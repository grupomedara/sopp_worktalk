"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { startTimeLog, stopTimeLog, addManualTimeLog, deleteTimeLog } from "@/app/actions/timeTracking";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimeLog {
    id: string;
    taskId: string;
    userId: string;
    startTime: Date;
    endTime: Date | null;
    duration: number;
}

interface TaskTimeTrackerProps {
    taskId: string;
    estimatedTime: number | null; // in minutes
    timeLogs: TimeLog[];
}

function formatDuration(totalSeconds: number) {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export function TaskTimeTracker({ taskId, estimatedTime, timeLogs }: TaskTimeTrackerProps) {
    const [loading, setLoading] = useState(false);
    const [manualMinutes, setManualMinutes] = useState("");
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Find any open log (endTime === null) — no need for session
    const activeLog = useMemo(() => {
        if (!timeLogs || timeLogs.length === 0) return null;
        return timeLogs.find(log => !log.endTime) ?? null;
    }, [timeLogs]);

    // Local state for the active timer so it ticks every second on the UI
    const [activeSeconds, setActiveSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeLog) {
            // Calculate elapsed time from start until now
            const calculateElapsed = () => {
                const start = new Date(activeLog.startTime).getTime();
                const now = new Date().getTime();
                setActiveSeconds(Math.floor((now - start) / 1000));
            };
            calculateElapsed();
            interval = setInterval(calculateElapsed, 1000);
        } else {
            setActiveSeconds(0);
        }
        return () => clearInterval(interval);
    }, [activeLog]);

    // Calculate total duration from all completed logs + current active log
    const totalDurationSeconds = useMemo(() => {
        try {
            const completedDuration = (timeLogs || []).reduce((acc, log) => acc + (log.duration || 0), 0);
            return completedDuration + activeSeconds;
        } catch(e) {
            console.error(e);
            return activeSeconds;
        }
    }, [timeLogs, activeSeconds]);

    const estimatedSeconds = (estimatedTime || 0) * 60;
    let progressPercentage = 0;
    if (estimatedSeconds > 0) {
        progressPercentage = Math.min((totalDurationSeconds / estimatedSeconds) * 100, 100);
    }

    const isOvertime = estimatedSeconds > 0 && totalDurationSeconds > estimatedSeconds;

    const handleToggleTimer = async () => {
        setLoading(true);
        if (activeLog) {
            const res = await stopTimeLog(taskId);
            if (res.success) toast.success("Tempo registrado com sucesso!");
            else toast.error(res.error || "Erro ao parar tempo.");
        } else {
            const res = await startTimeLog(taskId);
            if (res.success) toast.success("Tempo iniciado!");
            else toast.error(res.error || "Erro ao iniciar tempo.");
        }
        setLoading(false);
    };

    const handleAddManualTime = async () => {
        const mins = parseInt(manualMinutes);
        if (isNaN(mins) || mins <= 0) {
            toast.error("Insira um valor válido em minutos.");
            return;
        }
        setLoading(true);
        const res = await addManualTimeLog(taskId, mins);
        if (res.success) {
            toast.success("Tempo manual adicionado!");
            setManualMinutes("");
            setIsPopoverOpen(false);
        } else {
            toast.error(res.error || "Erro ao adicionar tempo.");
        }
        setLoading(false);
    };

    const handleDeleteLog = async (logId: string) => {
        if (!confirm("Tem certeza que deseja excluir este registro de tempo?")) return;
        const res = await deleteTimeLog(logId);
        if (res.success) toast.success("Registro excluído!");
        else toast.error(res.error || "Erro ao excluir registro.");
    };

    return (
        <div className="space-y-3 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        Tempo Gasto
                        {activeLog && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-bold tracking-tight ${isOvertime ? 'text-red-500' : 'text-zinc-100'}`}>
                            {formatDuration(totalDurationSeconds)}
                        </span>
                        {estimatedTime && estimatedTime > 0 && (
                            <span className="text-xs text-zinc-500 font-medium">
                                de {formatDuration(estimatedSeconds)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60" align="end">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-sm">Adicionar tempo manual</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Insira os minutos trabalhados</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minutes">Minutos</Label>
                                    <Input
                                        id="minutes"
                                        type="number"
                                        min="1"
                                        value={manualMinutes}
                                        onChange={(e) => setManualMinutes(e.target.value)}
                                        placeholder="Ex: 90"
                                    />
                                </div>
                                <Button className="w-full" size="sm" onClick={handleAddManualTime} disabled={loading || !manualMinutes}>
                                    Salvar Tempo
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        onClick={handleToggleTimer}
                        disabled={loading}
                        className={cn(
                            "w-28 transition-all gap-2 shadow-md",
                            activeLog 
                                ? "bg-red-500 hover:bg-red-600 text-white" 
                                : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        )}
                    >
                        {activeLog ? (
                            <>
                                <Square className="h-4 w-4 fill-current" />
                                Parar
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 fill-current" />
                                Iniciar
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {estimatedTime && estimatedTime > 0 && (
                <div className="space-y-1.5 mt-2">
                    <Progress value={progressPercentage} className="h-1.5" indicatorClassName={isOvertime ? "bg-red-500" : "bg-emerald-500"} />
                    {isOvertime && (
                        <p className="text-[10px] text-red-500 font-medium text-right">Tempo estourado em {formatDuration(totalDurationSeconds - estimatedSeconds)}</p>
                    )}
                </div>
            )}

            {timeLogs.length > 0 && (
                <div className="pt-2 border-t border-zinc-800 mt-3">
                    <p className="text-[10px] uppercase text-zinc-500 font-bold mb-2">Histórico de Apontamentos</p>
                    <ScrollArea className="h-[120px] pr-2">
                        <div className="space-y-2">
                            {timeLogs.slice().sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(log => (
                                <div key={log.id} className="flex justify-between items-center bg-zinc-950/50 p-2 rounded text-xs border border-zinc-800/50 group">
                                    <div>
                                        <p className="font-medium text-zinc-300">
                                            {log.endTime ? formatDuration(log.duration) : "Rodando..."}
                                        </p>
                                        <p className="text-zinc-600 text-[10px]">
                                            {format(new Date(log.startTime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                    {!log.endTime && (
                                        <button 
                                            onClick={() => handleDeleteLog(log.id)}
                                            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            Excluir
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
