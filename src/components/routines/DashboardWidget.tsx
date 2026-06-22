"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toggleRoutineItemLog } from "@/app/actions/routines";
import { 
    ClipboardList, Users, Folder, CheckCircle2, Square, 
    ChevronDown, ChevronUp, Clock, Info 
} from "lucide-react";

interface DashboardWidgetProps {
    initialRoutines: any[];
    dateStr: string;
}

export function DashboardWidget({ initialRoutines, dateStr }: DashboardWidgetProps) {
    const [routines, setRoutines] = useState<any[]>(initialRoutines);
    const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleToggleItem = (routineId: string, itemId: string, completed: boolean) => {
        startTransition(async () => {
            const res = await toggleRoutineItemLog({
                routineId,
                date: dateStr,
                itemId,
                completed
            });
            if (res.success) {
                setRoutines(prev => prev.map(r => {
                    if (r.id !== routineId) return r;
                    const updatedItems = r.items.map((i: any) => {
                        if (i.id !== itemId) return i;
                        return { ...i, completed, completedAt: completed ? new Date() : null };
                    });
                    const done = updatedItems.filter((i: any) => i.completed).length;
                    const progress = r.totalItems > 0 ? (done / r.totalItems) * 100 : 0;
                    return { ...r, items: updatedItems, completedItems: done, progress };
                }));
            }
        });
    };

    if (routines.length === 0) {
        return (
            <div className="border border-border rounded-lg p-5 text-center text-muted-foreground bg-card space-y-2 opacity-50">
                <ClipboardList className="h-8 w-8 mx-auto text-zinc-600 stroke-[1.5]" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sem Rotinas Hoje</p>
                <p className="text-[9px] font-bold leading-normal uppercase">Não existem checklists de cargos ou colaboradores com tarefas programadas para hoje.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {routines.map(routine => {
                const isExpanded = expandedRoutineId === routine.id;
                return (
                    <div key={routine.id} className="border border-border rounded-lg overflow-hidden bg-card transition-all">
                        <div className="p-3.5 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 space-y-1">
                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-1">
                                        {routine.role && (
                                            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded">
                                                {routine.role}
                                            </span>
                                        )}
                                        {routine.responsible && (
                                            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/10 rounded flex items-center gap-0.5">
                                                <Users className="w-2 h-2" /> @{routine.responsible.name}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-[11px] font-black uppercase tracking-tight text-white leading-tight truncate">
                                        {routine.title}
                                    </h4>
                                </div>
                                <div className="text-right shrink-0 flex items-center gap-2">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black tracking-tighter text-zinc-100">{Math.round(routine.progress)}%</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{routine.completedItems}/{routine.totalItems} hoje</p>
                                    </div>
                                    <button 
                                        onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                                        className="p-1 border border-zinc-800 rounded hover:bg-zinc-900 transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Linear progress */}
                            <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${routine.progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Expanded Checklist Items */}
                        {isExpanded && (
                            <div className="bg-zinc-950/20 border-t border-zinc-900 px-3.5 py-2 divide-y divide-zinc-900/60 max-h-60 overflow-y-auto">
                                {routine.items.length === 0 ? (
                                    <div className="py-3 text-center text-zinc-650 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                                        <Info className="w-3 h-3" /> Sem etapas cadastradas.
                                    </div>
                                ) : (
                                    routine.items.map((item: any) => (
                                        <div 
                                            key={item.id} 
                                            className={cn(
                                                "flex items-start justify-between py-2 gap-3 transition-colors",
                                                item.completed && "opacity-60",
                                                !item.isActiveToday && "opacity-40 bg-zinc-900/5"
                                            )}
                                        >
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <button 
                                                    disabled={isPending || !item.isActiveToday}
                                                    onClick={() => handleToggleItem(routine.id, item.id, !item.completed)}
                                                    className={cn(
                                                        "mt-0.5 shrink-0 hover:scale-105 active:scale-95 transition-transform",
                                                        !item.isActiveToday && "cursor-not-allowed opacity-50 hover:scale-100 active:scale-100"
                                                    )}
                                                >
                                                    {item.completed ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-zinc-700 stroke-[2]" />
                                                    )}
                                                </button>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <p className={cn(
                                                            "text-[11px] font-bold text-zinc-200 truncate",
                                                            item.completed && "line-through text-zinc-500"
                                                        )}>
                                                            {item.title}
                                                        </p>
                                                        <span className={cn(
                                                            "text-[6px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded border",
                                                            item.frequency === "DAILY" ? "bg-blue-500/10 text-blue-400 border-blue-500/10" :
                                                            item.frequency === "WEEKLY" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/10" :
                                                            "bg-amber-500/10 text-amber-400 border-amber-500/10"
                                                        )}>
                                                            {item.frequency === "DAILY" ? "Diária" :
                                                             item.frequency === "WEEKLY" ? "Semanal" : "Periódica"}
                                                        </span>

                                                        {/* Inactive tag & days representation */}
                                                        {!item.isActiveToday && (
                                                            <span className="text-[6px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded border bg-red-950/20 text-red-400 border-red-500/10">
                                                                Inativo Hoje
                                                            </span>
                                                        )}

                                                        {(() => {
                                                            if (!item.scheduleDays) return null;
                                                            try {
                                                                const days = JSON.parse(item.scheduleDays);
                                                                if (!Array.isArray(days) || days.length === 0) return null;
                                                                const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                                                                if (item.frequency === "DAILY" || item.frequency === "WEEKLY") {
                                                                    return (
                                                                        <span className="text-[6px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded border bg-zinc-900 text-zinc-550 border-zinc-800">
                                                                            Dias: {days.map(d => dayNames[d]).join(", ")}
                                                                        </span>
                                                                    );
                                                                }
                                                                if (item.frequency === "MONTHLY") {
                                                                    return (
                                                                        <span className="text-[6px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded border bg-zinc-900 text-zinc-550 border-zinc-800">
                                                                            Dias: {days.join(", ")}
                                                                        </span>
                                                                    );
                                                                }
                                                            } catch {}
                                                            return null;
                                                        })()}

                                                        {item.timeOfDay && (
                                                            <span className="text-[7px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-550 px-1 rounded flex items-center gap-0.5">
                                                                <Clock className="w-2 h-2" /> {item.timeOfDay}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
