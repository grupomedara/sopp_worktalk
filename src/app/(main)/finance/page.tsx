import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Wallet, ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getFinances, deleteFinance } from "@/app/actions/finance";
import { getPeople } from "@/app/actions/people";
import { getProjects } from "@/app/actions/projects";
import { FinanceDialog } from "@/components/finance/FinanceDialog";
import { FinanceTable } from "@/components/finance/FinanceTable";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { FinanceCategorySummary } from "@/components/finance/FinanceCategorySummary";
import { FinanceBriefing } from "@/components/finance/FinanceBriefing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function FinancePage({
    searchParams,
}: {
    searchParams: Promise<{ sort?: string; order?: string }>;
}) {
    const params = await searchParams;
    const sort = params.sort || "dueDate";
    const order = (params.order as "asc" | "desc") || "asc";

    const result = await getFinances(sort, order);
    const finances = result.data || [];

    const peopleResult = await getPeople();
    const people = peopleResult.data || [];

    const projectsResult = await getProjects();
    const projects = projectsResult.data || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finanças Simples</h2>
                    <p className="text-muted-foreground text-sm">
                        Controle de pagamentos e recebimentos vinculados.
                    </p>
                </div>
                <FinanceDialog people={people} projects={projects} />
            </div>
            
            <FinanceBriefing finances={finances} />

            <Tabs defaultValue="lista" className="w-full space-y-6">
                <TabsList className="bg-muted/30 p-1 rounded-xl">
                    <TabsTrigger value="lista" className="rounded-lg px-6 font-bold tracking-tight">Lista de Registros</TabsTrigger>
                    <TabsTrigger value="resumo" className="rounded-lg px-6 font-bold tracking-tight">Resumo Mensal</TabsTrigger>
                </TabsList>

                <TabsContent value="lista" className="space-y-6">
                    <FinanceOverview finances={finances as any} />
                    <FinanceTable finances={finances as any} people={people} projects={projects} />
                </TabsContent>

                <TabsContent value="resumo">
                    <FinanceCategorySummary finances={finances as any} />
                </TabsContent>
            </Tabs>

            {/* Botão Flutuante (FAB) para Mobile para Nova Movimentação Financeira */}
            <FinanceDialog
                people={people}
                projects={projects}
                trigger={
                    <button className="fixed bottom-24 md:bottom-6 right-6 z-40 bg-white text-black hover:bg-zinc-200 shadow-[0_4px_25px_rgba(255,255,255,0.25)] h-16 w-16 rounded-full flex items-center justify-center border-none lg:hidden transition-transform hover:scale-105 active:scale-95 duration-200 cursor-pointer">
                        <Plus className="h-8 w-8" />
                    </button>
                }
            />
        </div>
    );
}
