"use server";

import { PrismaClient, Lesson, FinanceType, FinanceCategory, Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export type CreateLessonData = {
    clientOrGroup: string;
    topic: string;
    objective?: string;
    appliedContent?: string;
    materials?: string;
    followUp?: string;
    personId?: string;
    date?: Date;
};

export async function createLesson(data: CreateLessonData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const lesson = await prisma.lesson.create({
            data: {
                clientOrGroup: data.clientOrGroup,
                topic: data.topic,
                objective: data.objective,
                appliedContent: data.appliedContent,
                materials: data.materials,
                followUp: data.followUp,
                personId: data.personId === "none" ? null : data.personId,
                date: data.date || new Date(),
                userId: session.user.id,
            },
        });

        revalidatePath("/lessons");
        return { success: true, data: lesson };
    } catch (error) {
        console.error("Failed to create lesson:", error);
        return { success: false, error: "Failed to create lesson" };
    }
}

export async function deleteLesson(id: string) {
    try {
        await prisma.lesson.delete({
            where: { id },
        });

        revalidatePath("/lessons");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete lesson:", error);
        return { success: false, error: "Failed to delete lesson" };
    }
}


export async function updateLesson(id: string, data: CreateLessonData) {
    try {
        const lesson = await prisma.lesson.update({
            where: { id },
            data: {
                clientOrGroup: data.clientOrGroup,
                topic: data.topic,
                objective: data.objective,
                appliedContent: data.appliedContent,
                materials: data.materials,
                followUp: data.followUp,
                personId: data.personId === "none" ? null : data.personId,
                date: data.date,
            },
        });

        // We do typically NOT auto-update finance on edit to avoid complex sync issues, 
        // unless explicitly requested. For now, we update the lesson only.

        revalidatePath("/lessons");
        return { success: true, data: lesson };
    } catch (error) {
        console.error("Failed to update lesson:", error);
        return { success: false, error: "Failed to update lesson" };
    }
}

export async function getLessons(sort: string = "createdAt", order: "asc" | "desc" = "desc") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const lessons = await prisma.lesson.findMany({
            where: { userId: session.user.id },
            orderBy: { [sort]: order },
            include: {
                person: true,
            }
        });
        return { success: true, data: lessons };
    } catch (error) {
        console.error("Failed to fetch lessons:", error);
        return { success: false, error: "Failed to fetch lessons" };
    }
}
