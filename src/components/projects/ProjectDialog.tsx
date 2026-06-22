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
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Goal, Person } from "@prisma/client";

interface ProjectDialogProps {
    goals: Goal[];
    people: Person[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function ProjectDialog({ goals, people, initialData, open: controlledOpen, onOpenChange, trigger }: ProjectDialogProps) {
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
                    <Button className="px-3" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Novo Projeto</span>
                        <span className="inline sm:hidden">Novo</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData?.id ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
                    <DialogDescription>
                        {initialData?.id ? "Atualize os detalhes do projeto." : "Crie um projeto para agrupar tarefas e atingir objetivos."}
                    </DialogDescription>
                </DialogHeader>
                <ProjectForm goals={goals} people={people} initialData={initialData} onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
}
