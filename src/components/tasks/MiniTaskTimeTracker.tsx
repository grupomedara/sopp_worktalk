"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Square } from "lucide-react";
import { toast } from "sonner";
import { startTimeLog, stopTimeLog } from "@/app/actions/timeTracking";
import { cn } from "@/lib/utils";

interface TimeLog {
    id: string;
    taskId: string;
    userId: string;
    startTime: Date;
    endTime: Date | null;
    duration: number;
}

interface MiniTaskTimeTrackerProps {
    taskId: string;
    timeLogs?: TimeLog[];
    estimatedTime?: number | null;
}

function formatDuration(totalSeconds: number) {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h${minutes}m`;
    return `${minutes}m`;
}

export function MiniTaskTimeTracker({ taskId, timeLogs = [], estimatedTime }: MiniTaskTimeTrackerProps) {
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Find any open log (endTime === null)
    const activeLog = useMemo(() => {
        if (!timeLogs || timeLogs.length === 0) return null;
        return timeLogs.find(log => !log.endTime) ?? null;
    }, [timeLogs]);

    const [activeSeconds, setActiveSeconds] = useState(0);

    useEffect(() => {
        if (!activeLog) {
            setActiveSeconds(0);
            return;
        }
        const calculateElapsed = () => {
            const start = new Date(activeLog.startTime).getTime();
            setActiveSeconds(Math.floor((Date.now() - start) / 1000));
        };
        calculateElapsed();
        const interval = setInterval(calculateElapsed, 1000);
        return () => clearInterval(interval);
    }, [activeLog]);

    const totalDurationSeconds = useMemo(() => {
        const completed = (timeLogs || []).reduce((acc, log) => acc + (log.duration || 0), 0);
        return completed + activeSeconds;
    }, [timeLogs, activeSeconds]);

    const estimatedSeconds = (estimatedTime || 0) * 60;
    const isOvertime = estimatedSeconds > 0 && totalDurationSeconds > estimatedSeconds;

    const handleToggleTimer = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        if (activeLog) {
            const res = await stopTimeLog(taskId);
            if (res.success) toast.success("Tempo parado!");
            else toast.error(res.error || "Erro ao parar.");
        } else {
            const res = await startTimeLog(taskId);
            if (res.success) toast.success("Timer iniciado!");
            else toast.error(res.error || "Erro ao iniciar.");
        }
        setLoading(false);
    };

    if (!mounted) {
        return (
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                <div className="h-5 w-5 rounded bg-muted opacity-30" />
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-1.5"
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
        >
            {totalDurationSeconds > 0 && (
                <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider",
                    activeLog ? "text-red-500 animate-pulse" : isOvertime ? "text-red-400" : "text-muted-foreground"
                )}>
                    {formatDuration(totalDurationSeconds)}
                </span>
            )}

            <button
                type="button"
                onClick={handleToggleTimer}
                disabled={loading}
                className={cn(
                    "h-5 w-5 rounded flex items-center justify-center transition-colors shadow-sm",
                    activeLog
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-muted hover:bg-emerald-500 hover:text-white text-muted-foreground",
                    loading && "opacity-50 cursor-not-allowed"
                )}
                title={activeLog ? "Parar timer" : "Iniciar timer"}
            >
                {activeLog ? (
                    <Square className="h-2.5 w-2.5 fill-current" />
                ) : (
                    <Play className="h-2.5 w-2.5 fill-current" />
                )}
            </button>
        </div>
    );
}
