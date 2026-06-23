"use client";

import { useState, useEffect, useTransition } from "react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
    Calendar, Users, Folder, Plus, Trash2, Edit, ChevronDown, 
    ChevronUp, Square, ClipboardList, Info, 
    CheckCircle2, Clock, PlusCircle, Save, AlertCircle, X, ShieldAlert, Share2
} from "lucide-react";
import { 
    getTodayRoutines, toggleRoutineItemLog, createRoutine, 
    updateRoutine, deleteRoutine, createRoutineItem, 
    deleteRoutineItem, updateRoutineExecutionNotes,
    shareRoutine, unshareRoutine
} from "@/app/actions/routines";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface RoutinesDashboardProps {
    currentUserId?: string;
}

export function RoutinesDashboard({ currentUserId }: RoutinesDashboardProps) {
    const { toast } = useToast();

    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [routines, setRoutines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Filtering states
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Collapsed lists
    const [expandedRoutines, setExpandedRoutines] = useState<Record<string, boolean>>({});

    // Sharing modal states
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareRoutineId, setShareRoutineId] = useState<string | null>(null);
    const [inviteEmailOrCpf, setInviteEmailOrCpf] = useState("");
    const [inviteRole, setInviteRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
    const [isSharingPending, setIsSharingPending] = useState(false);

    // Confirm Modals states
    const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);
    const [stepToDelete, setStepToDelete] = useState<string | null>(null);

    // Dialog state for Routine Group (Checklist) Creation/Edition
    const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<any | null>(null);
    const [routineTitle, setRoutineTitle] = useState("");
    const [routineRole, setRoutineRole] = useState("");
    const [routineDescription, setRoutineDescription] = useState("");

    // Dialog state for Adding Routine Steps (Item with Recurrence)
    const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
    const [activeRoutineForStep, setActiveRoutineForStep] = useState<string | null>(null);
    const [stepTitle, setStepTitle] = useState("");
    const [stepDescription, setStepDescription] = useState("");
    const [stepTime, setStepTime] = useState("");
    const [stepFrequency, setStepFrequency] = useState<string>("DAILY");
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
    const [monthlyDays, setMonthlyDays] = useState("");

    // Routine Execution Notes
    const [editingNotesRoutineId, setEditingNotesRoutineId] = useState<string | null>(null);
    const [routineNotesTemp, setRoutineNotesTemp] = useState("");

    // Fetch routines for selected date
    const fetchRoutines = async (date: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getTodayRoutines(date);
            if (res.success && res.data) {
                setRoutines(res.data);
                // Expand routines by default
                const expanded: Record<string, boolean> = {};
                res.data.forEach(r => {
                    expanded[r.id] = true;
                });
                setExpandedRoutines(expanded);
            } else {
                setError(res.error || "Erro ao buscar rotinas");
            }
        } catch (e: any) {
            setError(e.message || "Falha na requisição");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutines(selectedDate);
    }, [selectedDate]);

    // Handle Item check toggle
    const handleToggleItem = (routineId: string, itemId: string, completed: boolean) => {
        startTransition(async () => {
            const res = await toggleRoutineItemLog({
                routineId,
                date: selectedDate,
                itemId,
                completed
            });
            if (res.success) {
                setRoutines(prev => prev.map(r => {
                    if (r.id !== routineId) return r;
                    const updatedItems = r.items.map((i: any) => {
                        if (i.id !== itemId) return i;
                        return { ...i, completed, completedAt: completed ? new Date() : null };
                    });
                    const done = updatedItems.filter((i: any) => i.completed).length;
                    const progress = r.totalItems > 0 ? (done / r.totalItems) * 100 : 0;
                    return { ...r, items: updatedItems, completedItems: done, progress };
                }));
                toast({
                    title: completed ? "Tarefa concluída! 🎉" : "Tarefa reaberta",
                    description: completed ? "Bom trabalho! Continue progredindo." : "Tarefa marcada como pendente."
                });
            } else {
                toast({
                    title: "Erro ao atualizar tarefa",
                    description: res.error || "Acesso negado ou erro ao processar.",
                    variant: "destructive"
                });
            }
        });
    };

    // Handle create/update Routine Group
    const handleSaveRoutine = async () => {
        if (!routineTitle.trim()) return;

        const data = {
            title: routineTitle,
            role: routineRole || null,
            description: routineDescription || null
        };

        setLoading(true);
        if (editingRoutine) {
            const res = await updateRoutine(editingRoutine.id, data);
            if (res.success) {
                fetchRoutines(selectedDate);
                toast({
                    title: "Checklist atualizado!",
                    description: "As alterações do checklist foram salvas com sucesso."
                });
            } else {
                toast({
                    title: "Erro ao atualizar",
                    description: res.error || "Falha na requisição",
                    variant: "destructive"
                });
            }
        } else {
            const res = await createRoutine(data);
            if (res.success) {
                fetchRoutines(selectedDate);
                toast({
                    title: "Checklist criado! 🚀",
                    description: "O novo checklist já está disponível no painel."
                });
            } else {
                toast({
                    title: "Erro ao criar",
                    description: res.error || "Falha na requisição",
                    variant: "destructive"
                });
            }
        }
        setIsRoutineDialogOpen(false);
        setEditingRoutine(null);
        clearRoutineForm();
    };

    // Delete Routine Group
    const handleDeleteRoutine = async (id: string) => {
        setRoutineToDelete(id);
    };

    const executeDeleteRoutine = async () => {
        if (!routineToDelete) return;
        setLoading(true);
        const res = await deleteRoutine(routineToDelete);
        if (res.success) {
            fetchRoutines(selectedDate);
            toast({
                title: "Checklist removido!",
                description: "O checklist e todos os seus passos foram apagados."
            });
        } else {
            setLoading(false);
            toast({
                title: "Erro ao remover",
                description: res.error || "Falha na requisição",
                variant: "destructive"
            });
        }
        setRoutineToDelete(null);
    };

    // Save Routine Item (Step with Recurrence)
    const handleSaveStep = async () => {
        if (!stepTitle.trim() || !activeRoutineForStep) return;

        let scheduleDays: string | null = null;
        if (stepFrequency === "DAILY" && selectedWeekdays.length > 0) {
            scheduleDays = JSON.stringify(selectedWeekdays);
        } else if (stepFrequency === "WEEKLY" && selectedWeekdays.length > 0) {
            scheduleDays = JSON.stringify(selectedWeekdays);
        } else if (stepFrequency === "MONTHLY" && monthlyDays) {
            const days = monthlyDays.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d) && d >= 1 && d <= 31);
            scheduleDays = JSON.stringify(days);
        } else if (stepFrequency === "SPORADIC" && monthlyDays) {
            const dates = monthlyDays.split(",").map(d => d.trim()).filter(d => d.length > 0);
            scheduleDays = JSON.stringify(dates);
        }

        setLoading(true);
        const res = await createRoutineItem({
            routineId: activeRoutineForStep,
            title: stepTitle,
            description: stepDescription || null,
            frequency: stepFrequency as any,
            scheduleDays,
            timeOfDay: stepTime || null,
            order: routines.find(r => r.id === activeRoutineForStep)?.items.length || 0
        });

        if (res.success) {
            fetchRoutines(selectedDate);
            toast({
                title: "Tarefa cíclica adicionada! 🕒",
                description: "A tarefa foi integrada ao checklist com a recorrência agendada."
            });
        } else {
            setLoading(false);
            toast({
                title: "Erro ao adicionar tarefa",
                description: res.error || "Falha na requisição",
                variant: "destructive"
            });
        }

        setIsStepDialogOpen(false);
        clearStepForm();
    };

    // Delete Routine Item (Step)
    const handleDeleteStep = async (itemId: string) => {
        setStepToDelete(itemId);
    };

    const executeDeleteStep = async () => {
        if (!stepToDelete) return;
        setLoading(true);
        const res = await deleteRoutineItem(stepToDelete);
        if (res.success) {
            fetchRoutines(selectedDate);
            toast({
                title: "Tarefa removida",
                description: "A tarefa cíclica foi removida do checklist com sucesso."
            });
        } else {
            setLoading(false);
            toast({
                title: "Erro ao remover tarefa",
                description: res.error || "Falha na requisição",
                variant: "destructive"
            });
        }
        setStepToDelete(null);
    };

    // Save general notes for execution
    const handleSaveExecutionNotes = async (routineId: string) => {
        const res = await updateRoutineExecutionNotes(routineId, selectedDate, routineNotesTemp);
        if (res.success) {
            setRoutines(prev => prev.map(r => {
                if (r.id !== routineId) return r;
                return { ...r, notes: routineNotesTemp };
            }));
            setEditingNotesRoutineId(null);
            toast({
                title: "Notas salvas!",
                description: "As observações de auditoria foram registradas para este dia."
            });
        } else {
            toast({
                title: "Erro ao salvar notas",
                description: res.error || "Falha na requisição",
                variant: "destructive"
            });
        }
    };

    const handleShare = async () => {
        if (!shareRoutineId || !inviteEmailOrCpf.trim()) return;
        setIsSharingPending(true);
        try {
            const res = await shareRoutine(shareRoutineId, inviteEmailOrCpf.trim(), inviteRole);
            if (res.success) {
                toast({
                    title: "Checklist compartilhado!",
                    description: "Permissões atualizadas com sucesso."
                });
                setInviteEmailOrCpf("");
                fetchRoutines(selectedDate);
            } else {
                toast({
                    title: "Erro ao compartilhar",
                    description: res.error || "Ocorreu um erro.",
                    variant: "destructive"
                });
            }
        } catch (e: any) {
            toast({
                title: "Erro ao compartilhar",
                description: e.message || "Erro inesperado.",
                variant: "destructive"
            });
        } finally {
            setIsSharingPending(false);
        }
    };

    const handleUnshare = async (userId: string) => {
        if (!shareRoutineId) return;
        setIsSharingPending(true);
        try {
            const res = await unshareRoutine(shareRoutineId, userId);
            if (res.success) {
                toast({
                    title: "Compartilhamento removido",
                    description: "O usuário não tem mais acesso a este checklist."
                });
                fetchRoutines(selectedDate);
            } else {
                toast({
                    title: "Erro ao remover compartilhamento",
                    description: res.error || "Ocorreu um erro.",
                    variant: "destructive"
                });
            }
        } catch (e: any) {
            toast({
                title: "Erro ao remover compartilhamento",
                description: e.message || "Erro inesperado.",
                variant: "destructive"
            });
        } finally {
            setIsSharingPending(false);
        }
    };

    const clearRoutineForm = () => {
        setRoutineTitle("");
        setRoutineRole("");
        setRoutineDescription("");
    };

    const clearStepForm = () => {
        setStepTitle("");
        setStepDescription("");
        setStepTime("");
        setStepFrequency("DAILY");
        setSelectedWeekdays([]);
        setMonthlyDays("");
    };

    const openCreateRoutine = () => {
        setEditingRoutine(null);
        clearRoutineForm();
        setIsRoutineDialogOpen(true);
    };

    const openEditRoutine = (r: any) => {
        setEditingRoutine(r);
        setRoutineTitle(r.title);
        setRoutineRole(r.role || "");
        setRoutineDescription(r.description || "");
        setIsRoutineDialogOpen(true);
    };

    const toggleWeekday = (day: number) => {
        setSelectedWeekdays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    // Filter routines
    const filteredRoutines = routines.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (r.role && r.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
    });

    const parsedDate = new Date(selectedDate + "T12:00:00");

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-6 gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">
                        SOP (Standard Operating Procedure)
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-white uppercase">
                        Rotinas & Checklists
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={openCreateRoutine}
                        className="bg-primary hover:bg-primary/90 text-zinc-950 font-bold uppercase tracking-wider text-[10px] px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-primary/20 shrink-0 transition-transform active:scale-95"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" /> Novo Checklist
                    </button>
                </div>
            </div>

            {/* Date Navigator & Filters Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center bg-zinc-950/40 p-4 border border-zinc-800/80 rounded-xl backdrop-blur-md">
                {/* Date Navigator */}
                <div className="flex items-center justify-between lg:justify-start gap-4">
                    <button 
                        onClick={() => setSelectedDate(format(subDays(parsedDate, 1), "yyyy-MM-dd"))}
                        className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                    >
                        ◀
                    </button>
                    <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-sm font-black uppercase tracking-wider text-zinc-100">
                            {format(parsedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        {format(new Date(), "yyyy-MM-dd") === selectedDate && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded">
                                Hoje
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={() => setSelectedDate(format(addDays(parsedDate, 1), "yyyy-MM-dd"))}
                        className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                    >
                        ▶
                    </button>
                </div>

                {/* Search input */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar checklists ou funções..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800/80 text-white rounded-lg pl-3 pr-10 py-2.5 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:border-primary/50 transition-colors placeholder:text-zinc-650"
                    />
                </div>

            </div>

            {/* Error view */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex items-start gap-3.5">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-red-500 text-xs font-black uppercase tracking-wider">Erro na Carga das Rotinas</h4>
                        <p className="text-zinc-400 text-xs mt-1 font-semibold">{error}</p>
                    </div>
                </div>
            )}

            {/* Empty view */}
            {!loading && filteredRoutines.length === 0 && (
                <div className="text-center py-20 bg-zinc-950/20 border border-dashed border-zinc-800/80 rounded-2xl p-8 max-w-xl mx-auto">
                    <ClipboardList className="w-16 h-16 text-zinc-600 mx-auto mb-4 stroke-[1.5]" />
                    <h3 className="text-white text-xs font-black uppercase tracking-widest">Nenhuma Rotina ou Checklist Ativo</h3>
                    <p className="text-zinc-500 text-[11px] leading-relaxed mt-2 uppercase font-bold tracking-wider">
                        Não existem tarefas cíclicas agendadas para hoje neste checklist ou nenhum checklist de funcionário correspondente aos filtros foi encontrado.
                    </p>
                    <button 
                        onClick={openCreateRoutine}
                        className="mt-6 border border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900/60 text-zinc-350 hover:text-white font-bold uppercase tracking-wider text-[9px] px-4 py-2.5 rounded-lg transition-all"
                    >
                        Criar Novo Checklist
                    </button>
                </div>
            )}

            {/* List of active checklists */}
            {loading ? (
                <div className="text-center py-20 text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em]">
                    Carregando checklists de rotina...
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredRoutines.map(routine => {
                        const isExpanded = expandedRoutines[routine.id] !== false;
                        const isOwner = routine.userId === currentUserId;
                        const userShare = routine.shares?.find((s: any) => s.userId === currentUserId);
                        const isViewer = !isOwner && userShare?.role === "VIEWER";

                        return (
                            <Card key={routine.id} className="bg-zinc-950/40 border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-md transition-all shadow-2xl">
                                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 gap-4">
                                    <div className="space-y-1.5 min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Viewer / Editor Badges */}
                                            {isViewer && (
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded flex items-center gap-1">
                                                    Leitor
                                                </span>
                                            )}
                                            {!isOwner && !isViewer && (
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                    Editor
                                                </span>
                                            )}

                                            {/* Role/Cargo Badge */}
                                            {routine.role && (
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <ShieldAlert className="w-2.5 h-2.5 text-blue-400" /> {routine.role}
                                                </span>
                                            )}


                                        </div>

                                        <h3 className="text-white text-base font-black uppercase tracking-tight truncate leading-tight group">
                                            {routine.title}
                                        </h3>
                                        
                                        {routine.description && (
                                            <p className="text-[11px] text-zinc-500 leading-relaxed font-bold truncate">
                                                {routine.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Checklist metrics and actions */}
                                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                                        <div className="text-left md:text-right space-y-1">
                                            <span className="text-xl font-black text-white tracking-tighter">
                                                {Math.round(routine.progress)}%
                                            </span>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                {routine.completedItems} de {routine.totalItems} Ativas Hoje
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            {isOwner && (
                                                <button 
                                                    onClick={() => {
                                                        setShareRoutineId(routine.id);
                                                        setInviteEmailOrCpf("");
                                                        setInviteRole("VIEWER");
                                                        setShareModalOpen(true);
                                                    }}
                                                    title="Compartilhar"
                                                    className="p-2.5 border border-zinc-800 text-zinc-400 hover:text-primary hover:bg-zinc-900 rounded-lg transition-all"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {!isViewer && (
                                                <button 
                                                    onClick={() => {
                                                        setActiveRoutineForStep(routine.id);
                                                        setIsStepDialogOpen(true);
                                                    }}
                                                    title="Adicionar Passo"
                                                    className="p-2.5 border border-zinc-800 text-zinc-400 hover:text-primary hover:bg-zinc-900 rounded-lg transition-all"
                                                >
                                                    <PlusCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            {!isViewer && (
                                                <button 
                                                    onClick={() => openEditRoutine(routine)}
                                                    title="Editar"
                                                    className="p-2.5 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-lg transition-all"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}
                                            {!isViewer && (
                                                <button 
                                                    onClick={() => handleDeleteRoutine(routine.id)}
                                                    title="Deletar"
                                                    className="p-2.5 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-zinc-900 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setExpandedRoutines(prev => ({
                                                    ...prev,
                                                    [routine.id]: !isExpanded
                                                }))}
                                                className="p-2.5 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-all ml-1"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all duration-500 ease-out" 
                                        style={{ width: `${routine.progress}%` }}
                                    />
                                </div>

                                {/* Expandable steps list */}
                                {isExpanded && (
                                    <div className="p-5 bg-zinc-950/20 divide-y divide-zinc-900/60">
                                        {routine.items.length === 0 ? (
                                            <div className="py-6 text-center text-zinc-550 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                                <Info className="w-4 h-4" /> Nenhuma tarefa ativa para este dia.
                                            </div>
                                        ) : (
                                            routine.items.map((item: any) => (
                                                <div 
                                                    key={item.id} 
                                                    className={cn(
                                                        "flex items-start justify-between py-3.5 gap-4 group transition-colors",
                                                        item.completed && "opacity-60",
                                                        !item.isActiveToday && "opacity-40 bg-zinc-900/5"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3.5 min-w-0">
                                                        <button 
                                                            disabled={isPending || !item.isActiveToday}
                                                            onClick={() => handleToggleItem(routine.id, item.id, !item.completed)}
                                                            className={cn(
                                                                "mt-0.5 shrink-0 hover:scale-105 active:scale-95 transition-transform",
                                                                !item.isActiveToday && "cursor-not-allowed opacity-50 hover:scale-100 active:scale-100"
                                                            )}
                                                        >
                                                            {item.completed ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 stroke-[2.5]" />
                                                            ) : (
                                                                <Square className="w-5 h-5 text-zinc-700 stroke-[2]" />
                                                            )}
                                                        </button>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className={cn(
                                                                    "text-[13px] font-bold text-zinc-200 transition-all",
                                                                    item.completed && "line-through text-zinc-500"
                                                                )}>
                                                                    {item.title}
                                                                </p>
                                                                {/* Frequency Tag */}
                                                                <span className={cn(
                                                                    "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                                                    item.frequency === "DAILY" ? "bg-blue-500/10 text-blue-400 border-blue-500/10" :
                                                                    item.frequency === "WEEKLY" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/10" :
                                                                    item.frequency === "MONTHLY" ? "bg-amber-500/10 text-amber-400 border-amber-500/10" :
                                                                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                                                                )}>
                                                                    {item.frequency === "DAILY" ? "Diária" :
                                                                     item.frequency === "WEEKLY" ? "Semanal" :
                                                                     item.frequency === "MONTHLY" ? "Mensal" : "Periódica"}
                                                                </span>

                                                                {/* Inactive tag & days representation */}
                                                                {!item.isActiveToday && (
                                                                    <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border bg-red-950/20 text-red-400 border-red-500/10">
                                                                        Inativo Hoje
                                                                    </span>
                                                                )}

                                                                {(() => {
                                                                    if (!item.scheduleDays) return null;
                                                                    try {
                                                                        const days = JSON.parse(item.scheduleDays);
                                                                        if (!Array.isArray(days) || days.length === 0) return null;
                                                                        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                                                                        if (item.frequency === "DAILY" || item.frequency === "WEEKLY") {
                                                                            return (
                                                                                <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border bg-zinc-900 text-zinc-550 border-zinc-800">
                                                                                    Dias: {days.map(d => dayNames[d]).join(", ")}
                                                                                </span>
                                                                            );
                                                                        }
                                                                        if (item.frequency === "MONTHLY") {
                                                                            return (
                                                                                <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border bg-zinc-900 text-zinc-550 border-zinc-800">
                                                                                    Dias: {days.join(", ")}
                                                                                </span>
                                                                            );
                                                                        }
                                                                    } catch {}
                                                                    return null;
                                                                })()}

                                                                {item.timeOfDay && (
                                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                        <Clock className="w-2.5 h-2.5" /> {item.timeOfDay}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-[11px] text-zinc-500 mt-0.5 font-bold leading-normal">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Delete Step Button */}
                                                    {!isViewer && (
                                                        <button 
                                                            onClick={() => handleDeleteStep(item.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-red-500 hover:bg-zinc-900 rounded-md transition-all shrink-0"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}

                                        {/* Execution Notes Section */}
                                        <div className="pt-5 mt-2 flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-450 flex items-center gap-1.5">
                                                    <ClipboardList className="w-3.5 h-3.5" /> Notas de Auditoria / Observações
                                                </p>
                                                {editingNotesRoutineId !== routine.id ? (
                                                    <button 
                                                        onClick={() => {
                                                            setEditingNotesRoutineId(routine.id);
                                                            setRoutineNotesTemp(routine.notes || "");
                                                        }}
                                                        className="text-[9px] font-black uppercase tracking-wider text-primary hover:underline"
                                                    >
                                                        {routine.notes ? "Editar Notas" : "+ Adicionar Nota"}
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleSaveExecutionNotes(routine.id)}
                                                            className="text-[9px] font-black uppercase tracking-wider text-emerald-400 hover:underline flex items-center gap-1"
                                                        >
                                                            <Save className="w-2.5 h-2.5" /> Salvar
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingNotesRoutineId(null)}
                                                            className="text-[9px] font-black uppercase tracking-wider text-red-500 hover:underline"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {editingNotesRoutineId === routine.id ? (
                                                <Textarea 
                                                    value={routineNotesTemp}
                                                    onChange={(e) => setRoutineNotesTemp(e.target.value)}
                                                    placeholder="Digite as observações sobre a execução deste checklist neste dia específico..."
                                                    className="w-full bg-zinc-900 border-zinc-800 text-white text-xs py-2 px-3 focus:border-primary/50"
                                                    rows={2}
                                                />
                                            ) : (
                                                <p className={cn(
                                                    "text-[11px] font-semibold italic rounded-lg p-3 border",
                                                    routine.notes ? "bg-zinc-900/30 border-zinc-900 text-zinc-400" : "bg-transparent border-dashed border-zinc-900 text-zinc-600 text-center uppercase tracking-widest font-black text-[9px] py-4"
                                                )}>
                                                    {routine.notes || "Nenhuma observação registrada para este dia."}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Dialog 1: Nova / Editar Rotina */}
            <Dialog open={isRoutineDialogOpen} onOpenChange={setIsRoutineDialogOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 max-w-lg rounded-2xl shadow-2xl p-6 outline-none">
                    <DialogHeader>
                        <DialogTitle className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" /> {editingRoutine ? "Editar Checklist" : "Novo Checklist por Pessoa/Função"}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                            Defina o identificador do checklist e o cargo ou colaborador associado para auditorias rápidas.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Título do Checklist *</Label>
                            <Input 
                                value={routineTitle}
                                onChange={(e) => setRoutineTitle(e.target.value)}
                                placeholder="Ex: Checklist do João, Rotina de Vendas"
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-650 focus:border-primary/40 focus:ring-0 text-xs py-5.5 font-bold uppercase tracking-wider"
                            />
                        </div>

                        {/* Role (Cargo) */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Função / Cargo (Opcional)</Label>
                            <Input 
                                value={routineRole}
                                onChange={(e) => setRoutineRole(e.target.value)}
                                placeholder="Ex: Vendedor, Supervisor de TI, Suporte"
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-650 focus:border-primary/40 focus:ring-0 text-xs py-5 font-bold uppercase tracking-wider"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Descrição / Instruções</Label>
                            <Textarea 
                                value={routineDescription}
                                onChange={(e) => setRoutineDescription(e.target.value)}
                                placeholder="Descreva brevemente a finalidade deste agrupador de rotinas..."
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-650 focus:border-primary/40 focus:ring-0 text-xs"
                                rows={2}
                            />
                        </div>


                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-zinc-900/80 pt-5 mt-4 w-full">
                        <button 
                            type="button"
                            onClick={() => setIsRoutineDialogOpen(false)}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white font-black uppercase tracking-wider text-[10px] px-5 py-3 rounded-lg transition-all active:scale-95 cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button"
                            onClick={handleSaveRoutine}
                            className="bg-white hover:bg-zinc-200 text-zinc-950 font-black uppercase tracking-wider text-[10px] px-5 py-3 rounded-lg transition-all active:scale-95 shadow-lg shadow-white/5 cursor-pointer"
                        >
                            {editingRoutine ? "Salvar Alterações" : "Criar Checklist"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog 2: Adicionar Passo ao Checklist com Recorrência */}
            <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 max-w-lg rounded-2xl shadow-2xl p-6 outline-none">
                    <DialogHeader>
                        <DialogTitle className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-primary" /> Adicionar Tarefa Cíclica ao Checklist
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                            Insira uma tarefa configurando sua recorrência específica.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
                        {/* Step Title */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nome da Tarefa *</Label>
                            <Input 
                                value={stepTitle}
                                onChange={(e) => setStepTitle(e.target.value)}
                                placeholder="Ex: Verificar chaves de segurança, Backup semanal"
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-650 focus:border-primary/40 focus:ring-0 text-xs py-5 font-bold uppercase tracking-wider"
                            />
                        </div>

                        {/* Step Description */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Instruções de Execução (Opcional)</Label>
                            <Textarea 
                                value={stepDescription}
                                onChange={(e) => setStepDescription(e.target.value)}
                                placeholder="Detalhes ou passos de como executar essa tarefa..."
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-650 focus:border-primary/40 focus:ring-0 text-xs"
                                rows={2}
                            />
                        </div>

                        {/* Step Time */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Horário Sugerido (Opcional)</Label>
                            <Input 
                                type="text"
                                value={stepTime}
                                onChange={(e) => setStepTime(e.target.value)}
                                placeholder="Ex: 08:30, 18:00"
                                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-650 focus:border-primary/40 focus:ring-0 text-xs py-5"
                            />
                        </div>

                        {/* Frequency selection */}
                        <div className="space-y-1.5 border-t border-zinc-900 pt-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recorrência / Frequência</Label>
                            <select
                                value={stepFrequency}
                                onChange={(e) => setStepFrequency(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-3 py-2.5 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-primary/40"
                            >
                                <option value="DAILY">DIÁRIA (TODO DIA OU DIAS DA SEMANA)</option>
                                <option value="WEEKLY">SEMANAL (UMA VEZ POR SEMANA)</option>
                                <option value="BIWEEKLY">QUINZENAL (A CADA 14 DIAS)</option>
                                <option value="MONTHLY">MENSAL (DADOS FIXOS NO MÊS)</option>
                                <option value="BIMONTHLY">BIMESTRAL (A CADA 2 MESES)</option>
                                <option value="QUARTERLY">TRIMESTRAL (A CADA 3 MESES)</option>
                                <option value="SEMESTERLY">SEMESTRAL (A CADA 6 MESES)</option>
                                <option value="SPORADIC">ESPORÁDICA (DATAS ESPECÍFICAS)</option>
                            </select>
                        </div>

                        {/* Recurrence data based on selection */}
                        {(stepFrequency === "DAILY" || stepFrequency === "WEEKLY") && (
                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Dias da Semana Aplicáveis</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: "Seg", val: 1 },
                                        { label: "Ter", val: 2 },
                                        { label: "Qua", val: 3 },
                                        { label: "Qui", val: 4 },
                                        { label: "Sex", val: 5 },
                                        { label: "Sáb", val: 6 },
                                        { label: "Dom", val: 0 }
                                    ].map(day => {
                                        const isSelected = selectedWeekdays.includes(day.val);
                                        return (
                                            <button
                                                key={day.val}
                                                type="button"
                                                onClick={() => toggleWeekday(day.val)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider border transition-all",
                                                    isSelected 
                                                        ? "bg-primary text-zinc-950 border-primary" 
                                                        : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                                                )}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {stepFrequency === "MONTHLY" && (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Dias do Mês (Separados por vírgula)</Label>
                                <Input 
                                    value={monthlyDays}
                                    onChange={(e) => setMonthlyDays(e.target.value)}
                                    placeholder="Ex: 10, 20, 30"
                                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-650 focus:border-primary/40 text-xs py-5"
                                />
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">Deixe em branco para rodar no mesmo dia da criação da tarefa.</p>
                            </div>
                        )}

                        {stepFrequency === "SPORADIC" && (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Datas Específicas (Separadas por vírgula, YYYY-MM-DD)</Label>
                                <Input 
                                    value={monthlyDays}
                                    onChange={(e) => setMonthlyDays(e.target.value)}
                                    placeholder="Ex: 2026-06-15, 2026-07-20"
                                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-650 focus:border-primary/40 text-xs py-5"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-zinc-900/80 pt-5 mt-4 w-full">
                        <button 
                            type="button"
                            onClick={() => setIsStepDialogOpen(false)}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white font-black uppercase tracking-wider text-[10px] px-5 py-3 rounded-lg transition-all active:scale-95 cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button"
                            onClick={handleSaveStep}
                            className="bg-white hover:bg-zinc-200 text-zinc-950 font-black uppercase tracking-wider text-[10px] px-5 py-3 rounded-lg transition-all active:scale-95 shadow-lg shadow-white/5 cursor-pointer"
                        >
                            Salvar Tarefa
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ConfirmModal for Routine Group Deletion */}
            <ConfirmModal 
                isOpen={routineToDelete !== null}
                onOpenChange={(open) => !open && setRoutineToDelete(null)}
                onConfirm={executeDeleteRoutine}
                title="Deseja excluir este checklist?"
                description="Esta ação removerá permanentemente o checklist, todas as suas tarefas recorrentes e os históricos de auditoria associados."
                confirmText="Excluir Checklist"
            />

            {/* ConfirmModal for Step Deletion */}
            <ConfirmModal 
                isOpen={stepToDelete !== null}
                onOpenChange={(open) => !open && setStepToDelete(null)}
                onConfirm={executeDeleteStep}
                title="Deseja remover esta tarefa?"
                description="A tarefa cíclica será excluída permanentemente deste checklist."
                confirmText="Remover"
            />

            {/* Dialog for Sharing */}
            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-300 max-w-lg rounded-2xl shadow-2xl p-6 outline-none">
                    <DialogHeader>
                        <DialogTitle className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-primary" />
                            Compartilhar Checklist
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                            Compartilhe este checklist como Editor ou apenas Visualizador (Leitor).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Convidar Pessoa</label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="CPF ou E-mail da pessoa"
                                    value={inviteEmailOrCpf}
                                    onChange={e => setInviteEmailOrCpf(e.target.value)}
                                    className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm uppercase placeholder:text-zinc-650"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="shrink-0 bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-xs font-bold uppercase tracking-widest">
                                            {inviteRole === "VIEWER" ? "Ver" : "Editar"}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                        <DropdownMenuItem onClick={() => setInviteRole("VIEWER")} className="text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-zinc-850">
                                            Apenas Visualizar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setInviteRole("EDITOR")} className="text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-zinc-850">
                                            Pode Editar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Pessoas com Acesso</label>
                            {(() => {
                                const activeRoutine = routines.find(r => r.id === shareRoutineId);
                                if (!activeRoutine || !activeRoutine.shares || activeRoutine.shares.length === 0) {
                                    return (
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold p-3 bg-zinc-900/30 rounded border border-zinc-900 text-center">
                                            Apenas você tem acesso.
                                        </p>
                                    );
                                }
                                return (
                                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                                        {activeRoutine.shares.map((share: any) => (
                                            <div key={share.id} className="flex items-center justify-between p-2 bg-zinc-900/40 rounded border border-zinc-900">
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                                        <Users className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-xs font-bold text-white truncate">{share.user?.name}</p>
                                                        <p className="text-[9px] uppercase tracking-widest text-zinc-500 truncate">{share.user?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    <select
                                                        value={share.role}
                                                        onChange={async (e) => {
                                                            const newRole = e.target.value as "VIEWER" | "EDITOR";
                                                            const res = await shareRoutine(shareRoutineId!, share.user.email || share.user.document, newRole);
                                                            if (res.success) {
                                                                toast({
                                                                    title: "Permissão atualizada!",
                                                                    description: "Permissão atualizada com sucesso."
                                                                });
                                                                fetchRoutines(selectedDate);
                                                            } else {
                                                                toast({
                                                                    title: "Erro ao atualizar permissão",
                                                                    description: res.error || "Ocorreu um erro.",
                                                                    variant: "destructive"
                                                                });
                                                            }
                                                        }}
                                                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide focus:outline-none cursor-pointer"
                                                    >
                                                        <option value="VIEWER">Leitor</option>
                                                        <option value="EDITOR">Editor</option>
                                                    </select>

                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="w-5 h-5 text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                                                        onClick={() => handleUnshare(share.userId)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-zinc-900/80 pt-5 mt-4 w-full">
                        <button 
                            type="button"
                            onClick={() => setShareModalOpen(false)}
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white font-black uppercase tracking-wider text-[10px] px-5 py-3 rounded-lg transition-all active:scale-95 cursor-pointer"
                        >
                            Fechar
                        </button>
                        <button 
                            type="button"
                            disabled={!inviteEmailOrCpf.trim() || isSharingPending}
                            onClick={handleShare}
                            className="bg-white hover:bg-zinc-200 text-zinc-950 font-black uppercase tracking-wider text-[10px] px-5 py-3 rounded-lg transition-all active:scale-95 shadow-lg shadow-white/5 cursor-pointer disabled:opacity-50"
                        >
                            {isSharingPending ? "Compartilhando..." : "Compartilhar"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
