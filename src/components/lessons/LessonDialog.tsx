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
import { LessonForm } from "@/components/lessons/LessonForm";
import { Person } from "@prisma/client";

interface LessonDialogProps {
    people: Person[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function LessonDialog({ people, initialData, open: controlledOpen, onOpenChange, trigger }: LessonDialogProps) {
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
                    <Button className="px-3 sm:px-4 w-full justify-center">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Nova Aula</span>
                        <span className="inline sm:hidden ml-1">Novo</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Aula" : "Nova Aula"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Atualize os dados da aula." : "Registre detalhes da aula ou mentoria ministrada."}
                    </DialogDescription>
                </DialogHeader>
                <LessonForm people={people} initialData={initialData} onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
}
