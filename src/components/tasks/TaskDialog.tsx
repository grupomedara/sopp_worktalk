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
import { TaskForm } from "@/components/tasks/TaskForm";
import { Project, Person } from "@prisma/client";

interface TaskDialogProps {
    projects: Project[];
    people: Person[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function TaskDialog({ projects, people, initialData, open: controlledOpen, onOpenChange, trigger }: TaskDialogProps) {
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
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Atualize os detalhes da tarefa." : "Adicione uma nova ação ao seu sistema."}
                    </DialogDescription>
                </DialogHeader>
                <TaskForm projects={projects} people={people} initialData={initialData} onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
}
