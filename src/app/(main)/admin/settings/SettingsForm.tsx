"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGlobalSettings, saveGlobalSettings } from "@/app/actions/tenant";
import { toast } from "sonner";
import { Loader2, Key, ShieldCheck } from "lucide-react";

export function SettingsForm() {
    const [isPending, startTransition] = useTransition();
    const [token, setToken] = useState("");
    const [environment, setEnvironment] = useState("SANDBOX");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const res = await getGlobalSettings();
            if (res.success && res.data) {
                setToken(res.data.asaasToken || "");
                setEnvironment(res.data.asaasEnvironment || "SANDBOX");
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await saveGlobalSettings(token, environment);
            if (res.success) {
                toast.success("Configurações do Asaas salvas com sucesso!");
            } else {
                toast.error(res.error || "Erro ao salvar configurações.");
            }
        });
    };

    if (loading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSave}>
            <Card className="border border-white/10 bg-zinc-950/40 backdrop-blur-xl shadow-[0_32px_64px_rgba(0,0,0,0.6)] rounded-[32px] overflow-hidden hover:border-white/20 transition-all duration-300">
                <CardHeader className="pt-8 pb-4 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                            <Key className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-wider text-white">
                                Conexão Asaas
                            </CardTitle>
                            <CardDescription className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">
                                Configuração do gateway de pagamentos para assinaturas
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                            Token de API do Asaas
                        </label>
                        <div className="relative">
                            <Input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Insira o Access Token do Asaas"
                                className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-12 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider ml-1">
                            Este token é usado para sincronizar as assinaturas e receber webhooks de cobrança.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                            Ambiente do Asaas
                        </label>
                        <select
                            value={environment}
                            onChange={(e) => setEnvironment(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 font-bold text-xs uppercase tracking-wide rounded-xl p-3 h-12 focus:outline-none focus:border-white/30"
                        >
                            <option value="SANDBOX">Homologação (Sandbox / Testes)</option>
                            <option value="PRODUCTION">Produção (Ambiente Real)</option>
                        </select>
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                                Endpoint de Webhook Recomendado
                            </h5>
                            <p className="text-[9px] text-zinc-500 font-bold leading-relaxed">
                                Configure o seguinte URL de webhook na sua conta Asaas para receber atualizações de pagamento:
                                <code className="block mt-1.5 p-2 bg-zinc-950 rounded border border-white/5 text-[9px] font-mono text-zinc-300 select-all">
                                    https://seu-dominio.com.br/api/webhooks/asaas
                                </code>
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
                    <Button type="submit" className="bg-white text-black hover:bg-zinc-200 font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl cursor-pointer" disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Configurações"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
