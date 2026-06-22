import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="p-8 space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Meu Perfil</h1>
                <p className="text-muted-foreground">Gerencie suas informações e senha.</p>
            </div>

            <div className="bg-card border rounded-lg p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Informações Pessoais</h3>
                    <div className="mt-2 grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Nome</label>
                            <p className="text-base">{session.user.name}</p>
                        </div>
                        {/* @ts-ignore */}
                        {session.user.document && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">CPF</label>
                                {/* @ts-ignore */}
                                <p className="text-base">{session.user.document}</p>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Função</label>
                            {/* @ts-ignore */}
                            <p className="text-base">{session.user.role}</p>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
                    <ChangePasswordForm userId={session.user.id || ""} />
                </div>
            </div>
        </div>
    );
}
