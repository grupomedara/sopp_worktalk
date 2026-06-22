"use server";

import { PrismaClient, Goal, Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export type CreateGoalData = {
    title: string;
    lifeArea: string;
    deadline?: Date;
    metric?: string;
    motivation?: string;
    status: Status;
    progress?: number;
};

export async function createGoal(data: CreateGoalData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const goal = await prisma.goal.create({
            data: {
                title: data.title,
                lifeArea: data.lifeArea,
                deadline: data.deadline,
                metric: data.metric,
                motivation: data.motivation,
                status: data.status,
                progress: data.progress,
                userId: session.user.id,
            },
        });

        revalidatePath("/goals");
        return { success: true, data: goal };
    } catch (error) {
        console.error("Failed to create goal:", error);
        return { success: false, error: "Failed to create goal" };
    }
}

export async function deleteGoal(id: string) {
    try {
        await prisma.goal.delete({
            where: { id },
        });

        revalidatePath("/goals");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete goal:", error);
        return { success: false, error: "Failed to delete goal" };
    }
}

export async function getGoals() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const goals = await prisma.goal.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                projects: true, // Include related projects count if needed
            }
        });
        return { success: true, data: goals };
    } catch (error) {
        console.error("Failed to fetch goals:", error);
        return { success: false, error: "Failed to fetch goals" };
    }
}

export async function updateGoal(id: string, data: Partial<CreateGoalData>) {
    try {
        const goal = await prisma.goal.update({
            where: { id },
            data: {
                title: data.title,
                lifeArea: data.lifeArea,
                deadline: data.deadline,
                metric: data.metric,
                motivation: data.motivation,
                status: data.status,
                progress: data.progress,
            },
        });

        revalidatePath("/goals");
        return { success: true, data: goal };
    } catch (error) {
        console.error("Failed to update goal:", error);
        return { success: false, error: "Failed to update goal" };
    }
}
