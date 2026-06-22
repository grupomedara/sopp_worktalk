"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { deleteUser } from "@/app/actions/auth";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onConfirm() {
        setLoading(true);
        const result = await deleteUser(userId);
        setLoading(false);
        setOpen(false);

        if (result === "Usuário deletado com sucesso!") {
            toast.success(result);
        } else {
            toast.error(result);
        }
    }

    return (
        <>
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-red-500"
                onClick={() => setOpen(true)}
                disabled={loading}
            >
                {loading ? "..." : "DELETAR"}
            </Button>

            <ConfirmModal
                isOpen={open}
                onOpenChange={setOpen}
                onConfirm={onConfirm}
                title={`Excluir Usuário: ${userName}`}
                description="Você tem certeza que deseja excluir este usuário? Esta ação pode falhar se o usuário possuir dados vinculados."
                confirmText={loading ? "Excluindo..." : "Excluir"}
                cancelText="Cancelar"
            />
        </>
    );
}
