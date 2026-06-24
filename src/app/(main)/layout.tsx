import { Sidebar } from "@/components/layout/Sidebar";
import { getTenantFromHost } from "@/lib/tenant";
import { hexToHsl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tenant = await getTenantFromHost();
    
    const style = tenant?.primaryColor
        ? { "--primary": hexToHsl(tenant.primaryColor) } as React.CSSProperties
        : {};

    return (
        <div style={style} className="flex h-full min-h-screen bg-background">
            <Sidebar tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
            <main className="flex-1 md:pl-20 transition-all duration-300 relative main-shell min-w-0">
                {/* Clean, Focused Workspace */}
                <div className="h-full w-full overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 main-scroll-box">
                    <div className="max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 main-content w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
