import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
    const session = await auth();

    // @ts-ignore
    if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        redirect("/");
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
            <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Administração Global
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-1">
                    Configurações do Sistema
                </h2>
            </div>
            <SettingsForm />
        </div>
    );
}
