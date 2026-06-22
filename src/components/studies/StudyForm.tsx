"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { createStudy, updateStudy, getStudyFilterOptions, CreateStudyData } from "@/app/actions/studies";
import { useState, useEffect, useCallback } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";

const studySchema = z.object({
    course: z.string().min(2, "Curso obrigatório"),
    subject: z.string().min(2, "Disciplina obrigatória"),
    topic: z.string().min(2, "Tema obrigatório"),
    content: z.string().optional(),
    notes: z.string().optional(),
    timeSpent: z.string().refine((val) => !val || !isNaN(Number(val)), "Deve ser um número").optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED", "CANCELED"]),
    createReviewTask: z.boolean(),
});

type StudyFormValues = z.infer<typeof studySchema>;

interface StudyFormProps {
    initialData?: any;
    onSuccess?: () => void;
}

export function StudyForm({ initialData, onSuccess }: StudyFormProps) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<{ courses: string[], subjects: string[] }>({ 
        courses: [], 
        subjects: [] 
    });

    useEffect(() => {
        async function loadOptions() {
            const result = await getStudyFilterOptions();
            if (result.success && result.data) {
                setOptions({
                    courses: result.data.courses,
                    subjects: result.data.subjects
                });
            }
        }
        loadOptions();
    }, []);

    const form = useForm<StudyFormValues>({
        resolver: zodResolver(studySchema),
        defaultValues: {
            course: initialData?.course || "",
            subject: initialData?.subject || "",
            topic: initialData?.topic || "",
            status: initialData?.status || "PENDING",
            content: initialData?.content || "",
            notes: initialData?.notes || "",
            createReviewTask: !initialData, // Default false for edit, true for new
            timeSpent: initialData?.timeSpent ? String(initialData.timeSpent) : "",
        },
    });

    const watchedValues = form.watch();

    const handleAutoSave = useCallback(async (data: StudyFormValues) => {
        if (!initialData) return;
        try {
            const payload: any = { ...data };
            if (data.timeSpent && data.timeSpent.trim() !== "") {
                payload.timeSpent = parseInt(data.timeSpent, 10);
            } else {
                delete payload.timeSpent;
            }
            await updateStudy(initialData.id, payload);
        } catch (error) {
            console.error("AutoSave Error:", error);
        }
    }, [initialData]);

    const { isSaving } = useAutoSave({
        value: watchedValues,
        saveFn: handleAutoSave,
        enabled: !!initialData,
        isValid: form.formState.isValid,
    });

    // Reset formulário quando initialData mudar (Diálogo reusado)
    useEffect(() => {
        if (initialData) {
            form.reset({
                course: initialData.course || "",
                subject: initialData.subject || "",
                topic: initialData.topic || "",
                status: initialData.status || "PENDING",
                content: initialData.content || "",
                notes: initialData.notes || "",
                createReviewTask: false,
                timeSpent: initialData.timeSpent ? String(initialData.timeSpent) : "",
            });
        } else {
            form.reset({
                course: "",
                subject: "",
                topic: "",
                status: "PENDING",
                content: "",
                notes: "",
                createReviewTask: true,
                timeSpent: "",
            });
        }
    }, [initialData, form]);


    async function onSubmit(data: StudyFormValues) {
        setLoading(true);
        try {
            const payload: any = { ...data };
            if (data.timeSpent && data.timeSpent.trim() !== "") {
                payload.timeSpent = parseInt(data.timeSpent, 10);
            } else {
                delete payload.timeSpent;
            }

            let result;
            if (initialData) {
                result = await updateStudy(initialData.id, payload);
            } else {
                result = await createStudy(payload);
            }

            if (result.success) {
                toast.success(initialData ? "Estudo atualizado!" : "Estudo registrado com sucesso!");
                if (!initialData && data.createReviewTask) {
                    toast.info("Tarefa de revisão criada para amanhã.");
                }
                if (!initialData) form.reset();
                onSuccess?.();
            } else {
                toast.error(initialData ? "Erro ao atualizar." : "Erro ao registrar estudo.");
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
                    name="course"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Curso / Fonte</FormLabel>
                            <FormControl>
                                <CreatableCombobox
                                    options={options.courses}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Curso ou fonte..."
                                    emptyText="Nenhum curso encontrado."
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Disciplina</FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={options.subjects}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Disciplina..."
                                        emptyText="Nenhuma disciplina encontrada."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tema / Aula</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: useEffect Deep Dive" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Planejado</SelectItem>
                                        <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                                        <SelectItem value="COMPLETED">Concluído</SelectItem>
                                        <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="timeSpent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tempo (minutos)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="60" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Anotações</FormLabel>
                            <FormControl>
                                <RichTextEditor
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Resumo, prints, links... Ctrl+V para colar imagens."
                                    minHeight={150}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="createReviewTask"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                    Gerar tarefa de revisão?
                                </FormLabel>
                                <FormDescription>
                                    Cria automaticamente uma tarefa para revisar este conteúdo amanhã.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                <div className="flex flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={loading || isSaving}>
                        {loading || isSaving ? "Salvando..." : (initialData ? "Atualizar Estudo" : "Registrar Estudo")}
                    </Button>
                    {isSaving && (
                        <p className="text-[10px] text-primary text-center animate-pulse font-medium tracking-widest uppercase">
                            Alterações salvas automaticamente
                        </p>
                    )}
                </div>
            </form>
        </Form>
    );
}
