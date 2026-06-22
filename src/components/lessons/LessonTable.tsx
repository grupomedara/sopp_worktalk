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
import { MoreHorizontal, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Edit } from "lucide-react";
import { deleteLesson } from "@/app/actions/lessons";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Lesson, Person } from "@prisma/client";
import { LessonDialog } from "./LessonDialog";

interface LessonWithPerson extends Lesson {
    person: Person | null;
}

interface LessonTableProps {
    lessons: LessonWithPerson[];
    people: Person[];
}

export function LessonTable({ lessons, people }: LessonTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [editingLesson, setEditingLesson] = useState<LessonWithPerson | null>(null);

    const currentSort = searchParams.get("sort") || "createdAt";
    const currentOrder = searchParams.get("order") || "desc";

    const handleSort = (column: string) => {
        const newOrder = currentSort === column && currentOrder === "asc" ? "desc" : "asc";
        router.push(`/lessons?sort=${column}&order=${newOrder}`);
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
                        <TableHead
                            className="w-[120px] cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => handleSort("createdAt")}
                        >
                            <div className="flex items-center">
                                Data
                                <SortIcon column="createdAt" />
                            </div>
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => handleSort("clientOrGroup")}
                        >
                            <div className="flex items-center">
                                Cliente/Turma
                                <SortIcon column="clientOrGroup" />
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
                        <TableHead>Conteúdo</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Follow-up</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lessons.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                Nenhuma aula registrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        lessons.map((lesson) => (
                            <TableRow key={lesson.id}>
                                <TableCell className="text-sm">
                                    {format(new Date(lesson.date), "dd/MM/yy")}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {lesson.clientOrGroup}
                                    {lesson.person && (
                                        <span className="ml-2 text-xs text-muted-foreground">({lesson.person.type})</span>
                                    )}
                                </TableCell>
                                <TableCell>{lesson.topic}</TableCell>
                                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                    {lesson.appliedContent || lesson.objective || "-"}
                                </TableCell>
                                <TableCell>
                                    {(lesson as any).rating ? (
                                        <span className="text-amber-400 text-sm">{"⭐".repeat((lesson as any).rating)}</span>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-[150px] truncate">
                                    {lesson.followUp ? (
                                        <Badge variant="secondary" className="font-normal">{lesson.followUp}</Badge>
                                    ) : (
                                        "-"
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onSelect={() => setEditingLesson(lesson)}
                                            >
                                                <Edit className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <form action={async () => {
                                                await deleteLesson(lesson.id);
                                            }}>
                                                <button type="submit" className="w-full flex items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-red-600 focus:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                </button>
                                            </form>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <LessonDialog
                people={people}
                initialData={editingLesson || undefined}
                open={!!editingLesson}
                onOpenChange={(open) => !open && setEditingLesson(null)}
                trigger={<span className="hidden" />}
            />
        </div>
    );
}
