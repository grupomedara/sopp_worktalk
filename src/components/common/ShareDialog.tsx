"use client";

import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Share2, Users, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ShareUser {
    id: string;
    name: string | null;
    email: string | null;
    document: string;
}

interface ShareItem {
    id: string;
    userId: string;
    role: string;
    user: ShareUser;
}

interface ShareDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    shares: ShareItem[];
    onShare: (emailOrCpf: string, role: "VIEWER" | "EDITOR") => Promise<{ success: boolean; error?: string }>;
    onUnshare: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

export function ShareDialog({
    isOpen,
    onOpenChange,
    title,
    shares = [],
    onShare,
    onUnshare
}: ShareDialogProps) {
    const router = useRouter();
    const [inviteEmailOrCpf, setInviteEmailOrCpf] = useState("");
    const [inviteRole, setInviteRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
    const [isPending, startTransition] = useTransition();

    const handleShare = async () => {
        if (!inviteEmailOrCpf.trim()) return;

        startTransition(async () => {
            const res = await onShare(inviteEmailOrCpf.trim(), inviteRole);
            if (res.success) {
                toast.success("Item compartilhado com sucesso!");
                setInviteEmailOrCpf("");
                router.refresh();
            } else {
                toast.error(res.error || "Erro ao compartilhar");
            }
        });
    };

    const handleUnshare = async (userId: string) => {
        startTransition(async () => {
            const res = await onUnshare(userId);
            if (res.success) {
                toast.success("Acesso removido com sucesso!");
                router.refresh();
            } else {
                toast.error(res.error || "Erro ao remover acesso");
            }
        });
    };

    const handleRoleChange = async (share: ShareItem, newRole: "VIEWER" | "EDITOR") => {
        startTransition(async () => {
            const res = await onShare(share.user.email || share.user.document, newRole);
            if (res.success) {
                toast.success("Permissão atualizada!");
                router.refresh();
            } else {
                toast.error(res.error || "Erro ao atualizar permissão");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="noir-glass border-zinc-800 text-zinc-300 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-primary" />
                        {title}
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
                                className="bg-black/50 border-zinc-800 text-white font-mono text-xs uppercase h-9"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="shrink-0 bg-black/50 border-zinc-800 text-xs font-bold uppercase tracking-widest h-9">
                                        {inviteRole === "VIEWER" ? "Ver" : "Editar"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-black/90 border-zinc-800">
                                    <DropdownMenuItem onClick={() => setInviteRole("VIEWER")} className="text-xs font-bold uppercase tracking-widest cursor-pointer text-zinc-300 hover:text-white">
                                        Apenas Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setInviteRole("EDITOR")} className="text-xs font-bold uppercase tracking-widest cursor-pointer text-zinc-300 hover:text-white">
                                        Pode Editar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Pessoas com Acesso</label>
                        {shares.length === 0 ? (
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold p-3 bg-black/20 rounded border border-white/5 text-center">
                                Apenas você tem acesso.
                            </p>
                        ) : (
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                                {shares.map((share) => (
                                    <div key={share.id} className="flex items-center justify-between p-2 bg-black/30 rounded border border-white/5">
                                        <div className="flex items-center gap-2 truncate">
                                            <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                                <Users className="w-3 h-3" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-bold text-white truncate">{share.user.name || "Sem nome"}</p>
                                                <p className="text-[9px] uppercase tracking-widest text-zinc-500 truncate">{share.user.email || share.user.document}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <select
                                                value={share.role}
                                                onChange={(e) => handleRoleChange(share, e.target.value as "VIEWER" | "EDITOR")}
                                                className="bg-black/50 border border-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide focus:outline-none cursor-pointer"
                                                disabled={isPending}
                                            >
                                                <option value="VIEWER">Leitor</option>
                                                <option value="EDITOR">Editor</option>
                                            </select>

                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="w-5 h-5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                                                onClick={() => handleUnshare(share.userId)}
                                                disabled={isPending}
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

                <DialogFooter className="flex items-center justify-between border-t border-zinc-800/50 pt-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-bold uppercase tracking-widest"
                    >
                        Fechar
                    </Button>
                    <Button 
                        onClick={handleShare}
                        disabled={!inviteEmailOrCpf.trim() || isPending}
                        className="text-xs font-bold uppercase tracking-widest"
                    >
                        {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        Compartilhar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
