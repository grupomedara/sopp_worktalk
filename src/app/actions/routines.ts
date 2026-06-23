"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { RoutineFrequency } from "@prisma/client";

// ==========================================
// SECURITY / EDITOR CHECK HELPERS
// ==========================================

export async function verifyRoutineEditorRights(routineId: string, userId: string): Promise<boolean> {
    const routine = await db.routine.findUnique({
        where: { id: routineId }
    });
    if (!routine) return false;
    if (routine.userId === userId) return true;

    const share = await db.routineShare.findUnique({
        where: {
            routineId_userId: {
                routineId,
                userId
            }
        }
    });
    return share?.role === "EDITOR";
}

export async function verifyRoutineAccess(routineId: string, userId: string): Promise<boolean> {
    const routine = await db.routine.findUnique({
        where: { id: routineId }
    });
    if (!routine) return false;
    if (routine.userId === userId) return true;

    const share = await db.routineShare.findUnique({
        where: {
            routineId_userId: {
                routineId,
                userId
            }
        }
    });
    return !!share;
}

// ==========================================
// CRUD ROTINAS (CHECKLISTS POR PESSOA/FUNÇÃO)
// ==========================================

export async function getRoutines() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const whereClause: any = {
            OR: [
                { userId: session.user.id },
                { shares: { some: { userId: session.user.id } } }
            ]
        };

        const routines = await db.routine.findMany({
            where: whereClause,
            include: {
                items: {
                    orderBy: { order: "asc" }
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
            orderBy: { createdAt: "desc" }
        });

        return { success: true, data: routines };
    } catch (error: any) {
        console.error("Erro em getRoutines:", error);
        return { success: false, error: error.message || "Erro ao buscar rotinas" };
    }
}

export async function createRoutine(data: {
    title: string;
    role?: string | null;
    description?: string | null;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const routine = await db.routine.create({
            data: {
                title: data.title,
                role: data.role || null,
                description: data.description || null,
                userId: session.user.id
            }
        });

        revalidatePath("/routines");
        revalidatePath("/");
        return { success: true, data: routine };
    } catch (error: any) {
        console.error("Erro em createRoutine:", error);
        return { success: false, error: error.message || "Erro ao criar rotina" };
    }
}

export async function updateRoutine(id: string, data: {
    title?: string;
    role?: string | null;
    description?: string | null;
    isActive?: boolean;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const hasRights = await verifyRoutineEditorRights(id, session.user.id);
        if (!hasRights) {
            return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };
        }

        const updatedRoutine = await db.routine.update({
            where: { id },
            data: {
                title: data.title,
                role: data.role !== undefined ? data.role : undefined,
                description: data.description !== undefined ? data.description : undefined,
                isActive: data.isActive !== undefined ? data.isActive : undefined
            }
        });

        revalidatePath("/routines");
        revalidatePath("/");
        return { success: true, data: updatedRoutine };
    } catch (error: any) {
        console.error("Erro em updateRoutine:", error);
        return { success: false, error: error.message || "Erro ao atualizar rotina" };
    }
}

export async function deleteRoutine(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const hasRights = await verifyRoutineEditorRights(id, session.user.id);
        if (!hasRights) {
            return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };
        }

        await db.routine.delete({
            where: { id }
        });

        revalidatePath("/routines");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Erro em deleteRoutine:", error);
        return { success: false, error: error.message || "Erro ao excluir rotina" };
    }
}

// ==========================================
// CRUD ITEMS DA ROTINA (PASSOS DO CHECKLIST COM RECORRÊNCIA)
// ==========================================

export async function createRoutineItem(data: {
    routineId: string;
    title: string;
    description?: string | null;
    frequency: RoutineFrequency;
    scheduleDays?: string | null;
    order?: number;
    timeOfDay?: string | null;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const hasRights = await verifyRoutineEditorRights(data.routineId, session.user.id);
        if (!hasRights) {
            return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };
        }

        const item = await db.routineItem.create({
            data: {
                routineId: data.routineId,
                title: data.title,
                description: data.description || null,
                frequency: data.frequency,
                scheduleDays: data.scheduleDays || null,
                order: data.order ?? 0,
                timeOfDay: data.timeOfDay || null
            }
        });

        revalidatePath("/routines");
        revalidatePath("/");
        return { success: true, data: item };
    } catch (error: any) {
        console.error("Erro em createRoutineItem:", error);
        return { success: false, error: error.message || "Erro ao criar passo da rotina" };
    }
}

export async function updateRoutineItem(id: string, data: {
    title?: string;
    description?: string | null;
    frequency?: RoutineFrequency;
    scheduleDays?: string | null;
    order?: number;
    timeOfDay?: string | null;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const item = await db.routineItem.findUnique({
            where: { id }
        });
        if (!item) return { success: false, error: "Item não encontrado" };

        const hasRights = await verifyRoutineEditorRights(item.routineId, session.user.id);
        if (!hasRights) {
            return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };
        }

        const updatedItem = await db.routineItem.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description !== undefined ? data.description : undefined,
                frequency: data.frequency,
                scheduleDays: data.scheduleDays !== undefined ? data.scheduleDays : undefined,
                order: data.order !== undefined ? data.order : undefined,
                timeOfDay: data.timeOfDay !== undefined ? data.timeOfDay : undefined
            }
        });

        revalidatePath("/routines");
        revalidatePath("/");
        return { success: true, data: updatedItem };
    } catch (error: any) {
        console.error("Erro em updateRoutineItem:", error);
        return { success: false, error: error.message || "Erro ao atualizar item da rotina" };
    }
}

export async function deleteRoutineItem(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const item = await db.routineItem.findUnique({
            where: { id }
        });
        if (!item) return { success: false, error: "Item não encontrado" };

        const hasRights = await verifyRoutineEditorRights(item.routineId, session.user.id);
        if (!hasRights) {
            return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };
        }

        await db.routineItem.delete({
            where: { id }
        });

        revalidatePath("/routines");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Erro em deleteRoutineItem:", error);
        return { success: false, error: error.message || "Erro ao excluir item da rotina" };
    }
}

// ==========================================
// AVALIAÇÃO DE RECORRÊNCIA E EXECUÇÃO
// ==========================================

// Helper para verificar se a rotina está ativa em uma data específica
function isRoutineActiveOnDate(routine: { frequency: RoutineFrequency; scheduleDays: string | null; createdAt: Date }, date: Date): boolean {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const createdDate = new Date(routine.createdAt);
    createdDate.setHours(0, 0, 0, 0);

    if (checkDate < createdDate) return false;

    const dayOfWeek = checkDate.getDay(); // 0 = Domingo, 1 = Segunda, ...
    const dayOfMonth = checkDate.getDate(); // 1 a 31

    let scheduleDaysParsed: any[] = [];
    if (routine.scheduleDays) {
        try {
            scheduleDaysParsed = JSON.parse(routine.scheduleDays);
        } catch (e) {
            console.error("Erro ao fazer parse de scheduleDays:", e);
        }
    }

    switch (routine.frequency) {
        case "DAILY":
            if (scheduleDaysParsed.length > 0) {
                return scheduleDaysParsed.includes(dayOfWeek);
            }
            return true;
            
        case "WEEKLY":
            if (scheduleDaysParsed.length > 0) {
                return scheduleDaysParsed.includes(dayOfWeek);
            }
            return dayOfWeek === createdDate.getDay();

        case "BIWEEKLY":
            const diffTime = checkDate.getTime() - createdDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays % 14 === 0;

        case "MONTHLY":
            if (scheduleDaysParsed.length > 0) {
                return scheduleDaysParsed.includes(dayOfMonth);
            }
            return dayOfMonth === createdDate.getDate();

        case "BIMONTHLY":
            const diffMonthsBi = (checkDate.getFullYear() - createdDate.getFullYear()) * 12 + (checkDate.getMonth() - createdDate.getMonth());
            return diffMonthsBi % 2 === 0 && dayOfMonth === createdDate.getDate();

        case "QUARTERLY":
            const diffMonthsTri = (checkDate.getFullYear() - createdDate.getFullYear()) * 12 + (checkDate.getMonth() - createdDate.getMonth());
            return diffMonthsTri % 3 === 0 && dayOfMonth === createdDate.getDate();

        case "SEMESTERLY":
            const diffMonthsSem = (checkDate.getFullYear() - createdDate.getFullYear()) * 12 + (checkDate.getMonth() - createdDate.getMonth());
            return diffMonthsSem % 6 === 0 && dayOfMonth === createdDate.getDate();

        case "SPORADIC":
            const checkDateStr = checkDate.toISOString().split("T")[0];
            return scheduleDaysParsed.includes(checkDateStr);

        default:
            return false;
    }
}

// Obter as rotinas de uma data com seus logs de execução filtrados por item
export async function getTodayRoutines(dateStr: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const checkDate = new Date(dateStr + "T12:00:00");

        const whereClause: any = {
            OR: [
                { userId: session.user.id },
                { shares: { some: { userId: session.user.id } } }
            ],
            isActive: true
        };

        // 1. Busca todas as rotinas ativas
        const allRoutines = await db.routine.findMany({
            where: whereClause,
            include: {
                items: {
                    orderBy: { order: "asc" }
                },
                executions: {
                    where: { date: dateStr },
                    include: {
                        itemLogs: true
                    }
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
            }
        });

        // 2. Mapeia as rotinas e seus itens, adicionando a verificação de atividade do dia
        const formattedRoutines = allRoutines.map(r => {
            const execution = r.executions[0] || null;

            const items = r.items.map(item => {
                const log = execution?.itemLogs.find(l => l.itemId === item.id) || null;
                const isActiveToday = isRoutineActiveOnDate(item, checkDate);
                return {
                    ...item,
                    isActiveToday,
                    completed: log?.completed || false,
                    completedAt: log?.completedAt || null,
                    note: log?.note || null
                };
            });

            const totalItems = items.filter(i => i.isActiveToday).length;
            const completedItems = items.filter(i => i.isActiveToday && i.completed).length;
            const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

            return {
                id: r.id,
                title: r.title,
                role: r.role,
                description: r.description,
                progress,
                totalItems,
                completedItems,
                executionId: execution?.id || null,
                notes: execution?.notes || null,
                items,
                isNew: r.items.length === 0, // true se não tiver nenhuma tarefa cadastrada no banco de dados
                userId: r.userId,
                shares: r.shares
            };
        });

        return { success: true, data: formattedRoutines };
    } catch (error: any) {
        console.error("Erro em getTodayRoutines:", error);
        return { success: false, error: error.message || "Erro ao processar rotinas" };
    }
}

// Grava/Alterna a conclusão de um passo do checklist
export async function toggleRoutineItemLog(data: {
    routineId: string;
    date: string; // YYYY-MM-DD
    itemId: string;
    completed: boolean;
    note?: string | null;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const hasAccess = await verifyRoutineAccess(data.routineId, session.user.id);
        if (!hasAccess) {
            return { success: false, error: "Sem permissão de acesso a este checklist" };
        }

        // 1. Garante que a execução exista para esta data
        const execution = await db.routineExecution.upsert({
            where: {
                routineId_date: {
                    routineId: data.routineId,
                    date: data.date
                }
            },
            update: {},
            create: {
                routineId: data.routineId,
                date: data.date,
                userId: session.user.id
            }
        });

        // 2. Grava ou altera o log do item individual
        await db.routineItemLog.upsert({
            where: {
                executionId_itemId: {
                    executionId: execution.id,
                    itemId: data.itemId
                }
            },
            update: {
                completed: data.completed,
                completedAt: data.completed ? new Date() : null,
                note: data.note !== undefined ? data.note : undefined
            },
            create: {
                executionId: execution.id,
                itemId: data.itemId,
                completed: data.completed,
                completedAt: data.completed ? new Date() : null,
                note: data.note || null
            }
        });

        // 3. Atualiza se a execução geral foi concluída (todos os itens marcados)
        const routineItems = await db.routineItem.findMany({
            where: { routineId: data.routineId }
        });
        
        // Verifica as tarefas ativas na data da execução para computar se tudo foi concluído
        const checkDate = new Date(data.date + "T12:00:00");
        const activeItems = routineItems.filter(item => isRoutineActiveOnDate(item, checkDate));
        
        const routineItemLogs = await db.routineItemLog.findMany({
            where: { executionId: execution.id }
        });

        const activeLogs = routineItemLogs.filter(log => activeItems.some(item => item.id === log.itemId));
        const completedCount = activeLogs.filter(l => l.completed).length;
        const isAllCompleted = activeItems.length > 0 && completedCount === activeItems.length;

        await db.routineExecution.update({
            where: { id: execution.id },
            data: {
                completedAt: isAllCompleted ? new Date() : null
            }
        });

        revalidatePath("/routines");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Erro em toggleRoutineItemLog:", error);
        return { success: false, error: error.message || "Erro ao gravar log da rotina" };
    }
}

// Atualizar observações gerais de uma rodada de execução
export async function updateRoutineExecutionNotes(routineId: string, dateStr: string, notes: string | null) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const hasAccess = await verifyRoutineAccess(routineId, session.user.id);
        if (!hasAccess) {
            return { success: false, error: "Sem permissão de acesso a este checklist" };
        }

        const execution = await db.routineExecution.upsert({
            where: {
                routineId_date: {
                    routineId,
                    date: dateStr
                }
            },
            update: { notes },
            create: {
                routineId,
                date: dateStr,
                userId: session.user.id,
                notes
            }
        });

        revalidatePath("/routines");
        revalidatePath("/");
        return { success: true, data: execution };
    } catch (error: any) {
        console.error("Erro em updateRoutineExecutionNotes:", error);
        return { success: false, error: error.message || "Erro ao atualizar notas de execução" };
    }
}

// ==========================================
// SHARING MUTATIONS FOR ROUTINES
// ==========================================

export async function shareRoutine(routineId: string, emailOrCpf: string, role: "VIEWER" | "EDITOR") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        // Ensure owner
        const routine = await db.routine.findFirst({
            where: { id: routineId, userId: session.user.id }
        });
        if (!routine) return { success: false, error: "Apenas o proprietário pode compartilhar o checklist." };

        // Search user by email or CPF
        const targetUser = await db.user.findFirst({
            where: {
                OR: [
                    { email: emailOrCpf },
                    { document: emailOrCpf }
                ]
            }
        });
        if (!targetUser) return { success: false, error: "Usuário não encontrado com o E-mail ou CPF informado." };

        if (targetUser.id === session.user.id) {
            return { success: false, error: "Você não pode compartilhar um checklist consigo mesmo." };
        }

        const routineShare = await db.routineShare.upsert({
            where: {
                routineId_userId: {
                    routineId,
                    userId: targetUser.id
                }
            },
            update: { role },
            create: {
                routineId,
                userId: targetUser.id,
                role
            }
        });

        revalidatePath("/routines");
        return { success: true, data: routineShare };
    } catch (error: any) {
        console.error("Error in shareRoutine:", error);
        return { success: false, error: error.message || "Failed to share routine" };
    }
}

export async function unshareRoutine(routineId: string, userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Não autorizado" };

        const routine = await db.routine.findFirst({
            where: { id: routineId }
        });
        if (!routine) return { success: false, error: "Checklist não encontrado." };

        if (routine.userId !== session.user.id && userId !== session.user.id) {
            return { success: false, error: "Não autorizado" };
        }

        await db.routineShare.delete({
            where: {
                routineId_userId: {
                    routineId,
                    userId
                }
            }
        });

        revalidatePath("/routines");
        return { success: true };
    } catch (error: any) {
        console.error("Error in unshareRoutine:", error);
        return { success: false, error: error.message || "Failed to remove routine share" };
    }
}
