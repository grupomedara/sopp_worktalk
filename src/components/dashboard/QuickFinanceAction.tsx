"use client";

import { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFinance } from "@/app/actions/finance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { INCOME_CATEGORIES } from "@/lib/constants/finance";
import { TrendingUp, TrendingDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickFinanceActionProps {
    finance: any;
    trigger?: React.ReactNode;
}

export function QuickFinanceAction({ finance, trigger }: QuickFinanceActionProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(Number(finance.amount).toString());
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const isIncome = INCOME_CATEGORIES.includes(finance.category);
    const label = isIncome ? "Confirmar Recebimento" : "Confirmar Pagamento";
    const actionColor = isIncome ? "text-emerald-500" : "text-red-500";
    const buttonVariant = isIncome ? "default" : "destructive";

    async function handleConfirm() {
        setLoading(true);
        try {
            const result = await updateFinance(finance.id, {
                ...finance,
                amount: parseFloat(amount),
                status: "COMPLETED",
            });

            if (result.success) {
                toast.success(`${isIncome ? "Recebido" : "Pago"} com sucesso!`);
                setOpen(false);
                router.refresh();
            } else {
                toast.error("Erro ao atualizar registro.");
            }
        } catch (error) {
            toast.error("Ocorreu um erro inesperado.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] uppercase font-black tracking-widest">
                        {isIncome ? "Receber" : "Pagar"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-2 border-primary/20 noir-glass">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        {isIncome ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
                        {label}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</Label>
                        <p className="text-sm font-bold uppercase tracking-tight">{finance.description}</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Valor Final (R$)
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="text-lg font-black tracking-tighter h-12"
                        />
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                            Ajuste o valor se houver juros ou descontos.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={loading}
                        className={cn("w-full font-black uppercase tracking-[0.2em]", isIncome ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}
                    >
                        {loading ? "Processando..." : `Confirmar R$ ${parseFloat(amount || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
