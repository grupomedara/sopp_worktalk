"use client";

import { useState } from "react";
// Deployment trigger: force scroll fix update
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
import { StudyForm } from "@/components/studies/StudyForm";

interface StudyDialogProps {
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function StudyDialog({ initialData, open, onOpenChange, trigger }: StudyDialogProps) {
    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);

    // Determine current state and setter
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
                        <Plus className="mr-2 h-4 w-4" /> Novo Estudo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Editar Estudo" : "Novo Estudo"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Atualize o registro de estudo." : "O que você aprendeu hoje?"}
                    </DialogDescription>
                </DialogHeader>
                <StudyForm initialData={initialData} onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
    );
}
