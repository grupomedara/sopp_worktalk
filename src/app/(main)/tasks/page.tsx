import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getTasks } from "@/app/actions/tasks";
import { getProjects } from "@/app/actions/projects";
import { getPeople } from "@/app/actions/people";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskList } from "@/components/tasks/TaskList";

export const dynamic = 'force-dynamic';

export default async function TasksPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; order?: string }>;
}) {
    const params = await searchParams;
    const sort = params.sort || "date";
    const order = (params.order as "asc" | "desc") || "asc";

    const [tasksResult, projectsResult, peopleResult] = await Promise.all([
        getTasks(sort, order),
        getProjects(),
        getPeople()
    ]);

    const tasks = tasksResult.data || [];
    const projects = projectsResult.data || [];
    const people = peopleResult.data || [];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tarefas</h2>
                    <p className="text-muted-foreground">
                        O que precisa ser feito. Foco na execução.
                    </p>
                </div>
                <TaskDialog projects={projects} people={people} />
            </div>

            <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Carregando tarefas...</div>}>
                <TaskList tasks={tasks} projects={projects} people={people} currentSort={sort} currentOrder={order} />
            </Suspense>

            {/* Botão Flutuante (FAB) para Mobile */}
            <TaskDialog
                projects={projects}
                people={people}
                trigger={
                    <button className="fixed bottom-24 md:bottom-6 right-6 z-40 bg-white text-black hover:bg-zinc-200 shadow-[0_4px_25px_rgba(255,255,255,0.25)] h-16 w-16 rounded-full flex items-center justify-center border-none lg:hidden transition-transform hover:scale-105 active:scale-95 duration-200 cursor-pointer">
                        <Plus className="h-8 w-8" />
                    </button>
                }
            />
        </div>
    );
}
