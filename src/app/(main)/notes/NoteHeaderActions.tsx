"use client";

import { NoteDialog } from "@/components/notes/NoteDialog";
import { Button } from "@/components/ui/button";
import { Plus, BrainCircuit } from "lucide-react";
import { Note } from "@prisma/client";

interface NoteHeaderActionsProps {
    notes: Note[];
}

export function NoteHeaderActions({ notes }: NoteHeaderActionsProps) {
    return (
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            <NoteDialog
                notes={notes}
                trigger={
                    <Button className="flex items-center gap-2 px-6 min-w-[160px] shadow-lg">
                        <Plus className="h-5 w-5" />
                        <span className="font-black">ADICIONAR NOTA</span>
                    </Button>
                }
            />
            <NoteDialog
                notes={notes}
                defaultType="MINDMAP"
                trigger={
                    <Button variant="outline" className="flex items-center gap-2 px-4 min-w-[140px] border-white/40">
                        <BrainCircuit className="h-4 w-4" />
                        <span className="font-bold">BRAIN FLOW</span>
                    </Button>
                }
            />
        </div>
    );
}
