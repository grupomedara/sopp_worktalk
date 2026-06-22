"use server";

import { PrismaClient, Event, Context, RecurrenceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths, differenceInMinutes } from "date-fns";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export type RecurrenceMode = "SINGLE" | "FOLLOWING" | "ALL";

export type CreateEventData = {
    title: string;
    type: Context;
    startDate: Date;
    endDate: Date;
    projectId?: string;
    recurrenceType: RecurrenceType;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date;
    reminderMinutes?: number | null;
    color?: string | null;
    alarms?: Date[];
};

export async function createEvent(data: CreateEventData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const masterEvent = await prisma.event.create({
            data: {
                title: data.title,
                type: data.type,
                startDate: data.startDate,
                endDate: data.endDate,
                projectId: data.projectId === "none" ? null : data.projectId,
                recurrenceType: data.recurrenceType,
                recurrenceInterval: data.recurrenceInterval,
                recurrenceEndDate: data.recurrenceEndDate,
                reminderMinutes: data.reminderMinutes,
                color: data.color,
                userId: session.user.id,
                alarms: data.alarms && data.alarms.length > 0 ? {
                    create: data.alarms.map(d => ({ dateTime: new Date(d) }))
                } : undefined
            },
        });

        // Recurrence Generation
        if (data.recurrenceType !== "NONE") {
            const instances = [];
            let currentStartDate = new Date(data.startDate);
            let currentEndDate = new Date(data.endDate);
            const durationMinutes = differenceInMinutes(data.endDate, data.startDate);

            const effectiveEndDate = data.recurrenceEndDate
                ? new Date(data.recurrenceEndDate)
                : addDays(new Date(data.startDate), 365);

            // DEBUG TEMPORÁRIO
            console.log("[DEBUG createEvent] recurrenceType:", data.recurrenceType);
            console.log("[DEBUG createEvent] startDate:", data.startDate);
            console.log("[DEBUG createEvent] recurrenceEndDate:", data.recurrenceEndDate, "| typeof:", typeof data.recurrenceEndDate);
            console.log("[DEBUG createEvent] effectiveEndDate:", effectiveEndDate, "| isValid:", !isNaN(effectiveEndDate.getTime()));

            let count = 0;
            const MAX_INSTANCES = 365;

            while (count < MAX_INSTANCES) {
                // Calculate next date
                if (data.recurrenceType === "DAILY") {
                    currentStartDate = addDays(currentStartDate, 1);
                    currentEndDate = addDays(currentEndDate, 1);
                } else if (data.recurrenceType === "WEEKLY") {
                    currentStartDate = addWeeks(currentStartDate, 1);
                    currentEndDate = addWeeks(currentEndDate, 1);
                } else if (data.recurrenceType === "WEEKLY_MWF") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
                    while (nextDayOfWeek !== 1 && nextDayOfWeek !== 3 && nextDayOfWeek !== 5) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
                    }
                    currentStartDate = addDays(currentStartDate, diffDays);
                    if (currentEndDate) currentEndDate = addDays(currentEndDate, diffDays);
                } else if (data.recurrenceType === "WEEKLY_TTH") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
                    while (nextDayOfWeek !== 2 && nextDayOfWeek !== 4) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
                    }
                    currentStartDate = addDays(currentStartDate, diffDays);
                    if (currentEndDate) currentEndDate = addDays(currentEndDate, diffDays);
                } else if (data.recurrenceType === "WEEKDAYS") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
                    while (nextDayOfWeek === 0 || nextDayOfWeek === 6) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
                    }
                    currentStartDate = addDays(currentStartDate, diffDays);
                    if (currentEndDate) currentEndDate = addDays(currentEndDate, diffDays);
                } else if (data.recurrenceType === "WEEKDAYS_SAT") {
                    let diffDays = 1;
                    let nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
                    while (nextDayOfWeek === 0) {
                        diffDays++;
                        nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
                    }
                    currentStartDate = addDays(currentStartDate, diffDays);
                    if (currentEndDate) currentEndDate = addDays(currentEndDate, diffDays);
                } else if (data.recurrenceType === "BIWEEKLY") {
                    currentStartDate = addWeeks(currentStartDate, 2);
                    currentEndDate = addWeeks(currentEndDate, 2);
                } else if (data.recurrenceType === "MONTHLY") {
                    currentStartDate = addMonths(currentStartDate, 1);
                    currentEndDate = addMonths(currentEndDate, 1);
                } else if (data.recurrenceType === "CUSTOM" && data.recurrenceInterval) {
                    currentStartDate = addDays(currentStartDate, data.recurrenceInterval);
                    currentEndDate = addDays(currentEndDate, data.recurrenceInterval);
                } else {
                    break;
                }

                if (currentStartDate > effectiveEndDate) break;

                instances.push({
                    title: data.title,
                    type: data.type,
                    startDate: new Date(currentStartDate),
                    endDate: new Date(currentEndDate),
                    projectId: data.projectId === "none" ? null : data.projectId,
                    recurrenceType: data.recurrenceType,
                    recurrenceInterval: data.recurrenceInterval,
                    recurrenceEndDate: data.recurrenceEndDate,
                    originalId: masterEvent.id,
                    reminderMinutes: data.reminderMinutes,
                    color: data.color,
                    userId: session.user.id,
                });

                count++;
            }

            // DEBUG TEMPORÁRIO
            console.log("[DEBUG createEvent] instances geradas:", instances.length);

            if (instances.length > 0) {
                await prisma.event.createMany({
                    data: instances,
                });
            }
        }

        revalidatePath("/agenda");
        revalidatePath("/"); // Dashboard
        return { success: true, data: masterEvent };
    } catch (error) {
        console.error("Failed to create event:", error);
        return { success: false, error: "Failed to create event" };
    }
}

export async function updateEvent(id: string, data: CreateEventData, recurrenceMode: RecurrenceMode = "SINGLE") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = session.user.id;

        const currentEvent = await prisma.event.findUnique({ where: { id } });
        if (!currentEvent) throw new Error("Evento não encontrado");

        if (currentEvent.userId !== userId) return { success: false, error: "Unauthorized" };

        const masterId = currentEvent.originalId || currentEvent.id;

        if (recurrenceMode === "SINGLE") {
            // Update only this instance
            const result = await prisma.$transaction(async (tx) => {
                await (tx as any).alarm.deleteMany({ where: { eventId: id } });
                return await tx.event.update({
                    where: { id },
                    data: {
                        title: data.title,
                        type: data.type,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        projectId: data.projectId === "none" ? null : data.projectId,
                        reminderMinutes: data.reminderMinutes,
                        color: data.color as any,
                        alarms: data.alarms && data.alarms.length > 0 ? {
                            create: data.alarms.map(d => ({ dateTime: new Date(d) }))
                        } : undefined
                    } as any,
                });
            });
            revalidatePath("/agenda");
            return { success: true, data: result };
        }

        if (recurrenceMode === "FOLLOWING") {
            const result = await prisma.$transaction(async (tx) => {
                // Update this and all future
                // 1. Delete all future clones
                await tx.event.deleteMany({
                    where: {
                        OR: [{ id: masterId }, { originalId: masterId }],
                        id: { not: id },
                        startDate: { gt: currentEvent.startDate }
                    }
                });

                // 2. Update current instance
                await (tx as any).alarm.deleteMany({ where: { eventId: id } });
                const event = await tx.event.update({
                    where: { id },
                    data: {
                        title: data.title,
                        type: data.type,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        projectId: data.projectId === "none" ? null : data.projectId,
                        reminderMinutes: data.reminderMinutes,
                        color: data.color as any,
                        recurrenceType: data.recurrenceType,
                        recurrenceInterval: data.recurrenceInterval,
                        recurrenceEndDate: data.recurrenceEndDate,
                        alarms: data.alarms && data.alarms.length > 0 ? {
                            create: data.alarms.map(d => ({ dateTime: new Date(d) }))
                        } : undefined
                    } as any,
                });

                // 3. Regenerate future instances
                if (data.recurrenceType !== "NONE") {
                    await generateFutureRecurrences(id, masterId, data, userId, tx);
                }

                return event;
            });

            revalidatePath("/agenda");
            return { success: true, data: result };
        }

        if (recurrenceMode === "ALL") {
            // Update all instances in the series
            const masterEvent = await prisma.event.findUnique({ where: { id: masterId } });
            if (!masterEvent) throw new Error("Evento mestre não encontrado");

            // 1. Delete all clones
            const result = await prisma.$transaction(async (tx) => {
                await tx.event.deleteMany({
                    where: { originalId: masterId }
                });

                // 2. Update master event
                const timeDiff = data.startDate.getTime() - currentEvent.startDate.getTime();
                const newMasterStart = new Date(masterEvent.startDate.getTime() + timeDiff);
                const newMasterEnd = new Date(masterEvent.endDate.getTime() + timeDiff);

                await (tx as any).alarm.deleteMany({ where: { eventId: masterId } });
                const updatedMaster = await tx.event.update({
                    where: { id: masterId },
                    data: {
                        title: data.title,
                        type: data.type,
                        startDate: newMasterStart,
                        endDate: newMasterEnd,
                        projectId: data.projectId === "none" ? null : data.projectId,
                        reminderMinutes: data.reminderMinutes,
                        color: data.color as any,
                        recurrenceType: data.recurrenceType,
                        recurrenceInterval: data.recurrenceInterval,
                        recurrenceEndDate: data.recurrenceEndDate,
                        alarms: data.alarms && data.alarms.length > 0 ? {
                            create: data.alarms.map(d => ({ dateTime: new Date(d) }))
                        } : undefined
                    } as any,
                });

                // 3. Regenerate all clones from master
                if (data.recurrenceType !== "NONE") {
                    await generateFutureRecurrences(masterId, masterId, {
                        ...data,
                        startDate: newMasterStart,
                        endDate: newMasterEnd
                    }, userId, tx);
                }

                return updatedMaster;
            });

            revalidatePath("/agenda");
            return { success: true, data: result };
        }

        return { success: false, error: "Modo de recorrência inválido" };
    } catch (error) {
        console.error("Failed to update event:", error);
        return { success: false, error: "Failed to update event" };
    }
}

async function generateFutureRecurrences(
    templateId: string,
    masterId: string,
    data: CreateEventData,
    userId: string,
    tx?: any
) {
    const prismaClient = tx || prisma;
    const instances = [];
    let currentStartDate = new Date(data.startDate);
    let currentEndDate = new Date(data.endDate);
    const effectiveEndDate = data.recurrenceEndDate
        ? new Date(data.recurrenceEndDate)
        : addDays(new Date(data.startDate), 365);

    let count = 0;
    const MAX_INSTANCES = 365;

    while (count < MAX_INSTANCES) {
        if ((data.recurrenceType as string) === "DAILY") {
            currentStartDate = addDays(currentStartDate, 1);
            currentEndDate = addDays(currentEndDate, 1);
        } else if ((data.recurrenceType as string) === "WEEKLY") {
            currentStartDate = addWeeks(currentStartDate, 1);
            currentEndDate = addWeeks(currentEndDate, 1);
        } else if ((data.recurrenceType as string) === "WEEKLY_MWF") {
            let diffDays = 1;
            let nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
            while (nextDayOfWeek !== 1 && nextDayOfWeek !== 3 && nextDayOfWeek !== 5) {
                diffDays++;
                nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
            }
            currentStartDate = addDays(currentStartDate, diffDays);
            currentEndDate = addDays(currentEndDate, diffDays);
        } else if ((data.recurrenceType as string) === "WEEKLY_TTH") {
            let diffDays = 1;
            let nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
            while (nextDayOfWeek !== 2 && nextDayOfWeek !== 4) {
                diffDays++;
                nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
            }
            currentStartDate = addDays(currentStartDate, diffDays);
            currentEndDate = addDays(currentEndDate, diffDays);
        } else if ((data.recurrenceType as string) === "WEEKDAYS") {
            let diffDays = 1;
            let nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
            while (nextDayOfWeek === 0 || nextDayOfWeek === 6) {
                diffDays++;
                nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
            }
            currentStartDate = addDays(currentStartDate, diffDays);
            currentEndDate = addDays(currentEndDate, diffDays);
        } else if ((data.recurrenceType as string) === "WEEKDAYS_SAT") {
            let diffDays = 1;
            let nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
            while (nextDayOfWeek === 0) {
                diffDays++;
                nextDayOfWeek = addDays(currentStartDate, diffDays).getDay();
            }
            currentStartDate = addDays(currentStartDate, diffDays);
            currentEndDate = addDays(currentEndDate, diffDays);
        } else if ((data.recurrenceType as string) === "BIWEEKLY") {
            currentStartDate = addWeeks(currentStartDate, 2);
            currentEndDate = addWeeks(currentEndDate, 2);
        } else if ((data.recurrenceType as string) === "MONTHLY") {
            currentStartDate = addMonths(currentStartDate, 1);
            currentEndDate = addMonths(currentEndDate, 1);
        } else if ((data.recurrenceType as string) === "CUSTOM" && data.recurrenceInterval) {
            currentStartDate = addDays(currentStartDate, data.recurrenceInterval);
            currentEndDate = addDays(currentEndDate, data.recurrenceInterval);
        } else {
            break;
        }

        if (currentStartDate > effectiveEndDate) break;

        instances.push({
            title: data.title,
            type: data.type,
            startDate: new Date(currentStartDate),
            endDate: new Date(currentEndDate),
            projectId: data.projectId === "none" ? null : data.projectId,
            recurrenceType: data.recurrenceType,
            recurrenceInterval: data.recurrenceInterval,
            recurrenceEndDate: data.recurrenceEndDate,
            originalId: masterId,
            reminderMinutes: data.reminderMinutes,
            color: data.color,
            userId,
        });

        count++;
    }

    if (instances.length > 0) {
        await prismaClient.event.createMany({
            data: instances,
        });
    }
}

export async function deleteEvent(id: string, recurrenceMode: RecurrenceMode = "SINGLE") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const currentEvent = await prisma.event.findUnique({ where: { id } });
        if (!currentEvent) throw new Error("Evento não encontrado");

        if (currentEvent.userId !== session.user.id) return { success: false, error: "Unauthorized" };

        const masterId = currentEvent.originalId || currentEvent.id;

        if (recurrenceMode === "SINGLE") {
            await prisma.event.delete({ where: { id } });
        } else if (recurrenceMode === "FOLLOWING") {
            await prisma.event.deleteMany({
                where: {
                    OR: [{ id: masterId }, { originalId: masterId }],
                    userId: session.user.id,
                    startDate: { gte: currentEvent.startDate }
                }
            });
        } else if (recurrenceMode === "ALL") {
            await prisma.event.deleteMany({
                where: {
                    OR: [{ id: masterId }, { originalId: masterId }],
                    userId: session.user.id
                }
            });
        }

        revalidatePath("/agenda");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete event:", error);
        return { success: false, error: "Failed to delete event" };
    }
}

export async function getEvents() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const events = await prisma.event.findMany({
            where: { userId: session.user.id },
            orderBy: { startDate: "asc" },
            include: {
                project: true,
                alarms: true,
            }
        });
        return { success: true, data: events };
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return { success: false, error: "Failed to fetch events" };
    }
}
