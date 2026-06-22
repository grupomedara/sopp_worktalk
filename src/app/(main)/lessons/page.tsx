import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, GraduationCap, ClipboardList, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
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
import { getLessons, deleteLesson } from "@/app/actions/lessons";
import { getPeople } from "@/app/actions/people";
import { LessonDialog } from "@/components/lessons/LessonDialog";
import { LessonTable } from "@/components/lessons/LessonTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function LessonsPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; order?: string }>;
}) {
    const params = await searchParams;
    const sort = params.sort || "createdAt";
    const order = (params.order as "asc" | "desc") || "desc";

    const result = await getLessons(sort, order);
    const lessons = result.data || [];

    const peopleResult = await getPeople();
    const people = peopleResult.data || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Aulas e Mentorias</h2>
                    <p className="text-muted-foreground text-sm">
                        Gestão do que você ensina e tarefas passadas.
                    </p>
                </div>
                <div className="w-full sm:w-auto">
                    <LessonDialog people={people} />
                </div>
            </div>

            <LessonTable lessons={lessons} people={people} />
        </div>
    );
}
