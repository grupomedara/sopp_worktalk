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
import { createLesson, updateLesson, CreateLessonData } from "@/app/actions/lessons";
import { useState } from "react";
import { Person } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const lessonSchema = z.object({
    clientOrGroup: z.string().min(2, "Cliente ou Turma obrigatório"),
    topic: z.string().min(2, "Tema obrigatório"),
    objective: z.string().optional(),
    appliedContent: z.string().optional(),
    materials: z.string().optional(),
    followUp: z.string().optional(),
    personId: z.string().optional(),
    materialUrl: z.string().optional(),
    rating: z.string().optional(),
    studentFeedback: z.string().optional(),

    date: z.date(),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

interface LessonFormProps {
    people: Person[];
    initialData?: any; // Using any for flexibility or ideally mapped type
    onSuccess?: () => void;
}

export function LessonForm({ people, initialData, onSuccess }: LessonFormProps) {
    const [loading, setLoading] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isDueDateOpen, setIsDueDateOpen] = useState(false);

    const form = useForm<LessonFormValues>({
        resolver: zodResolver(lessonSchema),
        defaultValues: {
            clientOrGroup: initialData?.clientOrGroup || "",
            topic: initialData?.topic || "",
            objective: initialData?.objective || "",
            appliedContent: initialData?.appliedContent || "",
            materials: initialData?.materials || "",
            followUp: initialData?.followUp || "",
            personId: initialData?.personId || "none",
            materialUrl: initialData?.materialUrl || "",
            rating: initialData?.rating ? String(initialData.rating) : "",
            studentFeedback: initialData?.studentFeedback || "",
            // Finance defaults
            date: initialData?.date ? new Date(initialData.date) : new Date(),
        },
    });

    async function onSubmit(data: LessonFormValues) {
        setLoading(true);
        try {
            const payload = {
                ...data,
            };

            let result;
            if (initialData) {
                result = await updateLesson(initialData.id, payload as any);
            } else {
                result = await createLesson(payload as any);
            }

            if (result.success) {
                toast.success(initialData ? "Aula atualizada!" : "Aula registrada com sucesso!");
                if (!initialData) form.reset(); // Don't reset on edit to keep data visible or close dialog handles it
                onSuccess?.();
            } else {
                toast.error("Erro ao salvar aula.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Auto-fill client name when checking person
    const handlePersonChange = (value: string) => {
        form.setValue("personId", value);
        if (value !== "none") {
            const person = people.find((p) => p.id === value);
            if (person) {
                form.setValue("clientOrGroup", person.name);
            }
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Data da Aula</FormLabel>
                                <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
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
                                                    <span>Selecione uma data</span>
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
                                                setIsDateOpen(false);
                                            }}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
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
                        name="personId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vincular a Pessoa (Opcional)</FormLabel>
                                <Select onValueChange={handlePersonChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um aluno/cliente" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum / Turma Avulsa</SelectItem>
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

                    <FormField
                        control={form.control}
                        name="clientOrGroup"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cliente ou Turma</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Turma A ou Nome do Aluno" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tema da Aula</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Introdução ao Piano" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="objective"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Objetivo</FormLabel>
                                <FormControl>
                                    <Input placeholder="O que o aluno deve aprender hoje?" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="materials"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Materiais</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: PDF, Link" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="appliedContent"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Conteúdo Aplicado</FormLabel>
                            <FormControl>
                                <RichTextEditor
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Detalhes do que foi ensinado... Ctrl+V para colar imagens."
                                    minHeight={150}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="followUp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Próximos Passos (Follow-up)</FormLabel>
                            <FormControl>
                                <Input placeholder="Dever de casa?" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="materialUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link do Material</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." type="url" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nota do Aluno (1–5)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="—" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <SelectItem key={n} value={String(n)}>{"⭐".repeat(n)} ({n})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="studentFeedback"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Feedback do Aluno</FormLabel>
                                <FormControl>
                                    <Input placeholder="Percepção do aluno sobre a aula" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Salvando..." : (initialData ? "Atualizar Aula" : "Registrar Aula")}
                </Button>
            </form>
        </Form>
    );
}
