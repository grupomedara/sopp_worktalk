"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, Clock, Trash2, MoreHorizontal, Pencil, List, CalendarDays } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { deleteEvent } from "@/app/actions/events";
import { EventDialog } from "@/components/agenda/EventDialog";
import { WeeklyCalendar } from "@/components/agenda/WeeklyCalendar";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Event, Project, Person } from "@prisma/client";
import { cn } from "@/lib/utils";
import { RecurrenceActionDialog, RecurrenceMode } from "./RecurrenceActionDialog";
import { RecurrenceType } from "@/components/ui/RecurrenceSelector";

interface AgendaBoardProps {
    events: Event[];
    projects: Project[];
    people: Person[];
}

type ViewMode = "list" | "week";

export function AgendaBoard({ events, projects, people }: AgendaBoardProps) {
    const router = useRouter();
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isRecurrenceDialogOpen, setIsRecurrenceDialogOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

    // Auto-detect mobile and force "list" view
    useEffect(() => {
        const handleResize = () => {
             if (window.innerWidth < 1024) {  // md breakpoint is 768px, lg is 1024px
                 setViewMode("list");
             } else {
                 setViewMode("week");
             }
        };
        handleResize(); // run on load
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const allItems = [
        ...events.map(e => ({ ...e, typeStr: 'event', sortDate: new Date(e.startDate) }))
    ].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    const handleCreate = () => {
        setEditingEvent(null);
        setIsDialogOpen(true);
    };

    const handleTimeSlotClick = (date: Date) => {
        const endDate = new Date(date.getTime() + 60 * 60 * 1000);
        setEditingEvent({
            startDate: date,
            endDate: endDate,
        } as any);
        setIsDialogOpen(true);
    };

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setIsDialogOpen(true);
    };

    const handleEdit = (item: any) => {
        handleEditEvent(item);
    };

    const handleDelete = async (item: any) => {
        if (item.recurrenceType && item.recurrenceType !== RecurrenceType.NONE) {
            setPendingDeleteId(item.id);
            setIsRecurrenceDialogOpen(true);
            return;
        }
        await executeDelete(item.id, "SINGLE");
    };

    const executeDelete = async (id: string, mode: RecurrenceMode) => {
        setLoading(true);
        try {
            const result = await deleteEvent(id, mode);
            if (result.success) {
                toast.success("Compromisso excluído!");
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao excluir");
            }
        } catch (error) {
            toast.error("Erro ao excluir o compromisso");
        } finally {
            setLoading(false);
            setIsRecurrenceDialogOpen(false);
            setPendingDeleteId(null);
        }
    };

    const handleRecurrenceConfirm = (mode: RecurrenceMode) => {
        if (pendingDeleteId) {
            executeDelete(pendingDeleteId, mode);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
                    <p className="text-muted-foreground text-sm">Compromissos e tarefas com data marcada.</p>
                </div>
                <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                    {/* View toggle */}
                    <div className="flex items-center border border-zinc-800 rounded-lg p-0.5 bg-zinc-950 shrink-0">
                        <Button
                            size="sm"
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            className="h-7 px-2"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="w-3.5 h-3.5 mr-1" /> Lista
                        </Button>
                        <Button
                            size="sm"
                            variant={viewMode === "week" ? "secondary" : "ghost"}
                            className="h-7 px-2"
                            onClick={() => setViewMode("week")}
                        >
                            <CalendarDays className="w-3.5 h-3.5 mr-1" /> Semana
                        </Button>
                    </div>

                    <EventDialog
                        projects={projects}
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) setEditingEvent(null);
                        }}
                        initialData={editingEvent}
                        trigger={
                            <Button onClick={handleCreate} className="px-3 sm:px-4 shrink-0">
                                <Plus className="h-4 w-4" /> 
                                <span className="hidden sm:inline ml-2">Novo Compromisso</span>
                                <span className="inline sm:hidden ml-1">Compromisso</span>
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Weekly Calendar View */}
            {viewMode === "week" && (
                <WeeklyCalendar
                    events={events}
                    onEditEvent={handleEditEvent}
                    onTimeSlotClick={handleTimeSlotClick}
                />
            )}

            {/* List View */}
            {viewMode === "list" && (
                <div className="space-y-4">
                    {allItems.length === 0 ? (
                        <div className="text-center py-20 border rounded-lg bg-card">
                            <Plus className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nenhum compromisso ou tarefa para os próximos dias.</p>
                        </div>
                    ) : (
                        allItems.map((item: any) => (
                            <div key={`${item.typeStr}-${item.id}`} className="flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg bg-card hover:shadow-sm gap-4">
                                <div className={cn(
                                    "flex flex-col items-center justify-center w-16 h-16 rounded-lg text-center border shrink-0",
                                    item.typeStr === 'event' && item.color ? (
                                        item.color === 'red' ? 'bg-red-950/40 border-red-500/30 text-red-200' :
                                        item.color === 'green' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' :
                                        item.color === 'yellow' ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' :
                                        item.color === 'purple' ? 'bg-purple-950/40 border-purple-500/30 text-purple-200' :
                                        item.color === 'orange' ? 'bg-orange-950/40 border-orange-500/30 text-orange-200' :
                                        item.color === 'pink' ? 'bg-pink-950/40 border-pink-500/30 text-pink-200' :
                                        item.color === 'teal' ? 'bg-teal-950/40 border-teal-500/30 text-teal-200' :
                                        item.color === 'indigo' ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200' :
                                        item.color === 'slate' ? 'bg-slate-950/40 border-slate-500/30 text-slate-200' :
                                        'bg-blue-950/40 border-blue-500/30 text-blue-200'
                                    ) : "bg-secondary/30 border-transparent"
                                )}>
                                    <span className="text-xs font-bold uppercase text-muted-foreground">
                                        {format(item.sortDate, "MMM", { locale: ptBR })}
                                    </span>
                                    <span className="text-xl font-bold">
                                        {format(item.sortDate, "dd")}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-semibold">{item.title}</h3>
                                        <Badge variant={item.typeStr === 'event' ? 'default' : 'outline'}>
                                            {item.typeStr === 'event' ? 'Compromisso' : 'Tarefa'}
                                        </Badge>
                                        {item.context && (
                                            <Badge variant="secondary">{item.context}</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {item.typeStr === 'event' ? (
                                            <span>
                                                {format(new Date(item.startDate), "HH:mm")} - {format(new Date(item.endDate), "HH:mm")}
                                            </span>
                                        ) : (
                                            <span>Até as 23:59</span>
                                        )}
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-600 focus:text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))
                    )}
                </div>
            )}

            <RecurrenceActionDialog
                open={isRecurrenceDialogOpen}
                onOpenChange={setIsRecurrenceDialogOpen}
                onConfirm={handleRecurrenceConfirm}
                title="Excluir evento recorrente"
                description="Como você gostaria de excluir os eventos desta série?"
                actionLabel="Excluir"
            />

            <TaskDialog
                projects={projects}
                people={people}
                open={isTaskDialogOpen}
                onOpenChange={setIsTaskDialogOpen}
            />

            {/* Botão Flutuante (FAB) para Mobile com Menu Dropdown de Seleção */}
            <div className="fixed bottom-24 md:bottom-6 right-6 z-40 lg:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-16 w-16 rounded-full bg-white text-black hover:bg-zinc-200 shadow-[0_4px_25px_rgba(255,255,255,0.25)] flex items-center justify-center border-none transition-transform hover:scale-105 active:scale-95 duration-200 cursor-pointer">
                            <Plus className="h-8 w-8" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="noir-glass border-white/10 mb-2 z-50">
                        <DropdownMenuItem onClick={() => setIsDialogOpen(true)} className="cursor-pointer font-bold text-xs uppercase">
                            <CalendarIcon className="mr-2 h-4 w-4" /> Compromisso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsTaskDialogOpen(true)} className="cursor-pointer font-bold text-xs uppercase">
                            <Plus className="mr-2 h-4 w-4" /> Tarefa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
