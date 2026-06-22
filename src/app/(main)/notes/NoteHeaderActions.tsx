"use client";

import { NoteDialog } from "@/components/notes/NoteDialog";
import { Button } from "@/components/ui/button";
import { Plus, BrainCircuit } from "lucide-react";
import { Person, Note, Project } from "@prisma/client";

interface NoteHeaderActionsProps {
    people: Person[];
    notes: Note[];
    projects: Project[];
}

export function NoteHeaderActions({ people, notes, projects }: NoteHeaderActionsProps) {
    return (
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            <NoteDialog
                people={people}
                notes={notes}
                projects={projects}
                trigger={
                    <Button className="flex items-center gap-2 px-6 min-w-[160px] shadow-lg">
                        <Plus className="h-5 w-5" />
                        <span className="font-black">ADICIONAR NOTA</span>
                    </Button>
                }
            />
            <NoteDialog
                people={people}
                notes={notes}
                projects={projects}
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
