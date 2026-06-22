"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Circle, Clock, MessageSquare, StickyNote, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectViewDialogProps {
    project: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProjectViewDialog({ project, open, onOpenChange }: ProjectViewDialogProps) {
    if (!project) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col noir-glass border-white/10 p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4 border-b border-white/5">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-primary/20 text-primary">
                                    Projeto Simples
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                                    {project.context}
                                </span>
                            </div>
                            <DialogTitle className="text-4xl font-black tracking-tighter uppercase leading-none mt-2">
                                {project.name}
                            </DialogTitle>
                            {project.goal && (
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Meta: {project.goal.title}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="tasks" className="flex-1 flex flex-col min-h-0">
                    <div className="px-8 border-b border-white/5 bg-white/[0.02]">
                        <TabsList className="bg-transparent h-12 gap-6">
                            <TabsTrigger 
                                value="tasks" 
                                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-black uppercase text-[10px] tracking-widest gap-2"
                            >
                                <CheckCircle2 className="h-3 w-3" />
                                Tarefas ({project.tasks?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="notes" 
                                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-black uppercase text-[10px] tracking-widest gap-2"
                            >
                                <StickyNote className="h-3 w-3" />
                                Notas ({project.notes?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="team" 
                                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 font-black uppercase text-[10px] tracking-widest gap-2"
                            >
                                <User className="h-3 w-3" />
                                Time ({project.people?.length || 0})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-8">
                        <TabsContent value="tasks" className="mt-0 space-y-4 outline-none">
                            {(!project.tasks || project.tasks.length === 0) ? (
                                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                                    <p className="text-xs uppercase font-bold text-muted-foreground">Nenhuma tarefa vinculada.</p>
                                </div>
                            ) : (
                                project.tasks.map((task: any) => (
                                    <div key={task.id} className="p-4 bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            {task.status === 'COMPLETED' ? (
                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground/30" />
                                            )}
                                            <div>
                                                <h4 className={cn(
                                                    "text-sm font-bold uppercase tracking-tight",
                                                    task.status === 'COMPLETED' && "line-through opacity-50"
                                                )}>
                                                    {task.title}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground opacity-60">
                                                        {task.priority} Priority
                                                    </span>
                                                    {task.date && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground opacity-60">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(task.date), "dd MMM yyyy", { locale: ptBR })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] font-black uppercase opacity-40 group-hover:opacity-100 transition-opacity">
                                            {task.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="notes" className="mt-0 space-y-4 outline-none">
                            {(!project.notes || project.notes.length === 0) ? (
                                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                                    <p className="text-xs uppercase font-bold text-muted-foreground">Nenhuma nota vinculada.</p>
                                </div>
                            ) : (
                                project.notes.map((note: any) => (
                                    <div key={note.id} className="p-5 bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-sm font-bold uppercase tracking-widest text-primary/80">
                                                {note.title}
                                            </h4>
                                            <span className="text-[9px] font-bold text-muted-foreground opacity-50">
                                                {format(new Date(note.createdAt), "dd/MM/yyyy")}
                                            </span>
                                        </div>
                                        <div 
                                            className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: note.content || '' }}
                                        />
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                            <MessageSquare className="h-3 w-3 text-muted-foreground opacity-40" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">
                                                Insight vinculada ao projeto
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="team" className="mt-0 space-y-2 outline-none">
                             {(!project.people || project.people.length === 0) ? (
                                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                                    <p className="text-xs uppercase font-bold text-muted-foreground">Ninguém envolvido.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {project.people.map((person: any) => (
                                        <div key={person.id} className="p-4 bg-white/[0.03] border border-white/5 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                                                {person.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">{person.name}</p>
                                                <p className="text-[8px] text-muted-foreground uppercase font-bold">{person.company || 'Individual'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
