"use client";

import { useMemo, useState } from "react";
import {
    startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks,
    format, getHours, getMinutes, isSameDay, areIntervalsOverlapping,
    setHours, setMinutes, startOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Event } from "@prisma/client";
import { cn } from "@/lib/utils";

interface WeeklyCalendarProps {
    events: Event[];
    onEditEvent: (event: Event) => void;
    onTimeSlotClick?: (date: Date) => void;
}

const HOUR_START = 0;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_HEIGHT = 60; // Slightly larger for better 24h readability

const EVENT_COLORS = [
    "bg-indigo-500/80 border-indigo-400 text-white",
    "bg-violet-500/80 border-violet-400 text-white",
    "bg-cyan-500/80 border-cyan-400 text-white",
    "bg-emerald-500/80 border-emerald-400 text-white",
    "bg-amber-500/80 border-amber-400 text-white",
    "bg-rose-500/80 border-rose-400 text-white",
];

function getEventColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function getTopOffset(date: Date) {
    const h = getHours(date) - HOUR_START;
    const m = getMinutes(date);
    return (h + m / 60) * SLOT_HEIGHT;
}

function getEventHeight(start: Date, end: Date) {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(diffHours * SLOT_HEIGHT, 24);
}

function detectConflicts(events: Event[]): Set<string> {
    const conflictIds = new Set<string>();
    for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
            const a = events[i];
            const b = events[j];
            if (areIntervalsOverlapping(
                { start: new Date(a.startDate), end: new Date(a.endDate) },
                { start: new Date(b.startDate), end: new Date(b.endDate) }
            )) {
                conflictIds.add(a.id);
                conflictIds.add(b.id);
            }
        }
    }
    return conflictIds;
}

interface EventLayout extends Event {
    width: number;
    left: number;
}

function getEventLayouts(dayEvents: Event[]): EventLayout[] {
    if (dayEvents.length === 0) return [];

    // Sort by start date
    const sorted = [...dayEvents].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // 1. Group into clusters (indirect overlapping)
    const clusters: Event[][] = [];
    for (const event of sorted) {
        let foundClusterIndex = -1;
        for (let i = 0; i < clusters.length; i++) {
            if (clusters[i].some(e => areIntervalsOverlapping(
                { start: new Date(e.startDate), end: new Date(e.endDate) },
                { start: new Date(event.startDate), end: new Date(event.endDate) }
            ))) {
                foundClusterIndex = i;
                break;
            }
        }
        if (foundClusterIndex !== -1) {
            clusters[foundClusterIndex].push(event);
        } else {
            clusters.push([event]);
        }
    }

    const layouts: EventLayout[] = [];

    // 2. For each cluster, pack into columns
    for (const cluster of clusters) {
        const columns: Event[][] = [];
        for (const event of cluster) {
            let colIndex = 0;
            while (colIndex < columns.length) {
                const hasOverlapInCol = columns[colIndex].some(e => areIntervalsOverlapping(
                    { start: new Date(e.startDate), end: new Date(e.endDate) },
                    { start: new Date(event.startDate), end: new Date(event.endDate) }
                ));
                if (!hasOverlapInCol) break;
                colIndex++;
            }
            if (colIndex === columns.length) {
                columns.push([event]);
            } else {
                columns[colIndex].push(event);
            }
            
            // Temporary assignment
            (event as any)._colIndex = colIndex;
        }

        const totalCols = columns.length;
        for (const event of cluster) {
            layouts.push({
                ...event,
                width: 100 / totalCols,
                left: ((event as any)._colIndex || 0) * (100 / totalCols),
            });
        }
    }

    return layouts;
}

export function WeeklyCalendar({ events, tasks, onEditEvent, onEditTask, onTimeSlotClick }: WeeklyCalendarProps) {
    const [currentWeek, setCurrentWeek] = useState(new Date());

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i);

    const now = new Date();
    const isCurrentWeek = isSameDay(weekStart, startOfWeek(now, { weekStartsOn: 1 }));

    const nowTop = isCurrentWeek
        ? (getHours(now) - HOUR_START + getMinutes(now) / 60) * SLOT_HEIGHT
        : null;

    const conflictIds = useMemo(() => detectConflicts(events), [events]);

    const HEADER_HEIGHT = 44; // 40px + some padding/border

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full">
                {/* Week navigation */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setCurrentWeek(w => subWeeks(w, 1))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-semibold min-w-[160px] text-center">
                            {format(weekStart, "dd MMM", { locale: ptBR })} – {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
                        </span>
                        <Button size="icon" variant="ghost" onClick={() => setCurrentWeek(w => addWeeks(w, 1))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setCurrentWeek(new Date())}>
                        Hoje
                    </Button>
                </div>

                {/* Grid */}
                <div className="flex overflow-x-auto border border-zinc-800 rounded-lg bg-zinc-950 snap-x snap-mandatory">
                    {/* Hour labels */}
                    <div className="shrink-0 w-14 border-r border-zinc-800 sticky left-0 z-30 bg-zinc-950">
                        <div style={{ height: HEADER_HEIGHT }} className="border-b border-zinc-800" />

                        {/* Hourly labels */}
                        {hours.map(h => (
                            <div
                                key={h}
                                className="border-b border-zinc-900 flex items-start justify-end pr-2 pt-1"
                                style={{ height: SLOT_HEIGHT }}
                            >
                                <span className="text-[10px] md:text-[11px] text-zinc-500">{String(h).padStart(2, "0")}:00</span>
                            </div>
                        ))}
                    </div>

                     {/* Day columns */}
                     <div className="flex flex-1 min-w-0">
                         {days.map(day => {
                             const dayKey = format(day, "yyyy-MM-dd");
                             const isToday = isSameDay(day, now);
                             const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), day));

                             return (
                                 <div
                                     key={dayKey}
                                     className={cn(
                                         "flex-1 border-r border-zinc-800 last:border-r-0 min-w-[120px] md:min-w-0 snap-start scroll-ml-14",
                                         isToday && "bg-indigo-950/20"
                                     )}
                                 >
                                    {/* Day header */}
                                    <div 
                                        style={{ height: HEADER_HEIGHT }}
                                        className={cn(
                                            "border-b border-zinc-800 flex flex-col items-center justify-center sticky top-0 z-10",
                                            isToday ? "bg-indigo-950" : "bg-zinc-950"
                                        )}
                                    >
                                        <span className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-wider">
                                            {format(day, "EEE", { locale: ptBR })}
                                        </span>
                                        <span className={cn(
                                            "text-sm font-bold",
                                            isToday ? "text-indigo-300" : "text-zinc-200"
                                        )}>
                                            {format(day, "dd")}
                                        </span>
                                    </div>

                                    {/* Hour slots */}
                                     <div className="relative" style={{ height: TOTAL_HOURS * SLOT_HEIGHT }}>
                                         {/* Grid lines */}
                                         {hours.map(h => (
                                             <div
                                                 key={h}
                                                 className="absolute w-full border-b border-zinc-900/60"
                                                 style={{ top: (h - HOUR_START) * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                                             />
                                         ))}

                                         {/* Clickable time slots (Desktop only) */}
                                         {onTimeSlotClick && hours.map(h => {
                                             const slotTop00 = (h - HOUR_START) * SLOT_HEIGHT;
                                             const slotTop30 = slotTop00 + SLOT_HEIGHT / 2;
                                             const slotHeight = SLOT_HEIGHT / 2;
                                             
                                             return (
                                                 <div key={`slots-${h}`} className="hidden lg:block">
                                                     {/* 00 mins slot */}
                                                     <div
                                                         className="absolute left-0 w-full border border-transparent hover:border-white/20 hover:bg-white/[0.02] hover:shadow-[0_0_8px_rgba(255,255,255,0.05)] transition-all cursor-pointer z-0"
                                                         style={{ top: slotTop00, height: slotHeight }}
                                                         onClick={() => {
                                                             const slotDate = setMinutes(setHours(startOfDay(day), h), 0);
                                                             onTimeSlotClick(slotDate);
                                                         }}
                                                     />
                                                     {/* 30 mins slot */}
                                                     <div
                                                         className="absolute left-0 w-full border border-transparent hover:border-white/20 hover:bg-white/[0.02] hover:shadow-[0_0_8px_rgba(255,255,255,0.05)] transition-all cursor-pointer z-0"
                                                         style={{ top: slotTop30, height: slotHeight }}
                                                         onClick={() => {
                                                             const slotDate = setMinutes(setHours(startOfDay(day), h), 30);
                                                             onTimeSlotClick(slotDate);
                                                         }}
                                                     />
                                                 </div>
                                             );
                                         })}

                                        {/* Current time line */}
                                        {isToday && nowTop !== null && nowTop >= 0 && nowTop <= TOTAL_HOURS * SLOT_HEIGHT && (
                                            <div
                                                className="absolute w-full z-20 pointer-events-none"
                                                style={{ top: nowTop }}
                                            >
                                                <div className="relative">
                                                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-indigo-400" />
                                                    <div className="border-t border-indigo-400 w-full" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Events */}
                                        {getEventLayouts(dayEvents).map(event => {
                                            const start = new Date(event.startDate);
                                            const end = new Date(event.endDate);
                                            const top = getTopOffset(start);
                                            const height = getEventHeight(start, end);
                                            const hasConflict = conflictIds.has(event.id);
                                            const CUSTOM_COLORS: Record<string, string> = {
                                                blue: "bg-blue-600/80 border-blue-500 text-white",
                                                red: "bg-red-600/80 border-red-500 text-white",
                                                green: "bg-emerald-600/80 border-emerald-500 text-white",
                                                yellow: "bg-amber-600/80 border-amber-500 text-white",
                                                purple: "bg-purple-600/80 border-purple-500 text-white",
                                                orange: "bg-orange-600/80 border-orange-500 text-white",
                                                pink: "bg-pink-600/80 border-pink-500 text-white",
                                                teal: "bg-teal-600/80 border-teal-500 text-white",
                                                indigo: "bg-indigo-600/80 border-indigo-500 text-white",
                                                slate: "bg-slate-600/80 border-slate-500 text-white",
                                            };
                                            
                                            // @ts-ignore
                                            const color = event.color && CUSTOM_COLORS[event.color as string] 
                                                // @ts-ignore
                                                ? CUSTOM_COLORS[event.color as string] 
                                                : getEventColor(event.id);

                                            return (
                                                <Tooltip key={event.id}>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            className={cn(
                                                                "absolute rounded border text-left px-1.5 py-0.5 text-[11px] font-medium overflow-hidden cursor-pointer hover:brightness-110 transition-all z-10 flex flex-col justify-start",
                                                                color
                                                            )}
                                                            style={{ 
                                                                top, 
                                                                height: Math.max(height, 22),
                                                                left: `${event.left + 0.2}%`,
                                                                width: `${event.width - 0.4}%`,
                                                            }}
                                                            onClick={() => onEditEvent(event)}
                                                        >
                                                            <div className="flex items-center gap-1 truncate">
                                                                <span className="truncate">{event.title}</span>
                                                            </div>
                                                            {height > 30 && (
                                                                <div className="text-[9px] opacity-75 truncate">
                                                                    {format(start, "HH:mm")} – {format(end, "HH:mm")}
                                                                </div>
                                                            )}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="bg-zinc-900 border-zinc-700 max-w-[200px]">
                                                        <p className="font-semibold">{event.title}</p>
                                                        <p className="text-xs text-zinc-400">
                                                            {format(start, "HH:mm")} – {format(end, "HH:mm")}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                </div>
            </TooltipProvider>
    );
}
