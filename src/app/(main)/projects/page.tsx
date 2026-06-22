import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, FolderOpen, Calendar, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getProjects, deleteProject } from "@/app/actions/projects";
import { getGoals } from "@/app/actions/goals";
import { getPeople } from "@/app/actions/people";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { ProjectList } from "@/components/projects/ProjectList";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; order?: string }>;
}) {
    const params = await searchParams;
    const sort = params.sort || "createdAt";
    const order = (params.order as "asc" | "desc") || "desc";

    const result = await getProjects(sort, order);
    const projects = result.data || [];

    const goalsResult = await getGoals();
    const goals = goalsResult.data || [];

    const peopleResult = await getPeople();
    const people = peopleResult.data || [];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
                    <p className="text-muted-foreground">
                        Organize suas metas em projetos acionáveis.
                    </p>
                </div>
                <ProjectDialog goals={goals} people={people} />
            </div>

            <ProjectList projects={projects} goals={goals} people={people} />
        </div>
    );
}
