"use client";

import { Task, Project, Person } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight, Edit2, User2, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { updateTaskSprint } from "@/app/actions/tasks";
import { toast } from "sonner";
import { MiniTaskTimeTracker } from "@/components/tasks/MiniTaskTimeTracker";

export function BacklogList({ tasks, projectId, projects, people, activeSprintId }: { tasks: Task[], projectId: string, projects: Project[], people: Person[], activeSprintId?: string }) {
    const handleMoveToSprint = async (taskId: string) => {
        if (!activeSprintId) {
            toast.error("Nenhum sprint ativo para mover a tarefa.");
            return;
        }
        const result = await updateTaskSprint(taskId, activeSprintId);
        if (result.success) {
            toast.success("Tarefa movida para o sprint!");
        } else {
            toast.error("Erro ao mover tarefa.");
        }
    };

    return (
        <Card className="border-2 border-primary/20 bg-muted/5">
            <CardHeader className="flex flex-row items-center justify-between border-b-2 border-primary/10 bg-muted/10 px-6 py-4">
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Backlog do Produto</CardTitle>
                <TaskDialog
                    projects={projects}
                    people={people}
                    initialData={{ projectId }}
                    trigger={
                        <Button size="sm" className="font-black uppercase tracking-widest text-[10px] h-8 px-4 border-2 border-primary hover:bg-primary hover:text-black transition-all">
                            <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                        </Button>
                    }
                />
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">O backlog está vazio.</p>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => {
                            const responsible = (task as any).responsible;
                            
                            const getStatusColor = (status: string) => {
                                switch (status) {
                                    case "PENDING": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
                                    case "IN_PROGRESS": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
                                    case "COMPLETED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                                    case "CANCELED": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
                                    default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
                                }
                            };

                            const getPriorityColor = (priority: string) => {
                                switch (priority.toUpperCase()) {
                                    case "ALTA": return "text-rose-500";
                                    case "MEDIA": return "text-amber-500";
                                    case "BAIXA": return "text-blue-500";
                                    default: return "text-muted-foreground";
                                }
                            };

                            return (
                                <div key={task.id} className="group relative flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/20 border border-white/5 rounded-xl hover:bg-muted/40 hover:border-primary/20 transition-all duration-300">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 h-2 w-2 rounded-full ${getStatusColor(task.status).split(' ')[1].replace('text-', 'bg-')}`} />
                                            <p className="font-black text-lg uppercase tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                                                {task.title}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-widest ${getStatusColor(task.status)} border-2`}>
                                                {task.status}
                                            </Badge>
                                            
                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                                <Zap className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
                                                <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                                            </div>

                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                                <Target className="h-3 w-3" />
                                                <span>{task.points ? `${task.points} pts` : "0 pts"}</span>
                                            </div>

                                            {responsible ? (
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary/80 bg-primary/5 px-2 py-0.5 rounded border border-primary/10 whitespace-nowrap">
                                                    <User2 className="h-3 w-3" />
                                                    <span>{responsible.name}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 whitespace-nowrap">
                                                    <User2 className="h-3 w-3" />
                                                    <span>Sem responsável</span>
                                                </div>
                                            )}

                                            <MiniTaskTimeTracker 
                                                taskId={task.id} 
                                                timeLogs={(task as any).timeLogs} 
                                                estimatedTime={(task as any).estimatedTime} 
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {activeSprintId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-2 border-primary/20 hover:bg-primary hover:text-black hover:border-primary transition-all shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                                                onClick={() => handleMoveToSprint(task.id)}
                                            >
                                                <ArrowUpRight className="mr-2 h-4 w-4" /> Planejar Sprint
                                            </Button>
                                        )}
                                        <TaskDialog
                                            projects={projects}
                                            people={people}
                                            initialData={task}
                                            trigger={
                                                <Button variant="ghost" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all">
                                                    <Edit2 className="mr-2 h-3.5 w-3.5" /> Editar
                                                </Button>
                                            }
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
