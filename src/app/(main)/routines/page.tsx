import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RoutinesDashboard } from "@/components/routines/RoutinesDashboard";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    return (
        <RoutinesDashboard 
            currentUserId={userId}
        />
    );
}
