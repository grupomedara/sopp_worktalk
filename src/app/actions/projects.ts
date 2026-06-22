"use server";

import { PrismaClient, Project, Status, Context } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export type CreateProjectData = {
    name: string;
    context: Context;
    goalId?: string;
    personIds?: string[];
    deadline?: Date;
    status: Status;
    type?: string;
    ownerId?: string;
};

// ==========================================
// SECURITY / EDITOR CHECK HELPERS
// ==========================================

export async function verifyProjectEditorRights(projectId: string, userId: string): Promise<boolean> {
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project) return false;
    if (project.ownerId === userId) return true;

    // Check if there is an EDITOR share
    const share = await prisma.projectShare.findUnique({
        where: {
            projectId_userId: {
                projectId,
                userId
            }
        }
    });
    return share?.role === "EDITOR";
}

// ==========================================
// PROJECT MUTATIONS
// ==========================================

export async function createProject(data: CreateProjectData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const project = await prisma.project.create({
            data: {
                name: data.name,
                context: data.context,
                goalId: data.goalId === "none" ? undefined : data.goalId,
                people: {
                    connect: data.personIds?.map(id => ({ id })) || []
                },
                deadline: data.deadline,
                status: data.status,
                type: data.type || "STANDARD",
                ownerId: session.user.id,
            },
        });

        revalidatePath("/projects");
        return { success: true, data: project };
    } catch (error) {
        console.error("Failed to create project:", error);
        return { success: false, error: "Failed to create project" };
    }
}

export async function updateProject(id: string, data: CreateProjectData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const hasRights = await verifyProjectEditorRights(id, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const project = await prisma.project.update({
            where: { id },
            data: {
                name: data.name,
                context: data.context,
                goalId: data.goalId === "none" ? null : data.goalId,
                people: {
                    set: data.personIds?.map(id => ({ id })) || []
                },
                deadline: data.deadline,
                status: data.status,
                type: data.type,
            },
        });

        revalidatePath("/projects");
        return { success: true, data: project };
    } catch (error) {
        console.error("Failed to update project:", error);
        return { success: false, error: "Failed to update project" };
    }
}

export async function deleteProject(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const hasRights = await verifyProjectEditorRights(id, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        await prisma.project.delete({
            where: { id },
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete project:", error);
        return { success: false, error: "Failed to delete project" };
    }
}

// ==========================================
// PROJECT QUERY ACTIONS
// ==========================================

export async function getProjects(sort: string = "createdAt", order: "asc" | "desc" = "desc") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { ownerId: session.user.id },
                    { members: { some: { id: session.user.id } } },
                    { shares: { some: { userId: session.user.id } } }
                ]
            },
            orderBy: { [sort]: order },
            include: {
                goal: true,
                tasks: true,
                people: true,
                notes: true,
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
        return { success: true, data: projects };
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return { success: false, error: "Failed to fetch projects" };
    }
}

export async function getProject(id: string) {
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                goal: true,
                tasks: {
                    include: {
                        sprint: true,
                        responsible: true
                    }
                },
                people: true,
                notes: {
                    include: {
                        people: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                sprints: {
                    orderBy: { startDate: 'desc' },
                    include: {
                        tasks: {
                            include: {
                                responsible: true
                            }
                        }
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
        return { success: true, data: project };
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return { success: false, error: "Failed to fetch project" };
    }
}

// ==========================================
// SHARING MUTATIONS
// ==========================================

export async function shareProject(projectId: string, emailOrCpf: string, role: "VIEWER" | "EDITOR") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Ensure owner
        const project = await prisma.project.findFirst({
            where: { id: projectId, ownerId: session.user.id }
        });
        if (!project) return { success: false, error: "Apenas o proprietário pode compartilhar o projeto." };

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
            return { success: false, error: "Você não pode compartilhar um projeto consigo mesmo." };
        }

        const projectShare = await prisma.projectShare.upsert({
            where: {
                projectId_userId: {
                    projectId,
                    userId: targetUser.id
                }
            },
            update: { role },
            create: {
                projectId,
                userId: targetUser.id,
                role
            }
        });

        revalidatePath("/projects");
        return { success: true, data: projectShare };
    } catch (error: any) {
        console.error("Error in shareProject:", error);
        return { success: false, error: error.message || "Failed to share project" };
    }
}

export async function unshareProject(projectId: string, userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const project = await prisma.project.findFirst({
            where: { id: projectId }
        });
        if (!project) return { success: false, error: "Projeto não encontrado." };

        if (project.ownerId !== session.user.id && userId !== session.user.id) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.projectShare.delete({
            where: {
                projectId_userId: {
                    projectId,
                    userId
                }
            }
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error: any) {
        console.error("Error in unshareProject:", error);
        return { success: false, error: error.message || "Failed to remove project share" };
    }
}
