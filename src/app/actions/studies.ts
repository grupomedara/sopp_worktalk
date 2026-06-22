"use server";

import { PrismaClient, Study, Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export type CreateStudyData = {
    course: string;
    subject: string;
    topic: string;
    content?: string;
    notes?: string;
    timeSpent?: number;
    status: Status;
    createReviewTask?: boolean;
};

export async function createStudy(data: CreateStudyData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const study = await prisma.study.create({
            data: {
                course: data.course,
                subject: data.subject,
                topic: data.topic,
                content: data.content,
                notes: data.notes,
                timeSpent: data.timeSpent,
                status: data.status,
                userId: session.user.id,
            },
        });

        if (data.createReviewTask) {
            await prisma.task.create({
                data: {
                    title: `Revisar: ${data.topic}`,
                    context: "INTELECTUAL",
                    priority: "Medium",
                    date: addDays(new Date(), 1), // Next day review
                    status: "PENDING",
                }
            });
        }

        revalidatePath("/studies");
        revalidatePath("/tasks"); // Because we might have added a task
        return { success: true, data: study };
    } catch (error: any) {
        console.error("Failed to create study:", error);
        return {
            success: false,
            error: error?.message || "Failed to create study"
        };
    }
}


export async function updateStudy(id: string, data: CreateStudyData) {
    try {
        const study = await prisma.study.update({
            where: { id },
            data: {
                course: data.course,
                subject: data.subject,
                topic: data.topic,
                content: data.content,
                notes: data.notes,
                timeSpent: data.timeSpent,
                status: data.status,
            },
        });

        revalidatePath("/studies");
        return { success: true, data: study };
    } catch (error: any) {
        console.error("Failed to update study:", error);
        return {
            success: false,
            error: error?.message || "Failed to update study"
        };
    }
}

export async function deleteStudy(id: string) {
    try {
        await prisma.study.delete({
            where: { id },
        });

        revalidatePath("/studies");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete study:", error);
        return { success: false, error: "Failed to delete study" };
    }
}

export async function getStudies(
    sort: string = "createdAt",
    order: "asc" | "desc" | undefined = "desc",
    filters?: {
        course?: string;
        subject?: string;
        topic?: string;
    }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const where: any = { userId: session.user.id };
        if (filters?.course && filters.course !== "all") where.course = filters.course;
        if (filters?.subject && filters.subject !== "all") where.subject = filters.subject;
        if (filters?.topic && filters.topic !== "all") where.topic = { contains: filters.topic, mode: 'insensitive' }; // Topic might be partial search or exact, user said "same topic". Let's try exact first but "contains" is safer for loose matching. Actually user said "loose course with SAME topic". Let's stick to exact string for dropdown filters, or maybe contains if it's a search. 
        // Re-reading plan: "unique values from the database for the filter dropdowns". So it should be exact match.
        if (filters?.topic && filters.topic !== "all") where.topic = filters.topic;

        const studies = await prisma.study.findMany({
            where,
            orderBy: { [sort]: order || 'desc' },
            select: {
                id: true,
                course: true,
                subject: true,
                topic: true,
                status: true,
                timeSpent: true,
                createdAt: true,
                updatedAt: true,
                noteId: true,
                // Excluindo content e notes para evitar payload gigante no RSC
            }
        });
        return { success: true, data: studies };
    } catch (error) {
        console.error("Failed to fetch studies:", error);
        return { success: false, error: "Failed to fetch studies" };
    }
}

export async function getStudyById(id: string) {
    try {
        const study = await prisma.study.findUnique({
            where: { id },
        });
        return { success: true, data: study };
    } catch (error) {
        console.error("Failed to fetch study:", error);
        return { success: false, error: "Failed to fetch study" };
    }
}

export async function getStudyFilterOptions() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const courses = await prisma.study.findMany({
            where: { userId: session.user.id },
            select: { course: true },
            distinct: ['course'],
            orderBy: { course: 'asc' }
        });

        const subjects = await prisma.study.findMany({
            where: { userId: session.user.id },
            select: { subject: true },
            distinct: ['subject'],
            orderBy: { subject: 'asc' }
        });

        const topics = await prisma.study.findMany({
            where: { userId: session.user.id },
            select: { topic: true },
            distinct: ['topic'],
            orderBy: { topic: 'asc' }
        });

        return {
            success: true,
            data: {
                courses: courses.map(c => c.course).filter(Boolean),
                subjects: subjects.map(s => s.subject).filter(Boolean),
                topics: topics.map(t => t.topic).filter(Boolean),
            }
        };
    } catch (error) {
        console.error("Failed to fetch filter options:", error);
        return { success: false, error: "Failed to fetch filter options" };
    }
}
