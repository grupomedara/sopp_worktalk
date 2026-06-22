"use client";

import { Card, CardContent } from "@/components/ui/card";
import { KanbanSquare, MoreVertical, Edit2, Trash2, ArrowRight, Target, Share2, Users, Check, X } from "lucide-react";
import Link from "next/link";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { deleteProject, updateProject, shareProject, unshareProject } from "@/app/actions/projects";
import { useState, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Status } from "@prisma/client";

export function AgileProjectCard({
    project,
    goals,
    people,
    currentUserId
}: {
    project: any,
    goals: any[],
    people: any[],
    currentUserId?: string
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [deleteOpen, setDeleteOpen] = useState(false);
    
    // Sharing state
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [inviteEmailOrCpf, setInviteEmailOrCpf] = useState("");
    const [inviteRole, setInviteRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
    const [isSharingPending, setIsSharingPending] = useState(false);

    const isProjectOwner = project.ownerId === currentUserId;
    const userShare = project.shares?.find((s: any) => s.userId === currentUserId);
    const isProjectViewer = !isProjectOwner && userShare?.role === "VIEWER";

    const handleShareProject = async () => {
        if (!inviteEmailOrCpf.trim()) return;
        setIsSharingPending(true);
        const res = await shareProject(project.id, inviteEmailOrCpf.trim(), inviteRole);
        setIsSharingPending(false);
        if (res.success) {
            toast.success("Projeto compartilhado!");
            setInviteEmailOrCpf("");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao compartilhar");
        }
    };

    const handleUnshareProject = async (userId: string) => {
        const res = await unshareProject(project.id, userId);
        if (res.success) {
            toast.success("Compartilhamento removido.");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao remover");
        }
    };

    const handleDelete = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const result = await deleteProject(project.id);
        if (result.success) {
            toast.success("Projeto deletado com sucesso!");
        } else {
            toast.error("Erro ao deletar projeto.");
        }
        setDeleteOpen(false);
    };

    const handleStatusUpdate = async (newStatus: Status) => {
        const result = await updateProject(project.id, {
            ...project,
            status: newStatus
        });
        if (result.success) {
            toast.success("Status atualizado!");
        } else {
            toast.error("Erro ao atualizar status.");
        }
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case "IN_PROGRESS": return "Em Andamento";
            case "COMPLETED": return "Concluído";
            case "PENDING": return "Pendente";
            case "CANCELED": return "Cancelado";
            default: return status;
        }
    };

    const totalTasks = project._count.tasks;
    const completedTasks = project.tasks.length; // From the filtered query in page.tsx
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const activeSprint = project.sprints[0];

    return (
        <div className="group relative h-full animate-fade-in-up">
            <div className="h-full p-8 bg-card flex flex-col justify-between hover:bg-muted/30 transition-all duration-300 border border-border shadow-sm hover:shadow-xl group-hover:-translate-y-1">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 cursor-pointer hover:bg-primary hover:text-black transition-all rounded-full">
                                    {translateStatus(project.status)}
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-black/90 border-primary/20">
                                <DropdownMenuItem onClick={() => handleStatusUpdate("PENDING")} className="text-[10px] font-black uppercase tracking-widest">Pendente</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate("IN_PROGRESS")} className="text-[10px] font-black uppercase tracking-widest">Em Andamento</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate("COMPLETED")} className="text-[10px] font-black uppercase tracking-widest">Concluído</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusUpdate("CANCELED")} className="text-[10px] font-black uppercase tracking-widest text-red-500">Cancelado</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="flex items-center space-x-1">
                            {isProjectOwner && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShareModalOpen(true);
                                    }}
                                >
                                    <Share2 className="h-3.5 w-3.5" />
                                </Button>
                            )}

                            {!isProjectViewer && (
                                <ProjectDialog
                                    goals={goals}
                                    people={people}
                                    initialData={project}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                    }
                                />
                            )}
                            
                            {!isProjectViewer && (
                                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita. O projeto será excluído permanentemente.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={(e) => handleDelete(e as any)}
                                            >
                                                Sim, Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            )}
                        </div>
                    </div>

                    <Link href={`/agile/${project.id}`} className="block group/title">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-3xl font-black tracking-tighter uppercase group-hover/title:text-primary transition-colors leading-none truncate">
                                {project.name}
                            </h3>
                            {!isProjectOwner && (
                                <Badge className="bg-zinc-800 text-[8px] tracking-widest font-black uppercase text-zinc-400 border-zinc-700 shrink-0">
                                    {isProjectViewer ? "Ver" : "Edit"}
                                </Badge>
                            )}
                        </div>
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                <KanbanSquare className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {activeSprint ? `Sprint: ${activeSprint.name}` : "Backlog Only"}
                                </span>
                            </div>
                            {project._count.objectives > 0 && (
                                <div className="flex items-center space-x-2">
                                    <Target className="h-3 w-3 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                        {project._count.objectives} Objetivos Gerenciados
                                    </span>
                                </div>
                            )}
                        </div>
                    </Link>

                    <div className="space-y-2 pt-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-muted-foreground">Progresso Geral</span>
                            <span className="text-primary">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                                className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/10">
                    <Link href={`/agile/${project.id}`} className="flex justify-between items-center group/footer">
                        <div className="flex space-x-6">
                            <div className="flex flex-col">
                                <span className="text-2xl font-black tracking-tighter">{totalTasks}</span>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black opacity-50">Total Ações</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black tracking-tighter text-primary">{completedTasks}</span>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-black opacity-50">Concluídas</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-full border border-white/5 flex items-center justify-center group-hover/footer:bg-primary group-hover/footer:border-primary transition-all duration-300">
                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover/footer:text-black transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Share Modal */}
            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <DialogContent className="noir-glass border-zinc-800 text-zinc-300 sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-primary" />
                            Compartilhar Projeto
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Convidar Pessoa</label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="CPF ou E-mail da pessoa"
                                    value={inviteEmailOrCpf}
                                    onChange={e => setInviteEmailOrCpf(e.target.value)}
                                    className="bg-black/50 border-zinc-800 text-white font-mono text-sm uppercase"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="shrink-0 bg-black/50 border-zinc-800 text-xs font-bold uppercase tracking-widest">
                                            {inviteRole === "VIEWER" ? "Ver" : "Editar"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-black/90 border-zinc-800">
                                        <DropdownMenuItem onClick={() => setInviteRole("VIEWER")} className="text-xs font-bold uppercase tracking-widest cursor-pointer">
                                            Apenas Visualizar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setInviteRole("EDITOR")} className="text-xs font-bold uppercase tracking-widest cursor-pointer">
                                            Pode Editar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Pessoas com Acesso</label>
                            {(!project.shares || project.shares.length === 0) ? (
                                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold p-3 bg-black/20 rounded border border-white/5 text-center">
                                    Apenas você tem acesso.
                                </p>
                            ) : (
                                <div className="space-y-1.5">
                                    {project.shares.map((share: any) => (
                                        <div key={share.id} className="flex items-center justify-between p-2 bg-black/30 rounded border border-white/5">
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                                    <Users className="w-3 h-3" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs font-bold text-white truncate">{share.user.name}</p>
                                                    <p className="text-[9px] uppercase tracking-widest text-zinc-500 truncate">{share.user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <select
                                                    value={share.role}
                                                    onChange={async (e) => {
                                                        const newRole = e.target.value as "VIEWER" | "EDITOR";
                                                        const res = await shareProject(project.id, share.user.email || share.user.document, newRole);
                                                        if (res.success) {
                                                            toast.success("Permissão atualizada!");
                                                            startTransition(() => router.refresh());
                                                        } else {
                                                            toast.error(res.error || "Erro ao atualizar permissão");
                                                        }
                                                    }}
                                                    className="bg-black/50 border border-zinc-850 text-zinc-300 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide focus:outline-none cursor-pointer"
                                                >
                                                    <option value="VIEWER">Leitor</option>
                                                    <option value="EDITOR">Editor</option>
                                                </select>


                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="w-5 h-5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                                                    onClick={() => handleUnshareProject(share.userId)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="ghost" 
                            onClick={() => setShareModalOpen(false)}
                            className="text-xs font-bold uppercase tracking-widest"
                        >
                            Fechar
                        </Button>
                        <Button 
                            onClick={handleShareProject}
                            disabled={!inviteEmailOrCpf.trim() || isSharingPending}
                            className="text-xs font-bold uppercase tracking-widest"
                        >
                            {isSharingPending ? "Enviando..." : "Compartilhar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
