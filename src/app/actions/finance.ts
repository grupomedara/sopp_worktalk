"use server";

import { PrismaClient, Finance, FinanceCategory, FinanceType, Status, RecurrenceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths } from "date-fns";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type CreateFinanceData = {
    description: string;
    category: FinanceCategory;
    type: FinanceType;
    amount: number;
    dueDate?: Date;
    status: Status;
    personId?: string;
    projectId?: string;
    reminderMinutes?: number | null;
    recurrenceType?: RecurrenceType;
    recurrenceEndDate?: Date;
};

export async function createFinance(data: CreateFinanceData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const finance = await db.finance.create({
            data: {
                description: data.description,
                category: data.category,
                type: data.type,
                amount: data.amount,
                dueDate: data.dueDate,
                status: data.status,
                personId: data.personId === "none" ? null : data.personId,
                projectId: data.projectId === "none" ? null : data.projectId,
                reminderMinutes: data.reminderMinutes,
                recurrenceType: data.recurrenceType || "NONE",
                recurrenceEndDate: data.recurrenceEndDate,
                userId: session.user.id,
            } as any,
        });

        // Recurrence Generation
        if (data.recurrenceType && data.recurrenceType !== "NONE" && data.dueDate) {
            const instances = [];
            let currentDueDate = new Date(data.dueDate);
            
            const effectiveEndDate = data.recurrenceEndDate
                ? new Date(data.recurrenceEndDate)
                : addMonths(new Date(data.dueDate), 24);

            let count = 0;
            const MAX_INSTANCES = 100; // Safety limit

            while (count < MAX_INSTANCES) {
                if (data.recurrenceType === "DAILY") {
                    currentDueDate = addDays(currentDueDate, 1);
                } else if (data.recurrenceType === "WEEKLY") {
                    currentDueDate = addWeeks(currentDueDate, 1);
                } else if (data.recurrenceType === "WEEKLY_MWF") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                    while (nextDayOfWeek !== 1 && nextDayOfWeek !== 3 && nextDayOfWeek !== 5) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                    }
                    currentDueDate = addDays(currentDueDate, diffDays);
                } else if (data.recurrenceType === "WEEKLY_TTH") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                    while (nextDayOfWeek !== 2 && nextDayOfWeek !== 4) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                    }
                    currentDueDate = addDays(currentDueDate, diffDays);
                } else if (data.recurrenceType === "WEEKDAYS") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                    while (nextDayOfWeek === 0 || nextDayOfWeek === 6) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                    }
                    currentDueDate = addDays(currentDueDate, diffDays);
                } else if (data.recurrenceType === "WEEKDAYS_SAT") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                    while (nextDayOfWeek === 0) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                    }
                    currentDueDate = addDays(currentDueDate, diffDays);
                } else if (data.recurrenceType === "BIWEEKLY") {
                    currentDueDate = addWeeks(currentDueDate, 2);
                } else if (data.recurrenceType === "MONTHLY") {
                    currentDueDate = addMonths(currentDueDate, 1);
                } else {
                    break;
                }

                if (currentDueDate > effectiveEndDate) break;

                instances.push({
                    description: data.description,
                    category: data.category,
                    type: data.type,
                    amount: data.amount,
                    dueDate: new Date(currentDueDate),
                    status: Status.PENDING,
                    personId: data.personId === "none" ? null : data.personId,
                    projectId: data.projectId === "none" ? null : data.projectId,
                    reminderMinutes: data.reminderMinutes,
                    recurrenceType: data.recurrenceType,
                    parentId: finance.id,
                    userId: session.user.id,
                });
                count++;
            }

            if (instances.length > 0) {
                await db.finance.createMany({
                    data: instances
                });
            }
        }

        revalidatePath("/finance");
        revalidatePath("/"); // Dashboard might show finances
        return { success: true, data: finance };
    } catch (error) {
        console.error("Failed to create finance record:", error);
        return { success: false, error: "Failed to create finance record" };
    }
}


import { RecurrenceMode } from "./events";

export async function updateFinance(id: string, data: CreateFinanceData, updateMode: RecurrenceMode = "SINGLE") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const currentRecord = await db.finance.findUnique({ where: { id } });
        if (!currentRecord || currentRecord.userId !== session.user.id) {
            return { success: false, error: "Registro não encontrado ou acesso negado" };
        }

        const masterId = currentRecord.parentId || currentRecord.id;

        if (updateMode === "SINGLE") {
            await db.finance.update({
                where: { id },
                data: {
                    description: data.description,
                    category: data.category,
                    type: data.type,
                    amount: data.amount,
                    dueDate: data.dueDate,
                    status: data.status,
                    personId: data.personId === "none" ? null : data.personId,
                    projectId: data.projectId === "none" ? null : data.projectId,
                    reminderMinutes: data.reminderMinutes,
                    recurrenceType: data.recurrenceType,
                    recurrenceEndDate: data.recurrenceEndDate,
                },
            });
        } else if (updateMode === "FOLLOWING") {
            await db.finance.updateMany({
                where: {
                    OR: [{ id: masterId }, { parentId: masterId }],
                    dueDate: { gte: currentRecord.dueDate! }
                },
                data: {
                    description: data.description,
                    category: data.category,
                    type: data.type,
                    amount: data.amount,
                    status: data.status,
                    personId: data.personId === "none" ? null : data.personId,
                    projectId: data.projectId === "none" ? null : data.projectId,
                    reminderMinutes: data.reminderMinutes,
                } as any,
            });
        } else if (updateMode === "ALL") {
            await db.finance.updateMany({
                where: {
                    OR: [{ id: masterId }, { parentId: masterId }]
                },
                data: {
                    description: data.description,
                    category: data.category,
                    type: data.type,
                    amount: data.amount,
                    status: data.status,
                    personId: data.personId === "none" ? null : data.personId,
                    projectId: data.projectId === "none" ? null : data.projectId,
                    reminderMinutes: data.reminderMinutes,
                } as any,
            });
        }

        // Logic: Generate recurrence if newly added during edit
        if (data.recurrenceType && data.recurrenceType !== "NONE" && !currentRecord.parentId) {
            const hasChildren = await db.finance.count({ where: { parentId: currentRecord.id } });
            if (hasChildren === 0 && data.dueDate) {
                // Generate
                const instances = [];
                let currentDueDate = new Date(data.dueDate);
                const effectiveEndDate = data.recurrenceEndDate
                    ? new Date(data.recurrenceEndDate)
                    : addMonths(new Date(data.dueDate), 24);

                let count = 0;
                while (count < 100) {
                    if (data.recurrenceType === "DAILY") currentDueDate = addDays(currentDueDate, 1);
                    else if (data.recurrenceType === "WEEKLY") currentDueDate = addWeeks(currentDueDate, 1);
                    else if (data.recurrenceType === "WEEKLY_MWF") {
                        let diffDays = 1;
                        let nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                        while (nextDayOfWeek !== 1 && nextDayOfWeek !== 3 && nextDayOfWeek !== 5) {
                            diffDays++;
                            nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                        }
                        currentDueDate = addDays(currentDueDate, diffDays);
                    } else if (data.recurrenceType === "WEEKLY_TTH") {
                        let diffDays = 1;
                        let nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                        while (nextDayOfWeek !== 2 && nextDayOfWeek !== 4) {
                            diffDays++;
                            nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                        }
                        currentDueDate = addDays(currentDueDate, diffDays);
                    } else if (data.recurrenceType === "WEEKDAYS") {
                        let diffDays = 1;
                        let nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                        while (nextDayOfWeek === 0 || nextDayOfWeek === 6) {
                            diffDays++;
                            nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                        }
                        currentDueDate = addDays(currentDueDate, diffDays);
                    } else if (data.recurrenceType === "WEEKDAYS_SAT") {
                        let diffDays = 1;
                        let nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                        while (nextDayOfWeek === 0) {
                            diffDays++;
                            nextDayOfWeek = addDays(currentDueDate, diffDays).getDay();
                        }
                        currentDueDate = addDays(currentDueDate, diffDays);
                    } else if (data.recurrenceType === "BIWEEKLY") currentDueDate = addWeeks(currentDueDate, 2);
                    else if (data.recurrenceType === "MONTHLY") currentDueDate = addMonths(currentDueDate, 1);
                    else break;

                    if (currentDueDate > effectiveEndDate) break;

                    instances.push({
                        description: data.description,
                        category: data.category,
                        type: data.type,
                        amount: data.amount,
                        dueDate: new Date(currentDueDate),
                        status: Status.PENDING,
                        personId: data.personId === "none" ? null : data.personId,
                        projectId: data.projectId === "none" ? null : data.projectId,
                        reminderMinutes: data.reminderMinutes,
                        recurrenceType: data.recurrenceType,
                        parentId: currentRecord.id,
                    });
                    count++;
                }
                if (instances.length > 0) {
                    await db.finance.createMany({ data: instances.map(i => ({ ...i, userId: session.user.id })) });
                }
            }
        }

        revalidatePath("/finance");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to update finance record:", error);
        return { success: false, error: "Failed to update finance record" };
    }
}

export async function deleteFinance(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const existing = await db.finance.findUnique({ where: { id } });
        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: "Registro não encontrado ou acesso negado" };
        }

        await db.finance.delete({
            where: { id },
        });

        revalidatePath("/finance");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete finance record:", error);
        return { success: false, error: "Failed to delete finance record" };
    }
}

export async function getFinances(sort: string = "dueDate", order: "asc" | "desc" = "asc") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const finances = await db.finance.findMany({
            where: { userId: session.user.id },
            orderBy: { [sort]: order },
            include: {
                person: true,
                project: true,
            }
        });
        return { success: true, data: finances };
    } catch (error) {
        console.error("Failed to fetch finances:", error);
        return { success: false, error: "Failed to fetch finances" };
    }
}
