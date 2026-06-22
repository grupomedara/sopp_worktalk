"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, StickyNote, Trash2, Edit, BrainCircuit, Zap, CheckSquare } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { NoteForm } from "@/components/notes/NoteForm";
import { Person, Note, Project } from "@prisma/client";

interface NoteDialogProps {
    people: Person[];
    notes?: Note[];
    projects?: Project[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    defaultType?: "TEXT" | "MINDMAP";
    isReadOnly?: boolean;
}

export function NoteDialog({
    people,
    notes = [],
    projects = [],
    initialData,
    open: controlledOpen,
    onOpenChange,
    trigger,
    defaultType,
    isReadOnly = false
}: NoteDialogProps) {
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
                        <Plus className="mr-2 h-4 w-4" /> Nova Nota
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isReadOnly ? "Visualizar Nota" : (initialData ? "Editar Nota" : "Nova Nota")}</DialogTitle>
                    <DialogDescription>
                        {isReadOnly ? "Apenas leitura: Compartilhada com você." : (initialData ? "Edite suas anotações." : "Crie uma nova nota para armazenar ideias e informações.")}
                    </DialogDescription>
                </DialogHeader>
                <NoteForm
                    people={people}
                    notes={notes}
                    projects={projects}
                    initialData={initialData}
                    onSuccess={handleSuccess}
                    defaultType={defaultType}
                    isReadOnly={isReadOnly}
                />
            </DialogContent>
        </Dialog>
    );
}
