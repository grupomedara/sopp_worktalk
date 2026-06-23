"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createNote, updateNote } from "@/app/actions/notes";
import { createVisualNote } from "@/app/actions/mindmap";
import { useState, useCallback } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Note } from "@prisma/client";
import { SmartTextarea } from "@/components/ui/SmartTextarea";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { BrainCircuit, StickyNote } from "lucide-react";

const noteSchema = z.object({
    title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
    theme: z.string().optional(),
    content: z.string().optional(),
    context: z.enum(["SAUDE", "INTELECTUAL", "EMOCIONAL", "REALIZACAO", "FINANCEIRO", "SOCIAL", "FAMILIA", "RELACIONAMENTO", "VIDA_SOCIAL", "LAZER", "FELICIDADE", "ESPIRITUAL"]),
    type: z.enum(["TEXT", "MINDMAP"]),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface NoteWithRelations extends Note {
    type: "TEXT" | "MINDMAP";
}

interface NoteFormProps {
    notes: Note[];
    initialData?: NoteWithRelations;
    onSuccess?: () => void;
    defaultType?: "TEXT" | "MINDMAP";
    isReadOnly?: boolean;
}

export function NoteForm({ notes, initialData, onSuccess, defaultType, isReadOnly = false }: NoteFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<NoteFormValues>({
        resolver: zodResolver(noteSchema),
        defaultValues: {
            title: initialData?.title || "",
            theme: initialData?.theme || "",
            content: initialData?.content || "",
            context: (initialData?.context as any) || "SAUDE",
            type: initialData?.type || defaultType || "TEXT",
        },
    });

    const noteType = form.watch("type");
    const watchedValues = form.watch();

    const handleAutoSave = useCallback(async (data: NoteFormValues) => {
        if (!initialData) return;
        try {
            await updateNote(initialData.id, {
                ...data,
                type: data.type as any
            } as any);
        } catch (error) {
            console.error("AutoSave Error:", error);
        }
    }, [initialData]);

    const { isSaving } = useAutoSave({
        value: watchedValues,
        saveFn: handleAutoSave,
        enabled: !!initialData && !isReadOnly,
        isValid: form.formState.isValid,
    });

    async function onSubmit(data: NoteFormValues) {
        setLoading(true);
        try {
            let result;
            if (initialData) {
                result = await updateNote(initialData.id, {
                    ...data,
                    type: data.type as any
                } as any);
            } else if (data.type === "MINDMAP") {
                result = await createVisualNote(data);
            } else {
                result = await createNote(data as any);
            }

            if (result.success) {
                toast.success(initialData ? "Nota atualizada!" : "Nota criada com sucesso!");
                if (!initialData) form.reset();
                onSuccess?.();
            } else {
                toast.error(initialData ? "Erro ao atualizar nota." : "Erro ao criar nota.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Ideia para campanha" {...field} disabled={isReadOnly} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tema</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Marketing" {...field} disabled={isReadOnly} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="context"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contexto</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isReadOnly}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="SAUDE">Saúde e Disposição</SelectItem>
                                        <SelectItem value="INTELECTUAL">Desenv. Intelectual</SelectItem>
                                        <SelectItem value="EMOCIONAL">Equilíbrio Emocional</SelectItem>
                                        <SelectItem value="REALIZACAO">Realização e Propósito</SelectItem>
                                        <SelectItem value="FINANCEIRO">Recurso Financeiro</SelectItem>
                                        <SelectItem value="SOCIAL">Contribuição Social</SelectItem>
                                        <SelectItem value="FAMILIA">Família</SelectItem>
                                        <SelectItem value="RELACIONAMENTO">Relacionamento Amoroso</SelectItem>
                                        <SelectItem value="VIDA_SOCIAL">Vida Social</SelectItem>
                                        <SelectItem value="LAZER">Hobby e Lazer</SelectItem>
                                        <SelectItem value="FELICIDADE">Felicidade e Plenitude</SelectItem>
                                        <SelectItem value="ESPIRITUAL">Espiritualidade</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Tipo de Experiência</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => field.onChange("TEXT")}
                                        disabled={isReadOnly}
                                        className={cn(
                                            "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                                            field.value === "TEXT"
                                                ? "bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                                : "bg-zinc-900/50 border-zinc-800 text-muted-foreground hover:border-zinc-700",
                                            isReadOnly && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <StickyNote className="h-5 w-5" />
                                        <span className="font-bold uppercase tracking-widest text-[10px]">Padrão (Texto)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => field.onChange("MINDMAP")}
                                        disabled={!!initialData || isReadOnly}
                                        className={cn(
                                            "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                                            field.value === "MINDMAP"
                                                ? "bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                                : "bg-zinc-900/50 border-zinc-800 text-muted-foreground hover:border-zinc-700",
                                            (!!initialData || isReadOnly) && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <BrainCircuit className="h-5 w-5" />
                                        <span className="font-bold uppercase tracking-widest text-[10px]">Visual (Brain Flow)</span>
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                {noteType === "TEXT" ? (
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Conteúdo</FormLabel>
                                <FormControl>
                                    <RichTextEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Escreva suas anotações... Ctrl+V para colar imagens."
                                        minHeight={240}
                                        readOnly={isReadOnly}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    <div className="p-10 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5 flex flex-col items-center justify-center text-center gap-4">
                        <BrainCircuit className="h-10 w-10 text-primary animate-pulse" />
                        <div>
                            <p className="font-black uppercase tracking-tighter text-xl">Brain Flow Ativado</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2 px-10">
                                Esta nota será um espaço visual soberano. O mapa será aberto após a criação.
                            </p>
                        </div>
                    </div>
                )}

                {!isReadOnly && (
                    <div className="flex flex-col gap-2">
                        <Button type="submit" className="w-full" disabled={loading || isSaving}>
                            {loading || isSaving ? "Salvando..." : (initialData ? "Atualizar Nota" : "Criar Nota")}
                        </Button>
                        {isSaving && (
                            <p className="text-[10px] text-primary text-center animate-pulse font-medium tracking-widest uppercase">
                                Alterações salvas automaticamente
                            </p>
                        )}
                    </div>
                )}
            </form>
        </Form>
    );
}
