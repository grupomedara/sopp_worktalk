import { auth } from "@/auth";
import { getProject, getProjects } from "@/app/actions/projects";
import { getGoals } from "@/app/actions/goals";
import { getPeople } from "@/app/actions/people";
import { redirect, notFound } from "next/navigation";
import { AgileProjectView } from "@/components/agile/AgileProjectView";

export default async function AgileProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { projectId } = await params;

    const [projectResult, goalsResult, peopleResult, allProjectsResult] = await Promise.all([
        getProject(projectId),
        getGoals(),
        getPeople(),
        getProjects()
    ]);

    const project = projectResult.data;
    if (!project) notFound();

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col">
            <AgileProjectView
                project={project}
                goals={goalsResult.data || []}
                people={peopleResult.data || []}
                projects={allProjectsResult.data || []}
            />
        </div>
    );
}
