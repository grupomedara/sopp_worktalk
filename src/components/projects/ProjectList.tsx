"use client";

import { useState } from "react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Edit, ArrowRight } from "lucide-react";
import { deleteProject } from "@/app/actions/projects";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Project, Goal, Task, Person, Note } from "@prisma/client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ProjectDialog } from "./ProjectDialog";
import { ProjectViewDialog } from "./ProjectViewDialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";

import { cn } from "@/lib/utils";
import { ContextBadge } from "../ui/ContextBadge";

interface ProjectWithRelations extends Project {
    goal: Goal | null;
    tasks: Task[];
    people: Person[];
    notes: Note[];
}

interface ProjectListProps {
    projects: ProjectWithRelations[];
    goals: Goal[];
    people: Person[];
}

export function ProjectList({ projects, goals, people }: ProjectListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [editingProject, setEditingProject] = useState<ProjectWithRelations | null>(null);
    const [viewingProject, setViewingProject] = useState<ProjectWithRelations | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

    const currentSort = searchParams.get("sort") || "createdAt";
    const currentOrder = searchParams.get("order") || "desc";

    const handleSortChange = (value: string) => {
        const [sort, order] = value.split("-");
        router.push(`/projects?sort=${sort}&order=${order}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Select
                    defaultValue={`${currentSort}-${currentOrder}`}
                    onValueChange={handleSortChange}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt-desc">Mais recentes</SelectItem>
                        <SelectItem value="createdAt-asc">Mais antigos</SelectItem>
                        <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                        <SelectItem value="deadline-asc">Prazo (Próximos)</SelectItem>
                        <SelectItem value="deadline-desc">Prazo (Distantes)</SelectItem>
                        <SelectItem value="status-asc">Status</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        Nenhum projeto encontrado.
                    </div>
                ) : (
                    projects.map((project) => (
                        <Card key={project.id} className="group relative noir-glass border-border/40 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(var(--primary),0.05)] overflow-hidden flex flex-col h-full">
                            {project.type === 'AGILE' ? (
                                <Link href={`/agile/${project.id}`} className="absolute inset-0 z-20" />
                            ) : (
                                <div 
                                    onClick={() => setViewingProject(project)} 
                                    className="absolute inset-0 z-20 cursor-pointer" 
                                />
                            )}

                            {/* Menu de Ações (Editar/Excluir) - Absoluto com z-30 para ficar acima da película do card */}
                            <div className="absolute top-4 right-4 z-30">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/5">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="noir-glass border-white/10">
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onSelect={() => setEditingProject(project)}
                                        >
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="cursor-pointer text-red-500 focus:text-red-500"
                                            onSelect={() => {
                                                setProjectToDelete(project.id);
                                                setConfirmOpen(true);
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <CardHeader className="relative z-10 pb-2 pr-12">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-2">
                                        <ContextBadge context={project.context} />
                                        {project.type === 'AGILE' && (
                                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-black text-[10px] tracking-widest px-2 py-0">
                                                AGILE
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-black tracking-tighter uppercase group-hover:text-primary transition-colors leading-tight min-h-[3rem] line-clamp-2">
                                    {project.name}
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1 line-clamp-1">
                                    {project.goal ? `Meta: ${project.goal.title}` : "Sem meta vinculada"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10 flex-1 flex flex-col pt-0">
                                <div className="space-y-4 flex-1">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-muted-foreground">Progresso</span>
                                            <span className="text-primary">
                                                {project.tasks.length > 0
                                                    ? Math.round((project.tasks.filter(t => t.status === 'COMPLETED').length / project.tasks.length) * 100)
                                                    : 0}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${project.tasks.length > 0
                                                        ? (project.tasks.filter(t => t.status === 'COMPLETED').length / project.tasks.length) * 100
                                                        : 0}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black tracking-tighter leading-none">{project.tasks.length}</span>
                                            <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-black opacity-60">Ações Totais</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black tracking-tighter leading-none text-primary/80">{(project as any).notes?.length || 0}</span>
                                            <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-black opacity-60">Notas / Insights</span>
                                        </div>
                                    </div>

                                    {project.people && project.people.length > 0 && (
                                        <div className="flex flex-wrap gap-1 items-center">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mr-1">Time:</span>
                                            {project.people.slice(0, 3).map((p, idx) => (
                                                <Badge key={p.id} variant="outline" className="text-[8px] uppercase font-bold tracking-tight bg-white/[0.02] border-white/5 py-0 px-1.5 h-4">
                                                    {p.name.split(' ')[0]}
                                                </Badge>
                                            ))}
                                            {project.people.length > 3 && (
                                                <span className="text-[8px] font-black text-muted-foreground/40 ml-1">+{project.people.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="relative z-10 pt-4 border-t border-white/5 flex justify-between items-center mt-auto bg-white/[0.01]">
                                <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-[0.2em] border-2", 
                                    project.status === 'COMPLETED' ? "border-green-500/20 text-green-500 bg-green-500/5" : "border-primary/20 text-primary bg-primary/5"
                                )}>
                                    {project.status === 'COMPLETED' ? "Concluído" : "Em andamento"}
                                </Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>

            <ProjectDialog
                goals={goals}
                people={people}
                initialData={editingProject || undefined}
                open={!!editingProject}
                onOpenChange={(open) => !open && setEditingProject(null)}
                trigger={<span className="hidden" />}
            />

            <ProjectViewDialog
                project={viewingProject}
                open={!!viewingProject}
                onOpenChange={(open) => !open && setViewingProject(null)}
            />

            <ConfirmModal
                isOpen={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={async () => {
                    if (projectToDelete) {
                        await deleteProject(projectToDelete);
                        setProjectToDelete(null);
                    }
                }}
                title="Excluir Projeto"
                description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita e removerá todas as associações."
                confirmText="Excluir"
                cancelText="Cancelar"
            />
        </div>
    );
}
