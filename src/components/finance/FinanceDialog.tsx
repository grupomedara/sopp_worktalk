"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FinanceForm } from "@/components/finance/FinanceForm";
import { Person, Project } from "@prisma/client";

interface FinanceDialogProps {
    people: Person[];
    projects: Project[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function FinanceDialog({ people, projects, initialData, open: controlledOpen, onOpenChange, trigger }: FinanceDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const openState = isControlled ? controlledOpen : internalOpen;
    const setOpenState = isControlled ? onOpenChange : setInternalOpen;

    const handleSuccess = () => {
        setOpenState?.(false);
    }

    return (
        <Dialog open={openState} onOpenChange={setOpenState}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="px-3 sm:px-4">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Nova Movimentação</span>
                        <span className="inline sm:hidden ml-1">Novo</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Movimentação" : "Nova Movimentação"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Atualize os dados financeiros." : "Registre uma conta a pagar ou receber."}
                    </DialogDescription>
                </DialogHeader>
                <FinanceForm people={people} projects={projects} initialData={initialData} onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
}
