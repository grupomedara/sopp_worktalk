"use client";

import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, Clock, TrendingUp, Target, Calendar } from "lucide-react";
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks, format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meeting {
    id: string;
    companyOrPerson: string;
    theme: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    createdAt: Date;
}

interface MeetingMetricsProps {
    meetings: Meeting[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1"];

export function MeetingMetrics({ meetings }: MeetingMetricsProps) {
    const [monthlyGoal, setMonthlyGoal] = useState(10); // Number of meetings
    const [editingGoal, setEditingGoal] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("sopp_meeting_monthly_goal");
            if (saved) {
                setMonthlyGoal(Number(saved));
            }
        }
    }, []);

    const handleGoalSave = (val: number) => {
        setMonthlyGoal(val);
        if (typeof window !== "undefined") {
            localStorage.setItem("sopp_meeting_monthly_goal", val.toString());
        }
    };

    const stats = useMemo(() => {
        const now = new Date();
        const totalDurationMinutes = meetings.reduce((sum, m) => {
            const diff = differenceInMinutes(new Date(m.endTime), new Date(m.startTime));
            return sum + (isNaN(diff) ? 0 : diff);
        }, 0);
        const totalHours = totalDurationMinutes / 60;

        // Current month meetings count
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthMeetings = meetings.filter(m => new Date(m.date) >= monthStart);
        const monthCount = monthMeetings.length;

        // By companyOrPerson
        const byCompany: Record<string, number> = {};
        meetings.forEach(m => {
            byCompany[m.companyOrPerson] = (byCompany[m.companyOrPerson] || 0) + 1;
        });
        const topCompany = Object.entries(byCompany).sort((a, b) => b[1] - a[1])[0];

        // Last 4 weeks count
        const weeks = Array.from({ length: 4 }, (_, i) => {
            const weekStart = startOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
            const weekEnd = endOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
            const count = meetings
                .filter(m => isWithinInterval(new Date(m.date), { start: weekStart, end: weekEnd }))
                .length;
            return {
                name: format(weekStart, "dd/MM", { locale: ptBR }),
                meetingsCount: count,
            };
        });

        return { totalHours, monthCount, topCompany, weeks };
    }, [meetings]);

    const progress = Math.min((stats.monthCount / monthlyGoal) * 100, 100);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Card: Total */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40 backdrop-blur-md">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Total Reuniões</span>
                </div>
                <p className="text-3xl font-black">{meetings.length}</p>
                <p className="text-xs text-muted-foreground">{stats.totalHours.toFixed(1)}h em reuniões</p>
            </div>

            {/* Card: Este Mês + Meta */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40 backdrop-blur-md">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-xs uppercase tracking-wider font-semibold">Este Mês</span>
                    </div>
                    {!editingGoal ? (
                        <button onClick={() => setEditingGoal(true)} className="text-xs text-muted-foreground hover:text-foreground underline">
                            Meta: {monthlyGoal}
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
                <p className="text-3xl font-black">{stats.monthCount}</p>
                <div className="mt-2 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${progress}%`,
                            background: progress >= 100 ? "#10b981" : progress >= 60 ? "#f59e0b" : "#3b82f6"
                        }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% da meta</p>
            </div>

            {/* Card: Top Conexão */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40 backdrop-blur-md">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Principal Conexão</span>
                </div>
                <p className="text-lg font-black truncate text-foreground">{stats.topCompany?.[0] || "—"}</p>
                <p className="text-xs text-muted-foreground">{stats.topCompany?.[1] || 0} reuniões</p>
            </div>

            {/* Card: Gráfico Semanal */}
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40 backdrop-blur-md">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs uppercase tracking-wider font-semibold">Frequência Semanal</span>
                </div>
                <ResponsiveContainer width="100%" height={60}>
                    <BarChart data={stats.weeks} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717a" }} />
                        <YAxis tick={{ fontSize: 9, fill: "#71717a" }} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, fontSize: 11 }}
                            formatter={(v: any) => [v, "Reuniões"]}
                        />
                        <Bar dataKey="meetingsCount" radius={[2, 2, 0, 0]}>
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
