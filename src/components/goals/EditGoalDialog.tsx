"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GoalForm } from "@/components/goals/GoalForm";

interface EditGoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    goal: any;
}

export function EditGoalDialog({ open, onOpenChange, goal }: EditGoalDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Objetivo</DialogTitle>
                </DialogHeader>
                <GoalForm
                    onSuccess={() => onOpenChange(false)}
                    initialData={{
                        title: goal.title,
                        lifeArea: goal.lifeArea,
                        deadline: goal.deadline ? new Date(goal.deadline) : undefined,
                        metric: goal.metric || "",
                        motivation: goal.motivation || "",
                        status: goal.status,
                        progress: goal.progress || 0,
                    }}
                    goalId={goal.id}
                />
            </DialogContent>
        </Dialog>
    );
}
