"use client";

import { INCOME_CATEGORIES } from "@/lib/constants/finance";
import { TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp, DollarSign, Wallet } from "lucide-react";
import { useState } from "react";
import { isBefore, startOfDay, format } from "date-fns";
import { QuickFinanceAction } from "./QuickFinanceAction";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TodaysFinancesAlertProps {
    finances: any[];
}

export function TodaysFinancesAlert({ finances }: TodaysFinancesAlertProps) {
    const [expanded, setExpanded] = useState(false);

    if (!finances || finances.length === 0) return null;

    const incomes = finances.filter(f => INCOME_CATEGORIES.includes(f.category));
    const expenses = finances.filter(f => !INCOME_CATEGORIES.includes(f.category));

    const totalIncome = incomes.reduce((acc, f) => acc + Number(f.amount), 0);
    const totalExpense = expenses.reduce((acc, f) => acc + Number(f.amount), 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="relative overflow-hidden border-2 border-primary/20 noir-glass rounded-sm mb-12 group">
            {/* Ambient background glow */}
            <div className={cn(
                "absolute inset-0 opacity-10 pointer-events-none transition-colors duration-500",
                balance < 0 ? "bg-red-500" : "bg-emerald-500"
            )} />

            <div className="relative p-6 px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "p-4 rounded-full border shadow-[0_0_20px_rgba(var(--primary),0.3)]",
                        balance < 0 ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    )}>
                        <DollarSign className="h-8 w-8 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">
                            ALERTA FINANCEIRO: <span className="text-primary italic">PENDÊNCIAS ATÉ HOJE</span>
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                            {finances.length} {finances.length === 1 ? "registro pendente" : "registros pendentes"} para compensação imediata.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-8">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Saída Prevista</p>
                        <p className="text-2xl font-black tracking-tighter text-red-500">
                           - R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="w-px h-10 bg-border hidden md:block" />
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Entrada Prevista</p>
                        <p className="text-2xl font-black tracking-tighter text-emerald-500">
                           + R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="w-px h-10 bg-border hidden md:block" />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setExpanded(!expanded)}
                        className="text-[10px] uppercase font-black tracking-widest hover:bg-primary/10 group-hover:text-primary transition-all"
                    >
                        {expanded ? "Ocultar Detalhes" : "Ver Detalhes"}
                        {expanded ? <ChevronUp className="ml-2 h-3 w-3" /> : <ChevronDown className="ml-2 h-3 w-3" />}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4 px-8 space-y-px bg-white/5">
                        {finances.map((f) => (
                            <div key={f.id} className="flex items-center justify-between p-3 hover:bg-primary/5 transition-colors group/item">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border",
                                        INCOME_CATEGORIES.includes(f.category) 
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                                            : "bg-red-500/10 border-red-500/20 text-red-500"
                                    )}>
                                        {INCOME_CATEGORIES.includes(f.category) ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold uppercase tracking-tight">{f.description}</p>
                                            {isBefore(new Date(f.dueDate), startOfDay(new Date())) && (
                                                <span className="text-[8px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded-sm animate-pulse">
                                                    VENCIDA
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-l border-primary/30 pl-2 mt-0.5">
                                            {f.category.replace(/_/g, ' ')} • VENCIMENTO: {format(new Date(f.dueDate), "dd/MM")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-sm font-black tracking-tighter",
                                            INCOME_CATEGORIES.includes(f.category) ? "text-emerald-500" : "text-red-500"
                                        )}>
                                            R$ {Number(f.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        {f.person && (
                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{f.person.name}</p>
                                        )}
                                    </div>
                                    <QuickFinanceAction 
                                        finance={f} 
                                        trigger={
                                            <Button size="sm" variant="outline" className="h-8 px-4 text-[10px] uppercase font-black tracking-widest border-primary/20 hover:border-primary peer transition-all">
                                                Confirmar
                                            </Button>
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
