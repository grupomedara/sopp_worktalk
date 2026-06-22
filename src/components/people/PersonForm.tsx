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
import { createPerson, updatePerson } from "@/app/actions/people";
import { Person } from "@prisma/client"; // Will be updated after migration
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, User } from "lucide-react";
import { ReminderSelect } from "@/components/ui/ReminderSelect";

// Schema Validation
const personSchema = z.object({
    kind: z.enum(["FISICA", "JURIDICA"]),
    name: z.string().min(2, "Obrigatório"),
    fantasyName: z.string().optional(),

    type: z.enum(["FILHO", "CLIENTE", "COLABORADOR", "SOCIO", "OUTRO"]),
    context: z.enum(["SAUDE", "INTELECTUAL", "EMOCIONAL", "REALIZACAO", "FINANCEIRO", "SOCIAL", "FAMILIA", "RELACIONAMENTO", "VIDA_SOCIAL", "LAZER", "FELICIDADE", "ESPIRITUAL"]),

    document: z.string().optional(), // Logic for validation moved to refine or custom
    rg: z.string().optional().refine((val) => {
        if (!val) return true;
        const clean = val.replace(/[^0-9a-zA-Z]/g, "");
        return clean.length >= 7 && clean.length <= 9;
    }, "RG deve ter entre 7 e 9 caracteres"),
    stateRegistration: z.string().optional(),

    // Contact
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    website: z.string().optional(),

    // Address
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),

    // Personal
    birthDate: z.string().optional(),
    occupation: z.string().optional(),
    relationship: z.string().optional(),

    notes: z.string().optional(),

    // CRM
    nextFollowUpAt: z.string().optional(),
    stage: z.string().optional(),
    reminderMinutes: z.number().nullable().optional(),
}).superRefine((data, ctx) => {
    // Custom Validation based on Kind
    if (data.document) {
        const cleanDoc = data.document.replace(/\D/g, "");
        if (data.kind === "FISICA" && cleanDoc.length !== 11) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CPF deve ter 11 dígitos",
                path: ["document"],
            });
        }
        if (data.kind === "JURIDICA" && cleanDoc.length !== 14) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "CNPJ deve ter 14 dígitos",
                path: ["document"],
            });
        }
    }
});

type PersonFormValues = z.infer<typeof personSchema>;

interface PersonFormProps {
    person?: Person;
    onSuccess?: () => void;
}

// Helpers
const normalizeDocument = (value: string) => {
    if (!value) return "";
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 11) {
        return clean
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})/, "$1-$2")
            .replace(/(-\d{2})\d+?$/, "$1"); // CPF
    }
    return clean
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1"); // CNPJ
};

const normalizePhone = (value: string) => {
    if (!value) return "";
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})\d+?$/, "$1");
};

const normalizeZip = (value: string) => {
    if (!value) return "";
    return value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{3})\d+?$/, "$1");
};

const normalizeRG = (value: string) => {
    if (!value) return "";
    const clean = value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
    return clean
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})([0-9X])/, "$1-$2")
        .replace(/(-\w{1})\w+?$/, "$1");
};

export function PersonForm({ person, onSuccess }: PersonFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<PersonFormValues>({
        resolver: zodResolver(personSchema),
        defaultValues: {
            kind: (person as any)?.kind || "FISICA",
            name: person?.name || "",
            fantasyName: (person as any)?.fantasyName || "",
            type: (person?.type as any) || "CLIENTE",
            context: (person?.context as any) || "REALIZACAO",
            document: normalizeDocument((person as any)?.document || ""),
            rg: normalizeRG((person as any)?.rg || ""),
            stateRegistration: (person as any)?.stateRegistration || "",

            email: (person as any)?.email || "",
            phone: normalizePhone((person as any)?.phone || ""),
            mobile: normalizePhone((person as any)?.mobile || ""),
            website: (person as any)?.website || "",

            zipCode: normalizeZip((person as any)?.zipCode || ""),
            street: (person as any)?.street || "",
            number: (person as any)?.number || "",
            complement: (person as any)?.complement || "",
            district: (person as any)?.district || "",
            city: (person as any)?.city || "",
            state: (person as any)?.state || "",

            birthDate: (person as any)?.birthDate ? new Date((person as any).birthDate).toISOString().split('T')[0] : "",
            occupation: (person as any)?.occupation || "",
            relationship: (person as any)?.relationship || "",
            notes: person?.notes || "",

            // CRM Data if extending base Person form (optional but recommended for complete view)
            nextFollowUpAt: (person as any)?.nextFollowUpAt ? new Date((person as any).nextFollowUpAt).toISOString().split('T')[0] : "",
            stage: (person as any)?.stage || "",
            reminderMinutes: (person as any)?.reminderMinutes || null,
        },
    });

    const kind = form.watch("kind");

    async function onSubmit(values: PersonFormValues) {
        setLoading(true);
        try {
            const formattedData = {
                ...values,
                birthDate: values.birthDate ? new Date(values.birthDate) : undefined,
                nextFollowUpAt: values.nextFollowUpAt ? new Date(values.nextFollowUpAt) : undefined,
            } as any;

            let result;
            if (person) {
                result = await updatePerson({ ...formattedData, id: person.id });
            } else {
                result = await createPerson(formattedData);
            }

            if (result.success) {
                toast.success(person ? "Atualizado com sucesso!" : "Cadastrado com sucesso!");
                if (!person) form.reset();
                onSuccess?.();
            } else {
                toast.error("Erro ao salvar.");
                console.error(result.error);
            }
        } catch (error) {
            toast.error("Erro inesperado.");
        } finally {
            setLoading(false);
        }
    }

    const onInvalid = (errors: any) => {
        console.error("Errors", errors);
        toast.error("Verifique os campos obrigatórios.");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">

                {/* KIND SWITCHER */}
                <div className="flex justify-center mb-6">
                    <FormField
                        control={form.control}
                        name="kind"
                        render={({ field }) => (
                            <FormItem className="space-y-0">
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg"
                                    >
                                        <FormItem className="flex items-center space-x-0 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="FISICA" id="pf" className="peer sr-only" />
                                            </FormControl>
                                            <FormLabel
                                                htmlFor="pf"
                                                className="flex items-center gap-2 px-6 py-2 rounded-md cursor-pointer text-sm font-medium text-muted-foreground peer-data-[state=checked]:bg-zinc-800 peer-data-[state=checked]:text-white transition-all"
                                            >
                                                <User className="w-4 h-4" /> Pessoa Física
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-0 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value="JURIDICA" id="pj" className="peer sr-only" />
                                            </FormControl>
                                            <FormLabel
                                                htmlFor="pj"
                                                className="flex items-center gap-2 px-6 py-2 rounded-md cursor-pointer text-sm font-medium text-muted-foreground peer-data-[state=checked]:bg-zinc-800 peer-data-[state=checked]:text-white transition-all"
                                            >
                                                <Building2 className="w-4 h-4" /> Pessoa Jurídica
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800 w-full justify-start overflow-x-auto">
                        <TabsTrigger value="general" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Dados Gerais</TabsTrigger>
                        <TabsTrigger value="address" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Endereço</TabsTrigger>
                        <TabsTrigger value="contact" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Contatos</TabsTrigger>
                        <TabsTrigger value="details" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Detalhes</TabsTrigger>
                    </TabsList>

                    {/* GENERAL */}
                    <TabsContent value="general" className="space-y-4 p-4 border border-zinc-800 rounded-md bg-zinc-950 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{kind === "FISICA" ? "Nome Completo" : "Razão Social"}</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {kind === "JURIDICA" && (
                                <FormField
                                    control={form.control}
                                    name="fantasyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Fantasia</FormLabel>
                                            <FormControl>
                                                <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="document"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{kind === "FISICA" ? "CPF" : "CNPJ"}</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="bg-zinc-900 border-zinc-800 font-mono"
                                                {...field}
                                                onChange={(e) => field.onChange(normalizeDocument(e.target.value))}
                                                maxLength={18}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {kind === "FISICA" ? (
                                <FormField
                                    control={form.control}
                                    name="rg"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RG</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    className="bg-zinc-900 border-zinc-800" 
                                                    {...field} 
                                                    onChange={(e) => field.onChange(normalizeRG(e.target.value))}
                                                    maxLength={12}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <FormField
                                    control={form.control}
                                    name="stateRegistration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Inscrição Estadual</FormLabel>
                                            <FormControl>
                                                <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Relacionamento</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-zinc-950 border-zinc-800">
                                                <SelectItem value="CLIENTE">Cliente</SelectItem>
                                                <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                                                <SelectItem value="SOCIO">Sócio</SelectItem>
                                                <SelectItem value="FILHO">Filho</SelectItem>
                                                <SelectItem value="OUTRO">Outro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="context"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contexto</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-zinc-950 border-zinc-800">
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
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* ADDRESS */}
                    <TabsContent value="address" className="space-y-4 p-4 border border-zinc-800 rounded-md bg-zinc-950 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="zipCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CEP</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" {...field} onChange={(e) => field.onChange(normalizeZip(e.target.value))} maxLength={9} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="col-span-2">
                                <FormField
                                    control={form.control}
                                    name="street"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Logradouro</FormLabel>
                                            <FormControl>
                                                <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <div className="sm:col-span-3">
                                <FormField
                                    control={form.control}
                                    name="complement"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Complemento</FormLabel>
                                            <FormControl>
                                                <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="district"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bairro</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>UF</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" maxLength={2} {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* CONTACT */}
                    <TabsContent value="contact" className="space-y-4 p-4 border border-zinc-800 rounded-md bg-zinc-950 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Celular (WhatsApp)</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" {...field} onChange={e => field.onChange(normalizePhone(e.target.value))} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone Fixo</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" {...field} onChange={e => field.onChange(normalizePhone(e.target.value))} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site</FormLabel>
                                        <FormControl>
                                            <Input className="bg-zinc-900 border-zinc-800" placeholder="https://..." {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* DETAILS */}
                    <TabsContent value="details" className="space-y-4 p-4 border border-zinc-800 rounded-md bg-zinc-950 mt-4">
                        {kind === "FISICA" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="birthDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de Nascimento</FormLabel>
                                            <FormControl>
                                                <Input type="date" className="bg-zinc-900 border-zinc-800 invert-calendar-icon" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="occupation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Profissão</FormLabel>
                                            <FormControl>
                                                <Input className="bg-zinc-900 border-zinc-800" {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                        <RichTextEditor
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            placeholder="Anotações sobre a pessoa... Ctrl+V para colar imagens."
                                            minHeight={120}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* CRM Fields inside Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nextFollowUpAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Próximo Contato (CRM)</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="bg-zinc-900 border-zinc-800 invert-calendar-icon" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="reminderMinutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lembrete de Contato</FormLabel>
                                        <ReminderSelect
                                            value={field.value ?? null}
                                            onChange={field.onChange}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                    <Button type="submit" disabled={loading} className="px-8">
                        {loading ? "Salvando..." : "Salvar Cadastro"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
