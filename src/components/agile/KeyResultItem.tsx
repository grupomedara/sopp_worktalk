"use client";

import { KeyResult } from "@prisma/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, History, MoreHorizontal, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteKeyResult } from "@/app/actions/okrs";
import { toast } from "sonner";
import { CheckInDialog } from "./CheckInDialog";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface KeyResultItemProps {
    kr: KeyResult;
    projectId: string;
    onUpdate: () => void;
}

export function KeyResultItem({ kr, projectId, onUpdate }: KeyResultItemProps) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    
    const progress = (kr.currentValue / kr.targetValue) * 100;
    const isCompleted = progress >= 100;

    const handleDelete = async () => {
        const result = await deleteKeyResult(kr.id, projectId);
        if (result.success) {
            toast.success("KR removido");
            onUpdate();
        } else {
            toast.error("Erro ao remover KR");
        }
        setDeleteOpen(false);
    };

    return (
        <div className="group bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/50 p-3 rounded-lg transition-all">
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        <span className={`text-xs font-bold uppercase tracking-tight ${isCompleted ? "text-green-500" : ""}`}>
                            {kr.title}
                        </span>
                    </div>
                    {kr.lastCheckIn && (
                        <div className="flex items-center space-x-1 mt-1 text-muted-foreground/60">
                            <History className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">
                                Último check-in: {format(new Date(kr.lastCheckIn), "dd MMM, yyyy", { locale: ptBR })}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2 ml-2">
                    <span className="text-[10px] font-black tabular-nums">
                        {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit}
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/90 border-border/50">
                            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-500 text-xs font-bold">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <Progress value={progress} className={`h-1 flex-1 ${isCompleted ? "bg-green-500/20" : ""}`} />
                <CheckInDialog
                    kr={kr}
                    projectId={projectId}
                    onSuccess={onUpdate}
                    trigger={
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                        >
                            Atualizar
                        </Button>
                    }
                />
            </div>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O resultado-chave será excluído permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            Sim, Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
