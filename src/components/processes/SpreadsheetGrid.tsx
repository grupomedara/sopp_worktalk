"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Plus, Trash2, Calendar, User, Sparkles, 
    ChevronDown, Settings, CheckCircle2, Circle, AlertCircle, 
    MoreHorizontal, Columns, Phone, Mail, 
    Type, Hash, CheckSquare, PlusCircle, Check, ArrowUpDown, ChevronUp,
    FileSpreadsheet
} from "lucide-react";
import { 
    updateList, createListTask, updateListTask, deleteListTask, instantiateTemplate,
    duplicateList, getSpaces
} from "@/app/actions/processes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/** Parse a date value from DB without UTC offset shift.
 *  Prisma returns DateTime as a JS Date (UTC midnight for date-only values stored without time).
 *  Converting to local ISO string and slicing avoids the -N hour offset bug.
 */
function parseLocalDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    const d = typeof value === "string" ? value : value.toISOString();
    // Take yyyy-MM-dd part and parse as local date (midnight local time)
    const [year, month, day] = d.split("T")[0].split("-").map(Number);
    return new Date(year, month - 1, day);
}
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface SpreadsheetGridProps {
    list: any;
    currentUserId?: string;
}

export function SpreadsheetGrid({ list, currentUserId }: SpreadsheetGridProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeView, setActiveView] = useState<"spreadsheet" | "kanban" | "gantt">("spreadsheet");

    const isOwner = list.space?.userId === currentUserId;
    const spaceShares = list.space?.shares || [];
    const userShare = spaceShares.find((s: any) => s.userId === currentUserId);
    const isViewer = !isOwner && userShare?.role === "VIEWER";

    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (dateVal: any) => {
        if (!dateVal) return "—";
        try {
            const d = new Date(dateVal);
            return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        } catch (e) {
            return "—";
        }
    };

    const getDurationText = (startedAt: any, completedAt: any, status: string) => {
        if (!startedAt) return "—";
        const start = new Date(startedAt);
        const end = completedAt ? new Date(completedAt) : now;
        
        if (!completedAt && status !== "IN_PROGRESS") {
            return "—";
        }
        
        const diffMs = end.getTime() - start.getTime();
        if (diffMs < 0) return "0s";
        
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays}d ${diffHours % 24}h`;
        }
        if (diffHours > 0) {
            return `${diffHours}h ${diffMins % 60}m`;
        }
        if (diffMins > 0) {
            return `${diffMins}m ${diffSecs % 60}s`;
        }
        return `${diffSecs}s`;
    };

    // Inline task creation inputs
    const [quickTitleByStatus, setQuickTitleByStatus] = useState<Record<string, string>>({});

    // Dialog States
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
    const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");
    const [newColumnType, setNewColumnType] = useState("dropdown");
    const [newColumnOptions, setNewColumnOptions] = useState("");
    const [cloneName, setCloneName] = useState(`${list.name} - Cópia`);
    const [spaces, setSpaces] = useState<any[]>([]);
    const [targetSpaceId, setTargetSpaceId] = useState(list.spaceId);
    const [targetFolderId, setTargetFolderId] = useState<string | null>(list.folderId);

    // Fetch spaces to support copying to other spaces
    useEffect(() => {
        const fetchSpaces = async () => {
            const res = await getSpaces();
            if (res.success && res.data) {
                setSpaces(res.data);
            }
        };
        fetchSpaces();
    }, []);

    // Reset target space and folder when cloning modal is toggled
    useEffect(() => {
        if (isCloneDialogOpen) {
            setTargetSpaceId(list.spaceId);
            setTargetFolderId(list.folderId);
        }
    }, [isCloneDialogOpen, list]);

    // Column Edit States
    const [editColumnId, setEditColumnId] = useState<string | null>(null);
    const [editColumnName, setEditColumnName] = useState("");
    const [editColumnType, setEditColumnType] = useState("dropdown");
    const [editColumnOptions, setEditColumnOptions] = useState("");
    const [isEditColumnDialogOpen, setIsEditColumnDialogOpen] = useState(false);

    // Active editing cells state (tracking cellId: "taskId-fieldId")
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");

    // Confirm Delete States
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
    const [isConfirmDeleteColumnOpen, setIsConfirmDeleteColumnOpen] = useState(false);
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ column: string, direction: "asc" | "desc" } | null>(null);

    const handleSort = (column: string) => {
        if (sortConfig && sortConfig.column === column) {
            if (sortConfig.direction === "asc") {
                setSortConfig({ column, direction: "desc" });
            } else {
                setSortConfig(null);
            }
        } else {
            setSortConfig({ column, direction: "asc" });
        }
    };

    const renderSortIcon = (column: string) => {
        if (sortConfig?.column !== column) {
            return <ArrowUpDown className="w-3 h-3 ml-1.5 opacity-0 group-hover/th:opacity-50 transition-opacity" />;
        }
        return sortConfig.direction === "asc" ? (
            <ChevronUp className="w-3 h-3 ml-1.5 text-indigo-400" />
        ) : (
            <ChevronDown className="w-3 h-3 ml-1.5 text-indigo-400" />
        );
    };

    // Custom Fields Configuration (bulletproof parsing for arrays/JSON strings)
    const customFields = (() => {
        if (!list.customFieldsConfig) return [];
        if (Array.isArray(list.customFieldsConfig)) return list.customFieldsConfig as any[];
        if (typeof list.customFieldsConfig === "string") {
            try {
                const parsed = JSON.parse(list.customFieldsConfig);
                if (Array.isArray(parsed)) return parsed as any[];
            } catch (e) {
                console.error("Failed to parse customFieldsConfig:", e);
            }
        }
        return [];
    })();

    // Group tasks by status
    const statusGroups = [
        { id: "PENDING", name: "Pendente", color: "text-zinc-400 bg-zinc-900 border-zinc-800", icon: Circle },
        { id: "IN_PROGRESS", name: "Em Progresso", color: "text-blue-400 bg-blue-950/20 border-blue-500/20", icon: AlertCircle },
        { id: "COMPLETED", name: "Concluído", color: "text-emerald-400 bg-emerald-950/20 border-emerald-500/20", icon: CheckCircle2 }
    ];

    const getGroupTasks = (statusId: string) => {
        let tasks = list.tasks.filter((t: any) => t.status === statusId);

        if (sortConfig) {
            tasks.sort((a: any, b: any) => {
                let aValue = a[sortConfig.column];
                let bValue = b[sortConfig.column];
                
                // Responsável name sort
                if (sortConfig.column === "responsible") {
                    aValue = a.responsible?.name || "";
                    bValue = b.responsible?.name || "";
                }

                // Prioridade string representation (to match the UI logic visually?)
                // Just use the enum string value for simplicity: HIGH, LOW, NORMAL, URGENT
                
                // If it's a custom field
                if (sortConfig.column.startsWith("custom_")) {
                    const fieldId = sortConfig.column.replace("custom_", "");
                    aValue = (a.customFieldValues as any)?.[fieldId];
                    bValue = (b.customFieldValues as any)?.[fieldId];
                }

                if (aValue === bValue) return 0;
                if (aValue === null || aValue === undefined || aValue === "") return 1;
                if (bValue === null || bValue === undefined || bValue === "") return -1;

                if (sortConfig.column === "date" || sortConfig.column === "startedAt" || sortConfig.column === "completedAt") {
                    aValue = aValue ? new Date(aValue).getTime() : 0;
                    bValue = bValue ? new Date(bValue).getTime() : 0;
                }

                if (typeof aValue === "string" && typeof bValue === "string") {
                    const comparison = aValue.localeCompare(bValue);
                    return sortConfig.direction === "asc" ? comparison : -comparison;
                }

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return tasks;
    };

    // Handler to create a quick task
    const handleQuickCreate = async (statusId: string) => {
        const title = quickTitleByStatus[statusId];
        if (!title || !title.trim()) return;

        const res = await createListTask(list.id, title, "NORMAL", {});
        if (res.success) {
            // If the status we created is not pending, immediately update its status!
            if (statusId !== "PENDING" && res.data) {
                await updateListTask(res.data.id, { status: statusId as any });
            }
            setQuickTitleByStatus(prev => ({ ...prev, [statusId]: "" }));
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao criar");
        }
    };

    // Handler to update standard fields inline
    const handleUpdateTaskField = async (taskId: string, field: string, value: any) => {
        const updateData: any = {};
        updateData[field] = value;
        const res = await updateListTask(taskId, updateData);
        if (res.success) {
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao salvar");
        }
    };

    // Handler to update dynamic custom fields inline
    const handleUpdateCustomField = async (taskId: string, task: any, fieldId: string, value: any) => {
        const currentValues = (task.customFieldValues as Record<string, any>) || {};
        const updatedValues = { ...currentValues, [fieldId]: value };
        
        const res = await updateListTask(taskId, { customFieldValues: updatedValues });
        if (res.success) {
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao salvar");
        }
    };

    // Handler to delete a task row
    const handleDeleteRow = async (taskId: string) => {
        const res = await deleteListTask(taskId);
        if (res.success) {
            toast.success("Linha excluída!");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao excluir");
        }
    };

    // Add a custom field column definition
    const handleAddColumn = async () => {
        if (!newColumnName.trim()) {
            toast.error("Por favor, informe o nome da coluna!");
            return;
        }

        const parsedOptions = newColumnType === "dropdown" 
            ? newColumnOptions.split(",").map(o => o.trim()).filter(Boolean)
            : [];

        const newField = {
            id: newColumnName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            name: newColumnName,
            type: newColumnType,
            options: parsedOptions
        };

        const updatedConfig = [...customFields, newField];
        const res = await updateList(list.id, list.name, updatedConfig);
        if (res.success) {
            toast.success("Coluna adicionada!");
            setIsColumnDialogOpen(false);
            setNewColumnName("");
            setNewColumnOptions("");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao adicionar");
        }
    };

    // Remove a custom field column
    const handleRemoveColumn = async (fieldId: string) => {
        const updatedConfig = customFields.filter(f => f.id !== fieldId);
        const res = await updateList(list.id, list.name, updatedConfig);
        if (res.success) {
            toast.success("Coluna removida!");
            startTransition(() => router.refresh());
        }
    };

    const handleStartEditColumn = (field: any) => {
        setEditColumnId(field.id);
        setEditColumnName(field.name);
        setEditColumnType(field.type);
        setEditColumnOptions(field.options ? field.options.join(", ") : "");
        setIsEditColumnDialogOpen(true);
    };

    const handleSaveEditColumn = async () => {
        if (!editColumnId) return;
        if (!editColumnName.trim()) {
            toast.error("Por favor, informe o nome da coluna!");
            return;
        }

        const parsedOptions = editColumnType === "dropdown"
            ? editColumnOptions.split(",").map(o => o.trim()).filter(Boolean)
            : [];

        const updatedConfig = customFields.map(f => {
            if (f.id === editColumnId) {
                return {
                    ...f,
                    name: editColumnName,
                    type: editColumnType,
                    options: parsedOptions
                };
            }
            return f;
        });

        const res = await updateList(list.id, list.name, updatedConfig);
        if (res.success) {
            toast.success("Coluna atualizada!");
            setIsEditColumnDialogOpen(false);
            setEditColumnId(null);
            setEditColumnName("");
            setEditColumnOptions("");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao atualizar coluna");
        }
    };

    // Instantiate / Clone Template list
    const handleInstantiate = async () => {
        if (!cloneName.trim()) return;
        
        let res;
        if (list.isTemplate && targetSpaceId === list.spaceId && targetFolderId === list.folderId) {
            res = await instantiateTemplate(list.id, cloneName, targetSpaceId, targetFolderId);
        } else {
            res = await duplicateList(list.id, cloneName, targetSpaceId, targetFolderId);
        }
        
        if (res.success) {
            toast.success(list.isTemplate ? "Checklist instanciada!" : "Checklist duplicada!");
            setIsCloneDialogOpen(false);
            startTransition(() => {
                router.refresh();
                if (res.data) {
                    router.push(`/processes/${res.data.id}`);
                }
            });
        } else {
            toast.error(res.error || "Erro ao duplicar");
        }
    };

    const priorities = [
        { label: "Urgente", value: "URGENT", color: "bg-red-500/20 text-red-400 border-red-500/30" },
        { label: "Alta", value: "HIGH", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
        { label: "Normal", value: "NORMAL", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
        { label: "Baixa", value: "LOW", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
    ];

    const getPriorityObj = (val: string) => {
        return priorities.find(p => p.value === val) || priorities[2];
    };

    const dropdownColors = [
        "bg-zinc-800 text-zinc-300 border-zinc-700",
        "bg-blue-500/20 text-blue-400 border-blue-500/30",
        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        "bg-amber-500/20 text-amber-400 border-amber-500/30",
        "bg-orange-500/20 text-orange-400 border-orange-500/30",
        "bg-red-500/20 text-red-400 border-red-500/30",
        "bg-pink-500/20 text-pink-400 border-pink-500/30",
        "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    ];

    const getDropdownBadgeColor = (val: string, index: number) => {
        let hash = 0;
        for (let i = 0; i < val.length; i++) hash = val.charCodeAt(i) + ((hash << 5) - hash);
        return dropdownColors[Math.abs(hash) % dropdownColors.length];
    };

    const getGanttRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find min/max dates from tasks
        let minDate = new Date(today);
        minDate.setDate(minDate.getDate() - 3); // 3 days before today

        let maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 11); // 11 days after today

        const tasks = list.tasks || [];
        tasks.forEach((t: any) => {
            if (t.createdAt) {
                const cDate = new Date(t.createdAt);
                cDate.setHours(0, 0, 0, 0);
                if (cDate < minDate) {
                    minDate = cDate;
                }
            }
            if (t.date) {
                const dDate = new Date(t.date);
                dDate.setHours(0, 0, 0, 0);
                if (dDate > maxDate) {
                    maxDate = dDate;
                }
            }
        });

        // Restrict range to max 30 days to avoid UI overflow
        const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
            maxDate = new Date(minDate);
            maxDate.setDate(maxDate.getDate() + 30);
        }

        const daysArray: Date[] = [];
        let current = new Date(minDate);
        while (current <= maxDate) {
            daysArray.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return daysArray;
    };

    const renderKanbanView = () => {
        const tasks = list.tasks || [];
        if (tasks.length === 0) {
            return (
                <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center bg-zinc-950/20">
                    <Columns className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Nenhuma tarefa cadastrada nesta checklist</p>
                </div>
            );
        }

        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
        };

        const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
            e.preventDefault();
            if (isViewer) return;
            const taskId = e.dataTransfer.getData("taskId");
            if (!taskId) return;

            const task = tasks.find((t: any) => t.id === taskId);
            if (task && task.status !== targetStatus) {
                const res = await updateListTask(taskId, { status: targetStatus as any });
                if (res.success) {
                    toast.success("Status atualizado!");
                    startTransition(() => router.refresh());
                } else {
                    toast.error(res.error || "Erro ao atualizar status");
                }
            }
        };

        const handleDragStart = (e: React.DragEvent, taskId: string) => {
            if (isViewer) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData("taskId", taskId);
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[500px]">
                {statusGroups.map(group => {
                    const groupTasks = getGroupTasks(group.id);
                    return (
                        <div 
                            key={group.id} 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, group.id)}
                            className="flex flex-col bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 space-y-3 min-h-[400px] backdrop-blur-sm"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        group.id === "PENDING" && "bg-zinc-500",
                                        group.id === "IN_PROGRESS" && "bg-blue-500",
                                        group.id === "COMPLETED" && "bg-emerald-500"
                                    )} />
                                    <h4 className="font-bold text-[10px] uppercase tracking-widest text-zinc-350">{group.name}</h4>
                                </div>
                                <span className="text-[9px] font-black bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-zinc-500">
                                    {groupTasks.length}
                                </span>
                            </div>

                            {/* Column Tasks */}
                            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[600px] no-scrollbar">
                                {groupTasks.length === 0 ? (
                                    <div className="h-full border border-dashed border-zinc-800/40 rounded-lg flex items-center justify-center p-8 text-center">
                                        <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-650">Arraste tarefas aqui</p>
                                    </div>
                                ) : (
                                    groupTasks.map((task: any) => {
                                                                                const pObj = getPriorityObj(task.priority);
                                        const hasDueDate = !!task.date;
                                        const parsedDate = parseLocalDate(task.date);
                                        const isOverdue = hasDueDate && parsedDate && parsedDate < new Date() && task.status !== "COMPLETED";

                                        return (
                                            <div
                                                key={task.id}
                                                draggable={!isViewer}
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                className={cn(
                                                    "group p-3 rounded-lg border bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all select-none",
                                                    !isViewer && "cursor-grab active:cursor-grabbing"
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className={cn(
                                                        "text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 border rounded-md",
                                                        pObj.color
                                                    )}>
                                                        {pObj.label}
                                                    </span>
                                                </div>

                                                <h5 className="text-[11px] font-bold text-zinc-250 leading-tight break-words uppercase tracking-wide">
                                                    {task.title}
                                                </h5>

                                                {hasDueDate && (
                                                    <div className="mt-3 pt-2 border-t border-zinc-800/40 flex items-center justify-between">
                                                        <div className="flex items-center gap-1 text-[8px] text-zinc-500">
                                                            <Calendar className="w-2.5 h-2.5" />
                                                            <span>
                                                                {format(parsedDate!, "dd/MM/yyyy")}
                                                            </span>
                                                        </div>
                                                        {isOverdue && (
                                                            <span className="text-[7px] font-bold text-red-400 bg-red-950/20 border border-red-500/10 px-1 rounded uppercase tracking-widest">
                                                                Atrasada
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderGanttView = () => {
        const tasks = list.tasks || [];
        if (tasks.length === 0) {
            return (
                <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center bg-zinc-950/20">
                    <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Nenhuma tarefa cadastrada nesta checklist</p>
                </div>
            );
        }

        const days = getGanttRange();
        const minDate = days[0];

        return (
            <div className="flex border border-zinc-800 rounded-xl bg-zinc-950/40 backdrop-blur-md overflow-hidden">
                {/* Left Task Column - Fixed Width */}
                <div className="w-56 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950/60 z-10">
                    <div className="h-12 border-b border-zinc-800 flex items-center px-4">
                        <span className="text-[9px] uppercase font-black tracking-wider text-zinc-500">Tarefa</span>
                    </div>
                    <div className="flex-1 divide-y divide-zinc-900/40">
                        {tasks.map((task: any) => (
                            <div key={task.id} className="h-12 flex items-center px-4 min-w-0">
                                <span className="text-[10px] uppercase font-bold text-zinc-300 truncate" title={task.title}>
                                    {task.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Scrollable Timeline Grid */}
                <div className="flex-1 overflow-x-auto no-scrollbar">
                    <div className="min-w-max flex flex-col" style={{ width: days.length * 64 }}>
                        {/* Days Header */}
                        <div className="h-12 border-b border-zinc-800 flex bg-zinc-950/20">
                            {days.map((day, i) => {
                                const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                                return (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "w-16 h-full shrink-0 flex flex-col items-center justify-center border-r border-zinc-900/50 select-none",
                                            isToday && "bg-amber-500/10 text-amber-400 font-black"
                                        )}
                                    >
                                        <span className="text-[8px] uppercase text-zinc-500 font-bold">
                                            {format(day, "eee", { locale: ptBR })}
                                        </span>
                                        <span className="text-[10px] font-bold leading-none mt-0.5">
                                            {format(day, "dd")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Rows area */}
                        <div className="flex-1 divide-y divide-zinc-900/40 relative">
                            {tasks.map((task: any) => {
                                const taskStart = task.createdAt ? new Date(task.createdAt) : new Date();
                                taskStart.setHours(0, 0, 0, 0);

                                const taskEnd = task.date ? new Date(task.date) : new Date(taskStart);
                                taskEnd.setHours(23, 59, 59, 999);

                                const diffStartMs = taskStart.getTime() - minDate.getTime();
                                const startOffsetDays = Math.max(0, Math.floor(diffStartMs / (1000 * 60 * 60 * 24)));

                                const diffDurationMs = taskEnd.getTime() - taskStart.getTime();
                                const durationDays = Math.max(1, Math.ceil(diffDurationMs / (1000 * 60 * 60 * 24)));

                                const isNoDeadline = !task.date;
                                
                                return (
                                    <div key={task.id} className="relative h-12 flex items-center">
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {days.map((_, i) => (
                                                <div key={i} className="w-16 h-full shrink-0 border-r border-zinc-900/10" />
                                            ))}
                                        </div>

                                        <div 
                                            className={cn(
                                                "absolute h-7 rounded-lg border flex items-center justify-between px-2.5 shadow-md group/bar transition-all select-none hover:scale-[1.02]",
                                                task.status === "COMPLETED" && "bg-emerald-950/40 border-emerald-500/20 text-emerald-400",
                                                task.status === "IN_PROGRESS" && "bg-blue-950/40 border-blue-500/20 text-blue-400",
                                                task.status === "PENDING" && "bg-zinc-900 border-zinc-800 text-zinc-400",
                                                isNoDeadline && "border-dashed"
                                            )}
                                            style={{
                                                left: startOffsetDays * 64 + 4,
                                                width: Math.min(days.length - startOffsetDays, durationDays) * 64 - 8
                                            }}
                                        >
                                            <span className="text-[8px] font-black uppercase tracking-wider truncate mr-1">
                                                {task.status === "COMPLETED" ? "Pronto" : task.status === "IN_PROGRESS" ? "Fazer" : "Pend"}
                                            </span>

                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:flex flex-col bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-2xl z-50 min-w-[180px] pointer-events-none text-white">
                                                <span className="text-[9px] uppercase tracking-wider font-black text-white leading-normal border-b border-zinc-850 pb-1.5 mb-1.5">{task.title}</span>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[7px] uppercase font-bold text-zinc-550">
                                                        <span>Início:</span>
                                                        <span className="text-zinc-300">{format(taskStart, "dd/MM/yyyy")}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[7px] uppercase font-bold text-zinc-550">
                                                        <span>Prazo:</span>
                                                        <span className="text-zinc-350">{task.date ? format(new Date(task.date), "dd/MM/yyyy") : "Sem Prazo"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-zinc-800 rounded-xl bg-zinc-950/40 backdrop-blur-md gap-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{list.space?.name}</span>
                        {list.folder && (
                            <>
                                <span className="text-zinc-700 text-xs">/</span>
                                <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">{list.folder?.name}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <h3 className="text-xl font-bold uppercase tracking-tight text-white">{list.name}</h3>
                        {list.isTemplate && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 uppercase tracking-widest font-black text-[8px] h-4">
                                Modelo Procedimento
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Instantiation Trigger for Templates */}
                    {!isViewer && (
                        list.isTemplate ? (
                            <Button 
                                onClick={() => setIsCloneDialogOpen(true)}
                                className="bg-white text-black hover:bg-zinc-200 font-bold uppercase text-[10px] tracking-widest h-9"
                            >
                                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Instanciar Checklist
                            </Button>
                        ) : (
                            <Button 
                                variant="outline"
                                onClick={() => {
                                    setIsCloneDialogOpen(true);
                                    setCloneName(`${list.name} - Copiar`);
                                }}
                                className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 font-bold uppercase text-[10px] tracking-widest h-9"
                            >
                                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Duplicar
                            </Button>
                        )
                    )}

                    {!isViewer && (
                        <Button 
                            variant="outline"
                            onClick={() => setIsColumnDialogOpen(true)}
                            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 font-bold uppercase text-[10px] tracking-widest h-9"
                        >
                            <Columns className="mr-1.5 h-3.5 w-3.5" /> Adicionar Coluna
                        </Button>
                    )}
                </div>
            </div>

            {/* View Selector Tabs */}
            <div className="flex border-b border-zinc-800/80 gap-1 pb-1">
                {[
                    { id: "spreadsheet", name: "Planilha", icon: FileSpreadsheet },
                    { id: "kanban", name: "Quadro Kanban", icon: Columns },
                    { id: "gantt", name: "Cronograma Gantt", icon: Calendar }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id as "spreadsheet" | "kanban" | "gantt")}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 border-b-2 font-bold uppercase text-[9px] tracking-widest transition-all cursor-pointer",
                            activeView === tab.id
                                ? "border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg"
                                : "border-transparent text-zinc-500 hover:text-blue-300 hover:bg-blue-900/5 rounded-t-lg"
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>

            {/* Main Interactive Spreadsheet Containers - Beautifully Separated Cards */}
            {activeView === "spreadsheet" && (
                <div className="space-y-8">
                {statusGroups.map(group => {
                    const groupTasks = getGroupTasks(group.id);
                    
                    return (
                        <div key={group.id} className="space-y-2.5">
                            {/* Group Status Header */}
                            <div className="flex items-center gap-3 px-2">
                                <span className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-zinc-850 shadow-sm select-none",
                                    group.id === "PENDING" && "bg-zinc-900 text-zinc-400 border-zinc-800",
                                    group.id === "IN_PROGRESS" && "bg-blue-950/40 text-blue-400 border-blue-500/20",
                                    group.id === "COMPLETED" && "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                                )}>
                                    <group.icon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{group.name}</span>
                                </span>
                                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest">
                                    {groupTasks.length} {groupTasks.length === 1 ? "tarefa" : "tarefas"}
                                </span>
                            </div>

                            {/* Table Container Card */}
                            <div className="w-full glow-card-processos rounded-2xl bg-zinc-950/65 backdrop-blur-xl overflow-x-auto shadow-[0_20px_45px_rgba(0,0,0,0.85)] p-0.5">
                                <table className="w-full border-collapse text-left text-xs min-w-[950px] overflow-hidden rounded-xl">
                                    <thead>
                                        <tr className="border-b border-zinc-800/80 bg-zinc-900/85 backdrop-blur-md text-zinc-300 font-black tracking-widest text-[9px] h-11 select-none uppercase">
                                            <th className="w-12 px-4 text-center border-r border-zinc-800/50 bg-zinc-900/40">Status</th>
                                            <th className="min-w-[260px] px-4 border-r border-zinc-800/50 bg-zinc-900/40 group/th cursor-pointer hover:bg-zinc-800/50 transition-colors select-none" onClick={() => handleSort("title")}>
                                                <div className="flex items-center">Nome da Linha {renderSortIcon("title")}</div>
                                            </th>

                                            <th className="w-40 px-4 border-r border-zinc-800/50 bg-zinc-900/40 group/th cursor-pointer hover:bg-zinc-800/50 transition-colors select-none" onClick={() => handleSort("date")}>
                                                <div className="flex items-center">Data de Vencimento {renderSortIcon("date")}</div>
                                            </th>
                                            <th className="w-32 px-4 border-r border-zinc-800/50 bg-zinc-900/40 group/th cursor-pointer hover:bg-zinc-800/50 transition-colors select-none" onClick={() => handleSort("priority")}>
                                                <div className="flex items-center">Prioridade {renderSortIcon("priority")}</div>
                                            </th>
                                            <th className="w-44 px-4 border-r border-zinc-800/50 bg-zinc-900/40 group/th cursor-pointer hover:bg-zinc-800/50 transition-colors select-none" onClick={() => handleSort("startedAt")}>
                                                <div className="flex items-center">Iniciado em {renderSortIcon("startedAt")}</div>
                                            </th>
                                            <th className="w-44 px-4 border-r border-zinc-800/50 bg-zinc-900/40 group/th cursor-pointer hover:bg-zinc-800/50 transition-colors select-none" onClick={() => handleSort("completedAt")}>
                                                <div className="flex items-center">Concluído em {renderSortIcon("completedAt")}</div>
                                            </th>
                                            <th className="w-32 px-4 border-r border-zinc-800/50 bg-zinc-900/40 select-none">
                                                <div className="flex items-center">Duração</div>
                                            </th>
                                                                                      {customFields.map(field => (
                                                <th key={field.id} className="min-w-[150px] px-4 border-r border-zinc-800/50 bg-zinc-900/40 relative group/th cursor-pointer hover:bg-zinc-800/50 transition-colors select-none" onClick={() => handleSort("custom_" + field.id)}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center truncate">
                                                            {field.name}
                                                            {renderSortIcon("custom_" + field.id)}
                                                        </div>
                                                        {!isViewer && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white p-0.5 transition-opacity cursor-pointer">
                                                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="noir-glass border-zinc-800 text-zinc-300">
                                                                    <DropdownMenuItem 
                                                                        onClick={() => handleStartEditColumn(field)}
                                                                        className="hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider py-2 cursor-pointer"
                                                                    >
                                                                        <Settings className="w-3.5 h-3.5 mr-2" /> Editar Coluna
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem 
                                                                        onClick={() => {
                                                                            setColumnToDelete(field.id);
                                                                            setIsConfirmDeleteColumnOpen(true);
                                                                        }}
                                                                        className="hover:bg-red-950/20 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider py-2 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir Coluna
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="w-16 px-4 text-center bg-zinc-900/40">Ações</th>
                                        </tr>
                                    </thead>
 
                                    <tbody>
                                        {/* Empty Group State Helper */}
                                        {groupTasks.length === 0 && (
                                            <tr className="border-b border-zinc-900/40 select-none pointer-events-none bg-zinc-950/10">
                                                <td colSpan={9 + customFields.length} className="px-12 py-4 text-left text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                                    Nenhuma tarefa nesta seção. Adicione na linha abaixo.
                                                </td>
                                            </tr>
                                        )}

                                        {/* Group Tasks Rows */}
                                        {groupTasks.map((task: any) => {
                                            const taskValues = (task.customFieldValues as Record<string, any>) || {};
                                            
                                            return (
                                                <tr key={task.id} className="border-b border-zinc-900/50 hover:bg-white/[0.01] group/row h-11 transition-all">
                                                    {/* Status Toggle Box */}
                                                    <td className="px-4 text-center border-r border-zinc-900/40">
                                                        {isViewer ? (
                                                            <div className="p-1">
                                                                <group.icon className={cn("w-4.5 h-4.5 opacity-60", group.color.split(" ")[0])} />
                                                            </div>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="focus:outline-none cursor-pointer p-1 rounded hover:bg-zinc-850 transition-colors">
                                                                        <group.icon className={cn("w-4.5 h-4.5 hover:scale-110 transition-transform", group.color.split(" ")[0])} />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="noir-glass border-zinc-800">
                                                                    {statusGroups.map(g => (
                                                                        <DropdownMenuItem 
                                                                            key={g.id} 
                                                                            onClick={() => handleUpdateTaskField(task.id, "status", g.id)}
                                                                            className="cursor-pointer font-bold text-[10px] uppercase tracking-wide rounded-md"
                                                                        >
                                                                            <g.icon className="mr-2 w-3.5 h-3.5" /> {g.name}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </td>

                                                    {/* Task Title (Inline Input) */}
                                                    <td className="px-4 font-bold text-zinc-200 border-r border-zinc-900/40">
                                                        {editingCell === `${task.id}-title` && !isViewer ? (
                                                            <Input
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onBlur={() => {
                                                                    handleUpdateTaskField(task.id, "title", editingValue);
                                                                    setEditingCell(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        handleUpdateTaskField(task.id, "title", editingValue);
                                                                        setEditingCell(null);
                                                                    }
                                                                    if (e.key === "Escape") setEditingCell(null);
                                                                }}
                                                                autoFocus
                                                                className="h-8 bg-zinc-900 border-zinc-700 text-white font-bold text-xs focus:ring-1 focus:ring-white/10 focus:outline-none rounded-md w-full"
                                                            />
                                                        ) : (
                                                            <div 
                                                                onClick={() => {
                                                                    if (isViewer) return;
                                                                    setEditingCell(`${task.id}-title`);
                                                                    setEditingValue(task.title);
                                                                }}
                                                                className={cn(
                                                                    "truncate py-1.5 px-2.5 rounded-lg transition-all",
                                                                    isViewer 
                                                                        ? "border border-transparent text-zinc-400 cursor-default" 
                                                                        : "cursor-text hover:text-white hover:bg-zinc-800/10 border border-transparent hover:border-zinc-800/30"
                                                                )}
                                                                title={isViewer ? undefined : "Clique para editar o nome"}
                                                            >
                                                                {task.title}
                                                            </div>
                                                        )}
                                                       </td>

                                                    {/* Due Date selector */}
                                                    <td className="px-4 border-r border-zinc-900/40">
                                                        {isViewer ? (
                                                            <div className="flex items-center gap-2 px-2.5 py-1.5 text-zinc-500">
                                                                <Calendar className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                                                                <span className="text-xs font-bold text-zinc-400">
                                                                    {task.date ? format(parseLocalDate(task.date)!, "dd/MM/yyyy", { locale: ptBR }) : <span className="text-zinc-650 italic font-normal">—</span>}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="group/cell relative flex items-center justify-between w-full hover:bg-zinc-800/20 border border-transparent hover:border-zinc-800/40 rounded-lg px-2.5 py-1.5 transition-all">
                                                                <div className="flex items-center gap-2 text-zinc-400 group-hover/cell:text-zinc-200 w-full relative">
                                                                    <Calendar className="w-3.5 h-3.5 text-zinc-650 shrink-0 group-hover/cell:text-zinc-400" />
                                                                    <input 
                                                                        type="date"
                                                                        value={task.date ? format(parseLocalDate(task.date)!, "yyyy-MM-dd") : ""}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            handleUpdateTaskField(task.id, "date", val ? new Date(val) : null);
                                                                        }}
                                                                        onClick={(e) => {
                                                                            try {
                                                                                e.currentTarget.showPicker();
                                                                            } catch (err) {
                                                                                console.log(err);
                                                                            }
                                                                        }}
                                                                        className="bg-transparent border-none text-zinc-300 font-bold focus:outline-none focus:ring-0 text-xs w-full cursor-pointer hover:text-white leading-none p-0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Priority Selector */}
                                                    <td className="px-4 border-r border-zinc-900/40">
                                                        {isViewer ? (
                                                            <div className="px-2 py-1.5">
                                                                <Badge className={cn("px-2.5 py-0.5 border font-bold uppercase text-[8px] tracking-widest rounded-full shadow-sm opacity-70", getPriorityObj(task.priority).color)}>
                                                                    {getPriorityObj(task.priority).label}
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button className="w-full flex items-center justify-between hover:bg-zinc-800/20 border border-transparent hover:border-zinc-800/40 rounded-lg px-2 py-1.5 transition-all focus:outline-none cursor-pointer text-left group/cell">
                                                                        <Badge className={cn("px-2.5 py-0.5 border font-bold uppercase text-[8px] tracking-widest rounded-full shadow-sm", getPriorityObj(task.priority).color)}>
                                                                            {getPriorityObj(task.priority).label}
                                                                        </Badge>
                                                                        <ChevronDown className="w-3 h-3 text-zinc-650 shrink-0 ml-1 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="noir-glass border-zinc-800 p-1">
                                                                    {priorities.map(p => (
                                                                        <DropdownMenuItem key={p.value} onClick={() => handleUpdateTaskField(task.id, "priority", p.value)} className="font-bold text-[10px] uppercase cursor-pointer rounded-md">
                                                                            {p.label}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </td>

                                                    {/* Iniciado em */}
                                                    <td className="px-4 border-r border-zinc-900/40 text-xs font-bold text-zinc-400 select-none">
                                                        {formatDateTime(task.startedAt)}
                                                    </td>

                                                    {/* Concluído em */}
                                                    <td className="px-4 border-r border-zinc-900/40 text-xs font-bold text-zinc-400 select-none">
                                                        {formatDateTime(task.completedAt)}
                                                    </td>

                                                    {/* Duração */}
                                                    <td className="px-4 border-r border-zinc-900/40 select-none">
                                                        {task.status === "IN_PROGRESS" ? (
                                                            <div className="px-2 py-1">
                                                                <Badge className="bg-emerald-950/40 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-bold uppercase text-[9px] tracking-widest rounded-full shadow-sm animate-pulse flex items-center gap-1.5 w-fit">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                                                    {getDurationText(task.startedAt, task.completedAt, task.status)}
                                                                </Badge>
                                                            </div>
                                                        ) : task.status === "COMPLETED" && task.startedAt ? (
                                                            <div className="px-2 py-1">
                                                                <Badge className="bg-zinc-900 hover:bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold uppercase text-[9px] tracking-widest rounded-full shadow-sm flex items-center gap-1.5 w-fit">
                                                                    {getDurationText(task.startedAt, task.completedAt, task.status)}
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            <span className="text-zinc-750 font-normal italic text-[10px] pl-2">—</span>
                                                        )}
                                                    </td>

                                                    {/* Render dynamic Custom Fields Cells */}
                                                    {customFields.map(field => {
                                                        const value = taskValues[field.id] || "";
                                                        const cellId = `${task.id}-${field.id}`;
                                                        const isEditing = editingCell === cellId;

                                                        return (
                                                            <td key={field.id} className="px-4 border-r border-zinc-900/40 font-semibold text-zinc-300">
                                                                {/* Dropdown custom field type */}
                                                                {field.type === "dropdown" && (
                                                                    isViewer ? (
                                                                        <div className="px-2.5 py-1.5">
                                                                            {value ? (
                                                                                <Badge className={cn("px-2.5 py-0.5 border font-bold uppercase text-[8px] tracking-widest rounded-full opacity-80", getDropdownBadgeColor(value, 0))}>
                                                                                    {value}
                                                                                </Badge>
                                                                            ) : (
                                                                                <span className="text-zinc-700 font-normal italic text-[10px]">—</span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <button className="w-full flex items-center justify-between hover:bg-zinc-800/20 border border-transparent hover:border-zinc-800/40 rounded-lg px-2.5 py-1.5 transition-all focus:outline-none cursor-pointer text-left group/cell">
                                                                                    <span className="truncate max-w-[125px]">
                                                                                        {value ? (
                                                                                            <Badge className={cn("px-2.5 py-0.5 border font-bold uppercase text-[8px] tracking-widest rounded-full", getDropdownBadgeColor(value, 0))}>
                                                                                                {value}
                                                                                            </Badge>
                                                                                        ) : (
                                                                                            <span className="text-zinc-650 font-normal italic text-[10px] group-hover/cell:text-zinc-500">Adicionar</span>
                                                                                        )}
                                                                                    </span>
                                                                                    <ChevronDown className="w-3 h-3 text-zinc-650 shrink-0 ml-1 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                                                                </button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent className="noir-glass border-zinc-800 p-1 w-52">
                                                                                <DropdownMenuItem onClick={() => handleUpdateCustomField(task.id, task, field.id, "")} className="font-bold text-[10px] uppercase cursor-pointer rounded-md">
                                                                                    Limpar
                                                                                </DropdownMenuItem>
                                                                                {field.options?.map((opt: string) => (
                                                                                    <DropdownMenuItem key={opt} onClick={() => handleUpdateCustomField(task.id, task, field.id, opt)} className="font-bold text-[10px] uppercase cursor-pointer rounded-md">
                                                                                        {opt}
                                                                                    </DropdownMenuItem>
                                                                                ))}
                                                                                <div className="border-t border-zinc-850 my-1" />
                                                                                <div className="px-2 py-1.5 flex flex-col gap-1.5">
                                                                                    <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-500">Nova Opção</span>
                                                                                    <Input 
                                                                                        placeholder="Pressione Enter..."
                                                                                        onKeyDown={async (e) => {
                                                                                            if (e.key === "Enter") {
                                                                                                const val = e.currentTarget.value.trim();
                                                                                                if (val) {
                                                                                                    const updatedOptions = [...(field.options || []), val];
                                                                                                    const updatedFields = customFields.map(f => f.id === field.id ? { ...f, options: updatedOptions } : f);
                                                                                                    const res = await updateList(list.id, list.name, updatedFields);
                                                                                                    if (res.success) {
                                                                                                        toast.success("Opção adicionada!");
                                                                                                        startTransition(() => router.refresh());
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                        className="h-6 text-[10px] bg-zinc-900 border-zinc-800 text-white font-bold"
                                                                                    />
                                                                                </div>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    )
                                                                )}

                                                                {/* Checkbox custom field type */}
                                                                {field.type === "checkbox" && (
                                                                    <div className={cn("flex items-center h-full border border-transparent rounded-lg px-2.5 py-1.5 transition-all", !isViewer && "hover:bg-zinc-800/20 hover:border-zinc-800/40 cursor-pointer")}>
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={!!value}
                                                                            disabled={isViewer}
                                                                            onChange={(e) => !isViewer && handleUpdateCustomField(task.id, task, field.id, e.target.checked)}
                                                                            className={cn("h-4 w-4 bg-zinc-900 border-zinc-850 rounded focus:ring-0 accent-white", isViewer ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Progression slider / bar type */}
                                                                {field.type === "progress" && (
                                                                    <div className="flex items-center gap-2 border border-transparent rounded-lg px-2.5 py-1 select-none">
                                                                        <input 
                                                                            type="range"
                                                                            min="0"
                                                                            max="100"
                                                                            step="10"
                                                                            value={value || 0}
                                                                            disabled={isViewer}
                                                                            onChange={(e) => !isViewer && handleUpdateCustomField(task.id, task, field.id, parseInt(e.target.value))}
                                                                            className={cn("w-20 bg-zinc-850 rounded-lg appearance-none h-1.5 accent-white", isViewer ? "opacity-50 cursor-not-allowed" : "cursor-pointer")}
                                                                        />
                                                                        <span className="text-[10px] font-black text-zinc-500 w-8">{value || 0}%</span>
                                                                    </div>
                                                                )}

                                                                {/* Standard inputs (Text, Number, Email, Phone) */}
                                                                {["text", "number", "email", "phone"].includes(field.type) && (
                                                                    isEditing && !isViewer ? (
                                                                        <Input
                                                                            type={field.type === "number" ? "number" : "text"}
                                                                            value={editingValue}
                                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                                            onBlur={() => {
                                                                                handleUpdateCustomField(task.id, task, field.id, editingValue);
                                                                                setEditingCell(null);
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    handleUpdateCustomField(task.id, task, field.id, editingValue);
                                                                                    setEditingCell(null);
                                                                                }
                                                                                if (e.key === "Escape") setEditingCell(null);
                                                                            }}
                                                                            autoFocus
                                                                            className="h-8 bg-zinc-900 border-zinc-700 text-white font-bold text-xs focus:ring-1 focus:ring-white/10 focus:outline-none rounded-md w-full"
                                                                        />
                                                                    ) : (
                                                                        <div 
                                                                            onClick={() => {
                                                                                if (isViewer) return;
                                                                                setEditingCell(cellId);
                                                                                setEditingValue(value);
                                                                            }}
                                                                            className={cn(
                                                                                "w-full flex items-center justify-between border border-transparent rounded-lg px-2.5 py-1.5 transition-all truncate group/cell",
                                                                                isViewer
                                                                                    ? "cursor-default text-zinc-500"
                                                                                    : "hover:bg-zinc-800/20 hover:border-zinc-800/40 cursor-text text-zinc-450 hover:text-white"
                                                                            )}
                                                                        >
                                                                            <div className="flex items-center gap-1.5 truncate">
                                                                                {field.type === "email" && value && <Mail className="w-3.5 h-3.5 text-zinc-655 shrink-0" />}
                                                                                {field.type === "phone" && value && <Phone className="w-3.5 h-3.5 text-zinc-655 shrink-0" />}
                                                                                {field.type === "number" && value && <Hash className="w-3.5 h-3.5 text-zinc-655 shrink-0" />}
                                                                                
                                                                                <span className="truncate text-xs font-bold">
                                                                                    {value || <span className={cn("font-normal italic text-[10px]", isViewer ? "text-zinc-700" : "text-zinc-650 group-hover/cell:text-zinc-500")}>{isViewer ? "—" : "Adicionar"}</span>}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Trash Delete button column — hidden for viewers */}
                                                    <td className="px-4 text-center">
                                                        {!isViewer && (
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                                                                onClick={() => {
                                                                    setTaskToDelete(task.id);
                                                                    setIsConfirmDeleteOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Column-aligned Quick Create Row — hidden for viewers */}
                                        {isViewer ? (
                                            <tr className="h-10">
                                                <td colSpan={8 + customFields.length} className="px-4 py-2 text-center">
                                                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-700 italic">Visualização apenas — sem permissão para editar</span>
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr className="border-b border-zinc-800/50 border-dashed h-11 bg-zinc-950/30 hover:bg-zinc-900/10 transition-all group/quick">
                                                {/* Column 1: Status (Plus icon indicator) */}
                                                <td className="px-4 text-center border-r border-zinc-800/50">
                                                    <Plus className="w-4 h-4 text-zinc-500 mx-auto group-hover/quick:text-zinc-350 transition-colors" />
                                                </td>
                                                
                                                {/* Column 2: Title field */}
                                                <td className="px-4 border-r border-zinc-800/50">
                                                    <div className="flex items-center justify-between w-full gap-2">
                                                        <input 
                                                            type="text"
                                                            placeholder="+ Adicionar tarefa..."
                                                            value={quickTitleByStatus[group.id] || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setQuickTitleByStatus(prev => ({ ...prev, [group.id]: val }));
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleQuickCreate(group.id);
                                                            }}
                                                            className="bg-transparent border-none text-zinc-200 font-bold placeholder-zinc-700 text-xs flex-1 focus:outline-none focus:ring-0 focus:text-white p-1"
                                                        />
                                                        {quickTitleByStatus[group.id] && (
                                                            <span className="text-[8px] font-black text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded shrink-0 mr-1 flex items-center gap-1 select-none animate-pulse">
                                                                <Check className="w-2.5 h-2.5 text-zinc-400" /> Enter
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>



                                                {/* Column 4: Date Placeholder */}
                                                <td className="px-4 border-r border-zinc-800/50 text-zinc-750 italic text-[10px] select-none pointer-events-none text-center">
                                                    —
                                                </td>

                                                {/* Column 5: Priority Placeholder */}
                                                <td className="px-4 border-r border-zinc-800/50 text-zinc-750 italic text-[10px] select-none pointer-events-none text-center">
                                                    —
                                                </td>

                                                {/* Column 6: StartedAt Placeholder */}
                                                <td className="px-4 border-r border-zinc-800/50 text-zinc-750 italic text-[10px] select-none pointer-events-none text-center">
                                                    —
                                                </td>

                                                {/* Column 7: CompletedAt Placeholder */}
                                                <td className="px-4 border-r border-zinc-800/50 text-zinc-750 italic text-[10px] select-none pointer-events-none text-center">
                                                    —
                                                </td>

                                                {/* Column 8: Duration Placeholder */}
                                                <td className="px-4 border-r border-zinc-800/50 text-zinc-750 italic text-[10px] select-none pointer-events-none text-center">
                                                    —
                                                </td>

                                                {/* Custom Fields Placeholders */}
                                                {customFields.map(field => (
                                                    <td key={field.id} className="px-4 border-r border-zinc-800/50 text-zinc-750 italic text-[10px] select-none pointer-events-none text-center">
                                                        —
                                                    </td>
                                                ))}

                                                {/* Actions Placeholder */}
                                                <td className="px-4 text-center text-zinc-750 italic text-[10px] select-none pointer-events-none">
                                                    —
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeView === "kanban" && renderKanbanView()}

            {activeView === "gantt" && renderGanttView()}

            {/* Column Creator Dialog */}
            {isColumnDialogOpen && (
                <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                    <DialogContent className="noir-glass border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white uppercase tracking-wider text-sm font-bold">Criar Nova Coluna Customizada</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Nome da Coluna</label>
                                <Input 
                                    value={newColumnName}
                                    onChange={(e) => setNewColumnName(e.target.value)}
                                    placeholder="Ex: Setor Responsável, Telefone Cliente..."
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-black">Tipo de Campo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: "Menu Suspenso (Dropdown)", value: "dropdown", icon: ChevronDown },
                                        { label: "Caixa de Seleção (Checkbox)", value: "checkbox", icon: CheckSquare },
                                        { label: "Progresso (Progression Bar)", value: "progress", icon: CheckCircle2 },
                                        { label: "Texto Livre", value: "text", icon: Type },
                                        { label: "Telefone", value: "phone", icon: Phone },
                                        { label: "E-mail", value: "email", icon: Mail },
                                        { label: "Número", value: "number", icon: Hash },
                                    ].map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setNewColumnType(type.value)}
                                            className={cn(
                                                "flex items-center gap-2 p-3 text-left border rounded-lg transition-all",
                                                newColumnType === type.value
                                                    ? "bg-white text-black font-bold border-zinc-200"
                                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                                            )}
                                        >
                                            <type.icon className="w-4 h-4 shrink-0" />
                                            <span className="text-[10px] uppercase font-bold tracking-wide leading-none">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dropdown Options List */}
                            {newColumnType === "dropdown" && (
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-black">Opções (Separadas por vírgula)</label>
                                    <Input 
                                        value={newColumnOptions}
                                        onChange={(e) => setNewColumnOptions(e.target.value)}
                                        placeholder="Ex: Comercial, Financeiro, Marketing, Equipe"
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" className="text-zinc-500 hover:text-zinc-300 font-bold uppercase text-xs" onClick={() => setIsColumnDialogOpen(false)}>Cancelar</Button>
                            <Button 
                                className="bg-white text-black hover:bg-zinc-200 font-bold uppercase text-xs"
                                onClick={handleAddColumn}
                            >
                                Adicionar Coluna
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Template Clone / Instantiation Dialog */}
            {isCloneDialogOpen && (
                <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
                    <DialogContent className="noir-glass border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white uppercase tracking-wider text-sm font-bold">
                                {list.isTemplate ? "Instanciar Checklist" : "Duplicar Checklist"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <p className="text-zinc-400 text-xs">
                                {list.isTemplate 
                                    ? "Gere uma nova cópia executável deste checklist a partir do modelo de procedimento para começar a preencher e salvar o progresso."
                                    : "Gere uma nova cópia idêntica a este checklist contendo todas as tarefas e estruturas configuradas."
                                }
                            </p>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Nome da Nova Lista</label>
                                <Input 
                                    value={cloneName}
                                    onChange={(e) => setCloneName(e.target.value)}
                                    placeholder="Ex: Checklist Liderança - Semana 22"
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                />
                            </div>

                            {/* Space Selection */}
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Espaço de Destino</label>
                                <select
                                    value={targetSpaceId}
                                    onChange={(e) => {
                                        setTargetSpaceId(e.target.value);
                                        setTargetFolderId(null);
                                    }}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-350 rounded-lg p-2.5 text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-zinc-700"
                                >
                                    {spaces.length === 0 ? (
                                        <option value={list.spaceId}>{list.space?.name || "Espaço Atual"}</option>
                                    ) : (
                                        spaces.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            {/* Folder Selection */}
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Pasta de Destino</label>
                                <select
                                    value={targetFolderId || ""}
                                    onChange={(e) => setTargetFolderId(e.target.value || null)}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-350 rounded-lg p-2.5 text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-zinc-700"
                                >
                                    <option value="">Nenhuma pasta (Raiz do espaço)</option>
                                    {(spaces.find(s => s.id === targetSpaceId)?.folders || []).map((f: any) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" className="text-zinc-500 hover:text-zinc-300 font-bold uppercase text-xs" onClick={() => setIsCloneDialogOpen(false)}>Cancelar</Button>
                            <Button 
                                className="bg-white text-black hover:bg-zinc-200 font-bold uppercase text-xs"
                                onClick={handleInstantiate}
                            >
                                {list.isTemplate ? "Instanciar" : "Duplicar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Edit Custom Column Dialog */}
            {isEditColumnDialogOpen && (
                <Dialog open={isEditColumnDialogOpen} onOpenChange={setIsEditColumnDialogOpen}>
                    <DialogContent className="noir-glass border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white uppercase tracking-wider text-sm font-bold">Editar Coluna Customizada</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Nome da Coluna</label>
                                <Input 
                                    value={editColumnName}
                                    onChange={(e) => setEditColumnName(e.target.value)}
                                    placeholder="Ex: Setor Responsável, Telefone Cliente..."
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-black">Tipo de Campo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: "Menu Suspenso (Dropdown)", value: "dropdown", icon: ChevronDown },
                                        { label: "Caixa de Seleção (Checkbox)", value: "checkbox", icon: CheckSquare },
                                        { label: "Progresso (Progression Bar)", value: "progress", icon: CheckCircle2 },
                                        { label: "Texto Livre", value: "text", icon: Type },
                                        { label: "Telefone", value: "phone", icon: Phone },
                                        { label: "E-mail", value: "email", icon: Mail },
                                        { label: "Número", value: "number", icon: Hash },
                                    ].map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setEditColumnType(type.value)}
                                            className={cn(
                                                "flex items-center gap-2 p-3 text-left border rounded-lg transition-all",
                                                editColumnType === type.value
                                                    ? "bg-white text-black font-bold border-zinc-200"
                                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                                            )}
                                        >
                                            <type.icon className="w-4 h-4 shrink-0" />
                                            <span className="text-[10px] uppercase font-bold tracking-wide leading-none">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dropdown Options List */}
                            {editColumnType === "dropdown" && (
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-black">Opções (Separadas por vírgula)</label>
                                    <Input 
                                        value={editColumnOptions}
                                        onChange={(e) => setEditColumnOptions(e.target.value)}
                                        placeholder="Ex: Comercial, Financeiro, Marketing, Equipe"
                                        className="bg-zinc-900 border-zinc-800 text-white"
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" className="text-zinc-500 hover:text-zinc-300 font-bold uppercase text-xs" onClick={() => setIsEditColumnDialogOpen(false)}>Cancelar</Button>
                            <Button 
                                className="bg-white text-black hover:bg-zinc-200 font-bold uppercase text-xs"
                                onClick={handleSaveEditColumn}
                            >
                                Salvar Alterações
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Task Confirmation */}
            {isConfirmDeleteOpen && (
                <ConfirmModal
                    isOpen={isConfirmDeleteOpen}
                    onOpenChange={setIsConfirmDeleteOpen}
                    onConfirm={() => {
                        if (taskToDelete) {
                            handleDeleteRow(taskToDelete);
                            setTaskToDelete(null);
                        }
                    }}
                    title="Excluir Linha definitivamente?"
                    description="Esta ação removerá permanentemente a tarefa selecionada e todos os seus valores associados. Esta operação não pode ser desfeita."
                    confirmText="Excluir"
                    cancelText="Cancelar"
                />
            )}

            {/* Delete Column Confirmation */}
            {isConfirmDeleteColumnOpen && (
                <ConfirmModal
                    isOpen={isConfirmDeleteColumnOpen}
                    onOpenChange={setIsConfirmDeleteColumnOpen}
                    onConfirm={() => {
                        if (columnToDelete) {
                            handleRemoveColumn(columnToDelete);
                            setColumnToDelete(null);
                        }
                    }}
                    title="Excluir Coluna e Dados?"
                    description="Esta ação removerá permanentemente a coluna customizada e todos os dados salvos nela para cada linha. Esta operação não pode ser desfeita."
                    confirmText="Remover"
                    cancelText="Cancelar"
                />
            )}
        </div>
    );
}
