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
import { MoreHorizontal, Trash2, Clock, ArrowUpDown, ArrowUp, ArrowDown, Edit, Loader2 } from "lucide-react";
import { deleteStudy, getStudyById } from "@/app/actions/studies";
import { useRouter, useSearchParams } from "next/navigation";
import { Study } from "@prisma/client";
import { StudyDialog } from "./StudyDialog";

interface StudyTableProps {
    studies: any[];
}

export function StudyTable({ studies }: StudyTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [editingStudy, setEditingStudy] = useState<Study | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleEdit = async (study: any) => {
        setLoadingId(study.id);
        try {
            const result = await getStudyById(study.id);
            if (result.success && result.data) {
                setEditingStudy(result.data as Study);
            }
        } finally {
            setLoadingId(null);
        }
    };

    const currentSort = searchParams.get("sort") || "createdAt";
    const currentOrder = searchParams.get("order") || "desc";

    const handleSort = (column: string) => {
        const newOrder = currentSort === column && currentOrder === "asc" ? "desc" : "asc";
        router.push(`/studies?sort=${column}&order=${newOrder}`);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (currentSort !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />;
        if (currentOrder === "asc") return <ArrowUp className="ml-2 h-4 w-4 text-foreground" />;
        return <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
    };

    const StudyActions = ({ study }: { study: any }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                    {loadingId === study.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => handleEdit(study)}
                >
                    <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <form action={async () => {
                    await deleteStudy(study.id);
                }}>
                    <button
                        type="submit"
                        className="w-full flex items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </button>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div>
            {/* ── MOBILE: cards ── */}
            <div className="flex flex-col gap-3 md:hidden">
                {studies.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        Nenhum estudo registrado.
                    </div>
                ) : (
                    studies.map((study) => (
                        <div key={study.id} className="bg-card border rounded-lg p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                    <p className="font-semibold text-sm leading-tight truncate">{study.course}</p>
                                    {study.subject && (
                                        <p className="text-xs text-muted-foreground truncate">{study.subject}</p>
                                    )}
                                    {study.topic && (
                                        <p className="text-xs text-muted-foreground/70 truncate">{study.topic}</p>
                                    )}
                                </div>
                                <StudyActions study={study} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">{study.status}</Badge>
                                {study.timeSpent && (
                                    <span className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {study.timeSpent} min
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── DESKTOP: tabela ── */}
            <div className="hidden md:block border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort("course")}
                            >
                                <div className="flex items-center">
                                    Curso
                                    <SortIcon column="course" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort("subject")}
                            >
                                <div className="flex items-center">
                                    Disciplina
                                    <SortIcon column="subject" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort("topic")}
                            >
                                <div className="flex items-center">
                                    Tema
                                    <SortIcon column="topic" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort("status")}
                            >
                                <div className="flex items-center">
                                    Status
                                    <SortIcon column="status" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort("timeSpent")}
                            >
                                <div className="flex items-center">
                                    Tempo
                                    <SortIcon column="timeSpent" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Nenhum estudo registrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            studies.map((study) => (
                                <TableRow key={study.id}>
                                    <TableCell className="font-medium">{study.course}</TableCell>
                                    <TableCell>{study.subject}</TableCell>
                                    <TableCell>{study.topic}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{study.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {study.timeSpent ? (
                                            <div className="flex items-center text-muted-foreground">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {study.timeSpent} min
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <StudyActions study={study} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <StudyDialog
                initialData={editingStudy || undefined}
                open={!!editingStudy}
                onOpenChange={(open) => !open && setEditingStudy(null)}
                trigger={<span className="hidden" />}
            />
        </div>
    );
}
