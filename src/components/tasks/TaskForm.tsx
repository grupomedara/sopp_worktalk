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
import { createTask, updateTask, CreateTaskData } from "@/app/actions/tasks";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Project, Person } from "@prisma/client";
import { RecurrenceSelector, RecurrenceType } from "@/components/ui/RecurrenceSelector";
import { TaskReminderSelect } from "@/components/ui/TaskReminderSelect";
import { RecurrenceActionDialog, RecurrenceMode } from "../agenda/RecurrenceActionDialog";
import { TaskTimeTracker } from "./TaskTimeTracker";

const taskSchema = z.object({
    title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
    context: z.enum(["SAUDE", "INTELECTUAL", "EMOCIONAL", "REALIZACAO", "FINANCEIRO", "SOCIAL", "FAMILIA", "RELACIONAMENTO", "VIDA_SOCIAL", "LAZER", "FELICIDADE", "ESPIRITUAL"]),
    priority: z.enum(["High", "Medium", "Low"]),
    date: z.date().optional(),
    projectId: z.string().optional(),
    responsibleId: z.string().optional(),
    energy: z.enum(["BAIXA", "MEDIA", "ALTA"]).optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED", "CANCELED"]),

    // Recurrence
    recurrenceType: z.nativeEnum(RecurrenceType),
    recurrenceInterval: z.number().optional(),
    recurrenceEndDate: z.date().optional(),
    reminderMinutes: z.number().nullable().optional(),
    estimatedTime: z.number().nullable().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
    projects: Project[];
    people: Person[];
    initialData?: any;
    onSuccess?: () => void;
}

export function TaskForm({ projects, people, initialData, onSuccess }: TaskFormProps) {
    const [loading, setLoading] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isRecurrenceDialogOpen, setIsRecurrenceDialogOpen] = useState(false);
    const [formData, setFormData] = useState<TaskFormValues | null>(null);

    const form = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: initialData?.title || "",
            context: initialData?.context || "REALIZACAO",
            priority: initialData?.priority || "Medium",
            status: initialData?.status || "PENDING",
            energy: initialData?.energy || "MEDIA",
            projectId: initialData?.projectId || undefined,
            responsibleId: initialData?.responsibleId || undefined,
            date: initialData?.date ? new Date(initialData.date) : undefined,
            recurrenceType: RecurrenceType.NONE,
            reminderMinutes: initialData?.reminderMinutes || null,
            estimatedTime: initialData?.estimatedTime || null,
        },
    });

    async function onSubmit(data: TaskFormValues) {
        // If it's a recurring task and we are editing, show dialog
        if (initialData && initialData.recurrenceType && initialData.recurrenceType !== RecurrenceType.NONE) {
            setFormData(data);
            setIsRecurrenceDialogOpen(true);
            return;
        }

        await executeSave(data, "SINGLE");
    }

    const executeSave = async (data: TaskFormValues, mode: RecurrenceMode) => {
        setLoading(true);
        try {
            let result;
            if (initialData?.id) {
                result = await updateTask(initialData.id, {
                    ...data,
                    recurrenceType: data.recurrenceType as any,
                }, mode);
            } else {
                result = await createTask({
                    ...data,
                    recurrenceType: data.recurrenceType as any,
                });
            }

            if (result.success) {
                toast.success(initialData?.id ? "Tarefa atualizada!" : "Tarefa criada com sucesso!");
                if (!initialData?.id) form.reset();
                onSuccess?.();
            } else {
                toast.error(initialData?.id ? "Erro ao atualizar tarefa." : "Erro ao criar tarefa.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
            console.error(error);
        } finally {
            setLoading(false);
            setIsRecurrenceDialogOpen(false);
        }
    };

    const handleRecurrenceConfirm = (mode: RecurrenceMode) => {
        if (formData) {
            executeSave(formData, mode);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Título da Tarefa</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Enviar proposta comercial" {...field} />
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
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prioridade</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="High">Alta</SelectItem>
                                        <SelectItem value="Medium">Média</SelectItem>
                                        <SelectItem value="Low">Baixa</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="energy"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Energia</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="BAIXA">Baixa</SelectItem>
                                        <SelectItem value="MEDIA">Média</SelectItem>
                                        <SelectItem value="ALTA">Alta</SelectItem>
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
                        name="projectId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Projeto (Opcional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um projeto" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="responsibleId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Responsável (Opcional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um responsável" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {people.map((person) => (
                                            <SelectItem key={person.id} value={person.id}>
                                                {person.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data de Execução</FormLabel>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: ptBR })
                                            ) : (
                                                <span>Hoje / Sem data</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="estimatedTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tempo Estimado (minutos)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 60"
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="reminderMinutes"
                        render={({ field }) => (
                            <FormItem>
                                <TaskReminderSelect
                                    value={field.value ?? null}
                                    onChange={field.onChange}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {initialData?.id && (
                    <div className="mt-6 mb-4">
                        <TaskTimeTracker 
                            taskId={initialData.id} 
                            estimatedTime={form.watch("estimatedTime") || initialData.estimatedTime || 0} 
                            timeLogs={initialData.timeLogs || []} 
                        />
                    </div>
                )}

                {/* Recurrence Selector */}
                <FormField
                    control={form.control}
                    name="recurrenceType"
                    render={({ field }) => (
                        <FormItem>
                            <RecurrenceSelector
                                type={field.value}
                                interval={form.watch("recurrenceInterval")}
                                endDate={form.watch("recurrenceEndDate")}
                                onTypeChange={field.onChange}
                                onIntervalChange={(val) => form.setValue("recurrenceInterval", val)}
                                onEndDateChange={(val) => form.setValue("recurrenceEndDate", val)}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Salvando..." : (initialData ? "Atualizar Tarefa" : "Criar Tarefa")}
                </Button>

                <RecurrenceActionDialog
                    open={isRecurrenceDialogOpen}
                    onOpenChange={setIsRecurrenceDialogOpen}
                    onConfirm={handleRecurrenceConfirm}
                    title="Editar tarefa recorrente"
                    description="Esta tarefa faz parte de uma série. Como você gostaria de aplicar as alterações?"
                    actionLabel="Salvar"
                />
            </form>
        </Form>
    );
}
