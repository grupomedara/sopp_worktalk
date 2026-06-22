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
import { MeetingForm } from "@/components/meetings/MeetingForm";

interface MeetingDialogProps {
    people: { id: string; name: string }[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    isReadOnly?: boolean;
}

export function MeetingDialog({ people, initialData, open, onOpenChange, trigger, isReadOnly = false }: MeetingDialogProps) {
    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);

    const isOpen = isControlled ? open : internalOpen;
    const setOpen = isControlled ? onOpenChange : setInternalOpen;

    const handleSuccess = () => {
        if (setOpen) {
            setOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nova Ata / Reunião
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950">
                <DialogHeader>
                    <DialogTitle>
                        {isReadOnly ? "Visualizar Ata / Reunião" : initialData ? "Editar Ata / Reunião" : "Registrar Reunião"}
                    </DialogTitle>
                    <DialogDescription>
                        {isReadOnly 
                            ? "Visualização dos detalhes da ata de reunião compartilhada." 
                            : initialData 
                                ? "Edite o registro da ata de reunião." 
                                : "Registre uma nova ata de reunião."}
                    </DialogDescription>
                </DialogHeader>
                <MeetingForm people={people} initialData={initialData} onSuccess={handleSuccess} isReadOnly={isReadOnly} />
            </DialogContent>
        </Dialog>
    );
}
