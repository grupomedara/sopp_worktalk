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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createMeeting, updateMeeting, getMeetingFilterOptions, CreateMeetingData } from "@/app/actions/meetings";
import { useState, useEffect, useCallback } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { MultiSelect } from "@/components/ui/multi-select";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const meetingSchema = z.object({
    companyOrPerson: z.string().min(2, "Empresa/Pessoa obrigatória"),
    theme: z.string().min(2, "Tema obrigatório"),
    date: z.date(),
    startTimeString: z.string().min(5, "Horário de início obrigatório"),
    endTimeString: z.string().min(5, "Horário de término obrigatório"),
    content: z.string().optional(),
    participantIds: z.array(z.string()),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
    people: { id: string; name: string }[];
    initialData?: any;
    onSuccess?: () => void;
    isReadOnly?: boolean;
}

export function MeetingForm({ people, initialData, onSuccess, isReadOnly = false }: MeetingFormProps) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<{ companies: string[]; themes: string[] }>({
        companies: [],
        themes: [],
    });

    useEffect(() => {
        async function loadOptions() {
            const result = await getMeetingFilterOptions();
            if (result.success && result.data) {
                setOptions({
                    companies: result.data.companies,
                    themes: result.data.themes,
                });
            }
        }
        loadOptions();
    }, []);

    const parseTime = (date?: string | Date) => {
        if (!date) return "";
        const d = new Date(date);
        return format(d, "HH:mm");
    };

    const form = useForm<MeetingFormValues>({
        resolver: zodResolver(meetingSchema),
        defaultValues: {
            companyOrPerson: initialData?.companyOrPerson || "",
            theme: initialData?.theme || "",
            date: initialData?.date ? new Date(initialData.date) : new Date(),
            startTimeString: initialData?.startTime ? parseTime(initialData.startTime) : "",
            endTimeString: initialData?.endTime ? parseTime(initialData.endTime) : "",
            content: initialData?.content || "",
            participantIds: initialData?.participants ? initialData.participants.map((p: any) => p.id) : [],
        },
    });

    const watchedValues = form.watch();

    const getPayload = useCallback((data: MeetingFormValues): CreateMeetingData => {
        const [sh, sm] = data.startTimeString.split(":").map(Number);
        const [eh, em] = data.endTimeString.split(":").map(Number);

        const startTime = new Date(data.date);
        startTime.setHours(sh, sm, 0, 0);

        const endTime = new Date(data.date);
        endTime.setHours(eh, em, 0, 0);
        if (endTime < startTime) {
            endTime.setDate(endTime.getDate() + 1); // Spans past midnight
        }

        return {
            companyOrPerson: data.companyOrPerson,
            theme: data.theme,
            date: data.date,
            startTime,
            endTime,
            content: data.content,
            participantIds: data.participantIds,
        };
    }, []);

    const handleAutoSave = useCallback(async (data: MeetingFormValues) => {
        if (!initialData) return;
        try {
            const payload = getPayload(data);
            await updateMeeting(initialData.id, payload);
        } catch (error) {
            console.error("AutoSave Error:", error);
        }
    }, [initialData, getPayload]);

    const { isSaving } = useAutoSave({
        value: watchedValues,
        saveFn: handleAutoSave,
        enabled: !isReadOnly && !!initialData,
        isValid: form.formState.isValid,
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                companyOrPerson: initialData.companyOrPerson || "",
                theme: initialData.theme || "",
                date: initialData.date ? new Date(initialData.date) : new Date(),
                startTimeString: initialData.startTime ? parseTime(initialData.startTime) : "",
                endTimeString: initialData.endTime ? parseTime(initialData.endTime) : "",
                content: initialData.content || "",
                participantIds: initialData.participants ? initialData.participants.map((p: any) => p.id) : [],
            });
        } else {
            form.reset({
                companyOrPerson: "",
                theme: "",
                date: new Date(),
                startTimeString: "",
                endTimeString: "",
                content: "",
                participantIds: [],
            });
        }
    }, [initialData, form]);

    async function onSubmit(data: MeetingFormValues) {
        setLoading(true);
        try {
            const payload = getPayload(data);
            let result;
            if (initialData) {
                result = await updateMeeting(initialData.id, payload);
            } else {
                result = await createMeeting(payload);
            }

            if (result.success) {
                toast.success(initialData ? "Ata de reunião atualizada!" : "Reunião registrada com sucesso!");
                if (!initialData) form.reset();
                onSuccess?.();
            } else {
                toast.error(result.error || "Erro ao salvar reunião.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const durationText = (() => {
        const start = watchedValues.startTimeString;
        const end = watchedValues.endTimeString;
        if (!start || !end) return "";
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "";
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) {
            diff += 24 * 60; // Spans to next day
        }
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        if (hours > 0) {
            return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
        }
        return `${minutes} min`;
    })();

    const multiSelectOptions = people.map((p) => ({
        value: p.id,
        label: p.name,
    }));

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control as any}
                        name="companyOrPerson"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Empresa / Pessoa</FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={options.companies}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Selecione ou digite..."
                                        emptyText="Nenhuma empresa ou pessoa encontrada."
                                        disabled={isReadOnly}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="theme"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tema da Reunião</FormLabel>
                                <FormControl>
                                    <CreatableCombobox
                                        options={options.themes}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Selecione ou digite..."
                                        emptyText="Nenhum tema encontrado."
                                        disabled={isReadOnly}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <FormField
                        control={form.control as any}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Data</FormLabel>
                                <Popover open={isReadOnly ? false : undefined}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                disabled={isReadOnly}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal border-zinc-800 bg-zinc-950 px-3",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                ) : (
                                                    <span>Selecione a data</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-zinc-800 bg-zinc-950" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="startTimeString"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Início</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="time"
                                            disabled={isReadOnly}
                                            className="min-h-[40px] border-zinc-800 bg-zinc-950 text-foreground"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="endTimeString"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Término</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="time"
                                            disabled={isReadOnly}
                                            className="min-h-[40px] border-zinc-800 bg-zinc-950 text-foreground"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {durationText && (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-border/10 bg-background/50 text-xs font-semibold text-primary">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>Duração Calculada: {durationText}</span>
                    </div>
                )}

                <FormField
                    control={form.control as any}
                    name="participantIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vincular Participantes</FormLabel>
                            <FormControl>
                                <MultiSelect
                                    options={multiSelectOptions}
                                    selected={field.value}
                                    onChange={field.onChange}
                                    placeholder="Selecione participantes..."
                                    disabled={isReadOnly}
                                />
                            </FormControl>
                            <FormDescription>
                                Vincule contatos cadastrados que participaram desta reunião.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control as any}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Registro da Ata / Reunião</FormLabel>
                            <FormControl>
                                <RichTextEditor
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Tópicos discutidos, decisões tomadas, próximos passos... Ctrl+V para colar imagens."
                                    minHeight={250}
                                    readOnly={isReadOnly}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!isReadOnly && (
                    <div className="flex flex-col gap-2 pt-2">
                        <Button type="submit" className="w-full" disabled={loading || isSaving}>
                            {loading || isSaving ? "Salvando..." : (initialData ? "Atualizar Reunião" : "Registrar Reunião")}
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
