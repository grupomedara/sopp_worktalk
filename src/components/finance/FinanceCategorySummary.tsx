"use client";

import { useState, useMemo } from "react";
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    isWithinInterval,
    startOfDay,
    endOfDay
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
    TrendingUp, 
    TrendingDown, 
    Calculator,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Calendar as CalendarIcon,
    Wallet,
    PieChart,
    BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FinanceRecord {
    id: string;
    amount: any;
    category: string;
    status: string;
    dueDate: Date | null | string;
    type: string;
}

interface FinanceCategorySummaryProps {
    finances: FinanceRecord[];
}

const INCOME_CATEGORIES = [
    "RECEITA_SALARIO",
    "RECEITA_INVESTIMENTO",
    "RECEITA_VENDA",
    "RECEITA_SERVICO",
    "OUTRA_RECEITA"
];

const CATEGORY_LABELS: Record<string, string> = {
    PESSOAL: "Pessoal",
    EMPRESA: "Empresa",
    FILHO: "Filho",
    RECEITA_SALARIO: "Salário",
    RECEITA_INVESTIMENTO: "Investimentos",
    RECEITA_VENDA: "Vendas",
    RECEITA_SERVICO: "Serviços",
    MORADIA: "Moradia",
    ALIMENTACAO: "Alimentação",
    TRANSPORTE: "Transporte",
    SAUDE: "Saúde",
    EDUCACAO: "Educação",
    SERVICOS_ESSENCIAIS: "Serviços Essenciais",
    LAZER: "Lazer",
    RESTAURANTES: "Restaurantes",
    COMPRAS: "Compras",
    VIAGENS: "Viagens",
    FILHO_ESCOLA: "Filho: Escola",
    FILHO_SAUDE: "Filho: Saúde",
    FILHO_LAZER: "Filho: Lazer",
    EMPRESA_OPERACIONAL: "Empresa: Operacional",
    EMPRESA_MARKETING: "Empresa: Marketing",
    EMPRESA_IMPOSTOS: "Empresa: Impostos",
    EMPRESA_EQUIPE: "Empresa: Equipe",
    OUTRA_RECEITA: "Outras Receitas",
    OUTROS: "Outros"
};

export function FinanceCategorySummary({ finances }: FinanceCategorySummaryProps) {
    const [startDate, setStartDate] = useState<string>(
        format(startOfMonth(new Date()), "yyyy-MM-dd")
    );
    const [endDate, setEndDate] = useState<string>(
        format(endOfMonth(new Date()), "yyyy-MM-dd")
    );

    const { summary, incomeCategories, expenseCategories, totalIncome, totalExpense } = useMemo(() => {
        const start = startOfDay(new Date(startDate + "T00:00:00"));
        const end = endOfDay(new Date(endDate + "T23:59:59"));
        const effectiveEnd = end < start ? start : end;

        const summary: Record<string, number> = {};
        let totalIncome = 0;
        let totalExpense = 0;

        finances.forEach(record => {
            if (!record.dueDate) return;
            const date = new Date(record.dueDate);
            
            if (isWithinInterval(date, { start, end: effectiveEnd })) {
                const amount = Number(record.amount);
                const cat = record.category;
                
                summary[cat] = (summary[cat] || 0) + amount;
                
                if (INCOME_CATEGORIES.includes(cat)) {
                    totalIncome += amount;
                } else {
                    totalExpense += amount;
                }
            }
        });

        const incCats = Object.keys(summary).filter(c => INCOME_CATEGORIES.includes(c));
        const expCats = Object.keys(summary).filter(c => !INCOME_CATEGORIES.includes(c));

        return { 
            summary, 
            incomeCategories: incCats.sort((a, b) => summary[b] - summary[a]),
            expenseCategories: expCats.sort((a, b) => summary[b] - summary[a]),
            totalIncome,
            totalExpense
        };
    }, [finances, startDate, endDate]);

    const netResult = totalIncome - totalExpense;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Filter Section */}
            <div className="flex flex-col md:flex-row items-end gap-4 bg-zinc-900/40 p-6 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
                <div className="grid gap-2 flex-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-primary" /> Data Inicial
                    </Label>
                    <Input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-zinc-950/50 border-white/5 font-bold h-12 rounded-xl focus:ring-primary/20"
                    />
                </div>
                <div className="grid gap-2 flex-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-primary" /> Data Final
                    </Label>
                    <Input 
                        type="date" 
                        value={endDate} 
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-zinc-950/50 border-white/5 font-bold h-12 rounded-xl focus:ring-primary/20"
                    />
                </div>
                <div className="flex-none bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 h-12 flex items-center justify-center">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">
                        {format(new Date(startDate + "T00:00:00"), "MMM", { locale: ptBR })} - {format(new Date(endDate + "T00:00:00"), "MMM yyyy", { locale: ptBR })}
                    </span>
                </div>
            </div>

            {/* Overall Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none bg-emerald-500/10 backdrop-blur-md shadow-lg rounded-3xl overflow-hidden group hover:bg-emerald-500/15 transition-all duration-500">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <div className="p-2 bg-emerald-500/20 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Total Receitas</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter text-emerald-500">
                            R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-red-500/10 backdrop-blur-md shadow-lg rounded-3xl overflow-hidden group hover:bg-red-500/15 transition-all duration-500">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <div className="p-2 bg-red-500/20 rounded-xl">
                                <TrendingDown className="h-5 w-5 text-red-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500/60">Total Despesas</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter text-red-500">
                            R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "border-none backdrop-blur-md shadow-lg rounded-3xl overflow-hidden group transition-all duration-500",
                    netResult >= 0 ? "bg-primary/10 hover:bg-primary/15" : "bg-amber-500/10 hover:bg-amber-500/15"
                )}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <div className={cn("p-2 rounded-xl", netResult >= 0 ? "bg-primary/20" : "bg-amber-500/20")}>
                                <Calculator className={cn("h-5 w-5", netResult >= 0 ? "text-primary" : "text-amber-500")} />
                            </div>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", netResult >= 0 ? "text-primary/60" : "text-amber-500/60")}>Resultado Líquido</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-3xl font-black tracking-tighter", netResult >= 0 ? "text-primary" : "text-amber-500")}>
                            R$ {netResult.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Detail Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
                {/* Receipts Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            RECEITAS POR CATEGORIA
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {incomeCategories.length > 0 ? (
                            incomeCategories.map(cat => (
                                <div key={cat} className="p-5 bg-zinc-900/30 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-emerald-500 transition-colors">
                                            {CATEGORY_LABELS[cat] || cat}
                                        </span>
                                        <ArrowUpRight className="h-3 w-3 text-emerald-500/40 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <span className="text-xl font-black tracking-tighter text-foreground">
                                            R$ {summary[cat].toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-500/40">
                                            {((summary[cat] / totalIncome) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="mt-3 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500/40 rounded-full transition-all duration-1000"
                                            style={{ width: `${(summary[cat] / totalIncome) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                                <PieChart className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">Nenhuma receita encontrada</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expenses Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="h-8 w-1 bg-red-500 rounded-full" />
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                            DESPESAS POR CATEGORIA
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {expenseCategories.length > 0 ? (
                            expenseCategories.map(cat => (
                                <div key={cat} className="p-5 bg-zinc-900/30 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-red-500 transition-colors">
                                            {CATEGORY_LABELS[cat] || cat}
                                        </span>
                                        <ArrowDownRight className="h-3 w-3 text-red-500/40 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <span className="text-xl font-black tracking-tighter text-foreground">
                                            R$ {summary[cat].toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[10px] font-bold text-red-500/40">
                                            {((summary[cat] / totalExpense) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="mt-3 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-red-500/40 rounded-full transition-all duration-1000"
                                            style={{ width: `${(summary[cat] / totalExpense) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center text-muted-foreground bg-zinc-900/20 rounded-3xl border border-dashed border-white/10">
                                <BarChart3 className="h-10 w-10 mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">Nenhuma despesa encontrada</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
