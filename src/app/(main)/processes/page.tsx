import { getSpaces } from "@/app/actions/processes";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FolderKanban, Sparkles, FileSpreadsheet, Layers, ShieldCheck, CalendarRange } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProcessesLandingPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const spacesResult = await getSpaces();
    const spaces = spacesResult.success ? spacesResult.data || [] : [];
    
    // Compute quick stats
    const totalSpaces = spaces.length;
    let totalFolders = 0;
    let totalLists = 0;
    let totalTemplates = 0;

    spaces.forEach(s => {
        totalFolders += s.folders.length;
        totalLists += s.lists.length;
        s.folders.forEach((f: any) => {
            totalLists += f.lists.length;
            totalTemplates += f.lists.filter((l: any) => l.isTemplate).length;
        });
        totalTemplates += s.lists.filter((l: any) => l.isTemplate).length;
    });

    return (
        <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="bg-zinc-950 p-6 flex flex-col justify-center items-center text-center">
                    <span className="text-3xl font-black text-white">{totalSpaces}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Espaços</span>
                </div>
                <div className="bg-zinc-950 p-6 flex flex-col justify-center items-center text-center">
                    <span className="text-3xl font-black text-white">{totalFolders}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Pastas</span>
                </div>
                <div className="bg-zinc-950 p-6 flex flex-col justify-center items-center text-center">
                    <span className="text-3xl font-black text-white">{totalLists}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Checklists</span>
                </div>
                <div className="bg-zinc-950 p-6 flex flex-col justify-center items-center text-center">
                    <span className="text-3xl font-black text-primary animate-pulse">{totalTemplates}</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Procedimentos</span>
                </div>
            </div>

            {/* Instruction Card */}
            <Card className="noir-glass border-zinc-800 overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <FolderKanban className="w-64 h-64 text-white" />
                </div>

                <CardHeader>
                    <CardTitle className="text-white uppercase tracking-wider text-lg font-bold">Gestão Inteligente de Execução</CardTitle>
                    <CardDescription className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                        Planilhas com metadados coloridos, modelos de checklists e rotinas operacionais
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        Bem-vindo ao módulo de **Acompanhamento de Processos**! Aqui você pode organizar toda a execução da sua empresa ou vida pessoal no modelo ClickUp, estruturado em níveis e customizável com colunas inteligentes.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-3">
                            <Layers className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-white text-xs font-black uppercase tracking-wider mb-1">Estrutura em 3 Níveis</h4>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Crie Espaços para Empresas, Pastas para Setores e Listas para checklists específicos e dinâmicos.</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-white text-xs font-black uppercase tracking-wider mb-1">Campos Customizados</h4>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Defina dropdowns com etiquetas coloridas, barras de progressão de tarefas, e-mails, telefones e muito mais.</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-white text-xs font-black uppercase tracking-wider mb-1">Procedimentos Fixos (SOPs)</h4>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Salve qualquer checklist operacional como Modelo (Template) e instancie novos limpos para executar a cada semana.</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-3">
                            <CalendarRange className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-white text-xs font-black uppercase tracking-wider mb-1">Integração com Agenda</h4>
                                <p className="text-zinc-500 text-[11px] leading-relaxed">Qualquer tarefa com data de vencimento e responsável aparecerá instantaneamente no seu Calendário central!</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 text-center">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                            Para iniciar, use a barra lateral esquerda para criar ou selecionar uma Checklist
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
