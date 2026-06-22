"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
    Plus, ChevronRight, ChevronDown, Folder, FileSpreadsheet, 
    FolderPlus, FilePlus, Trash2, Edit2, Check, X,
    FolderKanban, Sparkles, FolderClosed, Copy, Share2, Users,
    MoreHorizontal, Settings, Move
} from "lucide-react";
import { 
    createSpace, updateSpace, deleteSpace,
    createFolder, updateFolder, deleteFolder,
    createList, deleteList, duplicateFolder,
    shareSpace, unshareSpace, updateProcessOrder,
    duplicateList, moveList, moveFolder
} from "@/app/actions/processes";
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function SortableItem({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        position: isDragging ? "relative" as const : "static" as const,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={className}>
            {children}
        </div>
    );
}

interface ProcessesSidebarProps {
    initialSpaces: any[];
    currentUserId?: string;
}

export function ProcessesSidebar({ initialSpaces, currentUserId }: ProcessesSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [localSpaces, setLocalSpaces] = useState(initialSpaces);
    useEffect(() => {
        setLocalSpaces(initialSpaces);
    }, [initialSpaces]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        let activeType = activeId.startsWith("folder-") ? "folder" : "list";
        const realActiveId = activeId.replace(/^(folder|list)-/, "");
        const realOverId = overId.replace(/^(folder|list)-/, "");

        setLocalSpaces((prevSpaces) => {
            const newSpaces = JSON.parse(JSON.stringify(prevSpaces)); // deep copy

            // Find the parent space for the active item
            for (const space of newSpaces) {
                if (activeType === "folder") {
                    const oldIndex = space.folders.findIndex((f: any) => f.id === realActiveId);
                    const newIndex = space.folders.findIndex((f: any) => f.id === realOverId);
                    if (oldIndex !== -1 && newIndex !== -1) {
                        space.folders = arrayMove(space.folders, oldIndex, newIndex);
                        const updates = space.folders.map((f: any, i: number) => ({ id: f.id, order: i }));
                        updateProcessOrder(updates, "folder");
                        return newSpaces;
                    }
                } else {
                    // It's a list. Could be in a folder or direct to space
                    const oldSpaceIndex = space.lists.findIndex((l: any) => l.id === realActiveId);
                    const newSpaceIndex = space.lists.findIndex((l: any) => l.id === realOverId);
                    if (oldSpaceIndex !== -1 && newSpaceIndex !== -1) {
                        space.lists = arrayMove(space.lists, oldSpaceIndex, newSpaceIndex);
                        const updates = space.lists.map((l: any, i: number) => ({ id: l.id, order: i }));
                        updateProcessOrder(updates, "list");
                        return newSpaces;
                    }

                    // Or inside a folder
                    for (const folder of space.folders) {
                        const oldFolderIndex = folder.lists.findIndex((l: any) => l.id === realActiveId);
                        const newFolderIndex = folder.lists.findIndex((l: any) => l.id === realOverId);
                        if (oldFolderIndex !== -1 && newFolderIndex !== -1) {
                            folder.lists = arrayMove(folder.lists, oldFolderIndex, newFolderIndex);
                            const updates = folder.lists.map((l: any, i: number) => ({ id: l.id, order: i }));
                            updateProcessOrder(updates, "list");
                            return newSpaces;
                        }
                    }
                }
            }
            return newSpaces;
        });
    };

    // UI state
    const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
    
    // Creation/Editing states
    const [activeModal, setActiveModal] = useState<{
        type: "space" | "folder" | "list" | "duplicate_folder" | "edit_space" | "copy_list" | "move_list" | "move_folder";
        spaceId?: string;
        folderId?: string | null;
        listId?: string;
        editId?: string;
        editName?: string;
    } | null>(null);

    const [formName, setFormName] = useState("");
    const [formColor, setFormColor] = useState("zinc");
    const [isTemplate, setIsTemplate] = useState(false);
    
    // Copy & Move destination states
    const [targetSpaceId, setTargetSpaceId] = useState("");
    const [targetFolderId, setTargetFolderId] = useState<string | null>(null);

    // Sharing state
    const [sharingSpace, setSharingSpace] = useState<any | null>(null);
    const [inviteEmailOrCpf, setInviteEmailOrCpf] = useState("");
    const [inviteRole, setInviteRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
    const [isSharingPending, setIsSharingPending] = useState(false);

    // Confirm delete state
    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        type: "space" | "folder" | "list";
        id: string;
        name: string;
    } | null>(null);

    // Sync sharingSpace state when initialSpaces is updated
    useEffect(() => {
        if (sharingSpace) {
            const updated = initialSpaces.find(s => s.id === sharingSpace.id);
            if (updated) {
                setSharingSpace(updated);
            } else {
                setSharingSpace(null);
            }
        }
    }, [initialSpaces]);

    // Sync copy & move destination states when modal opens
    useEffect(() => {
        if (activeModal) {
            if (activeModal.spaceId) {
                setTargetSpaceId(activeModal.spaceId);
            } else if (localSpaces.length > 0) {
                setTargetSpaceId(localSpaces[0].id);
            }
            if (activeModal.folderId !== undefined) {
                setTargetFolderId(activeModal.folderId);
            } else {
                setTargetFolderId(null);
            }
        }
    }, [activeModal, localSpaces]);

    const toggleSpace = (id: string) => {
        setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreateSpace = async () => {
        if (!formName.trim()) return;
        const res = await createSpace(formName, formColor);
        if (res.success) {
            toast.success("Espaço criado!");
            setActiveModal(null);
            setFormName("");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao criar");
        }
    };

    const handleCreateFolder = async (spaceId: string) => {
        if (!formName.trim()) return;
        const res = await createFolder(formName, spaceId);
        if (res.success) {
            toast.success("Pasta criada!");
            setActiveModal(null);
            setFormName("");
            setExpandedSpaces(prev => ({ ...prev, [spaceId]: true }));
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao criar");
        }
    };

    const handleDuplicateFolder = async (folderId: string, defaultSpaceId: string) => {
        if (!formName.trim()) return;
        const finalSpaceId = targetSpaceId || defaultSpaceId;
        const res = await duplicateFolder(folderId, formName, finalSpaceId);
        if (res.success) {
            toast.success("Pasta duplicada com sucesso!");
            setActiveModal(null);
            setFormName("");
            setExpandedSpaces(prev => ({ ...prev, [finalSpaceId]: true }));
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao duplicar pasta");
        }
    };

    const handleUpdateSpace = async (spaceId: string) => {
        if (!formName.trim()) return;
        const res = await updateSpace(spaceId, formName, formColor);
        if (res.success) {
            toast.success("Espaço atualizado!");
            setActiveModal(null);
            setFormName("");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao atualizar");
        }
    };

    const handleMoveFolder = async (folderId: string) => {
        if (!targetSpaceId) return;
        const res = await moveFolder(folderId, targetSpaceId);
        if (res.success) {
            toast.success("Pasta movida com sucesso!");
            setActiveModal(null);
            setExpandedSpaces(prev => ({ ...prev, [targetSpaceId]: true }));
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao mover pasta");
        }
    };

    const handleDuplicateList = async (listId: string) => {
        if (!formName.trim() || !targetSpaceId) return;
        const res = await duplicateList(listId, formName, targetSpaceId, targetFolderId);
        if (res.success) {
            toast.success("Checklist copiada com sucesso!");
            setActiveModal(null);
            setFormName("");
            if (targetFolderId) {
                setExpandedFolders(prev => ({ ...prev, [targetFolderId]: true }));
            } else {
                setExpandedSpaces(prev => ({ ...prev, [targetSpaceId]: true }));
            }
            startTransition(() => {
                router.refresh();
                if (res.data) {
                    router.push(`/processes/${res.data.id}`);
                }
            });
        } else {
            toast.error(res.error || "Erro ao copiar checklist");
        }
    };

    const handleMoveList = async (listId: string) => {
        if (!targetSpaceId) return;
        const res = await moveList(listId, targetSpaceId, targetFolderId);
        if (res.success) {
            toast.success("Checklist movida com sucesso!");
            setActiveModal(null);
            if (targetFolderId) {
                setExpandedFolders(prev => ({ ...prev, [targetFolderId]: true }));
            } else {
                setExpandedSpaces(prev => ({ ...prev, [targetSpaceId]: true }));
            }
            startTransition(() => {
                router.refresh();
                if (pathname === `/processes/${listId}`) {
                    router.push(`/processes/${listId}`); // reload
                }
            });
        } else {
            toast.error(res.error || "Erro ao mover checklist");
        }
    };

    const handleCreateList = async (spaceId: string, folderId?: string | null) => {
        if (!formName.trim()) return;
        const res = await createList(formName, spaceId, folderId, isTemplate);
        if (res.success) {
            toast.success(isTemplate ? "Modelo de Checklist criado!" : "Checklist criada!");
            setActiveModal(null);
            setFormName("");
            setIsTemplate(false);
            if (folderId) {
                setExpandedFolders(prev => ({ ...prev, [folderId]: true }));
            } else {
                setExpandedSpaces(prev => ({ ...prev, [spaceId]: true }));
            }
            startTransition(() => {
                router.refresh();
                if (res.data) {
                    router.push(`/processes/${res.data.id}`);
                }
            });
        } else {
            toast.error(res.error || "Erro ao criar");
        }
    };

    const handleShareSpace = async () => {
        if (!inviteEmailOrCpf.trim() || !sharingSpace) return;
        setIsSharingPending(true);
        const res = await shareSpace(sharingSpace.id, inviteEmailOrCpf.trim(), inviteRole);
        setIsSharingPending(false);
        if (res.success) {
            toast.success("Espaço compartilhado!");
            setInviteEmailOrCpf("");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao compartilhar");
        }
    };

    const handleUnshareSpace = async (userId: string) => {
        if (!sharingSpace) return;
        const res = await unshareSpace(sharingSpace.id, userId);
        if (res.success) {
            toast.success("Compartilhamento removido.");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error || "Erro ao remover");
        }
    };

    const initiateDeleteList = (id: string, name: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirmDelete({
            isOpen: true,
            type: "list",
            id,
            name
        });
    };

    const initiateDeleteFolder = (id: string, name: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirmDelete({
            isOpen: true,
            type: "folder",
            id,
            name
        });
    };

    const initiateDeleteSpace = (id: string, name: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirmDelete({
            isOpen: true,
            type: "space",
            id,
            name
        });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        const { type, id } = confirmDelete;
        setConfirmDelete(null);

        if (type === "list") {
            const res = await deleteList(id);
            if (res.success) {
                toast.success("Checklist excluída!");
                startTransition(() => {
                    router.refresh();
                    if (pathname === `/processes/${id}`) {
                        router.push("/processes");
                    }
                });
            } else {
                toast.error(res.error || "Erro ao excluir checklist");
            }
        } else if (type === "folder") {
            const res = await deleteFolder(id);
            if (res.success) {
                toast.success("Pasta excluída!");
                startTransition(() => router.refresh());
            } else {
                toast.error(res.error || "Erro ao excluir pasta");
            }
        } else if (type === "space") {
            const res = await deleteSpace(id);
            if (res.success) {
                toast.success("Espaço de trabalho excluído!");
                startTransition(() => router.refresh());
            } else {
                toast.error(res.error || "Erro ao excluir espaço de trabalho");
            }
        }
    };

    const colors = [
        { name: "Cinza", value: "zinc" },
        { name: "Azul", value: "blue" },
        { name: "Verde", value: "green" },
        { name: "Amarelo", value: "yellow" },
        { name: "Laranja", value: "orange" },
        { name: "Vermelho", value: "red" },
        { name: "Rosa", value: "pink" },
        { name: "Teal", value: "teal" },
    ];

    const colorClasses: Record<string, string> = {
        zinc: "bg-zinc-500",
        blue: "bg-blue-500",
        green: "bg-emerald-500",
        yellow: "bg-amber-500",
        orange: "bg-orange-500",
        red: "bg-red-500",
        pink: "bg-pink-500",
        teal: "bg-teal-500",
    };

    return (
        <div className="w-full h-full flex flex-col bg-zinc-950/60 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-white" />
                    <span className="font-bold text-xs uppercase tracking-wider text-white">Acompanhamentos</span>
                </div>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    onClick={() => {
                        setFormName("");
                        setFormColor("zinc");
                        setActiveModal({ type: "space" });
                    }}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Tree Navigation */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="flex-1 overflow-y-auto p-2 space-y-4 no-scrollbar">
                    {localSpaces.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                        <FolderClosed className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Nenhum espaço ativo</p>
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="text-xs text-zinc-400 hover:text-white mt-1 uppercase tracking-widest font-black"
                            onClick={() => setActiveModal({ type: "space" })}
                        >
                            + Novo Espaço
                        </Button>
                    </div>
                ) : (
                    localSpaces.map(space => {
                        const isSpaceExpanded = expandedSpaces[space.id];
                        const spaceColor = space.color || "zinc";
                        
                        // Check if current user is owner vs shared viewer
                        const isSpaceOwner = space.userId === currentUserId;
                        const userShare = space.shares?.find((s: any) => s.userId === currentUserId);
                        const isSpaceViewer = !isSpaceOwner && userShare?.role === "VIEWER";

                        // Calculate overall workspace statistics
                        let spaceTotalTasks = 0;
                        let spaceCompletedTasks = 0;

                        space.lists?.forEach((l: any) => {
                            spaceTotalTasks += l.tasks?.length || 0;
                            spaceCompletedTasks += l.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
                        });

                        space.folders?.forEach((f: any) => {
                            f.lists?.forEach((l: any) => {
                                spaceTotalTasks += l.tasks?.length || 0;
                                spaceCompletedTasks += l.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
                            });
                        });

                        const spaceProgressPercent = spaceTotalTasks > 0
                            ? Math.round((spaceCompletedTasks / spaceTotalTasks) * 100)
                            : 0;

                        return (
                            <div key={space.id} className="space-y-1">
                                {/* Space Header */}
                                <div className="group relative flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors">
                                    <button 
                                        onClick={() => toggleSpace(space.id)}
                                        className="flex-1 flex items-start gap-2 text-left min-w-0 pr-6"
                                    >
                                        {isSpaceExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-zinc-555 shrink-0 mt-0.5" />
                                        ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-zinc-555 shrink-0 mt-0.5" />
                                        )}
                                        <span className={cn(
                                            "w-2.5 h-2.5 rounded-full shrink-0 border border-white/10 mt-1",
                                            colorClasses[spaceColor] || "bg-zinc-500"
                                        )} />
                                        <span className="font-bold text-[11px] uppercase tracking-wider text-zinc-200 pr-1 flex-1 min-w-0 break-words whitespace-normal leading-normal">{space.name}</span>
                                        {spaceTotalTasks > 0 && (
                                            <span className="text-[8px] font-black tracking-tighter px-1.5 py-0.5 rounded bg-emerald-950/45 text-emerald-450 border border-emerald-500/10 shrink-0 select-none ml-1 mt-0.5">
                                                {spaceProgressPercent}%
                                            </span>
                                        )}
                                        {!isSpaceOwner && (
                                            <Badge className="bg-zinc-800 text-[8px] tracking-widest font-black uppercase text-zinc-400 border-zinc-700 shrink-0 h-4 mt-0.5">
                                                {isSpaceViewer ? "Ver" : "Edit"}
                                            </Badge>
                                        )}
                                    </button>

                                    {/* Action Buttons */}
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto flex items-center gap-1 transition-opacity shrink-0 bg-zinc-900 border border-zinc-800/80 px-1 py-0.5 rounded-md shadow-lg z-10">
                                        {/* Share Space Trigger (Only visible for Owner) */}
                                        {isSpaceOwner && (
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-6 w-6 text-zinc-555 hover:text-zinc-300 hover:bg-zinc-800"
                                                title="Compartilhar Espaço"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setSharingSpace(space);
                                                }}
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}

                                        {/* Edit Space Trigger (Only visible for Owner) */}
                                        {isSpaceOwner && (
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-6 w-6 text-zinc-555 hover:text-zinc-300 hover:bg-zinc-800"
                                                title="Configurações do Espaço"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setFormName(space.name);
                                                    setFormColor(space.color || "zinc");
                                                    setActiveModal({ type: "edit_space", spaceId: space.id });
                                                }}
                                            >
                                                <Settings className="w-3.5 h-3.5" />
                                            </Button>
                                        )}

                                        {/* Create Folder (Blocked for Viewer) */}
                                        {!isSpaceViewer && (
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-6 w-6 text-zinc-555 hover:text-zinc-300 hover:bg-zinc-800"
                                                title="Nova Pasta"
                                                onClick={() => {
                                                    setFormName("");
                                                    setActiveModal({ type: "folder", spaceId: space.id });
                                                }}
                                            >
                                                <FolderPlus className="w-3.5 h-3.5" />
                                            </Button>
                                        )}

                                        {/* Create List (Blocked for Viewer) */}
                                        {!isSpaceViewer && (
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-6 w-6 text-zinc-555 hover:text-zinc-300 hover:bg-zinc-800"
                                                title="Nova Checklist"
                                                onClick={() => {
                                                    setFormName("");
                                                    setIsTemplate(false);
                                                    setActiveModal({ type: "list", spaceId: space.id, folderId: null });
                                                }}
                                            >
                                                <FilePlus className="w-3.5 h-3.5" />
                                            </Button>
                                        )}

                                        {/* Delete Space (Only visible for Owner) */}
                                        {isSpaceOwner && (
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-6 w-6 text-zinc-555 hover:text-red-400 hover:bg-red-950/20"
                                                onClick={(e) => initiateDeleteSpace(space.id, space.name, e)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Space Children */}
                                {isSpaceExpanded && (
                                    <div className="pl-4 space-y-1.5 border-l border-zinc-800/80 ml-3.5 mt-1">
                                        {/* Folders */}
                                        <SortableContext items={space.folders.map((f: any) => "folder-" + f.id)} strategy={verticalListSortingStrategy}>
                                            {space.folders.map((folder: any) => {
                                                const isFolderExpanded = expandedFolders[folder.id];
                                                
                                                // Calculate folder statistics
                                                let folderTotalTasks = 0;
                                                let folderCompletedTasks = 0;
                                                folder.lists?.forEach((l: any) => {
                                                    folderTotalTasks += l.tasks?.length || 0;
                                                    folderCompletedTasks += l.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;
                                                });

                                                return (
                                                    <SortableItem key={folder.id} id={"folder-" + folder.id} className="space-y-1">
                                                    <div className="group relative flex items-center justify-between p-1.5 rounded hover:bg-zinc-900/40 transition-colors">
                                                        <button 
                                                            onClick={() => toggleFolder(folder.id)}
                                                            className="flex-1 flex items-start gap-1.5 text-left min-w-0 pr-6"
                                                        >
                                                            {isFolderExpanded ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-zinc-550 shrink-0 mt-0.5" />
                                                            ) : (
                                                                <ChevronRight className="w-3.5 h-3.5 text-zinc-550 shrink-0 mt-0.5" />
                                                            )}
                                                            <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                                                            <span className="font-semibold text-[10px] uppercase tracking-wider text-zinc-400 flex-1 min-w-0 break-words whitespace-normal leading-normal">{folder.name}</span>
                                                            {folderTotalTasks > 0 && (
                                                                <span className="text-[8px] text-zinc-500 font-bold ml-1.5 shrink-0 select-none bg-zinc-900 border border-zinc-800/80 px-1 py-0.2 rounded mt-0.5">
                                                                    {folderCompletedTasks}/{folderTotalTasks}
                                                                </span>
                                                            )}
                                                        </button>
                                                        
                                                        {/* Folder Actions (Blocked for Viewer) */}
                                                                                                                {!isSpaceViewer && (
                                                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto flex items-center gap-0.5 transition-opacity shrink-0 bg-zinc-900 border border-zinc-800/80 px-0.5 py-0.5 rounded shadow-md z-10">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            className="h-5 w-5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                            }}
                                                                        >
                                                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="noir-glass border-zinc-800 text-zinc-300">
                                                                        <DropdownMenuItem 
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setFormName("");
                                                                                setIsTemplate(false);
                                                                                setActiveModal({ type: "list", spaceId: space.id, folderId: folder.id });
                                                                            }}
                                                                            className="hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                        >
                                                                            <Plus className="w-3.5 h-3.5 mr-2" /> Nova Checklist
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setFormName(`${folder.name} - Cópia`);
                                                                                setTargetSpaceId(space.id);
                                                                                setActiveModal({ type: "duplicate_folder", folderId: folder.id, spaceId: space.id });
                                                                            }}
                                                                            className="hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                        >
                                                                            <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar Pasta
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setTargetSpaceId(space.id);
                                                                                setActiveModal({ type: "move_folder", folderId: folder.id, spaceId: space.id });
                                                                            }}
                                                                            className="hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                        >
                                                                            <Move className="w-3.5 h-3.5 mr-2" /> Mover Pasta
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={(e) => initiateDeleteFolder(folder.id, folder.name, e)}
                                                                            className="hover:bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir Pasta
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        )}
                                                    </div>
 
                                                    {/* Folder Lists */}
                                                    {isFolderExpanded && (
                                                        <div className="pl-4 space-y-1 border-l border-zinc-800/40 ml-3 mt-1">
                                                            <SortableContext items={folder.lists.map((l: any) => "list-" + l.id)} strategy={verticalListSortingStrategy}>
                                                                {folder.lists.map((list: any) => {
                                                                    const isActive = pathname === `/processes/${list.id}`;
                                                                    const listTotalTasks = list.tasks?.length || 0;
                                                                    const listCompletedTasks = list.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;

                                                                    return (
                                                                        <SortableItem key={list.id} id={"list-" + list.id}>
                                                                            <Link 
                                                                                href={`/processes/${list.id}`}
                                                                                className={cn(
                                                                                    "group relative flex items-center justify-between p-1.5 rounded transition-all text-left min-w-0",
                                                                                    isActive 
                                                                                        ? "bg-white/10 text-white font-bold border border-white/5 shadow-sm" 
                                                                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/30"
                                                                                )}
                                                                            >
                                                                                <div className="flex items-start gap-1.5 flex-1 min-w-0 pr-6">
                                                                                    <FileSpreadsheet className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", isActive ? "text-white" : "text-zinc-600")} />
                                                                                    <span className="text-[10px] uppercase tracking-wider flex-1 min-w-0 break-words whitespace-normal leading-normal">{list.name}</span>
                                                                                    {listTotalTasks > 0 && (
                                                                                        <span className="text-[8px] text-zinc-650 font-bold ml-1 select-none mt-0.5 shrink-0">
                                                                                            ({listCompletedTasks}/{listTotalTasks})
                                                                                        </span>
                                                                                    )}
                                                                                    {list.isTemplate && (
                                                                                        <Sparkles className="w-2.5 h-2.5 text-zinc-500 shrink-0 mt-0.5" />
                                                                                    )}
                                                                                </div>
                                                                                                                        {!isSpaceViewer && (
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button 
                                                                                        size="icon" 
                                                                                        variant="ghost" 
                                                                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto h-5 w-5 text-zinc-555 hover:text-zinc-300 hover:bg-zinc-800 shrink-0 bg-zinc-900 border border-zinc-850 shadow-sm z-10"
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                        }}
                                                                                    >
                                                                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end" className="noir-glass border-zinc-800 text-zinc-300">
                                                                                    <DropdownMenuItem 
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setFormName(`${list.name} - Cópia`);
                                                                                            setTargetSpaceId(space.id);
                                                                                            setTargetFolderId(folder.id);
                                                                                            setActiveModal({ type: "copy_list", listId: list.id, spaceId: space.id, folderId: folder.id });
                                                                                        }}
                                                                                        className="hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                                    >
                                                                                        <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar Checklist
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem 
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setTargetSpaceId(space.id);
                                                                                            setTargetFolderId(folder.id);
                                                                                            setActiveModal({ type: "move_list", listId: list.id, spaceId: space.id, folderId: folder.id });
                                                                                        }}
                                                                                        className="hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                                    >
                                                                                        <Move className="w-3.5 h-3.5 mr-2" /> Mover Checklist
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem 
                                                                                        onClick={(e) => initiateDeleteList(list.id, list.name, e)}
                                                                                        className="hover:bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir Checklist
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        )}
                                                                            </Link>
                                                                        </SortableItem>
                                                                    );
                                                                })}
                                                            </SortableContext>
                                                        </div>
                                                    )}
                                                </SortableItem>
                                                );
                                            })}
                                        </SortableContext>
 
                                        {/* Direct Space Lists */}
                                        <SortableContext items={space.lists.map((l: any) => "list-" + l.id)} strategy={verticalListSortingStrategy}>
                                            {space.lists.map((list: any) => {
                                                const isActive = pathname === `/processes/${list.id}`;
                                                const listTotalTasks = list.tasks?.length || 0;
                                                const listCompletedTasks = list.tasks?.filter((t: any) => t.status === "COMPLETED").length || 0;

                                                return (
                                                    <SortableItem key={list.id} id={"list-" + list.id}>
                                                        <Link 
                                                            href={`/processes/${list.id}`}
                                                            className={cn(
                                                                "group relative flex items-center justify-between p-1.5 rounded transition-all text-left min-w-0",
                                                                isActive 
                                                                    ? "bg-white/10 text-white font-bold border border-white/5 shadow-sm" 
                                                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/30"
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-1.5 flex-1 min-w-0 pr-6">
                                                                <FileSpreadsheet className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", isActive ? "text-white" : "text-zinc-600")} />
                                                                <span className="text-[10px] uppercase tracking-wider flex-1 min-w-0 break-words whitespace-normal leading-normal">{list.name}</span>
                                                                {listTotalTasks > 0 && (
                                                                    <span className="text-[8px] text-zinc-500 font-bold ml-1 select-none mt-0.5 shrink-0">
                                                                        ({listCompletedTasks}/{listTotalTasks})
                                                                    </span>
                                                                )}
                                                                {list.isTemplate && (
                                                                    <Sparkles className="w-2.5 h-2.5 text-zinc-500 shrink-0 mt-0.5" />
                                                                )}
                                                            </div>
                                                                                                                        {!isSpaceViewer && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button 
                                                                            size="icon" 
                                                                            variant="ghost" 
                                                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto h-5 w-5 text-zinc-555 hover:text-zinc-300 hover:bg-zinc-800 shrink-0 bg-zinc-900 border border-zinc-850 shadow-sm z-10"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                            }}
                                                                        >
                                                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="noir-glass border-zinc-800 text-zinc-300">
                                                                        <DropdownMenuItem 
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setFormName(`${list.name} - Cópia`);
                                                                                setTargetSpaceId(space.id);
                                                                                setTargetFolderId(null);
                                                                                setActiveModal({ type: "copy_list", listId: list.id, spaceId: space.id, folderId: null });
                                                                            }}
                                                                            className="hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                        >
                                                                            <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar Checklist
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setTargetSpaceId(space.id);
                                                                                setTargetFolderId(null);
                                                                                setActiveModal({ type: "move_list", listId: list.id, spaceId: space.id, folderId: null });
                                                                            }}
                                                                            className="hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                        >
                                                                            <Move className="w-3.5 h-3.5 mr-2" /> Mover Checklist
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            onClick={(e) => initiateDeleteList(list.id, list.name, e)}
                                                                            className="hover:bg-red-950/20 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider py-1.5 cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir Checklist
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </Link>
                                                    </SortableItem>
                                                );
                                            })}
                                        </SortableContext>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                </div>
            </DndContext>

            {/* Dialog for Space / Folder / List creation, editing, copying and moving */}
            {activeModal && (
                <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
                    <DialogContent className="noir-glass border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white uppercase tracking-wider text-sm font-bold">
                                {activeModal.type === "space" && "Criar Espaço de Trabalho"}
                                {activeModal.type === "edit_space" && "Configurações do Espaço"}
                                {activeModal.type === "folder" && "Criar Pasta"}
                                {activeModal.type === "list" && "Criar Checklist"}
                                {activeModal.type === "duplicate_folder" && "Duplicar Pasta"}
                                {activeModal.type === "move_folder" && "Mover Pasta"}
                                {activeModal.type === "copy_list" && "Duplicar Checklist"}
                                {activeModal.type === "move_list" && "Mover Checklist"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            {activeModal.type === "duplicate_folder" && (
                                <p className="text-zinc-400 text-xs">
                                    Esta ação criará uma pasta idêntica com todas as checklists e tarefas internas redefinidas para pendente no espaço de destino.
                                </p>
                            )}
                            {activeModal.type === "copy_list" && (
                                <p className="text-zinc-400 text-xs">
                                    Esta ação criará uma checklist idêntica com todas as tarefas redefinidas para pendente no destino selecionado.
                                </p>
                            )}
                            {activeModal.type === "move_folder" && (
                                <p className="text-zinc-400 text-xs">
                                    Esta ação moverá a pasta e todas as checklists internas para o espaço de destino selecionado.
                                </p>
                            )}
                            {activeModal.type === "move_list" && (
                                <p className="text-zinc-400 text-xs">
                                    Esta ação moverá a checklist para o espaço e pasta de destino selecionados.
                                </p>
                            )}

                            {/* Name Input - Only for creation, rename/edit, and duplicate actions */}
                            {(activeModal.type === "space" || 
                              activeModal.type === "edit_space" || 
                              activeModal.type === "folder" || 
                              activeModal.type === "list" || 
                              activeModal.type === "duplicate_folder" || 
                              activeModal.type === "copy_list") && (
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Nome</label>
                                    <Input 
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="Ex: Comercial, Rotina Semanal..."
                                        className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-white"
                                    />
                                </div>
                            )}

                            {/* Space Selection - For copy/move actions */}
                            {(activeModal.type === "duplicate_folder" || 
                              activeModal.type === "move_folder" || 
                              activeModal.type === "copy_list" || 
                              activeModal.type === "move_list") && (
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
                                        {localSpaces.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Folder Selection - Only for List copy/move actions */}
                            {(activeModal.type === "copy_list" || activeModal.type === "move_list") && (
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Pasta de Destino</label>
                                    <select
                                        value={targetFolderId || ""}
                                        onChange={(e) => setTargetFolderId(e.target.value || null)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-350 rounded-lg p-2.5 text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-zinc-700"
                                    >
                                        <option value="">Nenhuma pasta (Raiz do espaço)</option>
                                        {(localSpaces.find(s => s.id === targetSpaceId)?.folders || []).map((f: any) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Indicator Color Selection - Only for Spaces */}
                            {(activeModal.type === "space" || activeModal.type === "edit_space") && (
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Cor do Indicador</label>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                className={cn(
                                                    "w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-105 active:scale-95",
                                                    colorClasses[color.value],
                                                    formColor === color.value && "ring-2 ring-offset-2 ring-zinc-100"
                                                )}
                                                onClick={() => setFormColor(color.value)}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Options specific to List Creation */}
                            {activeModal.type === "list" && (
                                <div className="flex items-center gap-2 pt-2">
                                    <input 
                                        type="checkbox"
                                        id="isTemplateCheckbox"
                                        checked={isTemplate}
                                        onChange={(e) => setIsTemplate(e.target.checked)}
                                        className="h-4 w-4 bg-zinc-900 border-zinc-800 rounded focus:ring-0 cursor-pointer accent-white"
                                    />
                                    <label htmlFor="isTemplateCheckbox" className="text-xs text-zinc-400 font-bold uppercase tracking-wide cursor-pointer select-none">
                                        Salvar como Procedimento Fixo (Template)
                                    </label>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" className="text-zinc-500 hover:text-zinc-300 font-bold uppercase text-xs" onClick={() => setActiveModal(null)}>Cancelar</Button>
                            <Button 
                                className="bg-white text-black hover:bg-zinc-200 font-bold uppercase text-xs"
                                onClick={() => {
                                    if (activeModal.type === "space") handleCreateSpace();
                                    if (activeModal.type === "edit_space" && activeModal.spaceId) handleUpdateSpace(activeModal.spaceId);
                                    if (activeModal.type === "folder" && activeModal.spaceId) handleCreateFolder(activeModal.spaceId);
                                    if (activeModal.type === "list" && activeModal.spaceId) handleCreateList(activeModal.spaceId, activeModal.folderId);
                                    if (activeModal.type === "duplicate_folder" && activeModal.folderId && activeModal.spaceId) {
                                        handleDuplicateFolder(activeModal.folderId, activeModal.spaceId);
                                    }
                                    if (activeModal.type === "move_folder" && activeModal.folderId) {
                                        handleMoveFolder(activeModal.folderId);
                                    }
                                    if (activeModal.type === "copy_list" && activeModal.listId) {
                                        handleDuplicateList(activeModal.listId);
                                    }
                                    if (activeModal.type === "move_list" && activeModal.listId) {
                                        handleMoveList(activeModal.listId);
                                    }
                                }}
                            >
                                {activeModal.type === "duplicate_folder" || activeModal.type === "copy_list" ? "Duplicar" : 
                                 activeModal.type === "move_folder" || activeModal.type === "move_list" ? "Mover" :
                                 activeModal.type === "edit_space" ? "Salvar" : "Criar"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ClickUp-style Space Sharing Dialog */}
            {sharingSpace && (
                <Dialog open={!!sharingSpace} onOpenChange={(open) => !open && setSharingSpace(null)}>
                    <DialogContent className="noir-glass border-zinc-800 text-white w-full max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-xs sm:text-sm">
                                <Users className="w-5 h-5 text-zinc-400" />
                                <span>Compartilhar: {sharingSpace.name}</span>
                            </DialogTitle>
                        </DialogHeader>

                        {/* Invite Form */}
                        <div className="space-y-4 py-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-black">E-mail ou CPF do Usuário</label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={inviteEmailOrCpf}
                                        onChange={(e) => setInviteEmailOrCpf(e.target.value)}
                                        placeholder="Ex: 000.000.000-00 ou email@provedor.com"
                                        className="bg-zinc-900 border-zinc-800 text-white flex-1 text-xs"
                                        disabled={isSharingPending}
                                    />
                                    
                                    <select 
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as any)}
                                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-2.5 text-xs font-bold uppercase tracking-wide focus:outline-none"
                                        disabled={isSharingPending}
                                    >
                                        <option value="VIEWER">Leitor</option>
                                        <option value="EDITOR">Editor</option>
                                    </select>

                                    <Button 
                                        onClick={handleShareSpace}
                                        disabled={isSharingPending || !inviteEmailOrCpf.trim()}
                                        className="bg-white text-black hover:bg-zinc-200 font-bold uppercase text-[10px] tracking-wider px-4 shrink-0 h-9"
                                    >
                                        Convidar
                                    </Button>
                                </div>
                            </div>

                            {/* Active Shares List */}
                            <div className="space-y-2 mt-4">
                                <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-black block">Quem tem acesso ({sharingSpace.shares?.length || 0})</label>
                                <div className="max-h-48 overflow-y-auto space-y-2 no-scrollbar">
                                    {/* Owner display */}
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-850/40">
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span className="text-xs font-bold text-zinc-300 truncate">Proprietário</span>
                                        </div>
                                        <Badge className="bg-white/10 text-white border-white/15 uppercase text-[8px] tracking-wider font-bold h-4">Dono</Badge>
                                    </div>

                                    {/* Shares */}
                                    {(!sharingSpace.shares || sharingSpace.shares.length === 0) ? (
                                        <p className="text-[10px] text-zinc-650 italic text-center py-4 uppercase font-semibold">Este espaço não está compartilhado com outros usuários.</p>
                                    ) : (
                                        sharingSpace.shares.map((share: any) => (
                                            <div key={share.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 border border-zinc-800 hover:border-zinc-750 transition-colors">
                                                <div className="flex flex-col min-w-0 pr-2">
                                                    <span className="text-xs font-black text-white truncate">{share.user?.name || "Usuário"}</span>
                                                    <span className="text-[9px] text-zinc-500 truncate">{share.user?.email || share.user?.document}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={share.role}
                                                        onChange={async (e) => {
                                                            const newRole = e.target.value as "VIEWER" | "EDITOR";
                                                            const res = await shareSpace(sharingSpace.id, share.user?.email || share.user?.document, newRole);
                                                            if (res.success) {
                                                                toast.success("Permissão atualizada!");
                                                                startTransition(() => router.refresh());
                                                            } else {
                                                                toast.error(res.error || "Erro ao atualizar permissão");
                                                            }
                                                        }}
                                                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide focus:outline-none cursor-pointer"
                                                    >
                                                        <option value="VIEWER">Leitor</option>
                                                        <option value="EDITOR">Editor</option>
                                                    </select>

                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 shrink-0"
                                                        onClick={() => handleUnshareSpace(share.userId)}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button 
                                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs w-full py-2"
                                onClick={() => setSharingSpace(null)}
                            >
                                Fechar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Premium Confirm Delete Modal for Spaces, Folders, and Lists */}
            {confirmDelete && (
                <ConfirmModal
                    isOpen={confirmDelete.isOpen}
                    onOpenChange={(open) => !open && setConfirmDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title={
                        confirmDelete.type === "space" ? "Excluir Espaço de Trabalho?" :
                        confirmDelete.type === "folder" ? "Excluir Pasta?" :
                        "Excluir Checklist?"
                    }
                    description={
                        confirmDelete.type === "space"
                            ? `Esta ação removerá permanentemente o Espaço de Trabalho "${confirmDelete.name}" e todas as pastas e checklists contidas nele. Esta operação não pode ser desfeita.`
                            : confirmDelete.type === "folder"
                            ? `Esta ação removerá permanentemente a Pasta "${confirmDelete.name}" e todas as checklists contidas nela. Esta operação não pode ser desfeita.`
                            : `Esta ação removerá permanentemente a Checklist "${confirmDelete.name}" e todas as suas tarefas. Esta operação não pode ser desfeita.`
                    }
                    confirmText="Excluir"
                    cancelText="Cancelar"
                />
            )}
        </div>
    );
}
