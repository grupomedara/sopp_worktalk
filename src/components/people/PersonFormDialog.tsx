"use client";

import { useState, ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Person } from "@prisma/client";
import { PersonForm } from "./PersonForm";

interface PersonFormDialogProps {
    person?: Person | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: ReactNode; // Trigger
}

export function PersonFormDialog({ person, open: controlledOpen, onOpenChange: setControlledOpen, children }: PersonFormDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? (setControlledOpen || (() => { })) : setInternalOpen;

    const handleSuccess = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle>{person ? "Editar Pessoa" : "Nova Pessoa"}</DialogTitle>
                    <DialogDescription>
                        {person ? "Edite os dados da pessoa." : "Cadastre alguém importante para o seu sistema."}
                    </DialogDescription>
                </DialogHeader>
                <PersonForm person={person || undefined} onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
}
