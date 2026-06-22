"use client";

import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BookOpen, Clock, TrendingUp, Target } from "lucide-react";
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Study {
    id: string;
    course: string;
    subject: string;
    timeSpent?: number | null;
    createdAt: Date;
}

interface StudyMetricsProps {
    studies: Study[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

export function StudyMetrics({ studies }: StudyMetricsProps) {
    const [monthlyGoal, setMonthlyGoal] = useState(20); // hours
    const [editingGoal, setEditingGoal] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("sopp_study_monthly_goal");
            if (saved) {
                setMonthlyGoal(Number(saved));
            }
        }
    }, []);

    const handleGoalSave = (val: number) => {
        setMonthlyGoal(val);
        if (typeof window !== "undefined") {
            localStorage.setItem("sopp_study_monthly_goal", val.toString());
        }
    };

    const stats = useMemo(() => {
        const now = new Date();
        const totalHours = studies.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / 60;

        // Current month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStudies = studies.filter(s => new Date(s.createdAt) >= monthStart);
        const monthHours = monthStudies.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / 60;

        // By course
        const byCourse: Record<string, number> = {};
        studies.forEach(s => {
            byCourse[s.course] = (byCourse[s.course] || 0) + (s.timeSpent || 0) / 60;
        });
        const topCourse = Object.entries(byCourse).sort((a, b) => b[1] - a[1])[0];

        // Last 4 weeks
        const weeks = Array.from({ length: 4 }, (_, i) => {
            const weekStart = startOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
            const weekEnd = endOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
            const hours = studies
                .filter(s => isWithinInterval(new Date(s.createdAt), { start: weekStart, end: weekEnd }))
                .reduce((sum, s) => sum + (s.timeSpent || 0), 0) / 60;
            return {
                name: format(weekStart, "dd/MM", { locale: ptBR }),
                horas: parseFloat(hours.toFixed(1)),
            };
        });

        return { totalHours, monthHours, topCourse, weeks };
    }, [studies]);

    const progress = Math.min((stats.monthHours / monthlyGoal) * 100, 100);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Card: Total */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Total Registros</span>
                </div>
                <p className="text-3xl font-black">{studies.length}</p>
                <p className="text-xs text-muted-foreground">{stats.totalHours.toFixed(1)}h acumuladas</p>
            </div>

            {/* Card: Este Mês + Meta */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">Este Mês</span>
                    </div>
                    {!editingGoal ? (
                        <button onClick={() => setEditingGoal(true)} className="text-xs text-muted-foreground hover:text-foreground underline">
                            Meta: {monthlyGoal}h
                        </button>
                    ) : (
                        <input
                            type="number"
                            className="w-14 text-xs bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5"
                            value={monthlyGoal}
                            onChange={e => handleGoalSave(Number(e.target.value))}
                            onBlur={() => setEditingGoal(false)}
                            autoFocus
                        />
                    )}
                </div>
                <p className="text-3xl font-black">{stats.monthHours.toFixed(1)}h</p>
                <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${progress}%`,
                            background: progress >= 100 ? "#22c55e" : progress >= 60 ? "#f59e0b" : "#6366f1"
                        }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% da meta</p>
            </div>

            {/* Card: Top Disciplina */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Mais Estudada</span>
                </div>
                <p className="text-xl font-black truncate">{stats.topCourse?.[0] || "—"}</p>
                <p className="text-xs text-muted-foreground">{stats.topCourse?.[1].toFixed(1) || 0}h registradas</p>
            </div>

            {/* Card: Gráfico Semanal */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wider">Últimas 4 Semanas</span>
                </div>
                <ResponsiveContainer width="100%" height={60}>
                    <BarChart data={stats.weeks} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717a" }} />
                        <YAxis tick={{ fontSize: 9, fill: "#71717a" }} />
                        <Tooltip
                            contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 11 }}
                            formatter={(v: any) => [`${v}h`, "Horas"]}
                        />
                        <Bar dataKey="horas" radius={[2, 2, 0, 0]}>
                            {stats.weeks.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
