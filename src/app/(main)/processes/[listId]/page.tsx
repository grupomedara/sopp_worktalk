import { getList } from "@/app/actions/processes";
import { getPeople } from "@/app/actions/people";
import { getProjects } from "@/app/actions/projects";
import { getGoals } from "@/app/actions/goals";
import { SpreadsheetGrid } from "@/components/processes/SpreadsheetGrid";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";

export default async function ListDetailsPage({ params }: { params: Promise<{ listId: string }> }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { listId } = await params;

    const [listResult, peopleResult, projectsResult, goalsResult] = await Promise.all([
        getList(listId),
        getPeople(),
        getProjects(),
        getGoals()
    ]);

    if (!listResult.success || !listResult.data) {
        notFound();
    }

    const list = listResult.data;
    const people = peopleResult.success ? peopleResult.data || [] : [];
    const projects = projectsResult.success ? projectsResult.data || [] : [];
    const goals = goalsResult.success ? goalsResult.data || [] : [];

    return (
        <div className="h-full flex flex-col min-w-0">
            <SpreadsheetGrid 
                list={list} 
                people={people} 
                projects={projects} 
                goals={goals} 
                currentUserId={session.user.id}
            />
        </div>
    );
}
