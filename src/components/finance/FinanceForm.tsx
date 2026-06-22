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
import { createFinance, updateFinance, CreateFinanceData } from "@/app/actions/finance";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Person, Project } from "@prisma/client";
import { ReminderSelect } from "@/components/ui/ReminderSelect";
import { RecurrenceSelector, RecurrenceType } from "@/components/ui/RecurrenceSelector";
import { RecurrenceActionDialog, RecurrenceMode } from "../agenda/RecurrenceActionDialog";

const financeSchema = z.object({
    description: z.string().min(2, "Descrição obrigatória"),
    category: z.enum([
        "PESSOAL", "EMPRESA", "FILHO",
        "RECEITA_SALARIO", "RECEITA_INVESTIMENTO", "RECEITA_VENDA", "RECEITA_SERVICO",
        "MORADIA", "ALIMENTACAO", "TRANSPORTE", "SAUDE", "EDUCACAO", "SERVICOS_ESSENCIAIS",
        "LAZER", "RESTAURANTES", "COMPRAS", "VIAGENS",
        "FILHO_ESCOLA", "FILHO_SAUDE", "FILHO_LAZER",
        "EMPRESA_OPERACIONAL", "EMPRESA_MARKETING", "EMPRESA_IMPOSTOS", "EMPRESA_EQUIPE",
        "OUTRA_RECEITA", "OUTROS"
    ]),
    type: z.enum(["FIXO", "VARIAVEL"]),
    amount: z.string().min(1, "Valor obrigatório"),
    dueDate: z.date().optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED", "CANCELED"]), // Using Status enum but mapping to Paid/Pending
    personId: z.string().optional(),
    projectId: z.string().optional(),
    reminderMinutes: z.number().nullable().optional(),
    recurrenceType: z.nativeEnum(RecurrenceType).default(RecurrenceType.NONE),
    recurrenceEndDate: z.date().optional(),
});

type FinanceFormValues = z.infer<typeof financeSchema>;

interface FinanceFormProps {
    people: Person[];
    projects: Project[];
    initialData?: any;
    onSuccess?: () => void;
}

export function FinanceForm({ people, projects, initialData, onSuccess }: FinanceFormProps) {
    const [loading, setLoading] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const form = useForm<FinanceFormValues>({
        resolver: zodResolver(financeSchema) as any,
        defaultValues: {
            description: initialData?.description || "",
            category: initialData?.category || "EMPRESA",
            type: initialData?.type || "VARIAVEL",
            status: initialData?.status || "PENDING",
            personId: initialData?.personId || "none",
            projectId: initialData?.projectId || "none",
            amount: initialData?.amount ? String(initialData.amount).replace(".", ",") : "",
            dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : new Date(),
            reminderMinutes: initialData?.reminderMinutes || null,
            recurrenceType: initialData?.recurrenceType || RecurrenceType.NONE,
            recurrenceEndDate: initialData?.recurrenceEndDate ? new Date(initialData.recurrenceEndDate) : undefined,
        },
    });

    const [isRecurrenceDialogOpen, setIsRecurrenceDialogOpen] = useState(false);
    const [pendingData, setPendingData] = useState<FinanceFormValues | null>(null);

    async function onSubmit(data: FinanceFormValues) {
        // If it's a recurring record (has parent or has recurrenceType) and we are editing
        if (initialData && (initialData.parentId || (initialData.recurrenceType && initialData.recurrenceType !== "NONE"))) {
            setPendingData(data);
            setIsRecurrenceDialogOpen(true);
            return;
        }

        await executeSave(data, "SINGLE");
    }

    async function executeSave(data: FinanceFormValues, mode: RecurrenceMode) {
        setLoading(true);
        try {
            const formattedAmount = parseFloat(data.amount.replace(/[^\d.,]/g, "").replace(",", "."));

            const payload = {
                ...data,
                amount: isNaN(formattedAmount) ? 0 : formattedAmount,
                category: data.category as any,
                type: data.type as any,
                status: data.status as any,
                recurrenceType: data.recurrenceType as any,
            };

            let result;
            if (initialData) {
                result = await updateFinance(initialData.id, payload as any, mode);
            } else {
                result = await createFinance(payload as any);
            }

            if (result.success) {
                toast.success(initialData ? "Movimentação atualizada!" : "Movimentação registrada!");
                if (!initialData) form.reset();
                onSuccess?.();
            } else {
                toast.error(initialData ? "Erro ao atualizar." : "Erro ao registrar movimentação.");
            }
        } catch (error) {
            toast.error("Erro inesperado.");
            console.error(error);
        } finally {
            setLoading(false);
            setIsRecurrenceDialogOpen(false);
        }
    }

    const handleRecurrenceConfirm = (mode: RecurrenceMode) => {
        if (pendingData) {
            executeSave(pendingData, mode);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* ... existing fields ... */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Mensalidade Inglês" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor (R$)</FormLabel>
                                <FormControl>
                                    <Input placeholder="0,00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Vencimento</FormLabel>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50">Receitas</div>
                                        <SelectItem value="RECEITA_SALARIO">Salário</SelectItem>
                                        <SelectItem value="RECEITA_INVESTIMENTO">Investimentos</SelectItem>
                                        <SelectItem value="RECEITA_VENDA">Vendas</SelectItem>
                                        <SelectItem value="RECEITA_SERVICO">Prestação de Serviço</SelectItem>
                                        <SelectItem value="OUTRA_RECEITA">Outras Receitas</SelectItem>

                                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 mt-2">Despesas Essenciais</div>
                                        <SelectItem value="MORADIA">Moradia</SelectItem>
                                        <SelectItem value="ALIMENTACAO">Alimentação</SelectItem>
                                        <SelectItem value="TRANSPORTE">Transporte</SelectItem>
                                        <SelectItem value="SAUDE">Saúde</SelectItem>
                                        <SelectItem value="EDUCACAO">Educação</SelectItem>
                                        <SelectItem value="SERVICOS_ESSENCIAIS">Serviços (Água, Luz, etc)</SelectItem>

                                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 mt-2">Lifestyle</div>
                                        <SelectItem value="LAZER">Lazer</SelectItem>
                                        <SelectItem value="RESTAURANTES">Restaurantes</SelectItem>
                                        <SelectItem value="COMPRAS">Compras</SelectItem>
                                        <SelectItem value="VIAGENS">Viagens</SelectItem>

                                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 mt-2">Filho</div>
                                        <SelectItem value="FILHO_ESCOLA">Escola / Educação</SelectItem>
                                        <SelectItem value="FILHO_SAUDE">Saúde</SelectItem>
                                        <SelectItem value="FILHO_LAZER">Lazer</SelectItem>

                                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 mt-2">Empresa</div>
                                        <SelectItem value="EMPRESA_OPERACIONAL">Operacional</SelectItem>
                                        <SelectItem value="EMPRESA_MARKETING">Marketing</SelectItem>
                                        <SelectItem value="EMPRESA_IMPOSTOS">Impostos</SelectItem>
                                        <SelectItem value="EMPRESA_EQUIPE">Equipe / Salários</SelectItem>

                                        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 mt-2">Outros</div>
                                        <SelectItem value="OUTROS">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                        <SelectItem value="FIXO">Fixo</SelectItem>
                                        <SelectItem value="VARIAVEL">Variável</SelectItem>
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
                        name="personId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pessoa (Opcional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhuma</SelectItem>
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
                </div>

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status Pagamento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pendente</SelectItem>
                                    <SelectItem value="COMPLETED">Pago</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="reminderMinutes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lembrete de Vencimento</FormLabel>
                            <ReminderSelect
                                value={field.value ?? null}
                                onChange={field.onChange}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="recurrenceType"
                    render={({ field }) => (
                        <FormItem>
                            <RecurrenceSelector
                                type={field.value}
                                interval={1} 
                                endDate={form.watch("recurrenceEndDate")}
                                onTypeChange={field.onChange}
                                onIntervalChange={() => {}} 
                                onEndDateChange={(val) => form.setValue("recurrenceEndDate", val)}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Salvando..." : (initialData ? "Atualizar" : "Registrar")}
                </Button>

                <RecurrenceActionDialog
                    open={isRecurrenceDialogOpen}
                    onOpenChange={setIsRecurrenceDialogOpen}
                    onConfirm={handleRecurrenceConfirm}
                    title="Editar movimentação recorrente"
                    description="Esta movimentação faz parte de uma série. Como você gostaria de aplicar as alterações?"
                    actionLabel="Salvar"
                />
            </form>
        </Form>
    );
}
