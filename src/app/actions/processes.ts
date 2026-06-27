"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Status } from "@prisma/client";

// ==========================================
// SHARING RIGHT CHECKS
// ==========================================

async function verifySpaceEditorRights(spaceId: string, userId: string): Promise<boolean> {
    const session = await auth();
    // @ts-ignore
    const tenantId = session?.user?.tenantId;

    const space = await db.space.findFirst({
        where: { id: spaceId, tenantId: tenantId || null }
    });
    if (!space) return false;
    if (space.userId === userId) return true;

    // Check if there is an EDITOR share
    const share = await db.spaceShare.findUnique({
        where: {
            spaceId_userId: {
                spaceId,
                userId
            }
        }
    });
    return share?.role === "EDITOR";
}

// ==========================================
// SPACE ACTIONS
// ==========================================

export async function getSpaces() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const spaces = await db.space.findMany({
            where: {
                tenantId: tenantId || null,
                OR: [
                    { userId: session.user.id },
                    { shares: { some: { userId: session.user.id } } }
                ]
            },
            include: {
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
                },
                folders: {
                    include: {
                        lists: {
                            include: {
                                tasks: { select: { status: true } }
                            },
                            orderBy: { order: "asc" }
                        }
                    },
                    orderBy: { order: "asc" }
                },
                lists: {
                    where: { folderId: null },
                    include: {
                        tasks: { select: { status: true } }
                    },
                    orderBy: { order: "asc" }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return { success: true, data: spaces };
    } catch (error: any) {
        console.error("Error in getSpaces:", error);
        return { success: false, error: error.message || "Failed to fetch spaces" };
    }
}

export async function createSpace(name: string, color?: string, icon?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const space = await db.space.create({
            data: {
                name,
                color: color || "zinc",
                icon: icon || "folder",
                userId: session.user.id,
                tenantId: tenantId || null
            }
        });

        revalidatePath("/processes");
        return { success: true, data: space };
    } catch (error: any) {
        console.error("Error in createSpace:", error);
        return { success: false, error: error.message || "Failed to create space" };
    }
}

export async function updateSpace(id: string, name: string, color?: string, icon?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        // Ensure owner and tenant
        const spaceExists = await db.space.findFirst({
            where: { id, userId: session.user.id, tenantId: tenantId || null }
        });
        if (!spaceExists) return { success: false, error: "Apenas o proprietário pode editar as configurações do espaço." };

        const space = await db.space.update({
            where: { id },
            data: { name, color, icon }
        });

        revalidatePath("/processes");
        return { success: true, data: space };
    } catch (error: any) {
        console.error("Error in updateSpace:", error);
        return { success: false, error: error.message || "Failed to update space" };
    }
}

export async function deleteSpace(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        // Ensure owner and tenant
        const spaceExists = await db.space.findFirst({
            where: { id, userId: session.user.id, tenantId: tenantId || null }
        });
        if (!spaceExists) return { success: false, error: "Apenas o proprietário pode excluir o espaço." };

        await db.space.delete({
            where: { id }
        });

        revalidatePath("/processes");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteSpace:", error);
        return { success: false, error: error.message || "Failed to delete space" };
    }
}

export async function shareSpace(spaceId: string, emailOrCpf: string, role: "VIEWER" | "EDITOR") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        // Ensure current user is the owner and tenant of the space
        const space = await db.space.findFirst({
            where: { id: spaceId, userId: session.user.id, tenantId: tenantId || null }
        });
        if (!space) return { success: false, error: "Apenas o proprietário pode compartilhar o espaço." };

        // Search user by email or CPF in the same tenant
        const targetUser = await db.user.findFirst({
            where: {
                tenantId: tenantId || null,
                OR: [
                    { email: emailOrCpf },
                    { document: emailOrCpf }
                ]
            }
        });
        if (!targetUser) return { success: false, error: "Usuário não encontrado com o E-mail ou CPF informado." };

        if (targetUser.id === session.user.id) {
            return { success: false, error: "Você não pode compartilhar um espaço consigo mesmo." };
        }

        // Create or update share
        const spaceShare = await db.spaceShare.upsert({
            where: {
                spaceId_userId: {
                    spaceId,
                    userId: targetUser.id
                }
            },
            update: { role },
            create: {
                spaceId,
                userId: targetUser.id,
                role
            }
        });

        revalidatePath("/processes");
        return { success: true, data: spaceShare };
    } catch (error: any) {
        console.error("Error in shareSpace:", error);
        return { success: false, error: error.message || "Failed to share space" };
    }
}

export async function unshareSpace(spaceId: string, userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const space = await db.space.findFirst({
            where: { id: spaceId, tenantId: tenantId || null }
        });
        if (!space) return { success: false, error: "Espaço não encontrado." };

        // Only space owner or the user themselves can revoke
        if (space.userId !== session.user.id && userId !== session.user.id) {
            return { success: false, error: "Unauthorized" };
        }

        await db.spaceShare.delete({
            where: {
                spaceId_userId: {
                    spaceId,
                    userId
                }
            }
        });

        revalidatePath("/processes");
        return { success: true };
    } catch (error: any) {
        console.error("Error in unshareSpace:", error);
        return { success: false, error: error.message || "Failed to remove space share" };
    }
}

// ==========================================
// FOLDER ACTIONS
// ==========================================

export async function createFolder(name: string, spaceId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Verify editor rights
        const hasRights = await verifySpaceEditorRights(spaceId, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const folder = await db.folder.create({
            data: { name, spaceId }
        });

        revalidatePath("/processes");
        return { success: true, data: folder };
    } catch (error: any) {
        console.error("Error in createFolder:", error);
        return { success: false, error: error.message || "Failed to create folder" };
    }
}

export async function updateFolder(id: string, name: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const folder = await db.folder.findUnique({
            where: { id },
            include: { space: true }
        });
        if (!folder) return { success: false, error: "Folder not found" };

        const hasRights = await verifySpaceEditorRights(folder.spaceId, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const updatedFolder = await db.folder.update({
            where: { id },
            data: { name }
        });

        revalidatePath("/processes");
        return { success: true, data: updatedFolder };
    } catch (error: any) {
        console.error("Error in updateFolder:", error);
        return { success: false, error: error.message || "Failed to update folder" };
    }
}

export async function deleteFolder(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const folder = await db.folder.findUnique({
            where: { id },
            include: { space: true }
        });
        if (!folder) return { success: false, error: "Folder not found" };

        const hasRights = await verifySpaceEditorRights(folder.spaceId, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        await db.folder.delete({
            where: { id }
        });

        revalidatePath("/processes");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteFolder:", error);
        return { success: false, error: error.message || "Failed to delete folder" };
    }
}

// ==========================================
// LIST ACTIONS
// ==========================================

export async function getList(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const list = await db.list.findFirst({
            where: {
                id,
                space: {
                    tenantId: tenantId || null,
                    OR: [
                        { userId: session.user.id },
                        { shares: { some: { userId: session.user.id } } }
                    ]
                }
            },
            include: {
                space: {
                    include: {
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
                },
                folder: true,
                tasks: {
                    include: {
                        comments: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true
                                    }
                                }
                            },
                            orderBy: { createdAt: "asc" }
                        }
                    },
                    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
                }
            }
        });

        if (!list) return { success: false, error: "List not found or unauthorized" };

        return { success: true, data: list };
    } catch (error: any) {
        console.error("Error in getList:", error);
        return { success: false, error: error.message || "Failed to fetch list" };
    }
}

export async function createList(name: string, spaceId: string, folderId?: string | null, isTemplate = false, customFieldsConfig?: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const hasRights = await verifySpaceEditorRights(spaceId, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const list = await db.list.create({
            data: {
                name,
                spaceId,
                folderId: folderId || null,
                isTemplate,
                customFieldsConfig: customFieldsConfig || []
            }
        });

        revalidatePath("/processes");
        return { success: true, data: list };
    } catch (error: any) {
        console.error("Error in createList:", error);
        return { success: false, error: error.message || "Failed to create list" };
    }
}

export async function updateList(id: string, name: string, customFieldsConfig?: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const list = await db.list.findUnique({
            where: { id },
            include: { space: true }
        });
        if (!list) return { success: false, error: "List not found" };

        const hasRights = await verifySpaceEditorRights(list.spaceId, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const updatedList = await db.list.update({
            where: { id },
            data: {
                name,
                customFieldsConfig: customFieldsConfig !== undefined ? customFieldsConfig : undefined
            }
        });

        revalidatePath(`/processes/${id}`);
        revalidatePath("/processes");
        return { success: true, data: updatedList };
    } catch (error: any) {
        console.error("Error in updateList:", error);
        return { success: false, error: error.message || "Failed to update list" };
    }
}

export async function deleteList(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const list = await db.list.findUnique({
            where: { id },
            include: { space: true }
        });
        if (!list) return { success: false, error: "List not found" };

        const hasRights = await verifySpaceEditorRights(list.spaceId, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        await db.list.delete({
            where: { id }
        });

        revalidatePath("/processes");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteList:", error);
        return { success: false, error: error.message || "Failed to delete list" };
    }
}

// ==========================================
// LIST TASK ACTIONS
// ==========================================

export async function createListTask(listId: string, title: string, priority = "NORMAL", customFieldValues: any = {}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const list = await db.list.findUnique({
            where: { id: listId }
        });
        if (!list) return { success: false, error: "List not found" };

        const hasRights = await verifySpaceEditorRights(list.spaceId, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const task = await db.task.create({
            data: {
                title,
                priority: priority,
                status: "PENDING",
                listId,
                userId: session.user.id,
                customFieldValues: customFieldValues
            }
        });

        revalidatePath(`/processes/${listId}`);
        return { success: true, data: task };
    } catch (error: any) {
        console.error("Error in createListTask:", error);
        return { success: false, error: error.message || "Failed to create task" };
    }
}

export async function updateListTask(taskId: string, data: {
    title?: string;
    status?: Status;
    priority?: string;
    customFieldValues?: any;
    date?: Date | null;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const task = await db.task.findUnique({
            where: { id: taskId },
            include: { list: true }
        });
        if (!task) return { success: false, error: "Task not found" };

        if (task.listId && task.list) {
            const hasRights = await verifySpaceEditorRights(task.list.spaceId, session.user.id);
            if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };
        } else {
            if (task.userId !== session.user.id) return { success: false, error: "Unauthorized" };
        }

        let startedAtUpdate: Date | null | undefined = undefined;
        let completedAtUpdate: Date | null | undefined = undefined;

        if (data.status !== undefined && data.status !== task.status) {
            if (data.status === "IN_PROGRESS") {
                if (task.status === "PENDING") {
                    startedAtUpdate = new Date();
                }
                completedAtUpdate = null;
            } else if (data.status === "COMPLETED") {
                completedAtUpdate = new Date();
                if (!task.startedAt) {
                    startedAtUpdate = new Date();
                }
            } else if (data.status === "PENDING") {
                startedAtUpdate = null;
                completedAtUpdate = null;
            }
        }

        const updatedTask = await db.task.update({
            where: { id: taskId },
            data: {
                title: data.title !== undefined ? data.title : undefined,
                status: data.status !== undefined ? data.status : undefined,
                priority: data.priority !== undefined ? data.priority : undefined,
                customFieldValues: data.customFieldValues !== undefined ? data.customFieldValues : undefined,
                date: data.date !== undefined ? data.date : undefined,
                startedAt: startedAtUpdate !== undefined ? startedAtUpdate : undefined,
                completedAt: completedAtUpdate !== undefined ? completedAtUpdate : undefined
            }
        });

        // Audit Trail generation
        const auditLogs: string[] = [];
        if (data.title !== undefined && data.title !== task.title) {
            auditLogs.push(`alterou o título de "${task.title}" para "${data.title}"`);
        }
        if (data.status !== undefined && data.status !== task.status) {
            const statusMap: any = { PENDING: "Pendente", IN_PROGRESS: "Em Progresso", COMPLETED: "Concluído", ARCHIVED: "Arquivado", CANCELED: "Cancelado" };
            auditLogs.push(`alterou o status de "${statusMap[task.status] || task.status}" para "${statusMap[data.status] || data.status}"`);
        }
        if (data.priority !== undefined && data.priority !== task.priority) {
            auditLogs.push(`alterou a prioridade de "${task.priority}" para "${data.priority}"`);
        }
        const oldTime = task.date ? new Date(task.date).getTime() : 0;
        const newTime = data.date ? new Date(data.date).getTime() : 0;
        if (data.date !== undefined && oldTime !== newTime) {
            const oldStr = task.date ? new Date(task.date).toLocaleDateString("pt-BR") : "sem prazo";
            const newStr = data.date ? new Date(data.date).toLocaleDateString("pt-BR") : "sem prazo";
            auditLogs.push(`alterou o prazo de "${oldStr}" para "${newStr}"`);
        }

        if (auditLogs.length > 0) {
            const userId = session.user.id;
            const userName = session.user.name || "Um usuário";
            await Promise.all(auditLogs.map(log => 
                db.taskComment.create({
                    data: {
                        taskId,
                        userId,
                        content: `${userName} ${log}`,
                        isSystem: true
                    }
                })
            ));
        }

        if (task.listId) {
            revalidatePath(`/processes/${task.listId}`);
        }
        return { success: true, data: updatedTask };
    } catch (error: any) {
        console.error("Error in updateListTask:", error);
        return { success: false, error: error.message || "Failed to update task" };
    }
}

export async function deleteListTask(taskId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const task = await db.task.findUnique({
            where: { id: taskId },
            include: { list: true }
        });
        if (!task) return { success: false, error: "Task not found" };

        if (task.listId && task.list) {
            const hasRights = await verifySpaceEditorRights(task.list.spaceId, session.user.id);
            if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };
        } else {
            if (task.userId !== session.user.id) return { success: false, error: "Unauthorized" };
        }

        let isPermanent = false;
        if (task.deletedAt) {
            await db.task.delete({
                where: { id: taskId }
            });
            isPermanent = true;
        } else {
            await db.task.update({
                where: { id: taskId },
                data: { deletedAt: new Date() }
            });
        }

        if (task.listId) {
            revalidatePath(`/processes/${task.listId}`);
        }
        return { success: true, permanent: isPermanent };
    } catch (error: any) {
        console.error("Error in deleteListTask:", error);
        return { success: false, error: error.message || "Failed to delete task" };
    }
}

export async function restoreListTask(taskId: string, targetStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const task = await db.task.findUnique({
            where: { id: taskId },
            include: { list: true }
        });
        if (!task) return { success: false, error: "Task not found" };

        if (task.listId && task.list) {
            const hasRights = await verifySpaceEditorRights(task.list.spaceId, session.user.id);
            if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };
        } else {
            if (task.userId !== session.user.id) return { success: false, error: "Unauthorized" };
        }

        let startedAtUpdate: any = undefined;
        let completedAtUpdate: any = undefined;

        if (targetStatus === "IN_PROGRESS") {
            startedAtUpdate = new Date();
            completedAtUpdate = null;
        } else if (targetStatus === "COMPLETED") {
            if (!task.startedAt) startedAtUpdate = new Date();
            completedAtUpdate = new Date();
        } else if (targetStatus === "PENDING") {
            startedAtUpdate = null;
            completedAtUpdate = null;
        }

        const updatedTask = await db.task.update({
            where: { id: taskId },
            data: {
                deletedAt: null,
                status: targetStatus,
                startedAt: startedAtUpdate,
                completedAt: completedAtUpdate
            }
        });

        // Audit Trail generation
        const userName = session.user.name || "Um usuário";
        const statusMap: any = { PENDING: "Pendente", IN_PROGRESS: "Em Progresso", COMPLETED: "Concluído" };
        await db.taskComment.create({
            data: {
                taskId,
                userId: session.user.id,
                content: `${userName} restaurou a tarefa para o status "${statusMap[targetStatus] || targetStatus}"`,
                isSystem: true
            }
        });

        if (task.listId) {
            revalidatePath(`/processes/${task.listId}`);
        }
        return { success: true, data: updatedTask };
    } catch (error: any) {
        console.error("Error in restoreListTask:", error);
        return { success: false, error: error.message || "Failed to restore task" };
    }
}

// ==========================================
// PROCEDURES / TEMPLATE INSTANTIATION ENGINE
// ==========================================

export async function instantiateTemplate(templateListId: string, newListName: string, spaceId: string, folderId?: string | null) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // Verify write access to target space
        const hasRights = await verifySpaceEditorRights(spaceId, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        // Fetch template list
        const templateList = await db.list.findUnique({
            where: { id: templateListId },
            include: { tasks: true }
        });
        if (!templateList) return { success: false, error: "Template list not found" };

        // Create the new List
        const newList = await db.list.create({
            data: {
                name: newListName,
                spaceId,
                folderId: folderId || null,
                isTemplate: false,
                customFieldsConfig: templateList.customFieldsConfig || []
            }
        });

        // Clone tasks
        if (templateList.tasks.length > 0) {
            const userId = session.user.id;
            const taskData = templateList.tasks.map(t => ({
                title: t.title,
                context: t.context,
                priority: t.priority,
                status: "PENDING" as Status,
                listId: newList.id,
                userId: userId,
                customFieldValues: t.customFieldValues || {}
            }));

            await db.task.createMany({
                data: taskData
            });
        }

        revalidatePath("/processes");
        return { success: true, data: newList };
    } catch (error: any) {
        console.error("Error in instantiateTemplate:", error);
        return { success: false, error: error.message || "Failed to instantiate template" };
    }
}

export async function duplicateFolder(folderId: string, newFolderName: string, targetSpaceId?: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = session.user.id;

        // Fetch original folder
        const originalFolder = await db.folder.findUnique({
            where: { id: folderId },
            include: {
                lists: {
                    include: {
                        tasks: true
                    }
                }
            }
        });
        if (!originalFolder) return { success: false, error: "Folder not found" };

        const finalSpaceId = targetSpaceId || originalFolder.spaceId;

        // Verify editor rights on original space
        const hasOriginalRights = await verifySpaceEditorRights(originalFolder.spaceId, userId);
        if (!hasOriginalRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        // Verify editor rights on target space if moving/copying to another space
        if (targetSpaceId && targetSpaceId !== originalFolder.spaceId) {
            const hasTargetRights = await verifySpaceEditorRights(targetSpaceId, userId);
            if (!hasTargetRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária no espaço de destino." };
        }

        // Create new folder
        const newFolder = await db.folder.create({
            data: {
                name: newFolderName,
                spaceId: finalSpaceId
            }
        });

        // Clone lists and tasks
        for (const list of originalFolder.lists) {
            const newList = await db.list.create({
                data: {
                    name: list.name,
                    spaceId: finalSpaceId,
                    folderId: newFolder.id,
                    isTemplate: list.isTemplate,
                    customFieldsConfig: list.customFieldsConfig || []
                }
            });

            if (list.tasks.length > 0) {
                const taskData = list.tasks.map(t => ({
                    title: t.title,
                    context: t.context,
                    priority: t.priority,
                    status: "PENDING" as Status,
                    listId: newList.id,
                    userId: userId,
                    customFieldValues: t.customFieldValues || {}
                }));

                await db.task.createMany({
                    data: taskData
                });
            }
        }

        revalidatePath("/processes");
        return { success: true, data: newFolder };
    } catch (error: any) {
        console.error("Error in duplicateFolder:", error);
        return { success: false, error: error.message || "Failed to duplicate folder" };
    }
}

export async function moveFolder(folderId: string, targetSpaceId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = session.user.id;

        // Fetch original folder
        const folder = await db.folder.findUnique({
            where: { id: folderId }
        });
        if (!folder) return { success: false, error: "Pasta não encontrada" };

        // Check editor rights in original space and target space
        const hasOriginalRights = await verifySpaceEditorRights(folder.spaceId, userId);
        const hasTargetRights = await verifySpaceEditorRights(targetSpaceId, userId);
        if (!hasOriginalRights || !hasTargetRights) {
            return { success: false, error: "Apenas leitura: Permissão de Editor necessária em ambos os espaços." };
        }

        // Move folder
        const updatedFolder = await db.folder.update({
            where: { id: folderId },
            data: {
                spaceId: targetSpaceId
            }
        });

        // Move all child lists of this folder to the new spaceId too!
        await db.list.updateMany({
            where: { folderId: folderId },
            data: {
                spaceId: targetSpaceId
            }
        });

        revalidatePath("/processes");
        return { success: true, data: updatedFolder };
    } catch (error: any) {
        console.error("Error in moveFolder:", error);
        return { success: false, error: error.message || "Failed to move folder" };
    }
}

export async function duplicateList(listId: string, newListName: string, targetSpaceId: string, targetFolderId?: string | null) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = session.user.id;

        // Check target space editor rights
        const hasRights = await verifySpaceEditorRights(targetSpaceId, userId);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária no espaço de destino." };

        // Fetch original list and tasks
        const originalList = await db.list.findUnique({
            where: { id: listId },
            include: { tasks: true }
        });
        if (!originalList) return { success: false, error: "Lista não encontrada" };

        // Create new List
        const newList = await db.list.create({
            data: {
                name: newListName,
                spaceId: targetSpaceId,
                folderId: targetFolderId || null,
                isTemplate: originalList.isTemplate,
                customFieldsConfig: originalList.customFieldsConfig || []
            }
        });

        // Clone tasks (and reset status to PENDING, keep priority and assignee/responsible)
        if (originalList.tasks.length > 0) {
            const taskData = originalList.tasks.map(t => ({
                title: t.title,
                context: t.context,
                priority: t.priority,
                status: "PENDING" as Status,
                listId: newList.id,
                userId: userId,
                customFieldValues: t.customFieldValues || {}
            }));

            await db.task.createMany({
                data: taskData
            });
        }

        revalidatePath("/processes");
        return { success: true, data: newList };
    } catch (error: any) {
        console.error("Error in duplicateList:", error);
        return { success: false, error: error.message || "Failed to duplicate list" };
    }
}

export async function moveList(listId: string, targetSpaceId: string, targetFolderId?: string | null) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = session.user.id;

        // Fetch original list
        const list = await db.list.findUnique({
            where: { id: listId }
        });
        if (!list) return { success: false, error: "Lista não encontrada" };

        // Check editor rights in original space and target space
        const hasOriginalRights = await verifySpaceEditorRights(list.spaceId, userId);
        const hasTargetRights = await verifySpaceEditorRights(targetSpaceId, userId);
        if (!hasOriginalRights || !hasTargetRights) {
            return { success: false, error: "Apenas leitura: Permissão de Editor necessária em ambos os espaços." };
        }

        // Update list
        const updatedList = await db.list.update({
            where: { id: listId },
            data: {
                spaceId: targetSpaceId,
                folderId: targetFolderId || null
            }
        });

        revalidatePath("/processes");
        return { success: true, data: updatedList };
    } catch (error: any) {
        console.error("Error in moveList:", error);
        return { success: false, error: error.message || "Failed to move list" };
    }
}


export async function updateProcessOrder(items: { id: string; order: number }[], type: "folder" | "list") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // We use sequential updates inside a transaction for atomic safety
        if (type === "folder") {
            await db.$transaction(
                items.map(item =>
                    db.folder.update({
                        where: { id: item.id },
                        data: { order: item.order }
                    })
                )
            );
        } else {
            await db.$transaction(
                items.map(item =>
                    db.list.update({
                        where: { id: item.id },
                        data: { order: item.order }
                    })
                )
            );
        }

        revalidatePath("/processes");
        return { success: true };
    } catch (error: any) {
        console.error("Error in updateProcessOrder:", error);
        return { success: false, error: error.message || "Failed to update order" };
    }
}

// ==========================================
// TASK COMMENT ACTIONS
// ==========================================

export async function createTaskComment(
    taskId: string,
    content: string,
    attachmentUrl?: string | null,
    attachmentName?: string | null
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = session.user.id;

        // Verify task exists and user has access (via list space)
        const task = await db.task.findUnique({
            where: { id: taskId },
            include: { list: true }
        });
        if (!task || !task.listId) return { success: false, error: "Tarefa não encontrada" };

        const comment = await db.taskComment.create({
            data: {
                taskId,
                userId,
                content,
                attachmentUrl: attachmentUrl || null,
                attachmentName: attachmentName || null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        });

        revalidatePath(`/processes/${task.listId}`);
        revalidatePath("/processes");
        return { success: true, data: comment };
    } catch (error: any) {
        console.error("Error in createTaskComment:", error);
        return { success: false, error: error.message || "Failed to create comment" };
    }
}

export async function deleteTaskComment(commentId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        const userId = session.user.id;

        const comment = await db.taskComment.findUnique({
            where: { id: commentId },
            include: { task: true }
        });
        if (!comment) return { success: false, error: "Comentário não encontrado" };

        // Only the author can delete their comment
        if (comment.userId !== userId) {
            return { success: false, error: "Sem permissão para excluir este comentário" };
        }

        if (comment.isSystem) {
            return { success: false, error: "Registros de auditoria do sistema não podem ser excluídos." };
        }

        await db.taskComment.delete({
            where: { id: commentId }
        });

        if (comment.task?.listId) {
            revalidatePath(`/processes/${comment.task.listId}`);
        }
        revalidatePath("/processes");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteTaskComment:", error);
        return { success: false, error: error.message || "Failed to delete comment" };
    }
}

