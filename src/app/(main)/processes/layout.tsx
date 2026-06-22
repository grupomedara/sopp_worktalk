import { getSpaces } from "@/app/actions/processes";
import { ProcessesSidebar } from "@/components/processes/ProcessesSidebar";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProcessesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const spacesResult = await getSpaces();
    const spaces = spacesResult.success ? spacesResult.data || [] : [];

    return (
        <div className="space-y-6 pb-12 mt-4 h-full">
            {/* Header */}
            <div className="relative border-l-4 border-primary pl-6">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-[0.8] mb-2">
                    ACOMPANHAMENTO<br />DE PROCESSOS
                </h2>
                <p className="text-[9px] font-bold tracking-[0.45em] text-muted-foreground uppercase">
                    Metadados, Planilhas Interativas & Rotinas Operacionais
                </p>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
                {/* Left Sidebar navigation - Responsive width based on viewport size */}
                <div className="lg:col-span-4 xl:col-span-3 2xl:col-span-2 h-full min-h-[400px] lg:sticky lg:top-4">
                    <ProcessesSidebar initialSpaces={spaces} currentUserId={session.user.id} />
                </div>

                {/* Right Content View */}
                <div className="lg:col-span-8 xl:col-span-9 2xl:col-span-10 h-full min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
