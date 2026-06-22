"use client";

import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Coins,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface FinanceRecord {
  amount: any;
  category: string;
  status: string;
  dueDate: Date | null | string;
}

interface FinanceOverviewProps {
  finances: FinanceRecord[];
}

const incomeCategories = [
  "RECEITA_SALARIO",
  "RECEITA_INVESTIMENTO",
  "RECEITA_VENDA",
  "RECEITA_SERVICO",
  "OUTRA_RECEITA"
];

export function FinanceOverview({ finances }: FinanceOverviewProps) {
  const [startDate, setStartDate] = useState<string>(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd")
  );

  const metrics = useMemo(() => {
    let toPay = 0;
    let paid = 0;
    let toReceive = 0;
    let received = 0;

    const start = startOfDay(new Date(startDate + "T00:00:00"));
    const end = endOfDay(new Date(endDate + "T23:59:59"));
    const effectiveEnd = end < start ? start : end;

    finances.forEach((r) => {
      if (!r.dueDate) return;
      const date = new Date(r.dueDate);
      if (isWithinInterval(date, { start, end: effectiveEnd })) {
        const isIncome = incomeCategories.includes(r.category);
        const amount = Number(r.amount);

        if (isIncome) {
          if (r.status === "COMPLETED") received += amount;
          else toReceive += amount;
        } else {
          if (r.status === "COMPLETED") paid += amount;
          else toPay += amount;
        }
      }
    });

    return { toPay, paid, toReceive, received };
  }, [finances, startDate, endDate]);

  const items = [
    { 
      label: "Contas a Pagar", 
      value: metrics.toPay, 
      icon: TrendingDown, 
      color: "text-red-500",
      bg: "bg-red-500/10",
      sub: "Saídas Pendentes" 
    },
    { 
      label: "Contas Pagas", 
      value: metrics.paid, 
      icon: CreditCard, 
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      sub: "Saídas Liquidadas" 
    },
    { 
      label: "Recebimentos", 
      value: metrics.received, 
      icon: TrendingUp, 
      color: "text-primary",
      bg: "bg-primary/10",
      sub: "Entradas Liquidadas" 
    },
    { 
      label: "A Receber", 
      value: metrics.toReceive, 
      icon: Coins, 
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      sub: "Entradas Pendentes" 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Date Selectors */}
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
            <Activity className="h-4 w-4 text-primary mr-2" />
            <span className="text-xs font-black text-primary uppercase tracking-widest">
                Indicadores Operacionais
            </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <Card key={i} className="border-none bg-zinc-900/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden group hover:bg-zinc-900/60 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-500", item.bg)}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
                </div>
                <div className={cn(
                    "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
                    item.color
                )}>
                    {item.label.includes("Pagar") || item.label.includes("Pagas") ? (
                        <ArrowDownRight className="h-3 w-3" />
                    ) : (
                        <ArrowUpRight className="h-3 w-3" />
                    )}
                    {item.label}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-3xl font-black tracking-tighter text-foreground leading-none">
                  R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-2">
                  {item.sub}
                </p>
              </div>

              <div className="mt-6 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className={cn("h-full rounded-full transition-all duration-1000 w-full opacity-20", item.bg)}
                    style={{ backgroundColor: 'currentColor' }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
