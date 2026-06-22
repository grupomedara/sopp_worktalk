import { getNotes } from "@/app/actions/notes";
import { getPeople } from "@/app/actions/people";
import { getProjects } from "@/app/actions/projects";
import { NoteList } from "./NoteList";
import { NoteHeaderActions } from "./NoteHeaderActions";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function NotesPage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; order?: string }>;
}) {
    const params = await searchParams;
    const sort = params.sort || "createdAt";
    const order = (params.order as "asc" | "desc") || "desc";

    const result = await getNotes(sort, order);
    const notes = result.data || [];

    const peopleResult = await getPeople();
    const people = peopleResult.data || [];

    const projectsResult = await getProjects();
    const projects = projectsResult.data || [];

    const session = await auth();
    const currentUserId = session?.user?.id;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notas</h2>
                    <p className="text-muted-foreground text-sm">
                        Organize ideias, reuniões e informações importantes.
                    </p>
                </div>
                <NoteHeaderActions
                    people={people}
                    notes={notes}
                    projects={projects}
                />
            </div>

            <NoteList notes={notes} people={people} projects={projects} currentUserId={currentUserId} />
        </div>
    );
}
