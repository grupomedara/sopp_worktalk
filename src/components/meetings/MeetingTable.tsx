"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Clock, ArrowUpDown, ArrowUp, ArrowDown, Edit, Loader2, Calendar as CalendarIcon, User, Share2 } from "lucide-react";
import { deleteMeeting, getMeetingById, shareMeeting, unshareMeeting } from "@/app/actions/meetings";
import { useRouter, useSearchParams } from "next/navigation";
import { Meeting } from "@prisma/client";
import { MeetingDialog } from "./MeetingDialog";
import { ShareDialog } from "@/components/common/ShareDialog";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MeetingTableProps {
    meetings: any[];
    people: { id: string; name: string }[];
    currentUserId?: string;
}

export function MeetingTable({ meetings, people, currentUserId }: MeetingTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [sharingMeeting, setSharingMeeting] = useState<Meeting | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleEdit = async (meeting: any) => {
        setLoadingId(meeting.id);
        try {
            const result = await getMeetingById(meeting.id);
            if (result.success && result.data) {
                setEditingMeeting(result.data as Meeting);
            }
        } finally {
            setLoadingId(null);
        }
    };

    const currentSort = searchParams.get("sort") || "date";
    const currentOrder = searchParams.get("order") || "desc";

    const handleSort = (column: string) => {
        const newOrder = currentSort === column && currentOrder === "asc" ? "desc" : "asc";
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", column);
        params.set("order", newOrder);
        router.push(`/meetings?${params.toString()}`);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (currentSort !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />;
        if (currentOrder === "asc") return <ArrowUp className="ml-2 h-4 w-4 text-foreground" />;
        return <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
    };

    const getDurationText = (start: Date | string, end: Date | string) => {
        const diff = differenceInMinutes(new Date(end), new Date(start));
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        if (hours > 0) {
            return `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
        }
        return `${minutes} min`;
    };

    const MeetingActions = ({ meeting }: { meeting: any }) => {
        const isOwner = currentUserId ? meeting.userId === currentUserId : true;
        const userShare = currentUserId ? meeting.shares?.find((s: any) => s.userId === currentUserId) : null;
        const hasWriteAccess = isOwner || userShare?.role === "EDITOR";

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 shrink-0 hover:bg-zinc-900 border-zinc-800">
                        {loadingId === meeting.id
                            ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-950">
                    <DropdownMenuItem
                        className="cursor-pointer focus:bg-zinc-900"
                        onSelect={() => handleEdit(meeting)}
                    >
                        <Edit className="mr-2 h-4 w-4 text-primary" /> {hasWriteAccess ? "Editar" : "Visualizar"}
                    </DropdownMenuItem>
                    {isOwner && (
                        <DropdownMenuItem
                            className="cursor-pointer focus:bg-zinc-900"
                            onSelect={() => setSharingMeeting(meeting)}
                        >
                            <Share2 className="mr-2 h-4 w-4 text-primary" /> Compartilhar
                        </DropdownMenuItem>
                    )}
                    {hasWriteAccess && (
                        <form action={async () => {
                            await deleteMeeting(meeting.id);
                        }}>
                            <button
                                type="submit"
                                className="w-full flex items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-500/10 text-red-600 focus:text-red-500 cursor-pointer"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </button>
                        </form>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    return (
        <div>
            {/* ── MOBILE: cards ── */}
            <div className="flex flex-col gap-3 md:hidden">
                {meetings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-zinc-800 rounded-lg">
                        Nenhuma reunião registrada.
                    </div>
                ) : (
                    meetings.map((meeting) => {
                        const isOwner = currentUserId ? meeting.userId === currentUserId : true;
                        const userShare = currentUserId ? meeting.shares?.find((s: any) => s.userId === currentUserId) : null;

                        return (
                            <div key={meeting.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm leading-tight text-foreground truncate">{meeting.companyOrPerson}</p>
                                            {!isOwner && (
                                                <span className="text-[8px] tracking-widest font-black uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                                                    {userShare?.role === "EDITOR" ? "Editor" : "Leitor"}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-primary font-medium truncate">{meeting.theme}</p>
                                    </div>
                                    <MeetingActions meeting={meeting} />
                                </div>

                                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground/75" />
                                        {format(new Date(meeting.date), "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground/75" />
                                        {format(new Date(meeting.startTime), "HH:mm")} - {format(new Date(meeting.endTime), "HH:mm")} ({getDurationText(meeting.startTime, meeting.endTime)})
                                    </span>
                                </div>

                                {meeting.participants && meeting.participants.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {meeting.participants.map((p: any) => (
                                            <Badge key={p.id} variant="secondary" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300">
                                                <User className="w-2.5 h-2.5 mr-1" />
                                                {p.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── DESKTOP: tabela ── */}
            <div className="hidden md:block border border-zinc-800 rounded-md bg-zinc-950/50 backdrop-blur-md">
                <Table>
                    <TableHeader className="border-zinc-800 bg-zinc-900/30">
                        <TableRow className="border-zinc-800">
                            <TableHead
                                className="cursor-pointer hover:text-foreground transition-colors font-bold text-xs uppercase tracking-wider text-muted-foreground"
                                onClick={() => handleSort("companyOrPerson")}
                            >
                                <div className="flex items-center">
                                    Empresa / Pessoa
                                    <SortIcon column="companyOrPerson" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-foreground transition-colors font-bold text-xs uppercase tracking-wider text-muted-foreground"
                                onClick={() => handleSort("theme")}
                            >
                                <div className="flex items-center">
                                    Tema
                                    <SortIcon column="theme" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-foreground transition-colors font-bold text-xs uppercase tracking-wider text-muted-foreground"
                                onClick={() => handleSort("date")}
                            >
                                <div className="flex items-center">
                                    Data
                                    <SortIcon column="date" />
                                </div>
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Horário
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Duração
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                                Participantes
                            </TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {meetings.length === 0 ? (
                            <TableRow className="border-zinc-800">
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground border-zinc-800">
                                    Nenhuma reunião registrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            meetings.map((meeting) => {
                                const isOwner = currentUserId ? meeting.userId === currentUserId : true;
                                const userShare = currentUserId ? meeting.shares?.find((s: any) => s.userId === currentUserId) : null;

                                return (
                                    <TableRow key={meeting.id} className="border-zinc-800 hover:bg-zinc-900/10">
                                        <TableCell className="font-medium text-foreground">
                                            <div className="flex items-center gap-2">
                                                <span>{meeting.companyOrPerson}</span>
                                                {!isOwner && (
                                                    <span className="text-[8px] tracking-widest font-black uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                                                        {userShare?.role === "EDITOR" ? "Editor" : "Leitor"}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-primary">{meeting.theme}</TableCell>
                                        <TableCell>{format(new Date(meeting.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                        <TableCell>
                                            {format(new Date(meeting.startTime), "HH:mm")} - {format(new Date(meeting.endTime), "HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                                {getDurationText(meeting.startTime, meeting.endTime)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {meeting.participants && meeting.participants.length > 0 ? (
                                                    meeting.participants.map((p: any) => (
                                                        <Badge key={p.id} variant="secondary" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300">
                                                            {p.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/60">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <MeetingActions meeting={meeting} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <MeetingDialog
                people={people}
                initialData={editingMeeting || undefined}
                open={!!editingMeeting}
                onOpenChange={(open) => !open && setEditingMeeting(null)}
                isReadOnly={editingMeeting ? !(editingMeeting.userId === currentUserId || (editingMeeting as any).shares?.find((s: any) => s.userId === currentUserId)?.role === "EDITOR") : false}
                trigger={<span className="hidden" />}
            />

            {sharingMeeting && (() => {
                const activeSharingMeeting = meetings.find(m => m.id === sharingMeeting.id) || sharingMeeting;
                return (
                    <ShareDialog
                        isOpen={!!sharingMeeting}
                        onOpenChange={(open) => !open && setSharingMeeting(null)}
                        title="Compartilhar Ata de Reunião"
                        shares={activeSharingMeeting.shares || []}
                        onShare={async (emailOrCpf, role) => await shareMeeting(sharingMeeting.id, emailOrCpf, role)}
                        onUnshare={async (userId) => await unshareMeeting(sharingMeeting.id, userId)}
                    />
                );
            })()}
        </div>
    );
}
