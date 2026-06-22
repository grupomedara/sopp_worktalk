"use client";

import { useState, useEffect } from "react";
import { Objective, KeyResult } from "@prisma/client";
import { ObjectiveCard } from "./ObjectiveCard";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
import { OKRDialog } from "./OKRDialog";
import { getProjectObjectives } from "@/app/actions/okrs";

interface OKRTabProps {
    projectId: string;
    context?: string;
}

export function OKRTab({ projectId, context }: OKRTabProps) {
    const [objectives, setObjectives] = useState<(Objective & { keyResults: KeyResult[] })[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchObjectives = async () => {
        setLoading(true);
        const result = await getProjectObjectives(projectId);
        if (result.success) {
            setObjectives(result.data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchObjectives();
    }, [projectId]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Objetivos e Resultados Chave</span>
                </div>
                <OKRDialog projectId={projectId} onSuccess={fetchObjectives} />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
                    {[1, 2].map(i => (
                        <div key={i} className="h-64 bg-muted animate-pulse rounded-lg border-2 border-dashed" />
                    ))}
                </div>
            ) : objectives.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-muted/5">
                    <Target className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <h3 className="text-xl font-black uppercase tracking-tighter text-muted-foreground">Nenhum OKR definido</h3>
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-bold mt-2 text-center max-w-xs">
                        Defina objetivos claros e resultados mensuráveis para este projeto.
                    </p>
                    <OKRDialog
                        projectId={projectId}
                        onSuccess={fetchObjectives}
                        trigger={
                            <Button variant="outline" className="mt-6 font-black uppercase tracking-widest text-[10px] h-9 border-2 hover:bg-primary hover:text-black transition-all">
                                <Plus className="mr-2 h-4 w-4" /> Criar Primeiro OKR
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {objectives.map((objective, index) => (
                        <div key={objective.id} className={`animate-fade-in-up delay-${Math.min((index + 1) * 100, 500)}`}>
                            <ObjectiveCard
                                objective={objective}
                                onUpdate={fetchObjectives}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
