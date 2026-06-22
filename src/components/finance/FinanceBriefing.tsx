"use client";

import { format, isBefore, isToday, startOfDay } from "date-fns";
import { 
    AlertCircle, 
    Clock, 
    CreditCard, 
    ArrowRight, 
    DollarSign,
    AlertTriangle,
    ShieldAlert,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FinanceBriefingProps {
    finances: any[];
}

const INCOME_CATEGORIES = [ 'RECEITA_SALARIO', 'RECEITA_INVESTIMENTO', 'RECEITA_VENDA', 'RECEITA_SERVICO', 'OUTRA_RECEITA' ];

export function FinanceBriefing({ finances }: FinanceBriefingProps) {
    const today = startOfDay(new Date());

    const late = finances.filter(f => 
        f.dueDate && 
        isBefore(new Date(f.dueDate), today) && 
        f.status === 'PENDING'
    );
    
    const forToday = finances.filter(f => 
        f.dueDate && 
        isToday(new Date(f.dueDate)) && 
        f.status === 'PENDING'
    );

    if (late.length === 0 && forToday.length === 0) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-top duration-700">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-3">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Monitoramento de Saúde Financeira
                </h3>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                    Live Status
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {late.length > 0 && (
                    <div className="group relative overflow-hidden border border-red-500/20 bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-6 transition-all hover:bg-zinc-900/60 shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldAlert className="h-24 w-24 text-red-500" />
                        </div>
                        
                        <div className="flex items-start gap-5">
                            <div className="bg-red-500/20 p-3 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black uppercase tracking-tight text-red-500">
                                        {late.length} {late.length === 1 ? 'PENDÊNCIA CRÍTICA' : 'PENDÊNCIAS CRÍTICAS'}
                                    </p>
                                    <Badge variant="destructive" className="h-5 text-[9px] font-black px-2">URGENTE</Badge>
                                </div>
                                <p className="text-2xl font-black tracking-tighter text-foreground mt-2">
                                    R$ {late.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                    Volume total em atraso
                                </p>
                                
                                <div className="mt-6 space-y-3">
                                    {late.slice(0, 3).map(item => (
                                        <div key={item.id} className="flex justify-between items-center group/item">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-500/40 group-hover/item:bg-red-500 transition-colors" />
                                                <span className="text-[11px] font-bold text-muted-foreground group-hover/item:text-foreground transition-colors uppercase tracking-tight truncate max-w-[140px]">
                                                    {item.description}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-black text-red-500/80">
                                                R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                    {late.length > 3 && (
                                        <p className="text-[9px] font-black text-muted-foreground/40 text-center uppercase tracking-widest pt-2 border-t border-white/5">
                                            + {late.length - 3} outros itens em atraso
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {forToday.length > 0 && (
                    <div className="group relative overflow-hidden border border-amber-500/20 bg-zinc-900/40 backdrop-blur-xl rounded-3xl p-6 transition-all hover:bg-zinc-900/60 shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="h-24 w-24 text-amber-500" />
                        </div>
                        
                        <div className="flex items-start gap-5">
                            <div className="bg-amber-500/20 p-3 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black uppercase tracking-tight text-amber-500">
                                        {forToday.length} {forToday.length === 1 ? 'ITEM PARA HOJE' : 'ITENS PARA HOJE'}
                                    </p>
                                    <Badge variant="outline" className="h-5 text-[9px] font-black px-2 border-amber-500/30 text-amber-500">HOJE</Badge>
                                </div>
                                <p className="text-2xl font-black tracking-tighter text-foreground mt-2">
                                    R$ {forToday.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                    Volume total previsto
                                </p>
                                
                                <div className="mt-6 space-y-3">
                                    {forToday.slice(0, 3).map(item => (
                                        <div key={item.id} className="flex justify-between items-center group/item">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500/40 group-hover/item:bg-amber-500 transition-colors" />
                                                <span className="text-[11px] font-bold text-muted-foreground group-hover/item:text-foreground transition-colors uppercase tracking-tight truncate max-w-[140px]">
                                                    {item.description}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-black text-amber-500/80">
                                                R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                    {forToday.length > 3 && (
                                        <p className="text-[9px] font-black text-muted-foreground/40 text-center uppercase tracking-widest pt-2 border-t border-white/5">
                                            + {forToday.length - 3} outros itens para hoje
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
