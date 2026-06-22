import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, KanbanSquare, Target, Activity, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { AgileProjectCard } from "@/components/agile/AgileProjectCard";
import { getGoals } from "@/app/actions/goals";
import { getPeople } from "@/app/actions/people";

export default async function AgileDashboard() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const [projects, goalsResult, peopleResult] = await Promise.all([
        db.project.findMany({
            where: { 
                type: "AGILE",
                OR: [
                    { ownerId: session.user.id },
                    { shares: { some: { userId: session.user.id } } }
                ]
            },
            include: {
                sprints: { 
                    where: { status: "ACTIVE" },
                    take: 1
                },
                _count: {
                    select: {
                        tasks: true,
                        objectives: true,
                    }
                },
                tasks: {
                    where: { status: "COMPLETED" },
                    select: { id: true }
                },
                shares: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                document: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        getGoals(),
        getPeople()
    ]);

    const goals = goalsResult.data || [];
    const people = peopleResult.data || [];

    return (
        <div className="space-y-12 pb-20 mt-10">
            {/* Executive Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative border-l-4 border-primary pl-6">
                    <h2 className="text-4xl sm:text-7xl font-black tracking-tighter uppercase leading-[0.8] mb-2">
                        AGILE<br />MODULE
                    </h2>
                    <div className="flex items-center space-x-4">
                        <p className="text-xs font-bold tracking-[0.4em] text-muted-foreground uppercase">
                            Operational Excellence & Sprint Management
                        </p>
                    </div>
                </div>
                <div className="w-full sm:w-auto">
                    <ProjectDialog
                        goals={goals}
                        people={people}
                        initialData={{ type: 'AGILE' }}
                    />
                </div>
            </div>

            {/* Project Grid - Dense Strategic Layout */}
            <div className="grid gap-px bg-border border border-border grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {projects.length === 0 ? (
                    <div className="col-span-full p-20 bg-card flex flex-col items-center justify-center text-center border-dashed border-2 border-border/50">
                        <KanbanSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-black uppercase tracking-widest mb-2">Nenhum sistema ativo</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Inicie um novo projeto ágil para começar a gerenciar.</p>
                        <ProjectDialog
                            goals={goals}
                            people={people}
                            initialData={{ type: 'AGILE' }}
                            trigger={
                                <Button variant="outline" className="font-bold tracking-widest uppercase text-xs">
                                    <Plus className="mr-2 h-4 w-4" /> Criar Projeto
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    projects.map((project) => (
                        <AgileProjectCard
                            key={project.id}
                            project={project}
                            goals={goals}
                            people={people}
                            currentUserId={session.user.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
