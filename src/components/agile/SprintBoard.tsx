"use client";

import { useState } from "react";
import { Project, Task, Status, Person } from "@prisma/client";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateTaskKanban, deleteTask } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowUpRight, Edit2, User, Trash2 } from "lucide-react";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RecurrenceActionDialog, RecurrenceMode } from "../agenda/RecurrenceActionDialog";
import { RecurrenceType } from "@/components/ui/RecurrenceSelector";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { MiniTaskTimeTracker } from "@/components/tasks/MiniTaskTimeTracker";

type TaskWithRelations = Task & {
    responsible?: Person | null;
};

const COLUMNS = [
    { id: "TODO", title: "A Fazer", status: "PENDING" },
    { id: "DOING", title: "Em Progresso", status: "IN_PROGRESS" },
    { id: "DONE", title: "Concluído", status: "COMPLETED" },
];

function SortableTask({ task, people, projects }: { task: any, people: Person[], projects: Project[] }) {
    const [isRecurrenceDialogOpen, setIsRecurrenceDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-3 group relative">
            <Card className="border-2 border-border/50 bg-background/50 hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-xl group-hover:-translate-y-1 overflow-hidden">
                <div {...attributes} {...listeners} className="p-4">
                    <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-xs uppercase tracking-tight text-foreground/90 group-hover:text-primary transition-colors flex-1">{task.title}</p>
                        <div className="flex items-center space-x-1">
                            <TaskDialog
                                projects={projects}
                                people={people}
                                initialData={task}
                                trigger={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                }
                            />
                            <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                    onClick={() => {
                                        if (task.recurrenceType && task.recurrenceType !== RecurrenceType.NONE) {
                                            setIsRecurrenceDialogOpen(true);
                                        } else {
                                            setIsConfirmDialogOpen(true);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/10 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <MiniTaskTimeTracker 
                                taskId={task.id} 
                                timeLogs={task.timeLogs} 
                                estimatedTime={task.estimatedTime} 
                            />
                            <span className="text-[9px] font-black uppercase text-muted-foreground bg-muted/30 px-2 py-0.5 rounded border border-border/20">
                                {task.points ? `${task.points} PTS` : "-"}
                            </span>
                            {task.responsible && (
                                <div className="flex items-center text-[9px] font-black uppercase text-primary/70">
                                    <User className="h-2.5 w-2.5 mr-1" />
                                    {task.responsible.name.split(' ')[0]}
                                </div>
                            )}
                        </div>
                        <div className={cn(
                            "w-2 h-2 rounded-full shadow-[0_0_8px]",
                            task.priority === "High" ? "bg-red-500 shadow-red-500/50" :
                                task.priority === "Medium" ? "bg-yellow-500 shadow-yellow-500/50" : "bg-blue-500 shadow-blue-500/50"
                        )} />
                    </div>
                </div>
            </Card>

            <RecurrenceActionDialog
                open={isRecurrenceDialogOpen}
                onOpenChange={setIsRecurrenceDialogOpen}
                onConfirm={(mode) => executeDelete(mode)}
                title="Excluir tarefa recorrente"
                description="Como você gostaria de excluir as tarefas desta série?"
                actionLabel="Excluir"
            />
            <ConfirmModal
                isOpen={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
                onConfirm={() => executeDelete("SINGLE")}
                title="Excluir tarefa?"
                description="Tem certeza que deseja remover esta tarefa permanentemente?"
            />
        </div>
    );

    async function executeDelete(mode: RecurrenceMode) {
        setLoading(true);
        try {
            const result = await deleteTask(task.id, mode);
            if (result.success) {
                toast.success("Tarefa excluída!");
            } else {
                toast.error("Erro ao excluir tarefa.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
        } finally {
            setLoading(false);
            setIsRecurrenceDialogOpen(false);
        }
    }
}

function KanbanColumn({ id, title, tasks, people, projects }: { id: string, title: string, tasks: Task[], people: Person[], projects: Project[] }) {
    const { setNodeRef } = useSortable({ id });

    return (
        <div className="flex-1 min-w-[320px] bg-muted/10 border-2 border-border/50 rounded-xl p-3 flex flex-col max-h-full shadow-inner">
            <h3 className="font-black mb-4 px-2 text-[10px] uppercase tracking-[0.2em] flex justify-between items-center text-muted-foreground">
                <span className="flex items-center">
                    <span className={cn(
                        "w-2 h-2 rounded-full mr-2",
                        id === "TODO" ? "bg-blue-500" : id === "DOING" ? "bg-yellow-500" : "bg-green-500"
                    )} />
                    {title}
                </span>
                <span className="bg-zinc-100 text-zinc-900 px-2 py-0.5 rounded text-[9px] font-black shadow-sm">{tasks.length}</span>
            </h3>
            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[150px] space-y-1 scrollbar-hide">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTask key={task.id} task={task} people={people} projects={projects} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

export function SprintBoard({ sprint, tasks: initialTasks, people, projects }: { sprint: any, tasks: any[], people: Person[], projects: Project[] }) {
    const [tasks, setTasks] = useState(initialTasks);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        let targetColumnId = null;

        if (COLUMNS.find(c => c.id === overId)) {
            targetColumnId = overId;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                targetColumnId = overTask.kanbanColumn || "TODO";
            }
        }

        if (targetColumnId) {
            const activeTask = tasks.find(t => t.id === activeId);
            if (activeTask && activeTask.kanbanColumn !== targetColumnId) {
                const newStatus = COLUMNS.find(c => c.id === targetColumnId)?.status as Status;
                setTasks(tasks.map(t =>
                    t.id === activeId
                        ? { ...t, kanbanColumn: targetColumnId, status: newStatus }
                        : t
                ));
                await updateTaskKanban(activeId, targetColumnId, newStatus);
            }
        }
    }

    const tasksByColumn = COLUMNS.reduce((acc, col) => {
        acc[col.id] = tasks.filter(t => (t.kanbanColumn || "TODO") === col.id);
        return acc;
    }, {} as Record<string, Task[]>);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                {tasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-xl bg-muted/5">
                        <ArrowUpRight className="h-12 w-12 text-primary opacity-20 mb-4" />
                        <h3 className="text-xl font-black uppercase tracking-widest text-muted-foreground/50">Sprint Vazio</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mt-2 max-w-sm text-center">
                            Vá para a aba <span className="text-primary/50">BACKLOG</span> e use o botão <span className="text-primary/50">PLAN. SPRINT</span> para trazer ações para este quadro.
                        </p>
                    </div>
                ) : (
                    COLUMNS.map(col => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            tasks={tasksByColumn[col.id]}
                            people={people}
                            projects={projects}
                        />
                    ))
                )}
            </div>
        </DndContext>
    );
}
