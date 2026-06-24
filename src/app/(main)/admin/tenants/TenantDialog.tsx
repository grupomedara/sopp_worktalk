"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTenant, updateTenantSubscription } from "@/app/actions/tenant";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TenantDialogProps {
    tenant?: {
        id: string;
        name: string;
        slug: string;
        subscription?: {
            id: string;
            status: string;
            plan: string;
            currentPeriodEnd: string | null;
        } | null;
    };
    onSuccess: () => void;
}

export function TenantDialog({ tenant, onSuccess }: TenantDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states for Create Mode
    const [companyName, setCompanyName] = useState("");
    const [companySlug, setCompanySlug] = useState("");
    const [companyDocument, setCompanyDocument] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [ownerDocument, setOwnerDocument] = useState("");
    const [ownerPassword, setOwnerPassword] = useState("");

    // Form states for Edit Subscription Mode
    const [subStatus, setSubStatus] = useState(tenant?.subscription?.status || "TRIAL");
    const [subPlan, setSubPlan] = useState(tenant?.subscription?.plan || "PROFESSIONAL");
    const [subPeriodEnd, setSubPeriodEnd] = useState(
        tenant?.subscription?.currentPeriodEnd 
            ? new Date(tenant.subscription.currentPeriodEnd).toISOString().split("T")[0]
            : ""
    );

    const isEditing = !!tenant;

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const res = await createTenant(
            companyName,
            companySlug,
            companyDocument,
            ownerName,
            ownerEmail,
            ownerDocument,
            ownerPassword
        );

        setLoading(false);
        if (res.success) {
            toast.success("Empresa cadastrada com sucesso!");
            setOpen(false);
            onSuccess();
            // Reset form
            setCompanyName("");
            setCompanySlug("");
            setCompanyDocument("");
            setOwnerName("");
            setOwnerEmail("");
            setOwnerDocument("");
            setOwnerPassword("");
        } else {
            toast.error(res.error || "Erro ao cadastrar empresa.");
        }
    }

    async function handleUpdateSubscription(e: React.FormEvent) {
        e.preventDefault();
        if (!tenant) return;
        setLoading(true);

        const periodEndDate = subPeriodEnd ? new Date(subPeriodEnd) : null;
        const res = await updateTenantSubscription(
            tenant.id,
            subStatus,
            subPlan,
            periodEndDate
        );

        setLoading(false);
        if (res.success) {
            toast.success("Assinatura atualizada com sucesso!");
            setOpen(false);
            onSuccess();
        } else {
            toast.error(res.error || "Erro ao atualizar assinatura.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" /> Assinatura
                    </Button>
                ) : (
                    <Button className="bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase text-[10px] tracking-widest h-10 px-4 rounded-xl cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" /> Cadastrar Empresa
                    </Button>
                )}
            </DialogTrigger>
            
            <DialogContent className={isEditing ? "sm:max-w-[425px] bg-zinc-950 border-white/10 rounded-[32px]" : "sm:max-w-[600px] bg-zinc-950 border-white/10 rounded-[32px]"}>
                <DialogHeader>
                    <DialogTitle className="text-lg font-black uppercase tracking-tight text-white">
                        {isEditing ? "Gerenciar Assinatura" : "Cadastrar Nova Empresa"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                        {isEditing 
                            ? `Ajuste os parâmetros financeiros de ${tenant.name}.`
                            : "Preencha as informações para registrar um novo inquilino corporativo no sistema."}
                    </DialogDescription>
                </DialogHeader>

                {isEditing ? (
                    <form onSubmit={handleUpdateSubscription} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subStatus" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Status da Assinatura
                            </Label>
                            <select
                                id="subStatus"
                                value={subStatus}
                                onChange={(e) => setSubStatus(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/5 text-zinc-300 font-bold text-xs uppercase tracking-wide rounded-xl p-3 h-12 focus:outline-none focus:border-white/30"
                            >
                                <option value="ACTIVE">Ativo (Paga / Liberada)</option>
                                <option value="TRIAL">Período de Testes (Trial)</option>
                                <option value="PAST_DUE">Em Atraso (Past Due)</option>
                                <option value="CANCELED">Cancelado / Suspenso</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subPlan" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Plano Comercial
                            </Label>
                            <select
                                id="subPlan"
                                value={subPlan}
                                onChange={(e) => setSubPlan(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/5 text-zinc-300 font-bold text-xs uppercase tracking-wide rounded-xl p-3 h-12 focus:outline-none focus:border-white/30"
                            >
                                <option value="PROFESSIONAL">Profissional (R$ 49,90/mês)</option>
                                <option value="FREE">Gratuito</option>
                                <option value="ENTERPRISE">Enterprise (Personalizado)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subPeriodEnd" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Expiração do Ciclo / Trial
                            </Label>
                            <Input
                                id="subPeriodEnd"
                                type="date"
                                value={subPeriodEnd}
                                onChange={(e) => setSubPeriodEnd(e.target.value)}
                                className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl text-xs font-bold text-zinc-300"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t border-white/5">
                            <Button type="submit" className="bg-white text-black hover:bg-zinc-200 font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl cursor-pointer w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Alterações"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <form onSubmit={handleCreate} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Company Fields */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-primary border-b border-primary/20 pb-1">
                                    Dados da Empresa
                                </h3>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        Nome Fantasia
                                    </Label>
                                    <Input
                                        placeholder="Ex: Medara Holding"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                        className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-11 rounded-xl text-xs font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        Subdomínio / Slug
                                    </Label>
                                    <Input
                                        placeholder="ex: medara"
                                        value={companySlug}
                                        onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                                        required
                                        className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-11 rounded-xl text-xs font-bold"
                                    />
                                    <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-wider">
                                        Ficará: slug.sopp.com.br
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        CNPJ da Empresa
                                    </Label>
                                    <Input
                                        placeholder="00.000.000/0000-00"
                                        value={companyDocument}
                                        onChange={(e) => setCompanyDocument(e.target.value)}
                                        required
                                        className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-11 rounded-xl text-xs font-bold"
                                    />
                                </div>
                            </div>

                            {/* Manager User Fields */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-wider text-primary border-b border-primary/20 pb-1">
                                    Usuário Gestor (Proprietário)
                                </h3>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        Nome Completo
                                    </Label>
                                    <Input
                                        placeholder="Ex: Roberto Silva"
                                        value={ownerName}
                                        onChange={(e) => setOwnerName(e.target.value)}
                                        required
                                        className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-11 rounded-xl text-xs font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        E-mail Comercial
                                    </Label>
                                    <Input
                                        type="email"
                                        placeholder="exemplo@empresa.com"
                                        value={ownerEmail}
                                        onChange={(e) => setOwnerEmail(e.target.value)}
                                        required
                                        className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-11 rounded-xl text-xs font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        CPF do Gestor
                                    </Label>
                                    <Input
                                        placeholder="000.000.000-00"
                                        value={ownerDocument}
                                        onChange={(e) => setOwnerDocument(e.target.value)}
                                        required
                                        className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-11 rounded-xl text-xs font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        Senha do Gestor
                                    </Label>
                                    <Input
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={ownerPassword}
                                        onChange={(e) => setOwnerPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-11 rounded-xl text-xs font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t border-white/5">
                            <Button type="submit" className="bg-white text-black hover:bg-zinc-200 font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl cursor-pointer w-full" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Concluir Cadastro corporativo"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
