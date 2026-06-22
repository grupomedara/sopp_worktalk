"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { completeSprint } from "@/app/actions/sprints";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

interface SprintEvaluationDialogProps {
    sprintId: string;
    sprintName: string;
    onSuccess?: () => void;
}

export function SprintEvaluationDialog({ sprintId, sprintName, onSuccess }: SprintEvaluationDialogProps) {
    const [open, setOpen] = useState(false);
    const [retrospective, setRetrospective] = useState("");
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        if (!retrospective.trim()) {
            toast.error("Por favor, adicione uma avaliação/retrospectiva.");
            return;
        }

        setLoading(true);
        try {
            const result = await completeSprint(sprintId, retrospective);
            if (result.success) {
                toast.success("Sprint finalizado com sucesso!");
                setOpen(false);
                onSuccess?.();
            } else {
                toast.error("Erro ao finalizar sprint.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="font-black uppercase tracking-widest text-[10px] h-8 px-4 bg-green-600 hover:bg-green-700 text-white border-2 border-green-800 shadow-lg transition-all">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Sprint
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-2 border-primary/30 bg-black/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-primary/10 bg-muted/5">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center">
                        <ClipboardCheck className="mr-3 h-8 w-8 text-primary" />
                        Finalizar & Avaliar:<br />{sprintName}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6 px-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center">
                            <CheckCircle2 className="mr-2 h-3 w-3" /> Sua Avaliação
                        </label>
                        <Textarea
                            placeholder="O que funcionou bem? O que precisamos ajustar para o próximo ciclo?"
                            className="min-h-[160px] border-2 border-primary/20 bg-muted/5 focus:border-primary/50 focus:bg-muted/10 transition-all font-bold text-sm tracking-tight placeholder:text-muted-foreground/30 resize-none p-4"
                            value={retrospective}
                            onChange={(e) => setRetrospective(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter className="bg-muted/10 p-6 pt-2 border-t border-primary/10">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="font-bold uppercase tracking-widest text-[10px] hover:bg-muted/20"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleComplete}
                        disabled={loading}
                        className="font-black uppercase tracking-widest text-[10px] bg-primary text-black hover:bg-white transition-all px-8 h-10 border-2 border-primary"
                    >
                        {loading ? "Finalizando..." : "Concluir Sprint"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
