"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TenantDialog } from "./TenantDialog";
import { deleteTenant } from "@/app/actions/tenant";
import { toast } from "sonner";
import { Trash2, Search, Building2, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface TenantWithSub {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
    createdAt: string;
    _count: {
        users: number;
    };
    subscription: {
        id: string;
        status: string;
        plan: string;
        currentPeriodEnd: string | null;
    } | null;
}

interface TenantsClientProps {
    initialTenants: TenantWithSub[];
}

export function TenantsClient({ initialTenants }: TenantsClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [tenants, setTenants] = useState<TenantWithSub[]>(initialTenants);

    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir permanentemente a empresa "${name}"? Todos os usuários, notas, rotinas e espaços associados serão excluídos permanentemente!`)) {
            return;
        }

        const res = await deleteTenant(id);
        if (res.success) {
            toast.success("Empresa excluída com sucesso!");
            router.refresh();
            setTenants(prev => prev.filter(t => t.id !== id));
        } else {
            toast.error(res.error || "Erro ao excluir empresa.");
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-500/10 px-2.5 py-1 rounded-full border border-zinc-500/20">Sem Plano</span>;
        
        switch (status.toUpperCase()) {
            case "ACTIVE":
                return <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">Ativa</span>;
            case "TRIAL":
                return <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]">Período de Testes</span>;
            case "PAST_DUE":
                return <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]">Em Atraso</span>;
            case "CANCELED":
            default:
                return <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]">Suspensa</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar empresa..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-10 pl-10 rounded-xl text-xs font-bold text-zinc-300"
                    />
                </div>

                <TenantDialog onSuccess={() => router.refresh()} />
            </div>

            <div className="border border-white/5 bg-zinc-950/40 backdrop-blur-xl shadow-2xl rounded-[32px] overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/[0.01] border-b border-white/5">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400 h-14 pl-6">Empresa</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400 h-14">Subdomínio</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400 h-14 text-center">Usuários</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400 h-14">Plano</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400 h-14">Assinatura</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400 h-14">Vencimento</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-400 h-14 text-right pr-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    Nenhuma empresa cadastrada ou encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTenants.map((tenant) => (
                                <TableRow key={tenant.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                    <TableCell className="h-16 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                                {tenant.logoUrl ? (
                                                    <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Building2 className="w-4 h-4 text-zinc-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white">{tenant.name}</p>
                                                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Criada em: {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-xs text-zinc-300">
                                        {tenant.slug}.localhost
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-xs text-zinc-300">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-zinc-500" />
                                            {tenant._count.users}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-black text-[10px] uppercase tracking-wider text-zinc-400">
                                        {tenant.subscription?.plan || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(tenant.subscription?.status)}
                                    </TableCell>
                                    <TableCell className="text-xs font-semibold text-zinc-400">
                                        {tenant.subscription?.currentPeriodEnd 
                                            ? new Date(tenant.subscription.currentPeriodEnd).toLocaleDateString("pt-BR")
                                            : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <TenantDialog tenant={tenant} onSuccess={() => router.refresh()} />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(tenant.id, tenant.name)}
                                                className="text-zinc-600 hover:text-red-500 cursor-pointer h-8 w-8 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
