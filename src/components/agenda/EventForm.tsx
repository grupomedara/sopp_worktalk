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
import { createEvent, updateEvent, deleteEvent, CreateEventData } from "@/app/actions/events";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Project } from "@prisma/client";
import { RecurrenceSelector, RecurrenceType } from "@/components/ui/RecurrenceSelector";
import { ReminderSelect } from "@/components/ui/ReminderSelect";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RecurrenceActionDialog, RecurrenceMode } from "./RecurrenceActionDialog";

const eventSchema = z.object({
    title: z.string().min(2, "Título obrigatório"),
    type: z.enum(["SAUDE", "INTELECTUAL", "EMOCIONAL", "REALIZACAO", "FINANCEIRO", "SOCIAL", "FAMILIA", "RELACIONAMENTO", "VIDA_SOCIAL", "LAZER", "FELICIDADE", "ESPIRITUAL"]),
    startDate: z.date(),
    endDate: z.date(),
    projectId: z.string().optional(),

    // Recurrence
    recurrenceType: z.nativeEnum(RecurrenceType),
    recurrenceInterval: z.number().optional(),
    recurrenceEndDate: z.date().optional(),
    reminderMinutes: z.number().nullable().optional(),
    color: z.string().optional().nullable(),
    alarms: z.array(z.date()).optional(),
    updateAllFuture: z.boolean().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
    projects: Project[];
    initialData?: any;
    onSuccess?: () => void;
}

export function EventForm({ projects, initialData, onSuccess }: EventFormProps) {
    const [loading, setLoading] = useState(false);
    const [isRecurrenceDialogOpen, setIsRecurrenceDialogOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"SAVE" | "DELETE" | null>(null);
    const [formData, setFormData] = useState<EventFormValues | null>(null);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: initialData?.title || "",
            type: initialData?.type || "REALIZACAO",
            startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
            endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
            projectId: initialData?.projectId || "none",
            recurrenceType: initialData?.recurrenceType || RecurrenceType.NONE,
            recurrenceInterval: initialData?.recurrenceInterval || undefined,
            recurrenceEndDate: initialData?.recurrenceEndDate ? new Date(initialData.recurrenceEndDate) : undefined,
            reminderMinutes: initialData?.reminderMinutes || null,
            color: initialData?.color || "blue",
            alarms: initialData?.alarms ? initialData.alarms.map((a: any) => new Date(a.dateTime)) : [],
        },
    });

    const [alarms, setAlarms] = useState<Date[]>(
        initialData?.alarms ? initialData.alarms.map((a: any) => new Date(a.dateTime)) : []
    );

    const addAlarm = () => {
        if (alarms.length < 3) {
            setAlarms([...alarms, new Date()]);
        }
    };

    const removeAlarm = (index: number) => {
        setAlarms(alarms.filter((_, i) => i !== index));
    };

    const updateAlarm = (index: number, date: Date) => {
        const newAlarms = [...alarms];
        newAlarms[index] = date;
        setAlarms(newAlarms);
    };

    // Auto-set end date to 1 hour after start when start date changes
    const startDate = form.watch("startDate");
    const [prevStartDate, setPrevStartDate] = useState<Date | null>(
        initialData?.startDate ? new Date(initialData.startDate) : null
    );
    
    useEffect(() => {
        if (startDate && (!prevStartDate || startDate.getTime() !== prevStartDate.getTime())) {
            const newEndDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            form.setValue("endDate", newEndDate);
            setPrevStartDate(startDate);
        }
    }, [startDate, prevStartDate, form]);

    const onSubmit = async (data: EventFormValues) => {
        // If it's a recurring event and we are editing, show dialog
        if (initialData?.id && initialData.recurrenceType !== RecurrenceType.NONE) {
            setFormData(data);
            setPendingAction("SAVE");
            setIsRecurrenceDialogOpen(true);
            return;
        }

        await executeSave(data, "SINGLE");
    };

    const executeSave = async (data: EventFormValues, mode: RecurrenceMode) => {
        setLoading(true);
        try {
            if (alarms) {
                const now = new Date();
                const pastAlarms = alarms.filter(a => a < now);
                if (pastAlarms.length > 0) {
                    toast.error("Não é possível adicionar alarmes no passado.");
                    setLoading(false);
                    return;
                }
            }

            const formattedData: CreateEventData = {
                ...data,
                recurrenceType: data.recurrenceType as any,
                projectId: data.projectId === "none" ? undefined : data.projectId,
                alarms: alarms.length > 0 ? alarms : undefined
            };

            const result = initialData?.id
                ? await updateEvent(initialData.id, formattedData, mode)
                : await createEvent(formattedData);

            if (result.success) {
                toast.success(initialData?.id ? "Compromisso atualizado!" : "Compromisso agendado!");
                form.reset();
                onSuccess?.();
            } else {
                toast.error(result.error || "Ocorreu um erro");
            }
        } catch (error) {
            toast.error("Ocorreu um erro ao salvar o compromisso");
        } finally {
            setLoading(false);
            setIsRecurrenceDialogOpen(false);
            setPendingAction(null);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !initialData.id) return;

        if (initialData.recurrenceType !== RecurrenceType.NONE) {
            setPendingAction("DELETE");
            setIsRecurrenceDialogOpen(true);
            return;
        }

        await executeDelete("SINGLE");
    };

    const executeDelete = async (mode: RecurrenceMode) => {
        setLoading(true);
        try {
            const result = await deleteEvent(initialData.id, mode);
            if (result.success) {
                toast.success("Compromisso excluído!");
                onSuccess?.();
            } else {
                toast.error(result.error || "Ocorreu um erro ao excluir");
            }
        } catch (error) {
            toast.error("Ocorreu um erro ao excluir o compromisso");
        } finally {
            setLoading(false);
            setIsRecurrenceDialogOpen(false);
            setPendingAction(null);
        }
    };

    const handleRecurrenceConfirm = (mode: RecurrenceMode) => {
        if (pendingAction === "SAVE" && formData) {
            executeSave(formData, mode);
        } else if (pendingAction === "DELETE") {
            executeDelete(mode);
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
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Reunião Diretoria" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo</FormLabel>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Início</FormLabel>
                                <Popover>
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
                                                    <span className="truncate">{format(field.value, "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                                                ) : (
                                                    <span>Data/Hora</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date) {
                                                    const now = new Date();
                                                    date.setHours(now.getHours());
                                                    date.setMinutes(0);
                                                    field.onChange(date);
                                                }
                                            }}
                                            initialFocus
                                        />
                                        <div className="p-3 border-t">
                                            <input
                                                type="time"
                                                className="w-full min-h-[44px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                                                value={field.value ? format(field.value, "HH:mm") : ""}
                                                onChange={(e) => {
                                                    const [hours, minutes] = e.target.value.split(':');
                                                    if (hours && minutes) {
                                                        const newDate = new Date(field.value || new Date());
                                                        newDate.setHours(parseInt(hours));
                                                        newDate.setMinutes(parseInt(minutes));
                                                        field.onChange(newDate);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fim</FormLabel>
                                <Popover>
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
                                                    <span className="truncate">{format(field.value, "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                                                ) : (
                                                    <span>Data/Hora</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => {
                                                if (date) {
                                                    date.setHours(new Date().getHours() + 1);
                                                    date.setMinutes(0);
                                                    field.onChange(date);
                                                }
                                            }}
                                            initialFocus
                                        />
                                        <div className="p-3 border-t">
                                            <input
                                                type="time"
                                                className="w-full min-h-[44px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                                                value={field.value ? format(field.value, "HH:mm") : ""}
                                                onChange={(e) => {
                                                    const [hours, minutes] = e.target.value.split(':');
                                                    if (hours && minutes) {
                                                        const newDate = new Date(field.value || new Date());
                                                        newDate.setHours(parseInt(hours));
                                                        newDate.setMinutes(parseInt(minutes));
                                                        field.onChange(newDate);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Projeto (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
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
                    name="color"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cor do Evento</FormLabel>
                            <FormControl>
                                <div className="flex flex-wrap gap-2">
                                    {["blue", "red", "green", "yellow", "purple", "orange", "pink", "teal", "indigo", "slate"].map((color) => {
                                        const colorMap: Record<string, string> = {
                                            blue: "bg-blue-500", red: "bg-red-500", green: "bg-green-500", yellow: "bg-yellow-500", purple: "bg-purple-500",
                                            orange: "bg-orange-500", pink: "bg-pink-500", teal: "bg-teal-500", indigo: "bg-indigo-500", slate: "bg-slate-500"
                                        };
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                className={cn(
                                                    "w-6 h-6 rounded-full border",
                                                    colorMap[color],
                                                    field.value === color && "ring-2 ring-offset-2 ring-black"
                                                )}
                                                onClick={() => field.onChange(color)}
                                            />
                                        );
                                    })}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <FormLabel>Alarmes Customizados (Máx 3)</FormLabel>
                    {alarms.map((alarmDate, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full text-left font-normal",
                                            !alarmDate && "text-muted-foreground"
                                        )}
                                    >
                                        {alarmDate ? (
                                            format(alarmDate, "PP p", { locale: ptBR })
                                        ) : (
                                            <span>Selecionar</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={alarmDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                const newDate = new Date(alarmDate);
                                                newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                                                updateAlarm(index, newDate);
                                            }
                                        }}
                                        initialFocus
                                    />
                                    <div className="p-3 border-t">
                                        <Input
                                            type="time"
                                            className="w-full"
                                            value={format(alarmDate, "HH:mm")}
                                            onChange={(e) => {
                                                const [hours, minutes] = e.target.value.split(':');
                                                const newDate = new Date(alarmDate);
                                                newDate.setHours(parseInt(hours));
                                                newDate.setMinutes(parseInt(minutes));
                                                updateAlarm(index, newDate);
                                            }}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button type="button" variant="destructive" size="sm" onClick={() => removeAlarm(index)}>
                                X
                            </Button>
                        </div>
                    ))}
                    {alarms.length < 3 && (
                        <Button type="button" variant="outline" size="sm" onClick={addAlarm}>
                            + Adicionar Alarme
                        </Button>
                    )}
                </div>

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

                <div className="flex gap-2 w-full pt-4">
                    <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? "Salvando..." : (initialData?.id ? "Atualizar Compromisso" : "Agendar")}
                    </Button>
                    
                    {initialData?.id && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    disabled={loading}
                                    title="Excluir compromisso"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente este compromisso.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDelete} 
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Sim, Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

                <RecurrenceActionDialog
                    open={isRecurrenceDialogOpen}
                    onOpenChange={setIsRecurrenceDialogOpen}
                    onConfirm={handleRecurrenceConfirm}
                    title={pendingAction === "DELETE" ? "Excluir evento recorrente" : "Editar evento recorrente"}
                    description={pendingAction === "DELETE" ? "Como você gostaria de excluir os eventos desta série?" : "Este evento faz parte de uma série. Como você gostaria de aplicar as alterações?"}
                    actionLabel={pendingAction === "DELETE" ? "Excluir" : "Salvar"}
                />
            </form>
        </Form>
    );
}
