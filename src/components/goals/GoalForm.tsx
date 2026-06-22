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
import { toast } from "sonner";
import { createGoal, updateGoal, CreateGoalData } from "@/app/actions/goals";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const goalSchema = z.object({
    title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
    lifeArea: z.string().min(1, "Área da vida é obrigatória"),
    deadline: z.date().optional(),
    metric: z.string().optional(),
    motivation: z.string().optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED", "CANCELED"]),
    progress: z.number().min(0).max(100).optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface GoalFormProps {
    onSuccess?: () => void;
    initialData?: Partial<GoalFormValues>;
    goalId?: string;
}

export function GoalForm({ onSuccess, initialData, goalId }: GoalFormProps) {
    const [loading, setLoading] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const form = useForm<GoalFormValues>({
        resolver: zodResolver(goalSchema),
        defaultValues: initialData || {
            title: "",
            lifeArea: "",
            status: "PENDING",
            metric: "",
            motivation: "",
            progress: 0,
        },
    });

    async function onSubmit(data: GoalFormValues) {
        setLoading(true);
        try {
            if (goalId) {
                const result = await updateGoal(goalId, data);
                if (result.success) {
                    toast.success("Objetivo atualizado com sucesso!");
                    onSuccess?.();
                } else {
                    toast.error("Erro ao atualizar objetivo.");
                }
            } else {
                const result = await createGoal(data);
                if (result.success) {
                    toast.success("Objetivo criado com sucesso!");
                    form.reset();
                    onSuccess?.();
                } else {
                    toast.error("Erro ao criar objetivo.");
                }
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
                                <Input placeholder="Ex: Lançar produto X" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="lifeArea"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Área da Vida</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Saúde e Disposição">Saúde e Disposição</SelectItem>
                                        <SelectItem value="Desenv. Intelectual">Desenv. Intelectual</SelectItem>
                                        <SelectItem value="Equilíbrio Emocional">Equilíbrio Emocional</SelectItem>
                                        <SelectItem value="Realização e Propósito">Realização e Propósito</SelectItem>
                                        <SelectItem value="Recurso Financeiro">Recurso Financeiro</SelectItem>
                                        <SelectItem value="Contribuição Social">Contribuição Social</SelectItem>
                                        <SelectItem value="Família">Família</SelectItem>
                                        <SelectItem value="Relacionamento Amoroso">Relacionamento Amoroso</SelectItem>
                                        <SelectItem value="Vida Social">Vida Social</SelectItem>
                                        <SelectItem value="Hobby e Lazer">Hobby e Lazer</SelectItem>
                                        <SelectItem value="Felicidade e Plenitude">Felicidade e Plenitude</SelectItem>
                                        <SelectItem value="Espiritualidade">Espiritualidade</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Prazo</FormLabel>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 pr-3 text-left font-normal flex items-center justify-between",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                <span className="truncate">
                                                    {field.value ? (
                                                        format(field.value, "PPP", { locale: ptBR })
                                                    ) : (
                                                        "Selecione uma data"
                                                    )}
                                                </span>
                                                <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start" side="bottom">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                field.onChange(date);
                                                setIsCalendarOpen(false);
                                            }}
                                            disabled={(date) =>
                                                date < new Date(new Date().setHours(0, 0, 0, 0))
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="metric"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Métrica de Sucesso</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Faturar 10k" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="motivation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Motivação (Por quê?)</FormLabel>
                            <FormControl>
                                <RichTextEditor
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Por que esse objetivo é importante? Ctrl+V para colar imagens."
                                    minHeight={120}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="progress"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-center pb-2">
                                <FormLabel>Progresso Atual</FormLabel>
                                <span className="text-sm text-muted-foreground">{field.value || 0}%</span>
                            </div>
                            <FormControl>
                                <Slider
                                    min={0}
                                    max={100}
                                    step={1}
                                    defaultValue={[field.value || 0]}
                                    onValueChange={(vals) => field.onChange(vals[0])}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Salvando..." : (goalId ? "Salvar Alterações" : "Criar Objetivo")}
                </Button>
            </form>
        </Form>
    );
}
