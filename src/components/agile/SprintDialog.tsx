"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSprint } from "@/app/actions/sprints";
import { Plus } from "lucide-react";

export function SprintDialog({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get("name") as string,
            startDate: new Date(formData.get("startDate") as string),
            endDate: new Date(formData.get("endDate") as string),
            goal: formData.get("goal") as string,
            projectId,
        };

        const result = await createSprint(data);
        setLoading(false);

        if (result.success) {
            setOpen(false);
        } else {
            alert("Failed to create sprint");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Novo Sprint
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Criar Novo Sprint</DialogTitle>
                    <DialogDescription>
                        Defina o período e o objetivo deste sprint.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue="Sprint "
                                className="w-full"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Início</Label>
                                <Input
                                    id="startDate"
                                    name="startDate"
                                    type="date"
                                    className="w-full"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">Fim</Label>
                                <Input
                                    id="endDate"
                                    name="endDate"
                                    type="date"
                                    className="w-full"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="goal">Objetivo</Label>
                            <Textarea
                                id="goal"
                                name="goal"
                                className="w-full min-h-[100px]"
                                placeholder="O que o time deve alcançar?"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Criando..." : "Criar Sprint"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
