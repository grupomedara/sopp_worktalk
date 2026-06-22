"use client";

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from "lucide-react";
import { deletePerson } from "@/app/actions/people";
import { useRouter, useSearchParams } from "next/navigation";
import { PersonFormDialog } from "./PersonFormDialog";
import { useState } from "react";
import { ContextBadge } from "../ui/ContextBadge";
import { InteractionLog } from "./InteractionLog";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Interaction {
    id: string;
    date: Date;
    subject: string;
    type: string;
    notes?: string | null;
}

interface PersonWithInteractions {
    id: string;
    name: string;
    type: string;
    context: string;
    notes?: string | null;
    nextFollowUpAt?: Date | null;
    stage?: string | null;
    interactions: Interaction[];
    [key: string]: any;
}

interface PeopleTableProps {
    people: PersonWithInteractions[];
}

const stageLabels: Record<string, string> = {
    LEAD: "Lead",
    PROSPECT: "Prospect",
    PARTNER: "Parceiro",
    CLIENT: "Cliente",
    INACTIVE: "Inativo",
};

function RelationshipBadge({ interactions }: { interactions: Interaction[] }) {
    if (interactions.length === 0) {
        return <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500">Sem contato</Badge>;
    }
    const lastDate = new Date(interactions[0].date);
    const days = differenceInDays(new Date(), lastDate);
    if (days <= 30) return <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">🟢 {days}d atrás</Badge>;
    if (days <= 90) return <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">🟡 {days}d atrás</Badge>;
    return <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">🔴 {days}d atrás</Badge>;
}

export function PeopleTable({ people }: PeopleTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "createdAt";
    const currentOrder = searchParams.get("order") || "desc";
    const [editingPerson, setEditingPerson] = useState<PersonWithInteractions | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleSort = (column: string) => {
        const newOrder = currentSort === column && currentOrder === "asc" ? "desc" : "asc";
        router.push(`/people?sort=${column}&order=${newOrder}`);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (currentSort !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />;
        if (currentOrder === "asc") return <ArrowUp className="ml-2 h-4 w-4 text-foreground" />;
        return <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
    };

    return (
        <div className="border rounded-md w-full overflow-x-auto">
            <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[260px] cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                            <div className="flex items-center">Nome <SortIcon column="name" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("type")}>
                            <div className="flex items-center">Tipo <SortIcon column="type" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("context")}>
                            <div className="flex items-center">Contexto <SortIcon column="context" /></div>
                        </TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Último Contato</TableHead>
                        <TableHead>Follow-up</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {people.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                Nenhuma pessoa cadastrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        people.map((person) => {
                            const isExpanded = expandedId === person.id;
                            const followUpOverdue = person.nextFollowUpAt && new Date(person.nextFollowUpAt) < new Date();
                            const followUpToday = person.nextFollowUpAt && differenceInDays(new Date(person.nextFollowUpAt), new Date()) <= 1 && !followUpOverdue;
                            return (
                                <>
                                    <TableRow key={person.id} className="cursor-pointer hover:bg-zinc-900/50" onClick={() => setExpandedId(isExpanded ? null : person.id)}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {person.name}
                                                {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{person.type}</Badge></TableCell>
                                        <TableCell><ContextBadge context={person.context as any} /></TableCell>
                                        <TableCell>
                                            {person.stage ? (
                                                <Badge variant="secondary" className="text-xs">{stageLabels[person.stage] || person.stage}</Badge>
                                            ) : <span className="text-muted-foreground text-xs">—</span>}
                                        </TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <RelationshipBadge interactions={person.interactions} />
                                        </TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            {person.nextFollowUpAt ? (
                                                <span className={`text-xs font-medium ${followUpOverdue ? "text-red-400" : followUpToday ? "text-amber-400" : "text-muted-foreground"}`}>
                                                    {format(new Date(person.nextFollowUpAt), "dd/MM/yy", { locale: ptBR })}
                                                    {followUpOverdue && " ⚠️"}
                                                </span>
                                            ) : <span className="text-muted-foreground text-xs">—</span>}
                                        </TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setEditingPerson(person)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <form action={async () => { await deletePerson(person.id); }}>
                                                        <button type="submit" className="w-full flex items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-red-600 focus:text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </button>
                                                    </form>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow key={`${person.id}-expanded`} className="bg-zinc-950/50">
                                            <TableCell colSpan={7} className="p-4">
                                                <InteractionLog personId={person.id} interactions={person.interactions} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            <PersonFormDialog
                person={editingPerson as any}
                open={!!editingPerson}
                onOpenChange={(open) => !open && setEditingPerson(null)}
            />
        </div>
    );
}
