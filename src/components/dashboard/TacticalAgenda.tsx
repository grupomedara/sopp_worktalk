"use client";

import { format, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import { toast } from "sonner";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface AppointmentsProps {
    appointments: any[];
    finances?: any[];
}

export function TacticalAgenda({ appointments, finances = [] }: AppointmentsProps) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const alertedIds = useRef<string[]>([]);

    const localAppointments = appointments;

    // Combine appointments and finances for the display list
    const agendaItems = [
        ...localAppointments.map(a => ({ ...a, type: 'appointment' })),
        ...finances.map(f => ({ ...f, type: 'finance' }))
    ].sort((a, b) => {
        const dateA = new Date(a.startDate || a.dueDate).getTime();
        const dateB = new Date(b.startDate || b.dueDate).getTime();
        return dateA - dateB;
    });

    useEffect(() => {
        setMounted(true);
        
        const interval = setInterval(() => {
            const currentNow = new Date();

            // Alerta em primeiro plano (Foreground)
            localAppointments.forEach((event) => {
                const eventDate = new Date(event.startDate);
                const diff = eventDate.getTime() - currentNow.getTime();

                // Se o evento começa em breve (60s) ou começou há pouco (-30s)
                if (diff > -30000 && diff <= 60000 && !alertedIds.current.includes(event.id)) {
                    alertedIds.current.push(event.id);
                    
                    toast.warning(`📅 COMEÇANDO AGORA: ${event.title}`, {
                        description: `Seu compromisso na agenda está iniciando.`,
                        duration: 15000,
                    });

                    // Som de alerta leve
                    try {
                        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                        audio.volume = 0.5;
                        audio.play().catch(() => {});
                    } catch (e) {}
                }
            });

            router.refresh();
        }, 15000);

        return () => clearInterval(interval);
    }, [router, localAppointments]);

    if (!mounted) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

    const INCOME_CATEGORIES = [ 'RECEITA_SALARIO', 'RECEITA_INVESTIMENTO', 'RECEITA_VENDA', 'RECEITA_SERVICO', 'OUTRA_RECEITA' ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-foreground flex items-center">
                    <span className="w-2 h-2 bg-foreground mr-3" />
                    AGENDA PRÓXIMA
                </h3>
                <Link href="/agenda" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                    Cronograma &rarr;
                </Link>
            </div>

            <div className="space-y-4">
                {agendaItems.length === 0 ? (
                    <div className="p-8 bg-muted/20 border border-dashed border-border text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Nenhum compromisso tático agendado para hoje.</p>
                    </div>
                ) : (
                    agendaItems.map((item) => {
                        const isFinance = item.type === 'finance';
                        const isIncome = isFinance && INCOME_CATEGORIES.includes(item.category);
                        const date = new Date(item.startDate || item.dueDate);
                        
                        return (
                            <div 
                                key={item.id} 
                                className={cn(
                                    "bg-muted/30 border-l-4 p-4 hover:bg-muted/50 transition-all cursor-pointer rounded-r-md group/agenda",
                                    isFinance ? (isIncome ? "border-emerald-500/50 bg-emerald-500/5" : "border-red-500/50 bg-red-500/5") : ""
                                )}
                                style={!isFinance ? { borderLeftColor: item.color || '#64748b' } : {}}
                                onClick={() => {
                                    if (!isFinance) return;
                                    // Finance items click logic could be added here if needed
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm",
                                            isToday(date) ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800/80 text-zinc-300"
                                        )}>
                                            {isToday(date) 
                                                ? format(date, "HH:mm") 
                                                : format(date, "dd/MM HH:mm")}
                                        </span>
                                        {isFinance && (
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                                                isIncome ? "bg-emerald-600/20 text-emerald-500" : "bg-red-600/20 text-red-500"
                                            )}>
                                                {isIncome ? "RECEBER" : "PAGAR"}
                                            </span>
                                        )}
                                        {isFinance && isBefore(date, startOfDay(new Date())) && (
                                            <span className="text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-sm animate-pulse">
                                                VENCIDO
                                            </span>
                                        )}
                                    </div>
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm font-bold uppercase tracking-tight leading-tight flex-1">
                                        {item.title || item.description}
                                    </p>
                                    {isFinance && (
                                        <p className={cn(
                                            "text-sm font-black tracking-tighter shrink-0",
                                            isIncome ? "text-emerald-500" : "text-red-500"
                                        )}>
                                            R$ {Number(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
