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
import { toast } from "sonner";
import { createProject, updateProject, CreateProjectData } from "@/app/actions/projects";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MultiSelect } from "@/components/ui/multi-select";
import { Goal, Person } from "@prisma/client";

const projectSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    context: z.enum(["SAUDE", "INTELECTUAL", "EMOCIONAL", "REALIZACAO", "FINANCEIRO", "SOCIAL", "FAMILIA", "RELACIONAMENTO", "VIDA_SOCIAL", "LAZER", "FELICIDADE", "ESPIRITUAL"]),
    goalId: z.string().optional(),
    personIds: z.array(z.string()).optional(),
    deadline: z.date().optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED", "CANCELED"]),
    type: z.enum(["STANDARD", "AGILE"]).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
    goals: Goal[];
    people: Person[];
    initialData?: any;
    onSuccess?: () => void;
}

export function ProjectForm({ goals, people, initialData, onSuccess }: ProjectFormProps) {
    const [loading, setLoading] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: initialData?.name || "",
            context: initialData?.context || "REALIZACAO",
            status: initialData?.status || "IN_PROGRESS",
            goalId: initialData?.goalId || undefined,
            personIds: initialData?.people ? initialData.people.map((p: any) => p.id) : [],
            deadline: initialData?.deadline ? new Date(initialData.deadline) : undefined,
            type: initialData?.type || "STANDARD",
        },
    });

    async function onSubmit(data: ProjectFormValues) {
        setLoading(true);
        try {
            const projectData = {
                ...data,
                type: data.type || "STANDARD"
            };

            let result;
            if (initialData?.id) {
                result = await updateProject(initialData.id, projectData);
            } else {
                result = await createProject(projectData);
            }

            if (result.success) {
                toast.success(initialData?.id ? "Projeto atualizado!" : "Projeto criado com sucesso!");
                if (!initialData?.id) form.reset();
                onSuccess?.();
            } else {
                toast.error(initialData?.id ? "Erro ao atualizar." : "Erro ao criar projeto.");
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
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Projeto</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Reforma da Casa" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="context"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contexto</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                        <SelectItem value="PENDING">Pendente</SelectItem>
                                        <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                                        <SelectItem value="COMPLETED">Concluído</SelectItem>
                                        <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                                        <SelectItem value="CANCELED">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="personIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Clientes / Empresas / Pessoas</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        options={people.map(p => ({ label: p.name, value: p.id }))}
                                        selected={field.value || []}
                                        onChange={field.onChange}
                                        placeholder="Selecione..."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="goalId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vinculado ao Objetivo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione (Opcional)" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {goals.map((goal) => (
                                            <SelectItem key={goal.id} value={goal.id}>
                                                {goal.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Prazo de Entrega</FormLabel>
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
                                                        "SELECIONE UMA DATA"
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
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Projeto</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="STANDARD">Projeto Simples (Notas + Tarefas)</SelectItem>
                                        <SelectItem value="AGILE">Projeto Ágil (Kanban + Sprints)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Salvando..." : (initialData ? "Atualizar Projeto" : "Criar Projeto")}
                </Button>
            </form>
        </Form>
    );
}
