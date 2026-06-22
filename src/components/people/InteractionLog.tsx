"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Users, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";
import { createInteraction, deleteInteraction } from "@/app/actions/people";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Interaction {
    id: string;
    date: Date;
    subject: string;
    type: string;
    notes?: string | null;
}

interface InteractionLogProps {
    personId: string;
    interactions: Interaction[];
}

const typeIcons: Record<string, React.ReactNode> = {
    CALL: <Phone className="w-3 h-3" />,
    MEETING: <Users className="w-3 h-3" />,
    MESSAGE: <MessageSquare className="w-3 h-3" />,
    OTHER: <MoreHorizontal className="w-3 h-3" />,
};

const typeLabels: Record<string, string> = {
    CALL: "Ligação",
    MEETING: "Reunião",
    MESSAGE: "Mensagem",
    OTHER: "Outro",
};

export function InteractionLog({ personId, interactions }: InteractionLogProps) {
    const [adding, setAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ subject: "", type: "CALL", date: new Date().toISOString().split("T")[0], notes: "" });

    const handleSave = async () => {
        if (!form.subject.trim()) return;
        setLoading(true);
        const result = await createInteraction({
            personId,
            subject: form.subject,
            type: form.type,
            date: new Date(form.date),
            notes: form.notes || undefined,
        });
        setLoading(false);
        if (result.success) {
            toast.success("Interação registrada.");
            setAdding(false);
            setForm({ subject: "", type: "CALL", date: new Date().toISOString().split("T")[0], notes: "" });
        } else {
            toast.error("Erro ao registrar interação.");
        }
    };

    const handleDelete = async (id: string) => {
        const result = await deleteInteraction(id);
        if (result.success) toast.success("Interação removida.");
        else toast.error("Erro ao remover.");
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Histórico de Interações</h4>
                <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
                    <Plus className="w-3 h-3 mr-1" /> Registrar
                </Button>
            </div>

            {adding && (
                <div className="border border-zinc-800 rounded-lg p-3 space-y-2 bg-zinc-950">
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            placeholder="Assunto"
                            className="bg-zinc-900 border-zinc-800 text-sm"
                            value={form.subject}
                            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        />
                        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-800">
                                <SelectItem value="CALL">Ligação</SelectItem>
                                <SelectItem value="MEETING">Reunião</SelectItem>
                                <SelectItem value="MESSAGE">Mensagem</SelectItem>
                                <SelectItem value="OTHER">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Input
                        type="date"
                        className="bg-zinc-900 border-zinc-800 text-sm"
                        value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    />
                    <Textarea
                        placeholder="Notas (opcional)"
                        className="bg-zinc-900 border-zinc-800 text-sm min-h-[60px]"
                        value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
                        <Button size="sm" disabled={loading} onClick={handleSave}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {interactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma interação registrada.</p>
                ) : (
                    interactions.map(i => (
                        <div key={i.id} className="flex items-start gap-3 p-2 rounded-md bg-zinc-950 border border-zinc-900 group">
                            <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                                {typeIcons[i.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{i.subject}</span>
                                    <Badge variant="outline" className="text-xs shrink-0">{typeLabels[i.type]}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(i.date), "dd MMM yyyy", { locale: ptBR })}
                                </p>
                                {i.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{i.notes}</p>}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                        <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                                    <DropdownMenuItem onClick={() => handleDelete(i.id)} className="text-red-500 focus:text-red-500">
                                        <Trash2 className="w-3 h-3 mr-2" /> Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
