"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Trash2, Edit, BrainCircuit, ExternalLink, Search, Share2 } from "lucide-react";
import { deleteNote, shareNote, unshareNote } from "@/app/actions/notes";
import { Note, Person, Project } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

import { ContextBadge } from "@/components/ui/ContextBadge";
import { SmartViewer } from "@/components/ui/SmartViewer";
import { NoteDialog } from "@/components/notes/NoteDialog";
import { ShareDialog } from "@/components/common/ShareDialog";

interface NoteWithRelations extends Note {
    people: Person[];
    shares?: any[];
}

interface NoteListProps {
    notes: NoteWithRelations[];
    people: Person[];
    projects: Project[];
    currentUserId?: string;
}

export function NoteList({ notes, people, projects, currentUserId }: NoteListProps) {
    const [editingNote, setEditingNote] = useState<NoteWithRelations | null>(null);
    const [sharingNote, setSharingNote] = useState<NoteWithRelations | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por título..."
                        className="pl-9 bg-zinc-900 border-zinc-800 focus:bg-zinc-800 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground border border-dashed border-zinc-800 rounded-lg bg-zinc-950/50">
                        Nenhuma nota encontrada.
                    </div>
                ) : (
                    filteredNotes.map((note) => {
                        const isOwner = note.userId === currentUserId;
                        const userShare = note.shares?.find((s: any) => s.userId === currentUserId);
                        const hasWriteAccess = isOwner || userShare?.role === "EDITOR";

                        return (
                            <Card key={note.id} className="cursor-pointer hover:shadow-md transition-shadow relative group">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <ContextBadge context={note.context} />
                                            {!isOwner && (
                                                <span className="text-[8px] tracking-widest font-black uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                    {userShare?.role === "EDITOR" ? "Editor" : "Leitor"}
                                                </span>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <div
                                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                                    onClick={() => {
                                                        setEditingNote(note);
                                                    }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" /> {hasWriteAccess ? "Editar" : "Visualizar"}
                                                </div>
                                                {isOwner && (
                                                    <div
                                                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                                                        onClick={() => setSharingNote(note)}
                                                    >
                                                        <Share2 className="mr-2 h-4 w-4 text-primary" /> Compartilhar
                                                    </div>
                                                )}
                                                {hasWriteAccess && (
                                                    <form action={async () => {
                                                        await deleteNote(note.id);
                                                    }}>
                                                        <button type="submit" className="w-full flex items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-red-600 focus:text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </button>
                                                    </form>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg leading-tight">{note.title}</CardTitle>
                                        {note.type === "MINDMAP" && (
                                            <div className="bg-primary/10 text-primary p-1 rounded-sm">
                                                <BrainCircuit className="h-3 w-3" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {note.theme && (
                                    <CardDescription className="text-xs font-medium uppercase tracking-wider mt-1">
                                        {note.theme}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="pb-2">
                                {note.type === "MINDMAP" ? (
                                    <div className="flex flex-col gap-4 py-2">
                                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-1">Espaço Visual</div>
                                        <Button asChild className="w-full bg-zinc-900 border border-white/5 hover:bg-white/10 text-white rounded-xl h-12 gap-2 group/btn">
                                            <Link href={`/visual/${(note as any).mindMapId}`}>
                                                <BrainCircuit className="h-4 w-4 text-primary group-hover/btn:scale-110 transition-transform" />
                                                <span className="font-bold uppercase tracking-widest text-[10px]">Acessar Brain Flow</span>
                                                <ExternalLink className="h-3 w-3 opacity-30 ml-auto" />
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground line-clamp-6">
                                        <SmartViewer
                                            content={note.content || ""}
                                            notes={notes}
                                            people={people}
                                            projects={projects}
                                        />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="pt-2 flex flex-col items-start gap-2">
                                {(() => {
                                    const backlinks = notes.filter(n =>
                                        n.id !== note.id &&
                                        n.content?.toLowerCase().includes(`[[${note.title.toLowerCase()}]]`)
                                    );
                                    if (backlinks.length === 0) return null;
                                    return (
                                        <div className="w-full mb-1 pb-2 border-b border-sidebar-primary/10">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mb-1">Mencionado em:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {backlinks.map(bn => (
                                                    <span key={bn.id} className="text-[10px] text-sidebar-primary hover:underline cursor-pointer bg-sidebar-primary/5 px-1 rounded-sm">
                                                        {bn.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                                {note.people && note.people.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {note.people.map(p => (
                                            <span key={p.id} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm">
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="text-[10px] text-muted-foreground w-full text-right mt-1">
                                    {format(new Date(note.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                </div>
                            </CardFooter>
                        </Card>
                    )})
                )}
            </div>

            <NoteDialog
                people={people}
                notes={notes}
                projects={projects}
                initialData={editingNote || undefined}
                open={!!editingNote}
                onOpenChange={(open) => !open && setEditingNote(null)}
                isReadOnly={editingNote ? !(editingNote.userId === currentUserId || editingNote.shares?.find((s: any) => s.userId === currentUserId)?.role === "EDITOR") : false}
                trigger={<span className="hidden" />}
            />

            {sharingNote && (
                <ShareDialog
                    isOpen={!!sharingNote}
                    onOpenChange={(open) => !open && setSharingNote(null)}
                    title="Compartilhar Nota"
                    shares={sharingNote.shares || []}
                    onShare={async (emailOrCpf, role) => await shareNote(sharingNote.id, emailOrCpf, role)}
                    onUnshare={async (userId) => await unshareNote(sharingNote.id, userId)}
                />
            )}
        </div>
    );
}
