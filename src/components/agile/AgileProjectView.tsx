"use client";

import { useState } from "react";
import { Project, Sprint, Task, Goal, Person } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Play, ChevronLeft } from "lucide-react";
import { SprintDialog } from "./SprintDialog";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { SprintEvaluationDialog } from "./SprintEvaluationDialog";
import { activateSprint } from "@/app/actions/sprints";
import { toast } from "sonner";

const SprintBoard = dynamic(() => import("./SprintBoard").then(mod => mod.SprintBoard), {
    loading: () => <div className="h-96 w-full animate-pulse bg-muted/20 rounded-xl" />
});
const BacklogList = dynamic(() => import("./BacklogList").then(mod => mod.BacklogList), {
    loading: () => <div className="h-96 w-full animate-pulse bg-muted/20 rounded-xl" />
});
const OKRTab = dynamic(() => import("./OKRTab").then(mod => mod.OKRTab), {
    loading: () => <div className="h-96 w-full animate-pulse bg-muted/20 rounded-xl" />
});
const NotesTab = dynamic(() => import("./NotesTab").then(mod => mod.NotesTab), {
    loading: () => <div className="h-96 w-full animate-pulse bg-muted/20 rounded-xl" />
});

export function AgileProjectView({ project, goals, people, projects }: { project: any, goals: Goal[], people: Person[], projects: Project[] }) {
    const activeSprint = project.sprints.find((s: any) => s.status === "ACTIVE");
    const backlogTasks = project.tasks.filter((t: any) => !t.sprintId);

    const handleActivateSprint = async (sprintId: string) => {
        const result = await activateSprint(sprintId, project.id);
        if (result.success) {
            toast.success("Sprint ativado com sucesso!");
        } else {
            toast.error("Erro ao ativar sprint.");
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Link href="/agile">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-tighter">{project.name}</h1>
                        <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">{project.type === "AGILE" ? "Agile Project" : "Project"}</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <SprintDialog projectId={project.id} />
                    <ProjectDialog
                        goals={goals}
                        people={people}
                        initialData={project}
                        trigger={
                            <Button variant="outline" size="sm" className="font-bold border-2 h-9">
                                <Settings className="mr-2 h-4 w-4" /> Configurações
                            </Button>
                        }
                    />
                </div>
            </div>

            <Tabs defaultValue="board" className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-muted/20 p-1 rounded-lg gap-2">
                    <TabsList className="w-full md:w-auto justify-start overflow-x-auto no-scrollbar">
                        <TabsTrigger value="board" className="text-[10px] md:text-sm">Quadro</TabsTrigger>
                        <TabsTrigger value="backlog" className="text-[10px] md:text-sm">Backlog</TabsTrigger>
                        <TabsTrigger value="sprints" className="text-[10px] md:text-sm">Sprints</TabsTrigger>
                        <TabsTrigger value="notes" className="text-[10px] md:text-sm">Notas</TabsTrigger>
                        <TabsTrigger value="okrs" className="text-[10px] md:text-sm">OKRs</TabsTrigger>
                    </TabsList>
                    <div className="px-4 py-1 flex items-center space-x-4 w-full md:w-auto justify-end">
                        {activeSprint && (
                            <>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                                    {activeSprint.name}
                                </span>
                                <SprintEvaluationDialog
                                    sprintId={activeSprint.id}
                                    sprintName={activeSprint.name}
                                />
                            </>
                        )}
                        {!activeSprint && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Nenhum Sprint Ativo
                            </span>
                        )}
                    </div>
                </div>

                <TabsContent value="board" className="flex-1 flex flex-col mt-4 min-h-0">
                    {activeSprint ? (
                        <SprintBoard sprint={activeSprint} tasks={activeSprint.tasks} people={people} projects={projects} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p>Não há sprint ativo no momento.</p>
                            <Button variant="link">Ir para Sprints</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="backlog" className="mt-4">
                    <BacklogList
                        tasks={backlogTasks}
                        projectId={project.id}
                        projects={projects}
                        people={people}
                        activeSprintId={activeSprint?.id}
                    />
                </TabsContent>

                <TabsContent value="sprints" className="mt-4">
                    <div className="p-4 border rounded-md">
                        <h3 className="text-lg font-bold mb-4 uppercase tracking-tighter">Gerenciamento de Sprints</h3>
                        <ul className="space-y-2">
                            {project.sprints.map((s: any) => (
                                <li key={s.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold uppercase text-sm tracking-tight">{s.name}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">
                                            {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${s.status === "ACTIVE"
                                            ? "bg-primary/20 text-primary border-primary/30"
                                            : s.status === "COMPLETED"
                                                ? "bg-green-500/20 text-green-500 border-green-500/30"
                                                : "bg-muted text-muted-foreground border-border"
                                            }`}>
                                            {s.status === "PLANNING" ? "Planejamento" : s.status === "ACTIVE" ? "Ativo" : "Concluído"}
                                        </span>
                                        {s.status === "PLANNING" && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black"
                                                onClick={() => handleActivateSprint(s.id)}
                                            >
                                                <Play className="mr-1 h-3 w-3" /> Ativar
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </TabsContent>

                <TabsContent value="okrs" className="mt-4">
                    <OKRTab projectId={project.id} context={project.context} />
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                    <NotesTab project={project} people={people} projects={projects} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
