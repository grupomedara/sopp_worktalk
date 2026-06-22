import { Button } from "@/components/ui/button";
import { Search, Target, Calendar } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getGoals } from "@/app/actions/goals";
import { NewGoalDialog } from "@/components/goals/NewGoalDialog";
import { ObjectiveActions } from "@/components/goals/ObjectiveActions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
    const result = await getGoals();
    const goals = result.data || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Objetivos</h2>
                    <p className="text-muted-foreground text-sm">
                        Defina e acompanhe suas metas de longo prazo.
                    </p>
                </div>
                <div className="w-full sm:w-auto">
                    <NewGoalDialog />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {goals.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Target className="mx-auto h-12 w-12 opacity-50 mb-3" />
                        <p>Nenhum objetivo definido ainda.</p>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <Card key={goal.id} className="relative overflow-hidden flex flex-col h-full">
                            <div className={`absolute top-0 left-0 w-1 h-full 
                ${goal.status === 'COMPLETED' ? 'bg-green-500' : ''}
                ${goal.status === 'IN_PROGRESS' ? 'bg-blue-500' : ''}
                ${goal.status === 'PENDING' ? 'bg-yellow-500' : ''}
              `} />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2">{goal.lifeArea}</Badge>
                                    <ObjectiveActions goal={goal} />
                                </div>
                                <CardTitle className="text-lg">{goal.title}</CardTitle>
                                <div
                                    className="text-sm text-muted-foreground line-clamp-3 break-words [&>p]:m-0 mt-1"
                                    dangerouslySetInnerHTML={{ __html: goal.motivation || "" }}
                                />
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Progresso</span>
                                            <span>{goal.progress || 0}%</span>
                                        </div>
                                        <Progress value={goal.progress || 0} className="h-2" />
                                    </div>

                                    {goal.metric && (
                                        <div className="text-sm bg-secondary/50 p-2 rounded">
                                            <span className="font-semibold text-xs uppercase text-muted-foreground block mb-1">Métrica</span>
                                            {goal.metric}
                                        </div>
                                    )}

                                    {goal.deadline && (
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {format(new Date(goal.deadline), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
