"use client";

import { Note, Person, Project } from "@prisma/client";
import { NoteDialog } from "@/components/notes/NoteDialog";
import { Button } from "@/components/ui/button";
import { StickyNote, BrainCircuit, Edit, Trash2, Calendar, User, Search } from "lucide-react";
import { deleteNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface NotesTabProps {
    project: any;
    people: Person[];
    projects: Project[];
}

export function NotesTab({ project, people, projects }: NotesTabProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const notes = project.notes || [];

    const filteredNotes = notes.filter((note: any) => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.theme?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteClick = (id: string) => {
        setNoteToDelete(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!noteToDelete) return;
        const result = await deleteNote(noteToDelete);
        if (result.success) {
            toast.success("Nota excluída com sucesso!");
        } else {
            toast.error("Erro ao excluir nota.");
        }
        setNoteToDelete(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar notas..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <NoteDialog 
                    people={people} 
                    projects={projects}
                    initialData={{ projectId: project.id, context: project.context }}
                    trigger={
                        <Button className="w-full sm:w-auto font-bold uppercase tracking-widest text-[10px] h-9">
                            <StickyNote className="mr-2 h-4 w-4" /> Adicionar Nota
                        </Button>
                    }
                />
            </div>

            {filteredNotes.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/5">
                    <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Nenhuma nota encontrada vinculada a este projeto.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map((note: any) => (
                        <div key={note.id} className="group relative bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    {note.type === "MINDMAP" ? <BrainCircuit className="h-5 w-5" /> : <StickyNote className="h-5 w-5" />}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <NoteDialog 
                                        people={people} 
                                        projects={projects}
                                        initialData={note}
                                        trigger={
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 hover:text-red-500"
                                        onClick={() => handleDeleteClick(note.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg mb-1 leading-tight">{note.title}</h3>
                            {note.theme && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-3 block">
                                    {note.theme}
                                </span>
                            )}
                            
                            <div className="text-sm text-muted-foreground line-clamp-3 mb-6 min-h-[4.5rem]" 
                                 dangerouslySetInnerHTML={{ __html: note.content || "Sem conteúdo..." }} 
                            />

                            <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-zinc-800/50">
                                <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <Calendar className="mr-1.5 h-3 w-3" />
                                    {format(new Date(note.createdAt), "dd MMM yy", { locale: ptBR })}
                                </div>
                                {note.people?.length > 0 && (
                                    <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <User className="mr-1.5 h-3 w-3" />
                                        {note.people[0].name} {note.people.length > 1 && `+${note.people.length - 1}`}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={handleConfirmDelete}
                title="Excluir Nota"
                description="Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
            />
        </div>
    );
}
