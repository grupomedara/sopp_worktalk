"use client";

import { Task, Project, Status, Person } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, MoreHorizontal, Zap, Circle, Edit, Trash2, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { updateTaskStatus, deleteTask } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TaskDialog } from "./TaskDialog";
import { MiniTaskTimeTracker } from "./MiniTaskTimeTracker";

interface TaskWithProject extends Task {
    project: Project | null;
    responsible: Person | null;
    timeLogs?: any[];
    estimatedTime?: number | null;
}

interface TaskKanbanProps {
    tasks: TaskWithProject[];
    projects: Project[];
    people: Person[];
}

export function TaskKanban({ tasks, projects, people }: TaskKanbanProps) {
    const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);

    const columns = [
        { id: "PENDING", title: "A Fazer", status: "PENDING" as Status, color: "bg-zinc-100/50 dark:bg-zinc-900/30", borderColor: "border-zinc-200 dark:border-zinc-800" },
        { id: "IN_PROGRESS", title: "Em Andamento", status: "IN_PROGRESS" as Status, color: "bg-blue-50/50 dark:bg-blue-950/20", borderColor: "border-blue-200/50 dark:border-blue-900/50" },
        { id: "COMPLETED", title: "Feito", status: "COMPLETED" as Status, color: "bg-green-50/50 dark:bg-green-950/20", borderColor: "border-green-200/50 dark:border-green-900/50" },
    ];

    const getTasksByStatus = (status: Status) => {
        return tasks.filter((task) => task.status === status);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-x-auto pb-4">
                {columns.map((column) => (
                    <div key={column.id} className={cn("flex flex-col h-full rounded-xl border p-4 transition-colors", column.color, column.borderColor)}>
                        <h3 className="font-semibold mb-4 flex items-center justify-between text-sm tracking-tight text-foreground/80">
                            {column.title}
                            <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border shadow-sm">
                                {getTasksByStatus(column.status).length}
                            </span>
                        </h3>
                        <div className="flex-1 space-y-3 overflow-y-auto min-h-[200px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pr-1">
                            {getTasksByStatus(column.status).map((task) => (
                                <Card key={task.id} className="group cursor-default hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md bg-card/80 backdrop-blur-sm">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {task.project && (
                                                        <span className="inline-flex items-center text-[10px] font-medium text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md truncate max-w-[150px]">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 flex-shrink-0"></span>
                                                            <span className="truncate">{task.project.name}</span>
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center text-[10px] font-medium text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md">
                                                        {task.context}
                                                    </span>
                                                </div>
                                                <h4 className={cn("text-sm font-medium leading-snug break-words", task.status === 'COMPLETED' && "line-through text-muted-foreground")}>
                                                    {task.title}
                                                </h4>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onSelect={() => setEditingTask(task)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <div className="border-t my-1"></div>
                                                    <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                                        Mover para
                                                    </div>
                                                    {Object.values(Status).filter(s => s !== task.status && s !== 'ARCHIVED' && s !== 'CANCELED').map((status) => (
                                                        <form key={status} action={async () => {
                                                            await updateTaskStatus(task.id, status);
                                                        }}>
                                                            <button type="submit" className="w-full flex items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                                                                <Circle className="mr-2 h-3 w-3" />
                                                                {status === 'PENDING' && 'A Fazer'}
                                                                {status === 'IN_PROGRESS' && 'Em Andamento'}
                                                                {status === 'COMPLETED' && 'Feito'}
                                                            </button>
                                                        </form>
                                                    ))}
                                                    <div className="border-t my-1"></div>
                                                    <form action={async () => {
                                                        await deleteTask(task.id);
                                                    }}>
                                                        <button type="submit" className="w-full flex items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-red-600 focus:text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </button>
                                                    </form>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground border-t border-border/50 mt-2">
                                            <div className="flex items-center gap-3">
                                                {task.date && (
                                                    <span className={cn("flex items-center transition-colors",
                                                        new Date(task.date) < new Date() && task.status !== 'COMPLETED' ? "text-red-500 font-medium" : "hover:text-foreground"
                                                    )}>
                                                        <Calendar className="w-3 h-3 mr-1.5" />
                                                        {format(new Date(task.date), "dd MMM")}
                                                    </span>
                                                )}
                                                {task.energy && (
                                                    <span className="flex items-center hover:text-foreground transition-colors" title="Nível de Energia">
                                                        <Zap className="w-3 h-3 mr-1.5 text-yellow-500/80" />
                                                        {task.energy}
                                                    </span>
                                                )}
                                                <MiniTaskTimeTracker 
                                                    taskId={task.id} 
                                                    timeLogs={task.timeLogs} 
                                                    estimatedTime={task.estimatedTime} 
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {task.responsible && (
                                                    <div className="flex items-center px-1.5 py-0.5 rounded-md bg-primary/5 text-primary/70 border border-primary/10 mr-1" title={`Responsável: ${task.responsible.name}`}>
                                                        <User className="h-2.5 w-2.5 mr-1" />
                                                        <span className="font-semibold uppercase tracking-tighter truncate max-w-[80px]" style={{ fontSize: '9px' }} title={task.responsible.name}>
                                                            {task.responsible.name}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center" title={`Prioridade: ${task.priority}`}>
                                                    <Circle className={cn("w-2.5 h-2.5 fill-current transition-colors",
                                                        task.priority === 'High' ? "text-red-500 shadow-sm" :
                                                            task.priority === 'Medium' ? "text-orange-400" : "text-zinc-300 dark:text-zinc-700"
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <TaskDialog
                projects={projects}
                people={people}
                initialData={editingTask || undefined}
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
                trigger={<span className="hidden" />}
            />
        </>
    );
}
