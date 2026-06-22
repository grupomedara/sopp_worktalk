"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// Objective Actions
export async function createObjective(data: { title: string; description?: string; projectId: string }) {
    try {
        const objective = await prisma.objective.create({
            data: {
                title: data.title,
                description: data.description,
                projectId: data.projectId,
            },
        });
        revalidatePath(`/agile/${data.projectId}`);
        revalidatePath(`/projects`);
        return { success: true, data: objective };
    } catch (error) {
        console.error("Failed to create objective:", error);
        return { success: false, error: "Failed to create objective" };
    }
}

export async function updateObjective(id: string, data: { title: string; description?: string; projectId: string }) {
    try {
        const objective = await prisma.objective.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
            },
        });
        revalidatePath(`/agile/${data.projectId}`);
        return { success: true, data: objective };
    } catch (error) {
        console.error("Failed to update objective:", error);
        return { success: false, error: "Failed to update objective" };
    }
}

export async function deleteObjective(id: string, projectId: string) {
    try {
        await prisma.objective.delete({
            where: { id },
        });
        revalidatePath(`/agile/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete objective:", error);
        return { success: false, error: "Failed to delete objective" };
    }
}

// Key Result Actions
export async function createKeyResult(data: {
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
    objectiveId: string;
    projectId: string;
}) {
    try {
        const kr = await prisma.keyResult.create({
            data: {
                title: data.title,
                description: data.description,
                targetValue: data.targetValue,
                unit: data.unit,
                objectiveId: data.objectiveId,
            },
        });
        revalidatePath(`/agile/${data.projectId}`);
        return { success: true, data: kr };
    } catch (error) {
        console.error("Failed to create Key Result:", error);
        return { success: false, error: "Failed to create Key Result" };
    }
}

export async function updateKeyResultCheckIn(id: string, data: {
    currentValue: number;
    date: Date;
    projectId: string;
}) {
    try {
        const kr = await prisma.keyResult.findUnique({ where: { id } });
        if (!kr) throw new Error("Key Result not found");

        const isCompleted = data.currentValue >= kr.targetValue;

        const updatedKr = await prisma.keyResult.update({
            where: { id },
            data: {
                currentValue: data.currentValue,
                lastCheckIn: data.date,
                completedAt: isCompleted ? data.date : null,
            },
        });
        revalidatePath(`/agile/${data.projectId}`);
        return { success: true, data: updatedKr };
    } catch (error) {
        console.error("Failed to update Key Result check-in:", error);
        return { success: false, error: "Failed to update Key Result check-in" };
    }
}

export async function deleteKeyResult(id: string, projectId: string) {
    try {
        await prisma.keyResult.delete({
            where: { id },
        });
        revalidatePath(`/agile/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete Key Result:", error);
        return { success: false, error: "Failed to delete Key Result" };
    }
}

export async function getProjectObjectives(projectId: string) {
    try {
        const objectives = await prisma.objective.findMany({
            where: { projectId },
            include: {
                keyResults: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: objectives };
    } catch (error) {
        console.error("Failed to fetch objectives:", error);
        return { success: false, error: "Failed to fetch objectives" };
    }
}

export async function updateKeyResult(id: string, data: {
    title: string;
    description?: string;
    targetValue: number;
    unit: string;
    projectId: string;
}) {
    try {
        const kr = await prisma.keyResult.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                targetValue: data.targetValue,
                unit: data.unit,
            },
        });
        revalidatePath(`/agile/${data.projectId}`);
        return { success: true, data: kr };
    } catch (error) {
        console.error("Failed to update Key Result:", error);
        return { success: false, error: "Failed to update Key Result" };
    }
}
