"use server";

import { PrismaClient, Task, Status, Context, EnergyLevel, RecurrenceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths } from "date-fns";
import { RecurrenceMode } from "./events";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export type CreateTaskData = {
    title: string;
    context?: Context | null;
    priority: string;
    date?: Date;
    recurrence?: string; // Legacy field, optional for now
    recurrenceType: RecurrenceType;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date;
    energy?: EnergyLevel;
    projectId?: string;
    responsibleId?: string;
    sprintId?: string;
    status: Status;
    points?: number;
    kanbanColumn?: string;
    reminderMinutes?: number | null;
    estimatedTime?: number | null;
};

export async function createTask(data: CreateTaskData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const masterTask = await prisma.task.create({
            data: {
                title: data.title,
                context: data.context ?? undefined,
                priority: data.priority,
                date: data.date,
                recurrence: data.recurrence, // Keep legacy if provided
                energy: data.energy,
                projectId: data.projectId === "none" ? null : data.projectId,
                responsibleId: data.responsibleId === "none" ? null : data.responsibleId,
                sprintId: data.sprintId === "none" ? null : data.sprintId,
                status: data.status,
                points: data.points,
                kanbanColumn: data.kanbanColumn || (data.status === "COMPLETED" ? "DONE" : data.status === "IN_PROGRESS" ? "DOING" : "TODO"),
                recurrenceType: data.recurrenceType,
                recurrenceInterval: data.recurrenceInterval,
                recurrenceEndDate: data.recurrenceEndDate,
                reminderMinutes: data.reminderMinutes,
                estimatedTime: data.estimatedTime,
                userId: session.user.id,
            },
        });

        // Recurrence Generation
        if (data.recurrenceType !== "NONE" && data.date) { // Only generate if type is set and start date exists
            const instances = [];
            let currentDate = new Date(data.date);
            const effectiveEndDate = data.recurrenceEndDate
                ? new Date(data.recurrenceEndDate)
                : addDays(new Date(data.date), 365);

            // Prevent infinite loops or excessive creation
            let count = 0;
            const MAX_INSTANCES = 365; // Safety break

            while (count < MAX_INSTANCES) {
                // Calculate next date
                if ((data.recurrenceType as string) === "DAILY") {
                    currentDate = addDays(currentDate, 1);
                } else if ((data.recurrenceType as string) === "WEEKLY") {
                    currentDate = addWeeks(currentDate, 1);
                } else if ((data.recurrenceType as string) === "WEEKLY_MWF") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentDate, diffDays).getDay();
                    while (nextDayOfWeek !== 1 && nextDayOfWeek !== 3 && nextDayOfWeek !== 5) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentDate, diffDays).getDay();
                    }
                    currentDate = addDays(currentDate, diffDays);
                } else if ((data.recurrenceType as string) === "WEEKLY_TTH") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentDate, diffDays).getDay();
                    while (nextDayOfWeek !== 2 && nextDayOfWeek !== 4) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentDate, diffDays).getDay();
                    }
                    currentDate = addDays(currentDate, diffDays);
                } else if ((data.recurrenceType as string) === "WEEKDAYS") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentDate, diffDays).getDay();
                    while (nextDayOfWeek === 0 || nextDayOfWeek === 6) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentDate, diffDays).getDay();
                    }
                    currentDate = addDays(currentDate, diffDays);
                } else if ((data.recurrenceType as string) === "WEEKDAYS_SAT") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentDate, diffDays).getDay();
                    while (nextDayOfWeek === 0) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentDate, diffDays).getDay();
                    }
                    currentDate = addDays(currentDate, diffDays);
                } else if (data.recurrenceType === "BIWEEKLY") {
                    currentDate = addWeeks(currentDate, 2);
                } else if (data.recurrenceType === "MONTHLY") {
                    currentDate = addMonths(currentDate, 1);
                } else if (data.recurrenceType === "CUSTOM" && data.recurrenceInterval) {
                    currentDate = addDays(currentDate, data.recurrenceInterval);
                } else {
                    break;
                }

                if (currentDate > effectiveEndDate) break;

                instances.push({
                    title: data.title,
                    context: data.context,
                    priority: data.priority,
                    date: new Date(currentDate), // Copy date
                    recurrence: data.recurrence,
                    energy: data.energy,
                    projectId: data.projectId === "none" ? null : data.projectId,
                    status: "PENDING" as Status, // Future instances start as pending
                    recurrenceType: data.recurrenceType,
                    recurrenceInterval: data.recurrenceInterval,
                    recurrenceEndDate: data.recurrenceEndDate,
                    originalId: masterTask.id,
                    reminderMinutes: data.reminderMinutes,
                    estimatedTime: data.estimatedTime,
                    userId: session.user.id,
                });

                count++;
            }

            if (instances.length > 0) {
                await prisma.task.createMany({
                    data: instances,
                });
            }
        }

        revalidatePath("/tasks");
        revalidatePath("/agenda");
        revalidatePath("/agile");
        if (data.projectId) {
            revalidatePath(`/agile/${data.projectId}`);
        }
        revalidatePath("/"); // Update dashboard
        return { success: true, data: masterTask };
    } catch (error) {
        console.error("Failed to create task:", error);
        return { success: false, error: "Failed to create task" };
    }
}

export async function updateTaskStatus(id: string, status: Status) {
    try {
        let kanbanColumn = undefined;
        if (status === "COMPLETED") kanbanColumn = "DONE";
        else if (status === "IN_PROGRESS") kanbanColumn = "DOING";
        else if (status === "PENDING") kanbanColumn = "TODO";

        await prisma.task.update({
            where: { id },
            data: { 
                status,
                ...(kanbanColumn ? { kanbanColumn } : {})
            },
        });

        revalidatePath("/tasks");
        revalidatePath("/agenda");
        revalidatePath("/agile");
        // We don't have projectId here easily without fetching, 
        // but current actions revalidate global paths. 
        // Adding a broader revalidation strategy.
        revalidatePath("/agile", "layout");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to update task status:", error);
        return { success: false, error: "Failed to update task status" };
    }
}



export async function updateTask(id: string, data: CreateTaskData, recurrenceMode: RecurrenceMode = "SINGLE") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = session.user.id;

        const currentTask = await prisma.task.findUnique({ where: { id } });
        if (!currentTask) throw new Error("Tarefa não encontrada");

        if (currentTask.userId !== userId) return { success: false, error: "Unauthorized" };

        const masterId = currentTask.originalId || currentTask.id;

        if (recurrenceMode === "SINGLE") {
            const result = await prisma.$transaction(async (tx) => {
                return await tx.task.update({
                    where: { id },
                    data: {
                        title: data.title,
                        context: data.context,
                        priority: data.priority,
                        date: data.date,
                        energy: data.energy,
                        projectId: data.projectId === "none" ? null : data.projectId,
                        responsibleId: data.responsibleId === "none" ? null : data.responsibleId,
                        sprintId: data.sprintId === "none" ? null : data.sprintId,
                        status: data.status,
                        kanbanColumn: data.kanbanColumn || (data.status === "COMPLETED" ? "DONE" : data.status === "IN_PROGRESS" ? "DOING" : data.status === "PENDING" ? "TODO" : currentTask.kanbanColumn),
                        points: data.points,
                        reminderMinutes: data.reminderMinutes,
                        estimatedTime: data.estimatedTime,
                    },
                });
            });
            revalidatePath("/tasks");
            revalidatePath("/agenda");
            revalidatePath("/agile");
            if (data.projectId) revalidatePath(`/agile/${data.projectId}`);
            revalidatePath("/");
            return { success: true, data: result };
        }

        if (recurrenceMode === "FOLLOWING") {
            // Update this and future
            if (data.date && currentTask.date) {
                await prisma.$transaction(async (tx) => {
                    await tx.task.deleteMany({
                        where: {
                            OR: [{ id: masterId }, { originalId: masterId }],
                            id: { not: id },
                            date: { gt: currentTask.date! }
                        }
                    });

                    await tx.task.update({
                        where: { id },
                        data: {
                            title: data.title,
                            context: data.context,
                            priority: data.priority,
                            date: data.date,
                            energy: data.energy,
                            projectId: data.projectId === "none" ? null : data.projectId,
                            responsibleId: data.responsibleId === "none" ? null : data.responsibleId,
                            sprintId: data.sprintId === "none" ? null : data.sprintId,
                            status: data.status,
                            kanbanColumn: data.kanbanColumn || (data.status === "COMPLETED" ? "DONE" : data.status === "IN_PROGRESS" ? "DOING" : data.status === "PENDING" ? "TODO" : currentTask.kanbanColumn),
                            points: data.points,
                            reminderMinutes: data.reminderMinutes,
                            estimatedTime: data.estimatedTime,
                            recurrenceType: data.recurrenceType,
                            recurrenceInterval: data.recurrenceInterval,
                            recurrenceEndDate: data.recurrenceEndDate,
                        } as any,
                    });

                    if (data.recurrenceType !== "NONE") {
                        await generateFutureTaskRecurrences(id, masterId, data, userId, tx);
                    }
                });
            }
            revalidatePath("/tasks");
            revalidatePath("/agenda");
            revalidatePath("/agile");
            revalidatePath("/");
            return { success: true };
        }

        if (recurrenceMode === "ALL") {
            // Update all
            const masterTask = await prisma.task.findUnique({ where: { id: masterId } });
            if (!masterTask) throw new Error("Tarefa mestre não encontrada");

            // Calculate shift
            const timeDiff = data.date && currentTask.date 
                ? data.date.getTime() - currentTask.date.getTime() 
                : 0;
            const newMasterDate = masterTask.date 
                ? new Date(masterTask.date.getTime() + timeDiff) 
                : null;

            await prisma.$transaction(async (tx) => {
                // Delete all clones
                await tx.task.deleteMany({
                    where: { originalId: masterId }
                });

                await tx.task.update({
                    where: { id: masterId },
                    data: {
                        title: data.title,
                        context: data.context,
                        priority: data.priority,
                        date: newMasterDate,
                        energy: data.energy,
                        projectId: data.projectId === "none" ? null : data.projectId,
                        responsibleId: data.responsibleId === "none" ? null : data.responsibleId,
                        sprintId: data.sprintId === "none" ? null : data.sprintId,
                        status: data.status,
                        kanbanColumn: data.kanbanColumn || (data.status === "COMPLETED" ? "DONE" : data.status === "IN_PROGRESS" ? "DOING" : data.status === "PENDING" ? "TODO" : masterTask.kanbanColumn),
                        points: data.points,
                        reminderMinutes: data.reminderMinutes,
                        estimatedTime: data.estimatedTime,
                        recurrenceType: data.recurrenceType,
                        recurrenceInterval: data.recurrenceInterval,
                        recurrenceEndDate: data.recurrenceEndDate,
                    } as any,
                });

                if (data.recurrenceType !== "NONE" && newMasterDate) {
                    await generateFutureTaskRecurrences(masterId, masterId, {
                        ...data,
                        date: newMasterDate
                    }, userId, tx);
                }
            });

            revalidatePath("/tasks");
            revalidatePath("/agenda");
            revalidatePath("/agile");
            revalidatePath("/");
            return { success: true };
        }

        return { success: false, error: "Modo inválido" };
    } catch (error) {
        console.error("Failed to update task:", error);
        return { success: false, error: "Failed to update task" };
    }
}

async function generateFutureTaskRecurrences(
    templateId: string, 
    masterId: string, 
    data: CreateTaskData, 
    userId: string,
    tx?: any
) {
    const prismaClient = tx || prisma;
    const instances = [];
    let currentDate = new Date(data.date!);
    const effectiveEndDate = data.recurrenceEndDate
        ? new Date(data.recurrenceEndDate)
        : addDays(new Date(data.date!), 365);

    let count = 0;
    const MAX_INSTANCES = 365;

    while (count < MAX_INSTANCES) {
        if ((data.recurrenceType as string) === "DAILY") {
            currentDate = addDays(currentDate, 1);
        } else if ((data.recurrenceType as string) === "WEEKLY") {
            currentDate = addWeeks(currentDate, 1);
        } else if ((data.recurrenceType as string) === "WEEKLY_MWF") {
            let diffDays = 1;
            let nextDayOfWeek = addDays(currentDate, diffDays).getDay();
            while (nextDayOfWeek !== 1 && nextDayOfWeek !== 3 && nextDayOfWeek !== 5) {
                diffDays++;
                nextDayOfWeek = addDays(currentDate, diffDays).getDay();
            }
            currentDate = addDays(currentDate, diffDays);
        } else if ((data.recurrenceType as string) === "WEEKLY_TTH") {
            let diffDays = 1;
            let nextDayOfWeek = addDays(currentDate, diffDays).getDay();
            while (nextDayOfWeek !== 2 && nextDayOfWeek !== 4) {
                diffDays++;
                nextDayOfWeek = addDays(currentDate, diffDays).getDay();
            }
            currentDate = addDays(currentDate, diffDays);
        } else if ((data.recurrenceType as string) === "WEEKDAYS") {
            let diffDays = 1;
            let nextDayOfWeek = addDays(currentDate, diffDays).getDay();
            while (nextDayOfWeek === 0 || nextDayOfWeek === 6) {
                diffDays++;
                nextDayOfWeek = addDays(currentDate, diffDays).getDay();
            }
            currentDate = addDays(currentDate, diffDays);
        } else if ((data.recurrenceType as string) === "WEEKDAYS_SAT") {
            let diffDays = 1;
            let nextDayOfWeek = addDays(currentDate, diffDays).getDay();
            while (nextDayOfWeek === 0) {
                diffDays++;
                nextDayOfWeek = addDays(currentDate, diffDays).getDay();
            }
            currentDate = addDays(currentDate, diffDays);
        } else if ((data.recurrenceType as string) === "BIWEEKLY") {
            currentDate = addWeeks(currentDate, 2);
        } else if ((data.recurrenceType as string) === "MONTHLY") {
            currentDate = addMonths(currentDate, 1);
        } else if ((data.recurrenceType as string) === "CUSTOM" && data.recurrenceInterval) {
            currentDate = addDays(currentDate, data.recurrenceInterval);
        } else {
            break;
        }

        if (currentDate > effectiveEndDate) break;

        instances.push({
            title: data.title,
            context: data.context,
            priority: data.priority,
            date: new Date(currentDate),
            energy: data.energy,
            projectId: data.projectId === "none" ? null : data.projectId,
            status: "PENDING" as Status,
            recurrenceType: data.recurrenceType,
            recurrenceInterval: data.recurrenceInterval,
            recurrenceEndDate: data.recurrenceEndDate,
            originalId: masterId,
            reminderMinutes: data.reminderMinutes,
            estimatedTime: data.estimatedTime,
            userId,
        });

        count++;
    }

    if (instances.length > 0) {
        await prismaClient.task.createMany({
            data: instances,
        });
    }
}

export async function deleteTask(id: string, recurrenceMode: RecurrenceMode = "SINGLE") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const currentTask = await prisma.task.findUnique({ where: { id } });
        if (!currentTask) throw new Error("Tarefa não encontrada");

        if (currentTask.userId !== session.user.id) return { success: false, error: "Unauthorized" };

        const masterId = currentTask.originalId || currentTask.id;

        if (recurrenceMode === "SINGLE") {
            await prisma.task.delete({ where: { id } });
        } else if (recurrenceMode === "FOLLOWING") {
            await prisma.task.deleteMany({
                where: {
                    OR: [{ id: masterId }, { originalId: masterId }],
                    userId: session.user.id,
                    date: { gte: currentTask.date! }
                }
            });
        } else if (recurrenceMode === "ALL") {
            await prisma.task.deleteMany({
                where: {
                    OR: [{ id: masterId }, { originalId: masterId }],
                    userId: session.user.id
                }
            });
        }

        revalidatePath("/tasks");
        revalidatePath("/agenda");
        revalidatePath("/agile");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete task:", error);
        return { success: false, error: "Failed to delete task" };
    }
}

export async function updateTaskSprint(taskId: string, sprintId: string | null) {
    try {
        await prisma.task.update({
            where: { id: taskId },
            data: { 
                sprintId,
                ...(sprintId ? { kanbanColumn: "TODO" } : {})
            },
        });
        revalidatePath("/agile");
        if (sprintId) {
            // Revalidate project if possible
        }
        revalidatePath("/agile", "layout");
        revalidatePath("/agenda");
        revalidatePath("/tasks");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to update task sprint:", error);
        return { success: false, error: "Failed to update task sprint" };
    }
}

export async function updateTaskKanban(taskId: string, column: string, status: Status) {
    try {
        await prisma.task.update({
            where: { id: taskId },
            data: {
                kanbanColumn: column,
                status: status
            },
        });
        revalidatePath("/agile");
        revalidatePath("/agenda");
        revalidatePath("/tasks");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to update task kanban:", error);
        return { success: false, error: "Failed to update task kanban" };
    }
}

export async function getTasks(
    sort: string = "date",
    order: "asc" | "desc" = "asc",
    filter?: { sprintId?: string; projectId?: string; listId?: string }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const tasks = await prisma.task.findMany({
            where: {
                userId: session.user.id,
                ...(filter?.sprintId ? { sprintId: filter.sprintId } : {}),
                ...(filter?.projectId ? { projectId: filter.projectId } : {}),
                ...(filter?.listId ? { listId: filter.listId } : {}),
            },
            include: {
                project: true,
                sprint: true,
                responsible: true,
                list: {
                    select: {
                        id: true,
                        name: true,
                        space: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                timeLogs: true
            }
        });

        // Custom sorting logic
        const sortedTasks = tasks.sort((a, b) => {
            let comparison = 0;

            if (sort === 'priority') {
                const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
                const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
                const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
                comparison = weightA - weightB;
            } else if (sort === 'context') {
                comparison = a.context.localeCompare(b.context);
            } else if (sort === 'status') {
                // PENDING before COMPLETED for asc
                if (a.status === b.status) comparison = 0;
                else if (a.status === 'PENDING') comparison = -1;
                else comparison = 1;
            } else {
                // Default to date
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                // If dates are equal or missing, use creation date as fallback
                if (dateA === dateB) {
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                } else {
                    comparison = dateA - dateB;
                }
            }

            return order === 'asc' ? comparison : -comparison;
        });

        return { success: true, data: sortedTasks };
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return { success: false, error: "Failed to fetch tasks" };
    }
}
