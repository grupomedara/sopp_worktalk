"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSprints(projectId: string) {
    try {
        const sprints = await db.sprint.findMany({
            where: { projectId },
            orderBy: { startDate: 'desc' },
            include: {
                tasks: true // Include tasks to count/display progress
            }
        });
        return { success: true, data: sprints };
    } catch (error) {
        console.error("Failed to fetch sprints:", error);
        return { success: false, error: "Failed to fetch sprints" };
    }
}

export async function createSprint(data: {
    name: string;
    startDate: Date;
    endDate: Date;
    projectId: string;
    goal?: string;
}) {
    try {
        await db.sprint.create({
            data: {
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                projectId: data.projectId,
                goal: data.goal,
                status: "PLANNING"
            },
        });
        revalidatePath("/agile");
        revalidatePath(`/agile/${data.projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to create sprint:", error);
        return { success: false, error: "Failed to create sprint" };
    }
}

export async function updateSprint(id: string, data: {
    name?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    goal?: string;
}) {
    try {
        await db.sprint.update({
            where: { id },
            data,
        });
        revalidatePath("/agile");
        return { success: true };
    } catch (error) {
        console.error("Failed to update sprint:", error);
        return { success: false, error: "Failed to update sprint" };
    }
}

export async function deleteSprint(id: string) {
    try {
        await db.sprint.delete({ where: { id } });
        revalidatePath("/agile");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete sprint:", error);
        return { success: false, error: "Failed to delete sprint" };
    }
}
export async function activateSprint(id: string, projectId: string) {
    try {
        // Deactivate all sprints for this project
        await db.sprint.updateMany({
            where: { projectId },
            data: { status: "PLANNING" }
        });

        // Activate the selected sprint
        await db.sprint.update({
            where: { id },
            data: { status: "ACTIVE" }
        });

        revalidatePath("/agile");
        revalidatePath(`/agile/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to activate sprint:", error);
        return { success: false, error: "Failed to activate sprint" };
    }
}

export async function completeSprint(sprintId: string, retrospective: string) {
    try {
        await db.sprint.update({
            where: { id: sprintId },
            data: {
                status: "COMPLETED",
                retrospective: retrospective
            },
        });

        revalidatePath("/agile");
        return { success: true };
    } catch (error) {
        console.error("Failed to complete sprint:", error);
        return { success: false, error: "Failed to complete sprint" };
    }
}
