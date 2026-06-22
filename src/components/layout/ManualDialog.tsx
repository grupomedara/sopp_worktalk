"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    BookOpen, 
    Calendar, 
    CheckSquare, 
    Wallet, 
    Users, 
    Target, 
    StickyNote, 
    LayoutDashboard,
    GraduationCap,
    Info,
    Star
} from "lucide-react";

interface ManualDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManualDialog({ open, onOpenChange }: ManualDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-zinc-950 border-zinc-800">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-primary" />
                        MANUAL DO USUÁRIO <span className="text-primary">SOPP</span>
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Guia rápido para dominar as ferramentas de performance pessoal.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="intro" className="flex flex-col h-full overflow-hidden">
                    <div className="px-6 border-b border-zinc-800">
                        <TabsList className="bg-transparent h-auto p-0 flex-wrap justify-start gap-4 pb-2">
                            <TabsTrigger value="intro" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all">
                                <Info className="w-3.5 h-3.5 mr-2" /> Início
                            </TabsTrigger>
                            <TabsTrigger value="execucao" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all">
                                <Target className="w-3.5 h-3.5 mr-2" /> Execução
                            </TabsTrigger>
                            <TabsTrigger value="pessoas" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all">
                                <Users className="w-3.5 h-3.5 mr-2" /> Pessoas
                            </TabsTrigger>
                            <TabsTrigger value="conhecimento" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all">
                                <BookOpen className="w-3.5 h-3.5 mr-2" /> Conhecimento
                            </TabsTrigger>
                            <TabsTrigger value="financas" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all">
                                <Wallet className="w-3.5 h-3.5 mr-2" /> Finanças
                            </TabsTrigger>
                            <TabsTrigger value="espiritual" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all">
                                <Star className="w-3.5 h-3.5 mr-2" /> Espiritual
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="intro" className="mt-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <LayoutDashboard className="w-5 h-5 text-primary" /> Bem-vindo ao SOPP
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    O SOPP (Sistema Operacional de Performance Pessoal) centraliza sua vida estratégica, tática e operacional.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Visibilidade</h4>
                                    <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4">
                                        <li>Dashboard: Seu centro de comando em tempo real.</li>
                                        <li>Admin: Controle total de usuários e permissões.</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-primary mb-2">Próximos Passos</h4>
                                    <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4">
                                        <li>Defina seus Objetivos na aba Execução.</li>
                                        <li>Organize sua Agenda semanal.</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="execucao" className="mt-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" /> Ciclo de Execução
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-zinc-200">🎯 Objetivos e Projetos</h4>
                                            <p className="text-xs text-zinc-400">Objetivos: Metas macro (ex: Saúde, Carreira). Defina OKRs aqui.</p>
                                            <p className="text-xs text-zinc-400">Projetos: Desdobre objetivos em entregas menores monitoráveis.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-zinc-200">🚀 Agile e Sprints</h4>
                                            <p className="text-xs text-zinc-400">Use Sprints para ciclos de 1-2 semanas. O Kanban visualiza o progresso das tarefas.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-zinc-200">📅 Agenda e Tarefas</h4>
                                            <p className="text-xs text-zinc-400">Eventos: Compromissos com hora marcada.</p>
                                            <p className="text-xs text-zinc-400">Tarefas: Atividades diárias (checklist).</p>
                                            <p className="text-xs text-zinc-400">Recorrência: Configure repetições automáticas para hábitos.</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
                                            Dica: Conecte cada Projeto a um Objetivo para ver sua barra de progresso estratégica subir!
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="pessoas" className="mt-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" /> Gestão de Pessoas (CRM)
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <p className="text-zinc-400 text-xs">Matenha sua rede de contatos organizada e produtiva:</p>
                                    <ul className="text-xs text-zinc-400 list-disc pl-6 space-y-2">
                                        <li>Base Única: Cadastre clientes, fornecedores ou equipe.</li>
                                        <li>Conectividade: Vincule pessoas às suas Notas de reunião.</li>
                                        <li>Histórico: Veja tudo o que foi discutido ou planejado com cada indivíduo.</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="conhecimento" className="mt-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" /> Inteligência e Estudos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-zinc-200">📝 Notas e Wiki</h4>
                                        <ul className="text-xs text-zinc-400 list-disc pl-6 space-y-1">
                                            <li>Brain Dumps: Captura rápida de ideias.</li>
                                            <li>Rich-Text: Use formatação estilo Notion.</li>
                                            <li>Busca: Encontre qualquer ideia instantaneamente.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-zinc-200">🎓 Estudos e Aulas</h4>
                                        <ul className="text-xs text-zinc-400 list-disc pl-6 space-y-1">
                                            <li>Livros: Controle de leitura por capítulos.</li>
                                            <li>Aulas: Planejamento sequencial de aprendizado.</li>
                                            <li>Progresso: Saiba exatamente onde parou.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="financas" className="mt-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-primary" /> Finanças
                                </h3>
                                <div className="space-y-4">
                                    <ul className="text-xs text-zinc-400 list-disc pl-6 space-y-2">
                                        <li>Entradas e Saídas: Registro ágil de movimentações.</li>
                                        <li>Balanço: Visão automática do saldo mensal.</li>
                                        <li>Categorias: Organize por tipo de gasto para análise.</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="espiritual" className="mt-0 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-primary" /> Vida Espiritual
                                </h3>
                                <div className="space-y-4">
                                    <ul className="text-xs text-zinc-400 list-disc pl-6 space-y-2">
                                        <li>Orações: Cadastro de pedidos e monitoramento de respostas.</li>
                                        <li>Leitura Bíblica: Planos automáticos por capítulos.</li>
                                        <li>Versículo: Inspiração diária integrada.</li>
                                    </ul>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                    <p className="text-[10px] text-zinc-500 font-medium tracking-tight">
                        Versão 2.4.0 • SOPP Operational Manual
                    </p>
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                    >
                        Entendido
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
