"use client";

import { Objective, KeyResult } from "@prisma/client";
import { Progress } from "@/components/ui/progress";
import { KeyResultItem } from "./KeyResultItem";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteObjective } from "@/app/actions/okrs";
import { toast } from "sonner";
import { stripHtml, cn } from "@/lib/utils";
import { OKRDialog } from "./OKRDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ObjectiveCardProps {
    objective: Objective & { keyResults: KeyResult[] };
    onUpdate: () => void;
    context?: string;
}

export function ObjectiveCard({ objective, onUpdate, context }: ObjectiveCardProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const contextClass = context ? context.toLowerCase().replace(/_/g, '-') : 'primary';
    const contextBadgeClass = `context-badge-${contextClass}`;
    const contextColorClass = `bg-[hsl(var(--context-${contextClass}))]`;

    const totalTarget = objective.keyResults.length * 100;
    const currentProgress = objective.keyResults.reduce((acc, kr) => {
        const progress = (kr.currentValue / kr.targetValue) * 100;
        return acc + Math.min(progress, 100);
    }, 0);

    const percentage = totalTarget > 0 ? (currentProgress / totalTarget) * 100 : 0;

    const handleDelete = async () => {
        const result = await deleteObjective(objective.id, objective.projectId);
        if (result.success) {
            toast.success("Objetivo removido");
            onUpdate();
        } else {
            toast.error("Erro ao remover objetivo");
        }
        setDeleteOpen(false);
    };

    return (
        <Card className="bg-card/50 border-2 overflow-hidden transition-all hover:border-primary/20 glow-hover">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-black uppercase tracking-tighter leading-tight">
                                {objective.title}
                            </h3>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", contextBadgeClass)}>
                                {Math.round(percentage)}%
                            </span>
                        </div>
                        {objective.description && (
                            <p className="text-xs text-muted-foreground font-medium line-clamp-2">
                                {stripHtml(objective.description)}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                        <OKRDialog 
                            projectId={objective.projectId}
                            onSuccess={onUpdate}
                            initialData={objective}
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            }
                        />
                        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Deseja excluir este objetivo? Todos os resultados-chave vinculados serão removidos permanentemente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={handleDelete}
                                    >
                                        Sim, Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="mt-4 space-y-1">
                    <Progress value={percentage} className="h-1.5 bg-muted/30" indicatorClassName={contextColorClass} />
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="pt-0 space-y-2">
                    <div className="border-t border-border/50 pt-4 space-y-3">
                        {objective.keyResults.length === 0 ? (
                            <p className="text-[10px] text-center py-4 text-muted-foreground uppercase font-black tracking-widest">
                                Sem resultados-chave vinculados
                            </p>
                        ) : (
                            objective.keyResults.map((kr) => (
                                <KeyResultItem
                                    key={kr.id}
                                    kr={kr}
                                    projectId={objective.projectId}
                                    onUpdate={onUpdate}
                                />
                            ))
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
