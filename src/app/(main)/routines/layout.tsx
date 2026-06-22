import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RoutinesLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="w-full h-full min-h-[calc(100vh-4rem)] p-4 md:p-8">
            {children}
        </div>
    );
}
