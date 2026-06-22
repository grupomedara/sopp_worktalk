"use client";

import { useState, useRef, useEffect } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    MoreHorizontal, 
    Trash2, 
    ArrowUpDown, 
    ArrowUp, 
    ArrowDown, 
    Edit, 
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    User,
    Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteFinance } from "@/app/actions/finance";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isBefore, startOfDay } from "date-fns";
import { Finance, Person, Project } from "@prisma/client";
import { FinanceDialog } from "./FinanceDialog";

interface FinanceWithRelations extends Finance {
    person: Person | null;
    project: Project | null;
}

interface FinanceTableProps {
    finances: FinanceWithRelations[];
    people: Person[];
    projects: Project[];
}

export function FinanceTable({ finances, people, projects }: FinanceTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [editingFinance, setEditingFinance] = useState<FinanceWithRelations | null>(null);
    const todayRef = useRef<HTMLTableRowElement>(null);
    const hasScrolled = useRef(false);

    const today = startOfDay(new Date());
    const todayIndex = finances.findIndex(f => {
        if (!f.dueDate) return false;
        const date = new Date(f.dueDate);
        return !isBefore(date, today);
    });

    const targetIndex = finances.length > 0 ? (todayIndex !== -1 ? todayIndex : finances.length - 1) : -1;

    useEffect(() => {
        if (todayRef.current && !hasScrolled.current && finances.length > 0) {
            const timeoutId = setTimeout(() => {
                todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                hasScrolled.current = true;
            }, 600);
            return () => clearTimeout(timeoutId);
        }
    }, [finances, targetIndex]);

    const currentSort = searchParams.get("sort") || "dueDate";
    const currentOrder = searchParams.get("order") || "asc";

    const handleSort = (column: string) => {
        const newOrder = currentSort === column && currentOrder === "asc" ? "desc" : "asc";
        router.push(`/finance?sort=${column}&order=${newOrder}`);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (currentSort !== column) return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/30" />;
        if (currentOrder === "asc") return <ArrowUp className="ml-2 h-3 w-3 text-primary" />;
        return <ArrowDown className="ml-2 h-3 w-3 text-primary" />;
    };

    return (
        <div className="w-full bg-zinc-900/20 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                <Table className="min-w-[1000px] border-separate border-spacing-0">
                    <TableHeader className="sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-20">
                        <TableRow className="border-none hover:bg-transparent">
                            <TableHead
                                className="h-14 cursor-pointer hover:text-primary transition-colors pl-8 border-b border-white/5"
                                onClick={() => handleSort("dueDate")}
                            >
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Vencimento
                                    <SortIcon column="dueDate" />
                                </div>
                            </TableHead>
                            <TableHead className="h-14 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</TableHead>
                            <TableHead className="h-14 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoria</TableHead>
                            <TableHead className="h-14 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vínculo</TableHead>
                            <TableHead
                                className="h-14 cursor-pointer hover:text-primary transition-colors border-b border-white/5"
                                onClick={() => handleSort("amount")}
                            >
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Valor
                                    <SortIcon column="amount" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="h-14 cursor-pointer hover:text-primary transition-colors border-b border-white/5"
                                onClick={() => handleSort("status")}
                            >
                                <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Status
                                    <SortIcon column="status" />
                                </div>
                            </TableHead>
                            <TableHead className="h-14 w-[80px] border-b border-white/5"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {finances.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-40 text-muted-foreground bg-zinc-950/20">
                                    <div className="flex flex-col items-center gap-2">
                                        <Calendar className="h-8 w-8 opacity-10" />
                                        <p className="text-xs font-black uppercase tracking-widest opacity-40">Nenhum registro encontrado</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            finances.map((finance, index) => {
                                const isLate = finance.status === 'PENDING' && finance.dueDate && isBefore(new Date(finance.dueDate), startOfDay(new Date()));
                                return (
                                    <TableRow 
                                        key={finance.id} 
                                        ref={index === targetIndex ? todayRef : null}
                                        className={cn(
                                            "group border-b border-white/5 hover:bg-white/[0.02] transition-all duration-300",
                                            index === todayIndex && todayIndex !== -1 && "bg-primary/[0.03] border-l-2 border-l-primary"
                                        )}
                                    >
                                        <TableCell className="pl-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-xl flex items-center justify-center border transition-colors",
                                                    isLate ? "border-red-500/20 bg-red-500/5 text-red-500" : "border-white/5 bg-white/5 text-muted-foreground group-hover:border-primary/20 group-hover:text-primary"
                                                )}>
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black tracking-tight text-foreground">
                                                        {finance.dueDate ? format(new Date(finance.dueDate), "dd MMM") : "-"}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                                                        {finance.dueDate ? format(new Date(finance.dueDate), "yyyy") : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                    {finance.description}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/10 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                                                {finance.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {finance.person || finance.project ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center">
                                                        {finance.person ? <User className="h-3 w-3 text-muted-foreground" /> : <Briefcase className="h-3 w-3 text-muted-foreground" />}
                                                    </div>
                                                    <span className="text-xs font-bold text-muted-foreground tracking-tight">
                                                        {finance.person ? finance.person.name : finance.project?.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-muted-foreground/30 italic">Sem vínculo</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "text-sm font-black tracking-tighter",
                                                isLate ? "text-red-500" : "text-foreground"
                                            )}>
                                                R$ {Number(finance.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-start">
                                                <Badge 
                                                    variant={finance.status === 'COMPLETED' ? "default" : "secondary"}
                                                    className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest h-5 px-2",
                                                        finance.status === 'COMPLETED' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-zinc-800 hover:bg-zinc-700"
                                                    )}
                                                >
                                                    {finance.status === 'COMPLETED' ? (
                                                        <span className="flex items-center gap-1"><CheckCircle2 className="h-2 w-2" /> Liquidado</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1"><Clock className="h-2 w-2" /> Aberto</span>
                                                    )}
                                                </Badge>
                                                {isLate && (
                                                    <div className="mt-1 flex items-center gap-1 text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                                                        <AlertCircle className="h-2 w-2" /> Vencido
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-950/90 backdrop-blur-xl border-white/10 rounded-2xl p-2 min-w-[160px]">
                                                    <DropdownMenuItem
                                                        className="cursor-pointer rounded-xl font-black text-[10px] uppercase tracking-widest h-10"
                                                        onSelect={() => setEditingFinance(finance)}
                                                    >
                                                        <Edit className="mr-3 h-4 w-4 text-primary" /> Editar
                                                    </DropdownMenuItem>
                                                    <form action={async () => {
                                                        await deleteFinance(finance.id);
                                                    }}>
                                                        <button type="submit" className="w-full flex items-center px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors hover:bg-red-500/10 text-red-500 outline-none h-10">
                                                            <Trash2 className="mr-3 h-4 w-4" /> Excluir
                                                        </button>
                                                    </form>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <FinanceDialog
                people={people}
                projects={projects}
                initialData={editingFinance || undefined}
                open={!!editingFinance}
                onOpenChange={(open) => !open && setEditingFinance(null)}
                trigger={<span className="hidden" />}
            />
        </div>
    );
}
