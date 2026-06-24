import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TenantsClient } from "./TenantsClient";

export const dynamic = "force-dynamic";

export default async function AdminTenantsPage() {
    const session = await auth();

    // @ts-ignore
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        redirect("/");
    }

    const tenants = await db.tenant.findMany({
        include: {
            subscription: true,
            _count: {
                select: { users: true }
            }
        },
        orderBy: { name: "asc" }
    });

    return (
        <div className="p-8 space-y-6">
            <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Administração Global
                </span>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white mt-1">
                    Gestão de Empresas
                </h1>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">
                    Cadastre novas empresas e acompanhe as assinaturas integradas ao Asaas.
                </p>
            </div>
            
            <TenantsClient initialTenants={JSON.parse(JSON.stringify(tenants))} />
        </div>
    );
}
