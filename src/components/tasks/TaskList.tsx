"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, MoreHorizontal, Calendar, Trash2, Zap, Edit, LayoutGrid, List, User, Clock, AlertCircle, ArrowRight, Layers } from "lucide-react";
import { format, isBefore, isToday, startOfDay } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { updateTaskStatus, deleteTask } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";
import { Task, Project, Person } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TaskDialog } from "./TaskDialog";
import { TaskKanban } from "./TaskKanban";
import { MiniTaskTimeTracker } from "./MiniTaskTimeTracker";

import { ContextBadge } from "../ui/ContextBadge";

/** Parse date from Prisma without UTC offset shift */
function parseLocalDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    const d = typeof value === "string" ? value : value.toISOString();
    const [year, month, day] = d.split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day);
}

interface TaskWithProject extends Task {
    project: Project | null;
    responsible: Person | null;
    list: { id: string; name: string; space: { id: string; name: string } | null } | null;
    timeLogs?: any[];
    estimatedTime?: number | null;
}


interface TaskListProps {
    tasks: TaskWithProject[];
    projects: Project[];
    people: Person[];
    currentSort?: string;
    currentOrder?: string;
}

export function TaskList({ tasks, projects, people, currentSort = "date", currentOrder = "asc" }: TaskListProps) {
    const router = useRouter();
    const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "kanban" | "operational">("operational");
    const [selectedProject, setSelectedProject] = useState<string>("all");
    const [selectedContext, setSelectedContext] = useState<string>("all");

    const handleSortChange = (value: string) => {
        const [sort, order] = value.split("-");
        router.push(`/tasks?sort=${sort}&order=${order}`);
    };

    const filteredTasks = tasks.filter(task => {
        const matchesProject = selectedProject === "all" || task.projectId === selectedProject;
        const matchesContext = selectedContext === "all" || task.context === selectedContext;
        return matchesProject && matchesContext;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={selectedProject}
                        onValueChange={setSelectedProject}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por Projeto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Projetos</SelectItem>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedContext}
                        onValueChange={setSelectedContext}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por Contexto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Contextos</SelectItem>
                            <SelectItem value="SAUDE">Saúde e Disposição</SelectItem>
                            <SelectItem value="INTELECTUAL">Desenv. Intelectual</SelectItem>
                            <SelectItem value="EMOCIONAL">Equilíbrio Emocional</SelectItem>
                            <SelectItem value="REALIZACAO">Realização e Propósito</SelectItem>
                            <SelectItem value="FINANCEIRO">Recurso Financeiro</SelectItem>
                            <SelectItem value="SOCIAL">Contribuição Social</SelectItem>
                            <SelectItem value="FAMILIA">Família</SelectItem>
                            <SelectItem value="RELACIONAMENTO">Relacionamento Amoroso</SelectItem>
                            <SelectItem value="VIDA_SOCIAL">Vida Social</SelectItem>
                            <SelectItem value="LAZER">Hobby e Lazer</SelectItem>
                            <SelectItem value="FELICIDADE">Felicidade e Plenitude</SelectItem>
                            <SelectItem value="ESPIRITUAL">Espiritualidade</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="border-l pl-2 ml-2 h-6 flex items-center space-x-1">
                        <Button
                            variant={viewMode === "operational" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("operational")}
                            title="Visão Operacional"
                        >
                            <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("list")}
                            title="Lista"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "kanban" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("kanban")}
                            title="Kanban"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Select
                    defaultValue={`${currentSort}-${currentOrder}`}
                    onValueChange={handleSortChange}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-asc">Data (Próximos)</SelectItem>
                        <SelectItem value="date-desc">Data (Distantes)</SelectItem>
                        <SelectItem value="priority-desc">Prioridade (Alta)</SelectItem>
                        <SelectItem value="priority-asc">Prioridade (Baixa)</SelectItem>
                        <SelectItem value="context-asc">Contexto (A-Z)</SelectItem>
                        <SelectItem value="context-desc">Contexto (Z-A)</SelectItem>
                        <SelectItem value="status-asc">Status (Pendente)</SelectItem>
                        <SelectItem value="status-desc">Status (Concluído)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {viewMode === "kanban" ? (
                <TaskKanban tasks={filteredTasks} projects={projects} people={people} />
            ) : viewMode === "operational" ? (
                <OperationalView 
                    tasks={filteredTasks} 
                    projects={projects} 
                    people={people} 
                    onEdit={setEditingTask} 
                />
            ) : (
                <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <CheckCircle2 className="mx-auto h-12 w-12 opacity-50 mb-3" />
                            <p>Nenhuma tarefa encontrada.</p>
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <TaskItem 
                                key={task.id} 
                                task={task} 
                                onEdit={setEditingTask} 
                            />
                        ))
                    )}
                </div>
            )}

            <TaskDialog
                projects={projects}
                people={people}
                initialData={editingTask || undefined}
                open={!!editingTask}
                onOpenChange={(open) => !open && setEditingTask(null)}
                trigger={<span className="hidden" />}
            />
        </div>
    );
}

function OperationalView({ tasks, projects, people, onEdit }: { tasks: TaskWithProject[], projects: Project[], people: Person[], onEdit: (task: TaskWithProject) => void }) {
    const today = startOfDay(new Date());

    const late = tasks.filter(t => t.date && isBefore(parseLocalDate(t.date)!, today) && t.status !== 'COMPLETED');
    const todayTasks = tasks.filter(t => t.date && isToday(parseLocalDate(t.date)!) && t.status !== 'COMPLETED');
    const noDate = tasks.filter(t => !t.date && t.status !== 'COMPLETED');
    const upcoming = tasks.filter(t => t.date && !isToday(parseLocalDate(t.date)!) && !isBefore(parseLocalDate(t.date)!, today) && t.status !== 'COMPLETED');
    const completed = tasks.filter(t => t.status === 'COMPLETED');

    const sections = [
        { title: "Atrasado", items: late, icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/5" },
        { title: "Para Hoje", items: todayTasks, icon: Clock, color: "text-blue-500", bgColor: "bg-blue-500/5" },
        { title: "Sem Data", items: noDate, icon: Calendar, color: "text-muted-foreground", bgColor: "bg-muted/5" },
        { title: "Próximas", items: upcoming, icon: ArrowRight, color: "text-primary", bgColor: "bg-primary/5" },
        { title: "Concluído", items: completed, icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-500/5" },
    ];

    return (
        <div className="space-y-8">
            {sections.map((section) => (
                section.items.length > 0 && (
                    <div key={section.title} className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <section.icon className={cn("h-4 w-4", section.color)} />
                            <h3 className={cn("text-xs font-black uppercase tracking-[0.2em]", section.color)}>
                                {section.title} ({section.items.length})
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {section.items.map((task) => (
                                <TaskItem key={task.id} task={task} onEdit={onEdit} isLate={section.title === "Atrasado"} />
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}

function TaskItem({ task, onEdit, isLate }: { task: TaskWithProject, onEdit: (task: TaskWithProject) => void, isLate?: boolean }) {
    return (
        <div className={cn(
            "flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-sm transition-all",
            task.status === 'COMPLETED' ? "opacity-60 bg-secondary/50" : "",
            isLate ? "border-red-500/30 bg-red-500/[0.02]" : ""
        )}>
            <div className="flex items-center space-x-4">
                <form action={async () => {
                    await updateTaskStatus(task.id, task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED');
                }}>
                    <button type="submit" className="focus:outline-none">
                        {task.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                            <Circle className={cn("h-6 w-6",
                                task.priority === 'High' ? "text-red-500" :
                                    task.priority === 'Medium' ? "text-orange-400" : "text-gray-400"
                            )} />
                        )}
                    </button>
                </form>

                <div>
                    <h3 className={cn("font-medium", task.status === 'COMPLETED' && "line-through", isLate && "text-red-500/90")}>
                        {task.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                        {task.project && (
                            <span className="flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>
                                {task.project.type === 'AGILE' && (
                                    <span className="text-primary font-black mr-1">[AGILE]</span>
                                )}
                                {task.project.name}
                            </span>
                        )}
                        {task.list && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                                <Layers className="w-2.5 h-2.5 shrink-0" />
                                {task.list.space?.name ? `${task.list.space.name} › ` : ""}{task.list.name}
                            </span>
                        )}
                        <span className="flex items-center">
                                <ContextBadge context={task.context} />
                            </span>
                        {task.date && (
                            <span className={cn("flex items-center", isLate && "text-red-500 font-bold")}>
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(parseLocalDate(task.date)!, "dd MMM")}
                            </span>
                        )}
                        {task.energy && (
                            <span className="flex items-center" title="Nível de Energia">
                                <Zap className="w-3 h-3 mr-1 text-yellow-500" />
                                {task.energy}
                            </span>
                        )}
                        {task.responsible && (
                            <span className="flex items-center text-primary font-medium">
                                <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate max-w-[120px]" title={task.responsible.name}>{task.responsible.name}</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <MiniTaskTimeTracker 
                    taskId={task.id} 
                    timeLogs={task.timeLogs} 
                    estimatedTime={task.estimatedTime} 
                />
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={() => onEdit(task)}
                        >
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
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
        </div>
    );
}
