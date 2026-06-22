"use client";

import { authenticate } from "@/app/actions/auth";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import Link from "next/link";

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
        </Button>
    );
}

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black relative overflow-hidden">
            <div className="w-full max-w-sm relative z-10 px-4">
                <div className="mb-12 flex flex-col items-center justify-center">
                    {/* Embedded SVG Logo for Reliability & Style */}
                    <div className="w-24 h-24 mb-6 relative group">
                        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" className="opacity-20" />
                            <path d="M10 10H30V20H20C14.4772 20 10 24.4772 10 30V30" stroke="white" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                            <path d="M30 30H10V20H20C25.5228 20 30 15.5228 30 10V10" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" className="opacity-50" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">SOPP<span className="text-primary">.</span></h1>
                    <div className="h-px w-12 bg-white/20 my-3" />
                    <p className="text-[8px] uppercase font-black tracking-[0.2em] text-white/40">Sistema Operacional de Performance Pessoal</p>
                </div>

                <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] rounded-[40px] overflow-hidden group/card hover:border-white/20 transition-all duration-500">
                    <CardHeader className="pt-10 pb-4">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-center text-white/60">Acesso Restrito</CardTitle>
                    </CardHeader>
                    <CardContent className="px-10 pb-10">
                        <form action={dispatch} className="space-y-8">
                            <div className="space-y-3">
                                <label htmlFor="document" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">ID Usuário</label>
                                <Input
                                    id="document"
                                    type="text"
                                    name="document"
                                    placeholder="INSIRA SEU CPF"
                                    required
                                    minLength={11}
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-14 rounded-2xl tracking-widest"
                                />
                            </div>
                            <div className="space-y-3">
                                <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Código de Acesso</label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="bg-white/[0.02] border-white/5 focus-visible:border-white/30 h-14 rounded-2xl"
                                />
                            </div>
                            {errorMessage && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl" aria-live="polite" aria-atomic="true">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 text-center">{errorMessage}</p>
                                </div>
                            )}
                            <LoginButton />
                        </form>
                    </CardContent>
                    <CardFooter className="pb-10 flex flex-col space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 text-center hover:text-white/50 transition-colors cursor-help italic">
                            Suporte: Contate a Administração
                        </p>
                    </CardFooter>
                </Card>

                <div className="mt-16 text-center opacity-30">
                    <img src="/logo-cobusiness.png" alt="CO-Business" className="h-4 mx-auto grayscale invert brightness-200" />
                </div>
            </div>
        </div>
    );
}
