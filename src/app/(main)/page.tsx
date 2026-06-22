import { format, startOfDay, endOfDay, startOfWeek, isToday, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { cn, stripHtml } from "@/lib/utils";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { INCOME_CATEGORIES } from "@/lib/constants/finance";
import {
  AlertCircle, Clock, CheckCircle2, TrendingDown, TrendingUp, Coins,
  Target, Zap, Users, BookOpen, Heart, StickyNote, Calendar,
  BarChart2, Timer, Layers, ArrowRight, Flame, Activity, Circle,
  BookMarked, Shield, ClipboardList
} from "lucide-react";
import { TacticalAgenda } from "@/components/dashboard/TacticalAgenda";
import { TodaysFinancesAlert } from "@/components/dashboard/TodaysFinancesAlert";
import { getTodayRoutines } from "@/app/actions/routines";
import { DashboardWidget } from "@/components/routines/DashboardWidget";

export const dynamic = "force-dynamic";

const prisma = db;

async function getDashboardData() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { locale: ptBR });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    allTasks,
    completedToday,
    upcomingEvents,
    todaysFinances,
    activeSprints,
    activeGoals,
    recentNotes,
    biblePlans,
    readingBooks,
    timeLogsToday,
    timeLogsWeek,
    timeLogsByTask,
    people,
    prayers,
    processes,
    monthFinances,
    allPendingFinance,
    birthdays,
    todaysRoutinesResult,
  ] = await Promise.all([
    // All pending/in-progress tasks
    prisma.task.findMany({
      where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
      include: { project: { select: { name: true, type: true } }, list: { select: { name: true, space: { select: { name: true } } } } },
      orderBy: { date: "asc" },
    }),
    // Tasks completed today
    prisma.task.count({
      where: { userId, status: "COMPLETED", updatedAt: { gte: todayStart, lte: todayEnd } },
    }),
    // Upcoming events (next 5)
    prisma.event.findMany({
      where: { userId, startDate: { gte: now } },
      take: 5,
      orderBy: { startDate: "asc" },
    }),
    // Finances due today or overdue (pending)
    prisma.finance.findMany({
      where: { userId, status: "PENDING", dueDate: { lte: todayEnd } },
      include: { person: true, project: true },
    }),
    // Active sprints
    prisma.sprint.findMany({
      where: { status: "ACTIVE", project: { ownerId: userId } },
      include: {
        project: { select: { name: true, id: true } },
        tasks: { select: { status: true } },
      },
    }),
    // Strategic goals in progress
    prisma.goal.findMany({
      where: { userId, status: { in: ["IN_PROGRESS", "PENDING"] } },
      take: 4,
      orderBy: { createdAt: "asc" },
    }),
    // Recent notes
    prisma.note.findMany({
      where: { userId },
      take: 3,
      orderBy: { updatedAt: "desc" },
    }),
    // Bible plans in progress
    prisma.userBiblePlan.findMany({
      where: { userId, status: "IN_PROGRESS" },
      include: { plan: { select: { title: true, totalDays: true } } },
      take: 3,
    }),
    // Books being read
    prisma.book.findMany({
      where: { userId, status: "READING" },
      take: 3,
    }),
    // TimeLogs today
    prisma.timeLog.aggregate({
      where: { userId, startTime: { gte: todayStart, lte: todayEnd } },
      _sum: { duration: true },
    }),
    // TimeLogs this week
    prisma.timeLog.aggregate({
      where: { userId, startTime: { gte: weekStart, lte: weekEndFallback(now) } }, // using now for week end
      _sum: { duration: true },
    }),
    // TimeLogs by task (for top tasks today)
    prisma.timeLog.findMany({
      where: { userId, startTime: { gte: todayStart, lte: todayEnd } },
      include: { task: { select: { title: true } } },
    }),
    // People count
    prisma.person.count({ where: { userId } }),
    // Active prayers
    prisma.prayer.count({ where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    // Processes (Spaces > Lists with tasks)
    prisma.space.findMany({
      where: { userId },
      include: {
        lists: {
          include: {
            tasks: { 
              select: { 
                id: true,
                title: true,
                status: true,
                startedAt: true,
                completedAt: true,
                responsible: { select: { name: true } }
              } 
            },
          },
          take: 5,
        },
      },
      take: 3,
    }),
    // This month finances
    prisma.finance.findMany({
      where: { userId, dueDate: { gte: monthStart, lte: monthEnd } },
    }),
    // All pending finances
    prisma.finance.findMany({ where: { userId, status: "PENDING" } }),
    // Birthdays this month
    prisma.person.findMany({
      where: { userId, kind: "FISICA", birthDate: { not: null } },
      select: { name: true, birthDate: true },
    }),
    // Today's routines
    getTodayRoutines(format(now, "yyyy-MM-dd")),
  ]);

  // --- Task classification ---
  const today = startOfDay(now);
  const lateTasks = allTasks.filter(t => t.date && isBefore(new Date(t.date), today));
  const todayTasks = allTasks.filter(t => t.date && isToday(new Date(t.date)));
  const noDateTasks = allTasks.filter(t => !t.date);
  const totalPending = allTasks.length;

  // --- Time tracking ---
  const secondsToday = timeLogsToday._sum.duration || 0;
  const secondsWeek = timeLogsWeek._sum.duration || 0;

  // Group time by task today
  const timeByTask: Record<string, { title: string; seconds: number }> = {};
  for (const log of timeLogsByTask) {
    if (!timeByTask[log.taskId]) {
      timeByTask[log.taskId] = { title: log.task.title, seconds: 0 };
    }
    timeByTask[log.taskId].seconds += log.duration || 0;
  }
  const topTasksToday = Object.values(timeByTask)
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 4);

  // --- Finance metrics ---
  const calcMetrics = (records: any[]) => {
    let income = 0, expenses = 0, toPay = 0, paid = 0, toReceive = 0, received = 0;
    for (const r of records) {
      const isInc = INCOME_CATEGORIES.includes(r.category);
      const amt = Number(r.amount);
      if (isInc) { income += amt; r.status === "COMPLETED" ? (received += amt) : (toReceive += amt); }
      else { expenses += amt; r.status === "COMPLETED" ? (paid += amt) : (toPay += amt); }
    }
    return { income, expenses, toPay, paid, toReceive, received };
  };
  const monthMetrics = calcMetrics(monthFinances);
  const balance = monthMetrics.income - monthMetrics.expenses;

  // --- Sprints ---
  const sprintData = activeSprints.map(s => {
    const total = s.tasks.length;
    const done = s.tasks.filter(t => t.status === "COMPLETED").length;
    const daysLeft = Math.ceil((new Date(s.endDate).getTime() - now.getTime()) / 86400000);
    return { ...s, progress: total > 0 ? (done / total) * 100 : 0, total, done, daysLeft };
  });

  // --- Bible plans ---
  const bibleData = biblePlans.map(p => ({
    id: p.id,
    title: p.plan.title,
    currentDay: p.currentDay,
    totalDays: p.plan.totalDays,
    progress: p.progress,
  }));

  // --- Reading books ---
  const booksData = readingBooks.map(b => ({
    id: b.id,
    title: b.title,
    author: b.author,
    progress: b.totalChapters > 0 ? (b.currentChapter / b.totalChapters) * 100 : 0,
    current: b.currentChapter,
    total: b.totalChapters,
  }));

  // --- Processes ---
  const activeTasksInProgress: any[] = [];
  const processData = processes.map(space => ({
    id: space.id,
    name: space.name,
    lists: space.lists.map(list => {
      const total = list.tasks.length;
      const done = list.tasks.filter(t => t.status === "COMPLETED").length;
      
      // Collect tasks currently in progress
      list.tasks.forEach((t: any) => {
        if (t.status === "IN_PROGRESS") {
          activeTasksInProgress.push({
            id: t.id,
            title: t.title,
            startedAt: t.startedAt,
            responsibleName: t.responsible?.name,
            listName: list.name,
            listId: list.id,
            spaceName: space.name
          });
        }
      });

      return { id: list.id, name: list.name, total, done, progress: total > 0 ? (done / total) * 100 : 0 };
    }),
  }));

  // --- Birthdays this month ---
  const upcomingBirthdays = birthdays
    .filter(p => p.birthDate && p.birthDate.getMonth() === now.getMonth())
    .sort((a, b) => (a.birthDate?.getDate() || 0) - (b.birthDate?.getDate() || 0));

  // --- Today's Routines ---
  const todaysRoutines = todaysRoutinesResult.success ? todaysRoutinesResult.data || [] : [];
  const routinesCount = todaysRoutines.length;
  let totalRoutineItems = 0;
  let completedRoutineItems = 0;
  
  todaysRoutines.forEach(r => {
    totalRoutineItems += r.totalItems || 0;
    completedRoutineItems += r.completedItems || 0;
  });
  
  const routinesProgress = totalRoutineItems > 0 ? (completedRoutineItems / totalRoutineItems) * 100 : 0;
  const completedRoutinesCount = todaysRoutines.filter(r => r.progress === 100).length;

  return {
    lateTasks, todayTasks, noDateTasks, totalPending, completedToday,
    upcomingEvents, todaysFinances,
    sprintData, activeGoals,
    recentNotes, bibleData, booksData, processData,
    activeTasksInProgress,
    secondsToday, secondsWeek, topTasksToday,
    monthMetrics, balance,
    allPendingFinanceCount: allPendingFinance.length,
    people, prayers,
    upcomingBirthdays,
    todaysRoutines,
    routinesCount,
    routinesProgress,
    completedRoutinesCount,
  };
}

function weekEndFallback(now: Date) {
  return now;
}

function fmtTime(s: number) {
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtCurrency(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function ProgressBar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function SectionHeader({ color, title, href, linkLabel }: { color: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2.5">
        <span className={cn("w-2 h-2 rounded-full", color)} />
        {title}
      </h3>
      {href && (
        <Link href={href} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          {linkLabel || "Ver tudo"} →
        </Link>
      )}
    </div>
  );
}

export default async function Dashboard() {
  const data = await getDashboardData();
  if (!data) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;

  const lateCount = data.lateTasks.length;
  const todayCount = data.todayTasks.length;

  return (
    <div className="space-y-8 pb-20">

      {/* ── HEADER ── */}
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-1">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <h1 className="text-5xl font-black tracking-tighter leading-none">PAINEL DE CONTROLE</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sistema Ativo</span>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-border border border-border">
        {[
          {
            label: "Atrasadas",
            value: lateCount,
            icon: AlertCircle,
            color: lateCount > 0 ? "text-red-500" : "text-muted-foreground",
            bg: lateCount > 0 ? "bg-red-500/5" : "bg-card",
            pulse: lateCount > 0,
          },
          {
            label: "Para Hoje",
            value: todayCount,
            icon: Clock,
            color: todayCount > 0 ? "text-amber-400" : "text-muted-foreground",
            bg: todayCount > 0 ? "bg-amber-500/5" : "bg-card",
            pulse: false,
          },
          {
            label: "Concluídas Hoje",
            value: data.completedToday,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-card",
            pulse: false,
          },
          {
            label: "Tempo Hoje",
            value: fmtTime(data.secondsToday),
            icon: Timer,
            color: "text-blue-400",
            bg: "bg-card",
            pulse: false,
          },
          {
            label: "Saldo do Mês",
            value: fmtCurrency(data.balance),
            icon: data.balance >= 0 ? TrendingUp : TrendingDown,
            color: data.balance >= 0 ? "text-emerald-500" : "text-red-500",
            bg: data.balance >= 0 ? "bg-card" : "bg-red-500/5",
            pulse: false,
          },
          {
            label: "Finc. Pendentes",
            value: data.allPendingFinanceCount,
            icon: Coins,
            color: data.allPendingFinanceCount > 0 ? "text-amber-400" : "text-muted-foreground",
            bg: "bg-card",
            pulse: false,
          },
          {
            label: "Sprints Ativos",
            value: data.sprintData.length,
            icon: Zap,
            color: data.sprintData.length > 0 ? "text-primary" : "text-muted-foreground",
            bg: "bg-card",
            pulse: false,
          },
          {
            label: "Rotinas Hoje",
            value: `${Math.round(data.routinesProgress)}%`,
            icon: ClipboardList,
            color: data.routinesProgress === 100 ? "text-emerald-500" : data.routinesProgress > 0 ? "text-blue-400" : "text-muted-foreground",
            bg: "bg-card",
            pulse: data.routinesProgress > 0 && data.routinesProgress < 100,
          },
        ].map((item, i) => (
          <div key={i} className={cn("p-4 flex flex-col gap-2", item.bg)}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
              <item.icon className={cn("h-3.5 w-3.5", item.color, item.pulse && "animate-pulse")} />
            </div>
            <span className={cn("text-2xl font-black tracking-tighter", item.color)}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* ── FINANÇAS DO DIA ALERT ── */}
      <TodaysFinancesAlert finances={data.todaysFinances} />

      {/* ── GRID PRINCIPAL 3 COLUNAS ── */}
      <div className="grid gap-8 lg:grid-cols-3">

        {/* ================= COLUNA 1: OPERACIONAL E FOCO ================= */}
        <div className="space-y-8">
          
          {/* Tarefas Críticas */}
          <div>
            <SectionHeader color="bg-red-500" title="Ações Críticas" href="/tasks" linkLabel="Ver todas" />
            <div className="flex flex-col gap-4">
              {/* Atrasadas */}
              <div className={cn("border rounded-lg overflow-hidden", lateCount > 0 ? "border-red-500/40" : "border-border")}>
                <div className={cn("px-3 py-2 flex items-center justify-between", lateCount > 0 ? "bg-red-500/10" : "bg-muted/30")}>
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" /> Atrasadas
                  </span>
                  <span className="text-[10px] font-black text-red-500">{lateCount}</span>
                </div>
                <div className="divide-y divide-border">
                  {lateCount === 0 ? (
                    <div className="p-4 text-center text-muted-foreground opacity-40">
                      <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-[9px] font-bold uppercase">Limpo</p>
                    </div>
                  ) : data.lateTasks.slice(0, 4).map(t => (
                    <Link key={t.id} href="/tasks" className="flex items-start gap-2 p-2.5 hover:bg-muted/40 transition-colors group">
                      <Circle className={cn("h-3 w-3 mt-0.5 shrink-0", t.priority === "High" ? "text-red-500" : t.priority === "Medium" ? "text-amber-500" : "text-muted-foreground")} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate">{t.title}</p>
                        <p className="text-[9px] text-muted-foreground">{t.date ? format(new Date(t.date), "dd/MM") : ""}</p>
                      </div>
                    </Link>
                  ))}
                  {lateCount > 4 && (
                    <Link href="/tasks" className="flex items-center justify-center gap-1 p-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                      +{lateCount - 4} mais <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Para Hoje */}
              <div className={cn("border rounded-lg overflow-hidden", todayCount > 0 ? "border-amber-500/40" : "border-border")}>
                <div className={cn("px-3 py-2 flex items-center justify-between", todayCount > 0 ? "bg-amber-500/10" : "bg-muted/30")}>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Para Hoje
                  </span>
                  <span className="text-[10px] font-black text-amber-400">{todayCount}</span>
                </div>
                <div className="divide-y divide-border">
                  {todayCount === 0 ? (
                    <div className="p-4 text-center text-muted-foreground opacity-40">
                      <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-[9px] font-bold uppercase">Livre</p>
                    </div>
                  ) : data.todayTasks.slice(0, 4).map(t => (
                    <Link key={t.id} href="/tasks" className="flex items-start gap-2 p-2.5 hover:bg-muted/40 transition-colors">
                      <Circle className={cn("h-3 w-3 mt-0.5 shrink-0", t.priority === "High" ? "text-red-500" : t.priority === "Medium" ? "text-amber-500" : "text-muted-foreground")} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate">{t.title}</p>
                        {t.project && <p className="text-[9px] text-primary font-bold truncate">{t.project.name}</p>}
                      </div>
                    </Link>
                  ))}
                  {todayCount > 4 && (
                    <Link href="/tasks" className="flex items-center justify-center gap-1 p-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                      +{todayCount - 4} mais <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Sem Data */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between bg-muted/30">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Sem Data
                  </span>
                  <span className="text-[10px] font-black text-muted-foreground">{data.noDateTasks.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {data.noDateTasks.length === 0 ? (
                    <div className="p-4 text-center opacity-40">
                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Nenhuma</p>
                    </div>
                  ) : data.noDateTasks.slice(0, 4).map(t => (
                    <Link key={t.id} href="/tasks" className="flex items-start gap-2 p-2.5 hover:bg-muted/40 transition-colors">
                      <Circle className={cn("h-3 w-3 mt-0.5 shrink-0", t.priority === "High" ? "text-red-500" : t.priority === "Medium" ? "text-amber-500" : "text-muted-foreground")} />
                      <p className="text-[11px] font-bold truncate">{t.title}</p>
                    </Link>
                  ))}
                  {data.noDateTasks.length > 4 && (
                    <Link href="/tasks" className="flex items-center justify-center gap-1 p-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                      +{data.noDateTasks.length - 4} mais <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div>
            <SectionHeader color="bg-blue-500" title="Rastreamento de Tempo" href="/tasks" linkLabel="Tarefas" />
            <div className="grid gap-px bg-border border border-border grid-cols-2">
              <div className="bg-card p-5 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Hoje</p>
                <p className="text-3xl font-black tracking-tighter text-blue-400">{fmtTime(data.secondsToday)}</p>
              </div>
              <div className="bg-card p-5 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Esta Semana</p>
                <p className="text-3xl font-black tracking-tighter text-blue-400">{fmtTime(data.secondsWeek)}</p>
              </div>
            </div>
            {data.topTasksToday.length > 0 && (
              <div className="mt-3 border border-border rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 border-b border-border">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Top Tarefas Hoje</p>
                </div>
                <div className="divide-y divide-border">
                  {data.topTasksToday.map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5">
                      <p className="text-[11px] font-bold truncate flex-1">{t.title}</p>
                      <span className="text-[11px] font-black text-blue-400 ml-2 shrink-0">{fmtTime(t.seconds)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Processos (Spaces/Lists) */}
          {data.processData.length > 0 && (
            <div>
              <SectionHeader color="bg-emerald-500" title="Processos" href="/processes" linkLabel="Ver espaços" />
              <div className="space-y-3">
                {data.processData.map(space => (
                  <div key={space.id} className="border border-border rounded-lg overflow-hidden bg-card">
                    <div className="px-3 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
                      <Layers className="h-3 w-3 text-emerald-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-100">{space.name}</p>
                    </div>
                    <div className="divide-y divide-border">
                      {space.lists.map(list => (
                        <div key={list.id} className="px-3 py-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Link href={`/processes/${list.id}`} className="text-[11px] font-bold hover:text-emerald-400 transition-colors truncate">
                              {list.name}
                            </Link>
                            <span className="text-[9px] font-black text-muted-foreground shrink-0 ml-2">{list.done}/{list.total}</span>
                          </div>
                          {list.total > 0 && <ProgressBar value={list.progress} color="bg-emerald-500" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Real-time active execution metrics */}
                {data.activeTasksInProgress.length > 0 && (
                  <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg overflow-hidden mt-3">
                    <div className="px-3 py-2 border-b border-emerald-500/25 bg-emerald-500/10 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 font-bold">
                        <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-400" /> Em Execução Ativa
                      </span>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-widest">
                        {data.activeTasksInProgress.length} rodando
                      </span>
                    </div>
                    <div className="divide-y divide-emerald-500/10">
                      {data.activeTasksInProgress.map((task: any) => {
                        const elapsedMs = new Date().getTime() - new Date(task.startedAt).getTime();
                        const elapsedMins = Math.floor(elapsedMs / 60000);
                        const elapsedText = elapsedMins < 60 
                          ? `${elapsedMins}m` 
                          : elapsedMins < 1440 
                          ? `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m` 
                          : `${Math.floor(elapsedMins / 1440)}d`;

                        return (
                          <Link key={task.id} href={`/processes/${task.listId}`} className="block p-3 hover:bg-emerald-500/10 transition-colors group">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors truncate">
                                  {task.title}
                                </p>
                                <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                                  {task.spaceName} ➔ {task.listName}
                                </p>
                              </div>
                              <span className="shrink-0 text-[10px] font-black text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10 whitespace-nowrap">
                                <Clock className="w-3 h-3 text-emerald-400 shrink-0" /> {elapsedText}
                              </span>
                            </div>
                            {task.responsibleName && (
                              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 flex items-center gap-1.5">
                                <Users className="w-3 h-3 text-zinc-650" /> {task.responsibleName}
                              </p>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rotinas Operacionais (SOP) */}
          <div>
            <SectionHeader color="bg-emerald-500" title="Rotinas & SOPs" href="/routines" linkLabel="Checklists" />
            <DashboardWidget initialRoutines={data.todaysRoutines} dateStr={format(new Date(), "yyyy-MM-dd")} />
          </div>

        </div>


        {/* ================= COLUNA 2: PROJETOS E CONHECIMENTO ================= */}
        <div className="space-y-8">
          
          {/* Sprints Agile */}
          {data.sprintData.length > 0 && (
            <div>
              <SectionHeader color="bg-primary" title="Sprints Ativos (Agile)" href="/agile" linkLabel="Gerenciar" />
              <div className="space-y-3">
                {data.sprintData.map(sprint => (
                  <Link key={sprint.id} href={`/agile/${sprint.projectId}`}>
                    <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 hover:bg-primary/10 transition-all group space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">{sprint.name}</p>
                          <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">{sprint.project.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black tracking-tighter">{Math.round(sprint.progress)}%</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                            {sprint.daysLeft > 0 ? `${sprint.daysLeft}d restantes` : "Encerrado"}
                          </p>
                        </div>
                      </div>
                      <ProgressBar value={sprint.progress} color="bg-primary" />
                      <div className="flex items-center gap-4 text-[9px] font-black uppercase text-muted-foreground">
                        <span className="text-emerald-500">{sprint.done} concluídas</span>
                        <span>{sprint.total - sprint.done} pendentes</span>
                        <span>{sprint.total} total</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Metas */}
          {data.activeGoals.length > 0 && (
            <div>
              <SectionHeader color="bg-yellow-500" title="Metas Ativas" href="/goals" linkLabel="Todas" />
              <div className="space-y-3">
                {data.activeGoals.map(goal => (
                  <Link key={goal.id} href="/goals">
                    <div className="border border-border rounded-lg p-3.5 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all group space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-tight leading-tight group-hover:text-yellow-500 transition-colors">{goal.title}</p>
                          <p className="text-[8px] text-muted-foreground font-bold uppercase mt-0.5">{goal.lifeArea}</p>
                        </div>
                        <span className="text-base font-black text-yellow-500 shrink-0">{goal.progress}%</span>
                      </div>
                      <ProgressBar value={goal.progress} color="bg-yellow-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Notas Recentes */}
          <div>
            <SectionHeader color="bg-violet-500" title="Notas Recentes" href="/notes" linkLabel="Todas notas" />
            <div className="flex flex-col gap-3">
              {data.recentNotes.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-lg text-center text-muted-foreground text-[10px] uppercase font-bold opacity-50">
                  Nenhuma nota recente
                </div>
              ) : data.recentNotes.map(note => (
                <Link key={note.id} href={`/notes?id=${note.id}`}>
                  <div className="border border-border rounded-lg p-3.5 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group space-y-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-violet-400 opacity-70">{note.theme || note.context}</p>
                    <p className="text-[11px] font-bold leading-snug group-hover:text-violet-400 transition-colors line-clamp-2">{note.title}</p>
                    <p className="text-[9px] text-muted-foreground line-clamp-2 opacity-70 leading-relaxed">{stripHtml(note.content || "")}</p>
                    <p className="text-[8px] font-bold text-muted-foreground opacity-40">{format(new Date(note.updatedAt), "dd MMM")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Planos Bíblicos */}
          {data.bibleData.length > 0 && (
            <div>
              <SectionHeader color="bg-amber-600" title="Leitura Bíblica" href="/spiritual" linkLabel="Espiritual" />
              <div className="space-y-3">
                {data.bibleData.map(plan => (
                  <Link key={plan.id} href="/spiritual">
                    <div className="border border-amber-600/20 rounded-lg p-3.5 bg-amber-600/5 hover:bg-amber-600/10 transition-all space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-black leading-snug">{plan.title}</p>
                        <span className="text-[10px] font-black text-amber-500 shrink-0">Dia {plan.currentDay}/{plan.totalDays}</span>
                      </div>
                      <ProgressBar value={(plan.currentDay / plan.totalDays) * 100} color="bg-amber-500" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Livros */}
          {data.booksData.length > 0 && (
            <div>
              <SectionHeader color="bg-indigo-500" title="Leituras Ativas" href="/studies" linkLabel="Biblioteca" />
              <div className="space-y-3">
                {data.booksData.map(book => (
                  <div key={book.id} className="border border-border rounded-lg p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black leading-snug truncate">{book.title}</p>
                        <p className="text-[9px] text-muted-foreground">{book.author}</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-400 shrink-0">{book.current}/{book.total} cap.</span>
                    </div>
                    <ProgressBar value={book.progress} color="bg-indigo-500" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* ================= COLUNA 3: CONTROLE DIÁRIO E PESSOAS ================= */}
        <div className="space-y-8">
          
          {/* Agenda Próxima */}
          <TacticalAgenda appointments={data.upcomingEvents} finances={data.todaysFinances} />

          {/* Finanças do Mês */}
          <div>
            <SectionHeader color="bg-emerald-500" title="Finanças do Mês" href="/finance" linkLabel="Detalhes" />
            <div className="space-y-2">
              {[
                { label: "A Pagar", value: data.monthMetrics.toPay, color: "text-red-500", icon: TrendingDown },
                { label: "Pago", value: data.monthMetrics.paid, color: "text-emerald-500", icon: CheckCircle2 },
                { label: "A Receber", value: data.monthMetrics.toReceive, color: "text-amber-400", icon: Coins },
                { label: "Recebido", value: data.monthMetrics.received, color: "text-blue-400", icon: TrendingUp },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{item.label}</span>
                  </div>
                  <span className={cn("text-sm font-black tracking-tighter", item.color)}>{fmtCurrency(item.value)}</span>
                </div>
              ))}
              <div className={cn("flex items-center justify-between p-3 rounded-lg border", data.balance >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30")}>
                <span className="text-[10px] font-black uppercase tracking-wider">Saldo Líquido</span>
                <span className={cn("text-base font-black tracking-tighter", data.balance >= 0 ? "text-emerald-500" : "text-red-500")}>{fmtCurrency(data.balance)}</span>
              </div>
            </div>
          </div>

          {/* Stats compactas */}
          <div>
            <SectionHeader color="bg-muted-foreground" title="Visão Geral" />
            <div className="grid grid-cols-2 gap-px bg-border border border-border">
              {[
                { label: "Pessoas", value: data.people, icon: Users, color: "text-pink-400", href: "/people" },
                { label: "Orações", value: data.prayers, icon: Shield, color: "text-amber-400", href: "/spiritual" },
              ].map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className="bg-card p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                      <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                    </div>
                    <span className={cn("text-2xl font-black tracking-tighter", item.color)}>{item.value}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Aniversários do Mês */}
          {data.upcomingBirthdays.length > 0 && (
            <div>
              <SectionHeader color="bg-pink-500" title="Aniversários do Mês" href="/people" />
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {data.upcomingBirthdays.slice(0, 5).map(p => (
                  <div key={p.name} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 font-black text-[10px] shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold truncate">{p.name}</p>
                      <p className="text-[8px] text-muted-foreground">{format(p.birthDate!, "dd 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                    <Heart className="h-3 w-3 text-pink-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
