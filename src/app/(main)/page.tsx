import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import {
  Layers, ClipboardList, StickyNote, ArrowRight,
  BrainCircuit, ShieldCheck
} from "lucide-react";
import { getTodayRoutines } from "@/app/actions/routines";
import { DashboardWidget } from "@/components/routines/DashboardWidget";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const prisma = db;

async function getDashboardData() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const dateStr = format(now, "yyyy-MM-dd");

  const [
    spaces,
    pendingTasks,
    completedTodayCount,
    recentNotes,
    todaysRoutinesResult
  ] = await Promise.all([
    // Spaces owned by or shared with user
    prisma.space.findMany({
      where: {
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      },
      include: {
        folders: { include: { lists: true } },
        lists: { where: { folderId: null } }
      }
    }),
    // Pending tasks under lists (Processes)
    prisma.task.findMany({
      where: { 
        userId, 
        status: { in: ["PENDING", "IN_PROGRESS"] },
        listId: { not: null },
        deletedAt: null
      },
      include: { 
        list: { 
          select: { 
            name: true, 
            space: { select: { name: true } } 
          } 
        } 
      },
      take: 5,
      orderBy: { date: "asc" }
    }),
    // Tasks completed today
    prisma.task.count({
      where: { 
        userId, 
        status: "COMPLETED", 
        listId: { not: null },
        updatedAt: { gte: todayStart, lte: todayEnd },
        deletedAt: null
      }
    }),
    // Recent Notes / Mindmaps
    prisma.note.findMany({
      where: {
        OR: [
          { userId },
          { shares: { some: { userId } } }
        ]
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    // Today's Routines
    getTodayRoutines(dateStr)
  ]);

  return {
    dateStr,
    spaces,
    pendingTasks,
    completedTodayCount,
    recentNotes,
    todaysRoutines: todaysRoutinesResult.success ? todaysRoutinesResult.data || [] : []
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getDashboardData();
  if (!data) return null;

  // Stats calculation
  const totalSpaces = data.spaces.length;
  let totalFolders = 0;
  let totalLists = 0;
  data.spaces.forEach(s => {
    totalFolders += s.folders.length;
    totalLists += s.lists.length;
    s.folders.forEach(f => {
      totalLists += f.lists.length;
    });
  });

  const now = new Date();
  const formattedDate = format(now, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative border-l-4 border-primary pl-6">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-[0.8] mb-2">
          DASHBOARD CENTRAL
        </h2>
        <p className="text-[9px] font-bold tracking-[0.45em] text-muted-foreground uppercase">
          {formattedDate} — SISTEMA DE PERFORMANCE E CHECKLISTS
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-zinc-950/80 p-6 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-zinc-900/40 group">
          <span className="text-3xl font-black text-white group-hover:scale-115 transition-transform duration-300">
            {totalSpaces}
          </span>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Espaços ativos</span>
        </div>
        <div className="bg-zinc-950/80 p-6 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-zinc-900/40 group">
          <span className="text-3xl font-black text-blue-400 group-hover:scale-115 transition-transform duration-300">
            {totalLists}
          </span>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Listas Processos</span>
        </div>
        <div className="bg-zinc-950/80 p-6 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-zinc-900/40 group">
          <span className="text-3xl font-black text-emerald-400 group-hover:scale-115 transition-transform duration-300">
            {data.todaysRoutines.length}
          </span>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Rotinas do dia</span>
        </div>
        <div className="bg-zinc-950/80 p-6 flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-zinc-900/40 group">
          <span className="text-3xl font-black text-orange-400 group-hover:scale-115 transition-transform duration-300">
            {data.completedTodayCount}
          </span>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Tarefas Feitas Hoje</span>
        </div>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column (Routines & Checklists) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-950/40 backdrop-blur-xl glow-card-rotinas p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              Rotinas & SOPs de Hoje
            </h3>
            <DashboardWidget initialRoutines={data.todaysRoutines} dateStr={data.dateStr} />
          </div>

          {/* Pending Tasks */}
          <div className="bg-zinc-950/40 backdrop-blur-xl glow-card-processos p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Tarefas de Processo Pendentes
              </h3>
              <Link href="/processes" className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1 hover:underline">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data.pendingTasks.length === 0 ? (
              <p className="text-xs text-zinc-500 uppercase tracking-widest text-center py-6">Nenhuma tarefa pendente.</p>
            ) : (
              <div className="divide-y divide-zinc-900">
                {data.pendingTasks.map((task) => (
                  <div key={task.id} className="py-3 flex items-center justify-between text-xs hover:bg-white/[0.01] px-1 rounded transition-colors duration-200">
                     <div className="space-y-1">
                      <p className="font-bold text-white">{task.title}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                        {task.list?.space?.name} / {task.list?.name}
                      </p>
                    </div>
                    {task.date && (
                      <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                        {format(new Date(task.date), "dd/MM HH:mm")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (Recent Notes & Quick Access) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Notes & Mindmaps */}
          <div className="bg-zinc-950/40 backdrop-blur-xl glow-card-notas p-6 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-orange-400" />
                Notas & Mapas Mentais Recentes
              </h3>
              <Link href="/notes" className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1 hover:underline">
                Abrir Notas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data.recentNotes.length === 0 ? (
              <p className="text-xs text-zinc-500 uppercase tracking-widest text-center py-6">Nenhuma anotação recente.</p>
            ) : (
              <div className="space-y-2">
                {data.recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={note.type === "MINDMAP" && note.mindMapId ? `/visual/${note.mindMapId}` : "/notes"}
                    className={cn(
                      "p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-lg flex items-center gap-3 transition-all cursor-pointer block",
                      note.type === "MINDMAP"
                        ? "hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.04)] hover:bg-zinc-900/80"
                        : "hover:border-zinc-700/50 hover:bg-zinc-900/80"
                    )}
                  >
                    {note.type === "MINDMAP" ? (
                      <BrainCircuit className="w-4 h-4 text-orange-400 shrink-0" />
                    ) : (
                      <StickyNote className="w-4 h-4 text-zinc-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{note.title}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                        {format(new Date(note.updatedAt), "dd/MM HH:mm")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info & Help */}
          <div className="p-6 bg-zinc-950/40 backdrop-blur-xl glow-card-primary rounded-xl space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Painel Operacional Simplificado
            </h3>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Este sistema foi simplificado para focar exclusivamente na produtividade operacional: acompanhe processos estruturados em listas (ClickUp), execute rotinas recorrentes de checklists, e crie notas/mapas mentais rápidos compartilháveis com toda a sua equipe.
            </p>
            <div className="pt-2">
              <Link href="/profile">
                <button className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest text-[9px] py-2 rounded transition-colors cursor-pointer">
                  Configurações de Perfil
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
