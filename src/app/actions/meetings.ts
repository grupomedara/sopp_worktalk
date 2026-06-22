"use server";

import { PrismaClient, Meeting } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export type CreateMeetingData = {
    companyOrPerson: string;
    theme: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    content?: string;
    participantIds?: string[];
};

export async function createMeeting(data: CreateMeetingData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const meeting = await prisma.meeting.create({
            data: {
                companyOrPerson: data.companyOrPerson,
                theme: data.theme,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                content: data.content,
                userId: session.user.id,
                participants: data.participantIds && data.participantIds.length > 0 ? {
                    connect: data.participantIds.map(id => ({ id }))
                } : undefined,
            },
        });

        revalidatePath("/meetings");
        return { success: true, data: meeting };
    } catch (error: any) {
        console.error("Failed to create meeting:", error);
        return {
            success: false,
            error: error?.message || "Failed to create meeting"
        };
    }
}

// ==========================================
// SECURITY / EDITOR CHECK HELPERS
// ==========================================

export async function verifyMeetingEditorRights(meetingId: string, userId: string): Promise<boolean> {
    const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId }
    });
    if (!meeting) return false;
    if (meeting.userId === userId) return true;

    // Check if there is an EDITOR share
    const share = await prisma.meetingShare.findUnique({
        where: {
            meetingId_userId: {
                meetingId,
                userId
            }
        }
    });
    return share?.role === "EDITOR";
}

export async function updateMeeting(id: string, data: CreateMeetingData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const hasRights = await verifyMeetingEditorRights(id, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const meeting = await prisma.meeting.update({
            where: { id },
            data: {
                companyOrPerson: data.companyOrPerson,
                theme: data.theme,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                content: data.content,
                participants: {
                    set: data.participantIds ? data.participantIds.map(id => ({ id })) : []
                }
            },
        });

        revalidatePath("/meetings");
        return { success: true, data: meeting };
    } catch (error: any) {
        console.error("Failed to update meeting:", error);
        return {
            success: false,
            error: error?.message || "Failed to update meeting"
        };
    }
}

export async function deleteMeeting(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const hasRights = await verifyMeetingEditorRights(id, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        await prisma.meeting.delete({
            where: { id },
        });

        revalidatePath("/meetings");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete meeting:", error);
        return { success: false, error: "Failed to delete meeting" };
    }
}

export async function getMeetings(
    sort: string = "date",
    order: "asc" | "desc" | undefined = "desc",
    filters?: {
        companyOrPerson?: string;
        theme?: string;
        startDate?: string;
        endDate?: string;
    }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const where: any = {
            AND: [
                {
                    OR: [
                        { userId: session.user.id },
                        { shares: { some: { userId: session.user.id } } }
                    ]
                }
            ]
        };

        if (filters?.companyOrPerson && filters.companyOrPerson !== "all") {
            where.AND.push({ companyOrPerson: filters.companyOrPerson });
        }
        if (filters?.theme && filters.theme !== "all") {
            where.AND.push({ theme: filters.theme });
        }
        if (filters?.startDate || filters?.endDate) {
            const dateFilter: any = {};
            if (filters.startDate) {
                dateFilter.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                dateFilter.lte = new Date(filters.endDate);
            }
            where.AND.push({ date: dateFilter });
        }

        const meetings = await prisma.meeting.findMany({
            where,
            orderBy: { [sort]: order || 'desc' },
            select: {
                id: true,
                companyOrPerson: true,
                theme: true,
                date: true,
                startTime: true,
                endTime: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                participants: {
                    select: {
                        id: true,
                        name: true,
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
        return { success: true, data: meetings };
    } catch (error) {
        console.error("Failed to fetch meetings:", error);
        return { success: false, error: "Failed to fetch meetings" };
    }
}

export async function getMeetingById(id: string) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) return { success: false, error: "Unauthorized" };

        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                participants: {
                    select: {
                        id: true,
                        name: true,
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

        if (!meeting) return { success: false, error: "Reunião não encontrada." };

        const isOwner = meeting.userId === userId;
        const isShared = meeting.shares.some(s => s.userId === userId);
        if (!isOwner && !isShared) {
            return { success: false, error: "Sem permissão para visualizar esta reunião." };
        }

        return { success: true, data: meeting };
    } catch (error) {
        console.error("Failed to fetch meeting:", error);
        return { success: false, error: "Failed to fetch meeting" };
    }
}

export async function getMeetingFilterOptions() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const companies = await prisma.meeting.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { shares: { some: { userId: session.user.id } } }
                ]
            },
            select: { companyOrPerson: true },
            distinct: ['companyOrPerson'],
            orderBy: { companyOrPerson: 'asc' }
        });

        const themes = await prisma.meeting.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    { shares: { some: { userId: session.user.id } } }
                ]
            },
            select: { theme: true },
            distinct: ['theme'],
            orderBy: { theme: 'asc' }
        });

        return {
            success: true,
            data: {
                companies: companies.map(c => c.companyOrPerson).filter(Boolean),
                themes: themes.map(t => t.theme).filter(Boolean),
            }
        };
    } catch (error) {
        console.error("Failed to fetch filter options:", error);
        return { success: false, error: "Failed to fetch filter options" };
    }
}

// ==========================================
// SHARING MUTATIONS
// ==========================================

export async function shareMeeting(meetingId: string, emailOrCpf: string, role: "VIEWER" | "EDITOR") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Ensure owner
        const meeting = await prisma.meeting.findFirst({
            where: { id: meetingId, userId: session.user.id }
        });
        if (!meeting) return { success: false, error: "Apenas o proprietário pode compartilhar a reunião." };

        // Search user by email or CPF
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailOrCpf },
                    { document: emailOrCpf }
                ]
            }
        });
        if (!targetUser) return { success: false, error: "Usuário não encontrado com o E-mail ou CPF informado." };

        if (targetUser.id === session.user.id) {
            return { success: false, error: "Você não pode compartilhar uma reunião consigo mesmo." };
        }

        const meetingShare = await prisma.meetingShare.upsert({
            where: {
                meetingId_userId: {
                    meetingId,
                    userId: targetUser.id
                }
            },
            update: { role },
            create: {
                meetingId,
                userId: targetUser.id,
                role
            }
        });

        revalidatePath("/meetings");
        return { success: true, data: meetingShare };
    } catch (error: any) {
        console.error("Error in shareMeeting:", error);
        return { success: false, error: error.message || "Failed to share meeting" };
    }
}

export async function unshareMeeting(meetingId: string, userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const meeting = await prisma.meeting.findFirst({
            where: { id: meetingId }
        });
        if (!meeting) return { success: false, error: "Reunião não encontrada." };

        if (meeting.userId !== session.user.id && userId !== session.user.id) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.meetingShare.delete({
            where: {
                meetingId_userId: {
                    meetingId,
                    userId
                }
            }
        });

        revalidatePath("/meetings");
        return { success: true };
    } catch (error: any) {
        console.error("Error in unshareMeeting:", error);
        return { success: false, error: error.message || "Failed to remove meeting share" };
    }
}
