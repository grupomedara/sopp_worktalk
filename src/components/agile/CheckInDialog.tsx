"use client";

import { useState } from "react";
import { KeyResult } from "@prisma/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateKeyResultCheckIn } from "@/app/actions/okrs";
import { toast } from "sonner";
import { CalendarIcon, Target } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CheckInDialogProps {
    kr: KeyResult;
    projectId: string;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function CheckInDialog({ kr, projectId, onSuccess, trigger }: CheckInDialogProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(kr.currentValue.toString());
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await updateKeyResultCheckIn(kr.id, {
            currentValue: parseFloat(value),
            date,
            projectId,
        });

        if (result.success) {
            toast.success("Check-in realizado!");
            onSuccess();
            setOpen(false);
        } else {
            toast.error("Erro ao realizar check-in");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Atualizar</Button>}
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-2 border-primary/20 sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Check-in</span>
                    </div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                        {kr.title}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso Atual ({kr.unit})</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="bg-muted/10 border-2 border-border/50 focus:border-primary transition-all font-black text-xl h-14"
                            placeholder={`Meta: ${kr.targetValue}${kr.unit}`}
                            required
                        />
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest text-right">Meta: {kr.targetValue}{kr.unit}</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data da Conquista</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-bold border-2 h-12 bg-muted/10",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-black border-2 border-border" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 font-black uppercase tracking-[0.2em] text-xs bg-primary hover:bg-primary/90 text-black"
                    >
                        {loading ? "Salvando..." : "Confirmar Check-in"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
