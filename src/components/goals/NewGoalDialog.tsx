"use client";

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
import { GoalForm } from "@/components/goals/GoalForm";
import { useState } from "react";

export function NewGoalDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="px-3 sm:px-4 w-full justify-center">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Novo Objetivo</span>
                    <span className="inline sm:hidden ml-1">Novo</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Objetivo</DialogTitle>
                    <DialogDescription>
                        Onde você quer chegar? Defina com clareza.
                    </DialogDescription>
                </DialogHeader>
                <GoalForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
