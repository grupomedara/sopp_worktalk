"use client";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export type RecurrenceMode = "SINGLE" | "FOLLOWING" | "ALL";

interface RecurrenceActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (mode: RecurrenceMode) => void;
    title?: string;
    description?: string;
    actionLabel?: string;
}

export function RecurrenceActionDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Editar evento recorrente",
    description = "Este evento faz parte de uma série. Como você gostaria de aplicar as alterações?",
    actionLabel = "Confirmar",
}: RecurrenceActionDialogProps) {
    const [mode, setMode] = useState<RecurrenceMode>("SINGLE");

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <RadioGroup
                    value={mode}
                    onValueChange={(v) => setMode(v as RecurrenceMode)}
                    className="py-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="SINGLE" id="single" />
                        <Label htmlFor="single">Somente este evento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="FOLLOWING" id="following" />
                        <Label htmlFor="following">Este e os próximos eventos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ALL" id="all" />
                        <Label htmlFor="all">Todos os eventos</Label>
                    </div>
                </RadioGroup>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirm(mode)}>
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
