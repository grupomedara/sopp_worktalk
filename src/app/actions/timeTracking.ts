"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// 1. Start Timer (Creates a new TimeLog without endTime)
export async function startTimeLog(taskId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Check if there is already an open timer for this user and task
        const existingOpenLog = await prisma.timeLog.findFirst({
            where: {
                taskId,
                userId: session.user.id,
                endTime: null,
            }
        });

        if (existingOpenLog) {
            return { success: false, error: "Timer já está rodando para esta tarefa." };
        }

        const newLog = await prisma.timeLog.create({
            data: {
                taskId,
                userId: session.user.id,
                startTime: new Date(),
            }
        });

        revalidatePath("/tasks");
        revalidatePath("/agile");
        return { success: true, data: newLog };
    } catch (error: any) {
        console.error("Error in startTimeLog:", error);
        return { success: false, error: error.message || "Failed to start timer." };
    }
}

// 2. Stop Timer (Closes an open TimeLog and calculates duration)
export async function stopTimeLog(taskId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const openLog = await prisma.timeLog.findFirst({
            where: {
                taskId,
                userId: session.user.id,
                endTime: null,
            }
        });

        if (!openLog) {
            return { success: false, error: "Nenhum timer rodando para esta tarefa." };
        }

        const endTime = new Date();
        const durationSeconds = Math.floor((endTime.getTime() - openLog.startTime.getTime()) / 1000);

        const updatedLog = await prisma.timeLog.update({
            where: { id: openLog.id },
            data: {
                endTime,
                duration: durationSeconds,
            }
        });

        revalidatePath("/tasks");
        revalidatePath("/agile");
        return { success: true, data: updatedLog };
    } catch (error: any) {
        console.error("Error in stopTimeLog:", error);
        return { success: false, error: error.message || "Failed to stop timer." };
    }
}

// 3. Add Manual Time (Creates a TimeLog with both start and end time matching the duration)
export async function addManualTimeLog(taskId: string, durationMinutes: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        if (durationMinutes <= 0) {
            return { success: false, error: "Duração deve ser maior que zero." };
        }

        const durationSeconds = durationMinutes * 60;
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (durationSeconds * 1000));

        const newLog = await prisma.timeLog.create({
            data: {
                taskId,
                userId: session.user.id,
                startTime,
                endTime,
                duration: durationSeconds,
            }
        });

        revalidatePath("/tasks");
        revalidatePath("/agile");
        return { success: true, data: newLog };
    } catch (error: any) {
        console.error("Error in addManualTimeLog:", error);
        return { success: false, error: error.message || "Failed to add manual time." };
    }
}

// 4. Delete Time Log
export async function deleteTimeLog(logId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const log = await prisma.timeLog.findUnique({ where: { id: logId } });
        if (!log) return { success: false, error: "Time log not found" };

        // Only creator can delete their logs, unless they are admin (assuming basic check for now)
        if (log.userId !== session.user.id) {
            return { success: false, error: "Você só pode excluir seus próprios apontamentos." };
        }

        await prisma.timeLog.delete({ where: { id: logId } });

        revalidatePath("/tasks");
        revalidatePath("/agile");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteTimeLog:", error);
        return { success: false, error: error.message || "Failed to delete time log." };
    }
}
