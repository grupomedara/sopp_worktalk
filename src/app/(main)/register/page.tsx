"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { createTenant, acceptInvite } from "@/app/actions/tenant";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function RegisterForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const token = searchParams.get("token");

    // Company Registration State
    const [companyName, setCompanyName] = useState("");
    const [companySlug, setCompanySlug] = useState("");
    const [companyDoc, setCompanyDoc] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [ownerEmail, setOwnerEmail] = useState("");
    const [ownerDoc, setOwnerDoc] = useState("");
    const [ownerPassword, setOwnerPassword] = useState("");

    // Member Registration State (via invite token)
    const [memberName, setMemberName] = useState("");
    const [memberDoc, setMemberDoc] = useState("");
    const [memberPassword, setMemberPassword] = useState("");

    const handleCompanyRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName || !companySlug || !ownerName || !ownerEmail || !ownerDoc || !ownerPassword) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        startTransition(async () => {
            const res = await createTenant(
                companyName,
                companySlug,
                companyDoc,
                ownerName,
                ownerEmail,
                ownerDoc,
                ownerPassword
            );

            if (res.success) {
                toast.success("Empresa cadastrada com sucesso! Redirecionando...");
                const host = window.location.host;
                const protocol = window.location.protocol;
                let redirectHost = "";
                
                if (host.includes("localhost")) {
                    redirectHost = `${companySlug.toLowerCase()}.localhost:3000`;
                } else {
                    redirectHost = `${companySlug.toLowerCase()}.sopp.com.br`;
                }
                
                setTimeout(() => {
                    window.location.href = `${protocol}//${redirectHost}/login`;
                }, 2000);
            } else {
                toast.error(res.error || "Erro ao cadastrar empresa.");
            }
        });
    };

    const handleMemberRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (!memberName || !memberDoc || !memberPassword) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        startTransition(async () => {
            const res = await acceptInvite(token, memberName, memberDoc, memberPassword);
            if (res.success) {
                toast.success("Cadastro realizado com sucesso! Redirecionando...");
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                toast.error(res.error || "Erro ao concluir cadastro.");
            }
        });
    };

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="mb-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-4 relative">
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" className="opacity-20" />
                        <path d="M10 10H30V20H20C14.4772 20 10 24.4772 10 30V30" stroke="white" strokeWidth="3" strokeLinecap="round" />
                        <path d="M30 30H10V20H20C25.5228 20 30 15.5228 30 10V10" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" className="opacity-50" />
                    </svg>
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-white">SOPP<span className="text-primary">.</span></h1>
                <p className="text-[7px] uppercase font-black tracking-[0.2em] text-white/40 mt-1">Cadastro de Equipes & Empresas</p>
            </div>

            {token ? (
                /* Accept Invite Form */
                <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] rounded-[40px] overflow-hidden">
                    <CardHeader className="pt-8 pb-4">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-center text-white/60">Completar Cadastro</CardTitle>
                        <CardDescription className="text-center text-[10px] text-white/30 uppercase font-bold tracking-wider mt-1.5">Você foi convidado para participar de uma equipe</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <form onSubmit={handleMemberRegister} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Seu Nome Completo</label>
                                <Input
                                    value={memberName}
                                    onChange={(e) => setMemberName(e.target.value)}
                                    placeholder="Ex: João da Silva"
                                    required
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Seu CPF</label>
                                <Input
                                    value={memberDoc}
                                    onChange={(e) => setMemberDoc(e.target.value)}
                                    placeholder="Ex: 000.000.000-00"
                                    required
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl tracking-wider"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Criar Senha de Acesso</label>
                                <Input
                                    type="password"
                                    value={memberPassword}
                                    onChange={(e) => setMemberPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl"
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 rounded-xl font-bold uppercase tracking-wider text-xs" disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Concluir Cadastro"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                /* New Company Signup Form */
                <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] rounded-[40px] overflow-hidden">
                    <CardHeader className="pt-8 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-center text-white/60">Registrar Empresa</CardTitle>
                        <CardDescription className="text-center text-[10px] text-white/30 uppercase font-bold tracking-wider mt-1.5">Inicie seu teste gratuito de 14 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 max-h-[450px] overflow-y-auto no-scrollbar space-y-6 pt-4">
                        <form onSubmit={handleCompanyRegister} className="space-y-6">
                            <div className="border-b border-white/5 pb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">1. Dados da Organização</h4>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Nome da Empresa</label>
                                <Input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Ex: Minha Empresa Ltda"
                                    required
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Subdomínio (Link de acesso)</label>
                                <div className="flex items-center bg-white/[0.02] border border-white/5 focus-within:border-white/30 rounded-xl px-3 h-12">
                                    <input
                                        value={companySlug}
                                        onChange={(e) => setCompanySlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                                        placeholder="minha-empresa"
                                        required
                                        className="bg-transparent border-none text-white focus:outline-none focus:ring-0 text-sm font-bold w-full"
                                    />
                                    <span className="text-[10px] font-black text-white/30 uppercase">.sopp.com</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">CNPJ (Opcional)</label>
                                <Input
                                    value={companyDoc}
                                    onChange={(e) => setCompanyDoc(e.target.value)}
                                    placeholder="Ex: 00.000.000/0000-00"
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl tracking-wider"
                                />
                            </div>

                            <div className="border-b border-white/5 pb-2 pt-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">2. Administrador da Conta</h4>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Seu Nome</label>
                                <Input
                                    value={ownerName}
                                    onChange={(e) => setOwnerName(e.target.value)}
                                    placeholder="Ex: José da Silva"
                                    required
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Seu E-mail</label>
                                <Input
                                    type="email"
                                    value={ownerEmail}
                                    onChange={(e) => setOwnerEmail(e.target.value)}
                                    placeholder="Ex: jose@empresa.com"
                                    required
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Seu CPF</label>
                                <Input
                                    value={ownerDoc}
                                    onChange={(e) => setOwnerDoc(e.target.value)}
                                    placeholder="Ex: 000.000.000-00"
                                    required
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl tracking-wider"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Senha de Acesso</label>
                                <Input
                                    type="password"
                                    value={ownerPassword}
                                    onChange={(e) => setOwnerPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl"
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 rounded-xl font-bold uppercase tracking-wider text-xs mt-4" disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Registrar Empresa e Entrar"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="pb-6 pt-4 flex flex-col space-y-2 border-t border-white/5 bg-white/[0.01]">
                        <p className="text-[9px] uppercase tracking-wider font-bold text-white/30 text-center">
                            Já possui conta?{" "}
                            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                                Entrar
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black relative overflow-y-auto py-12 px-4">
            <Suspense fallback={
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            }>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
