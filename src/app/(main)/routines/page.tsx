import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RoutinesDashboard } from "@/components/routines/RoutinesDashboard";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    // Fetch active people (for responsible options)
    const people = await db.person.findMany({
        where: { userId },
        select: {
            id: true,
            name: true,
            type: true
        },
        orderBy: { name: "asc" }
    });

    // Fetch active projects
    const projects = await db.project.findMany({
        where: { ownerId: userId },
        select: {
            id: true,
            name: true
        },
        orderBy: { name: "asc" }
    });

    return (
        <RoutinesDashboard 
            initialPeople={people} 
            initialProjects={projects} 
            currentUserId={userId}
        />
    );
}
