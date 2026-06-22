import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getPeople } from "@/app/actions/people";
import { PersonFormDialog } from "@/components/people/PersonFormDialog";
import { PeopleTable } from "@/components/people/PeopleTable";

export const dynamic = 'force-dynamic';

export default async function PeoplePage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; order?: string }>;
}) {
    const params = await searchParams;
    const sort = (params.sort as "name" | "type" | "context" | "createdAt") || "createdAt";
    const order = (params.order as "asc" | "desc") || "desc";

    const result = await getPeople(sort, order);
    const people = result.data || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pessoas</h2>
                    <p className="text-muted-foreground text-sm">
                        Gerencie clientes, sócios, colaboradores e família.
                    </p>
                </div>
                <PersonFormDialog>
                    <Button className="px-3 sm:px-4 w-full sm:w-auto justify-center">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Nova Pessoa</span>
                        <span className="inline sm:hidden ml-1">Novo</span>
                    </Button>
                </PersonFormDialog>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar pessoas..." className="pl-8" />
                </div>
            </div>

            <PeopleTable people={people} />
        </div >
    );
}
