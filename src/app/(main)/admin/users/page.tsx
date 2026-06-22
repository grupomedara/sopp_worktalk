import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserDialog } from "@/components/admin/UserDialog";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";

export default async function UsersPage() {
    const session = await auth();

    // @ts-ignore
    if (session?.user?.role !== "SUPER_ADMIN") {
        redirect("/agile"); // or 403
    }

    const users = await db.user.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
                    <p className="text-muted-foreground">Crie e gerencie usuários do sistema.</p>
                </div>
                <UserDialog />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.document}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'SUPER_ADMIN' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <UserDialog user={user} />
                                    {session?.user?.id !== user.id && (
                                        <DeleteUserButton userId={user.id} userName={user.name || ""} />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
