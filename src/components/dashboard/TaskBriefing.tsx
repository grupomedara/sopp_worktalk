"use client";

import { format, isBefore, isToday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Calendar, Clock, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ContextBadge } from "../ui/ContextBadge";

interface TaskBriefingProps {
    tasks: any[];
}

export function TaskBriefing({ tasks }: TaskBriefingProps) {
    const today = startOfDay(new Date());

    const lateTasks = tasks.filter(t => t.date && isBefore(new Date(t.date), today) && t.status !== 'COMPLETED');
    const todayTasks = tasks.filter(t => t.date && isToday(new Date(t.date)) && t.status !== 'COMPLETED');
    const noDateTasks = tasks.filter(t => !t.date && t.status !== 'COMPLETED');

    const categories = [
        {
            title: "Atrasado",
            items: lateTasks,
            color: "text-red-500",
            borderColor: "border-red-500/50",
            bgColor: "bg-red-500/5",
            icon: AlertCircle,
        },
        {
            title: "Para Hoje",
            items: todayTasks,
            color: "text-blue-500",
            borderColor: "border-blue-500/50",
            bgColor: "bg-blue-500/5",
            icon: Clock,
        },
        {
            title: "Sem Data",
            items: noDateTasks,
            color: "text-muted-foreground",
            borderColor: "border-border",
            bgColor: "bg-muted/5",
            icon: Calendar,
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-foreground flex items-center">
                    <span className="w-2 h-2 bg-primary mr-3 animate-pulse" />
                    BRIEFING OPERACIONAL: AÇÕES CRÍTICAS
                </h3>
                <Link href="/tasks" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                    Ver Todas &rarr;
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {categories.map((cat) => (
                    <div key={cat.title} className={cn(
                        "flex flex-col border rounded-sm overflow-hidden bg-card",
                        cat.borderColor
                    )}>
                        <div className={cn("px-4 py-2 border-b flex items-center justify-between", cat.bgColor, cat.borderColor)}>
                            <div className="flex items-center gap-2">
                                <cat.icon className={cn("h-3 w-3", cat.color)} />
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", cat.color)}>
                                    {cat.title}
                                </span>
                            </div>
                            <span className={cn("text-[10px] font-black", cat.color)}>
                                {cat.items.length}
                            </span>
                        </div>

                        <div className="flex-1 p-2 space-y-1">
                            {cat.items.length === 0 ? (
                                <div className="py-8 text-center opacity-30">
                                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
                                    <p className="text-[8px] font-bold uppercase tracking-tighter">Limpo</p>
                                </div>
                            ) : (
                                <>
                                    {cat.items.slice(0, 3).map((task: any) => (
                                        <div key={task.id} className="group p-2 hover:bg-muted/50 transition-colors border border-transparent hover:border-border rounded-sm">
                                            <div className="flex items-start gap-2">
                                                <div className="mt-0.5">
                                                    <Circle className={cn("h-3 w-3 shrink-0", 
                                                        task.priority === 'High' ? "text-red-500" : 
                                                        task.priority === 'Medium' ? "text-amber-500" : "text-muted-foreground"
                                                    )} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-bold leading-tight truncate uppercase tracking-tight">
                                                        {task.title}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                                                        {task.project && (
                                                            <span className="text-[8px] font-black uppercase text-primary truncate max-w-[60px]">
                                                                {task.project.name}
                                                            </span>
                                                        )}
                                                        <span className="text-[8px] opacity-50 shrink-0">
                                                            {task.date ? format(new Date(task.date), "dd/MM") : "---"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {cat.items.length > 3 && (
                                        <Link 
                                            href={`/tasks?view=operational`} 
                                            className="mt-2 flex items-center justify-center gap-1 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded-sm"
                                        >
                                            +{cat.items.length - 3} mais <ArrowRight className="h-2 w-2" />
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
