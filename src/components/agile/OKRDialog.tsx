"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KeyResult, Objective } from "@prisma/client";
import { createObjective, createKeyResult, updateObjective, updateKeyResult, deleteKeyResult } from "@/app/actions/okrs";
import { toast } from "sonner";
import { Plus, Target, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface OKRDialogProps {
    projectId: string;
    onSuccess: () => void;
    trigger?: React.ReactNode;
    initialData?: Objective & { keyResults: KeyResult[] };
}

export function OKRDialog({ projectId, onSuccess, trigger, initialData }: OKRDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [confirmKRIndex, setConfirmKRIndex] = useState<number | null>(null);

    const isEditing = !!initialData;

    // Objective fields
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");

    // Key Results fields
    const [keyResults, setKeyResults] = useState<{ id?: string; title: string; targetValue: number; unit: string }[]>(
        initialData?.keyResults.map(kr => ({
            id: kr.id,
            title: kr.title,
            targetValue: kr.targetValue,
            unit: kr.unit
        })) || [
            { title: "", targetValue: 100, unit: "%" }
        ]
    );

    const addKeyResult = () => {
        setKeyResults([...keyResults, { title: "", targetValue: 100, unit: "%" }]);
    };

    const removeKeyResult = async (index: number) => {
        const krToRemove = keyResults[index];
        if (krToRemove.id) {
            setConfirmKRIndex(index);
        } else {
            setKeyResults(keyResults.filter((_, i) => i !== index));
        }
    };

    const onConfirmRemoveKR = async () => {
        if (confirmKRIndex === null) return;
        const index = confirmKRIndex;
        const krToRemove = keyResults[index];
        
        if (krToRemove.id) {
            setLoading(true);
            const result = await deleteKeyResult(krToRemove.id, projectId);
            setLoading(false);
            if (result.success) {
                setKeyResults(keyResults.filter((_, i) => i !== index));
                toast.success("KR removido");
            } else {
                toast.error("Erro ao remover KR");
            }
        }
        setConfirmKRIndex(null);
    };

    const updateKR = (index: number, field: string, value: any) => {
        const newKRs = [...keyResults];
        (newKRs[index] as any)[field] = value;
        setKeyResults(newKRs);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (keyResults.some(kr => !kr.title)) {
            toast.error("Preencha todos os títulos dos resultados-chave");
            return;
        }

        setLoading(true);
        
        const objOperation = isEditing 
            ? updateObjective(initialData.id, { title, description, projectId })
            : createObjective({ title, description, projectId });

        const objResult = await objOperation;

        if (objResult.success && objResult.data) {
            const objectiveId = objResult.data.id;

            // Handle KRs
            await Promise.all(keyResults.map(kr => {
                if (kr.id) {
                    return updateKeyResult(kr.id, {
                        title: kr.title,
                        targetValue: kr.targetValue,
                        unit: kr.unit,
                        projectId
                    });
                } else {
                    return createKeyResult({
                        ...kr,
                        objectiveId,
                        projectId
                    });
                }
            }));

            toast.success(isEditing ? "OKR atualizado!" : "OKR criado!");
            onSuccess();
            setOpen(false);
            
            if (!isEditing) {
                setTitle("");
                setDescription("");
                setKeyResults([{ title: "", targetValue: 100, unit: "%" }]);
            }
        } else {
            toast.error("Erro ao salvar objetivo");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="font-bold border-2 h-9 hover:bg-primary hover:text-black transition-all">
                        <Plus className="mr-2 h-4 w-4" /> Novo OKR
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent 
                className="bg-black/95 border-2 border-primary/20 sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col p-0"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <div className="p-6 pb-0">
                    <DialogHeader>
                        <div className="flex items-center space-x-2 mb-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                {isEditing ? "Editar Objetivo" : "Novo Objetivo"}
                            </span>
                        </div>
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
                            {isEditing ? "Atualizar OKR" : "Definir OKR do Projeto"}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título do Objetivo</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-muted/10 border-2 border-border/50 focus:border-primary transition-all font-black text-xl"
                                    placeholder="EX: Aumentar NPS dos Clientes"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição (Opcional)</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-muted/10 border-2 border-border/50 focus:border-primary transition-all min-h-[80px]"
                                    placeholder="Descreva brevemente por que este objetivo é importante..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Resultados-Chave (KRs)</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={addKeyResult} className="h-7 text-[9px] font-black uppercase tracking-widest hover:text-primary">
                                    <Plus className="mr-1 h-3 w-3" /> Adicionar KR
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {keyResults.map((kr, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-end bg-muted/5 p-4 rounded-xl border border-border/30 relative">
                                    <div className="w-full md:flex-1 space-y-2">
                                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">KR {index + 1}</Label>
                                        <Input
                                            value={kr.title}
                                            onChange={(e) => updateKR(index, "title", e.target.value)}
                                            className="h-10 text-sm font-bold bg-muted/10 w-full"
                                            placeholder="Ex: NPS acima de 80"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <div className="flex-1 md:w-24 space-y-2">
                                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Meta</Label>
                                            <Input
                                                type="number"
                                                value={kr.targetValue}
                                                onChange={(e) => updateKR(index, "targetValue", parseFloat(e.target.value))}
                                                className="h-10 text-sm font-black bg-muted/10 text-center w-full"
                                                required
                                            />
                                        </div>
                                        <div className="w-20 md:w-16 space-y-2">
                                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Unidade</Label>
                                            <Input
                                                value={kr.unit}
                                                onChange={(e) => updateKR(index, "unit", e.target.value)}
                                                className="h-10 text-sm font-black bg-muted/10 text-center w-full"
                                                required
                                            />
                                        </div>
                                        {keyResults.length > 1 && (
                                            <div className="md:hidden pt-6">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeKeyResult(index)}
                                                    className="h-10 w-10 text-muted-foreground hover:text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {keyResults.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeKeyResult(index)}
                                            className="hidden md:flex h-10 w-10 text-muted-foreground hover:text-red-500 shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 pt-4 border-t border-white/10 flex flex-row gap-4 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="flex-1 h-12 font-black uppercase tracking-[0.2em] text-[10px] border border-white/10 hover:bg-white/5 text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 font-black uppercase tracking-[0.2em] text-[10px] bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            {loading ? "Processando..." : (isEditing ? "Atualizar Objetivo" : "Inserir Objetivo")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
            
            <ConfirmModal
                isOpen={confirmKRIndex !== null}
                onOpenChange={(open) => !open && setConfirmKRIndex(null)}
                onConfirm={onConfirmRemoveKR}
                title="Excluir Resultado-Chave?"
                description="Esta ação removerá o KR permanentemente do projeto."
            />
        </Dialog>
    );
}
