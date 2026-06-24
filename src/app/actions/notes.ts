"use server";

import { Note, Context } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const prisma = db;

export type CreateNoteData = {
    title: string;
    theme?: string;
    content?: string;
    context: Context;
};

export async function createNote(data: CreateNoteData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const note = await prisma.note.create({
            data: {
                title: data.title,
                theme: data.theme,
                content: data.content,
                context: data.context,
                userId: session.user.id,
                tenantId: tenantId || null,
            },
        });

        revalidatePath("/notes");
        return { success: true, data: note };
    } catch (error) {
        console.error("Failed to create note:", error);
        return { success: false, error: "Failed to create note" };
    }
}

// ==========================================
// SECURITY / EDITOR CHECK HELPERS
// ==========================================

export async function verifyNoteEditorRights(noteId: string, userId: string): Promise<boolean> {
    const session = await auth();
    // @ts-ignore
    const tenantId = session?.user?.tenantId;

    const note = await prisma.note.findFirst({
        where: { id: noteId, tenantId: tenantId || null }
    });
    if (!note) return false;
    if (note.userId === userId) return true;

    // Check if there is an EDITOR share
    const share = await prisma.noteShare.findUnique({
        where: {
            noteId_userId: {
                noteId,
                userId
            }
        }
    });
    return share?.role === "EDITOR";
}

export async function updateNote(id: string, data: CreateNoteData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const hasRights = await verifyNoteEditorRights(id, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const note = await prisma.note.update({
            where: { id },
            data: {
                title: data.title,
                theme: data.theme,
                content: data.content,
                context: data.context,
            },
        });

        revalidatePath("/notes");
        return { success: true, data: note };
    } catch (error) {
        console.error("Failed to update note:", error);
        return { success: false, error: "Failed to update note" };
    }
}

export async function deleteNote(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const hasRights = await verifyNoteEditorRights(id, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        await prisma.note.delete({
            where: { id },
        });

        revalidatePath("/notes");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete note:", error);
        return { success: false, error: "Failed to delete note" };
    }
}

export async function getNotes(sort: string = "createdAt", order: "asc" | "desc" = "desc") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const notes = await prisma.note.findMany({
            where: {
                tenantId: tenantId || null,
                OR: [
                    { userId: session.user.id },
                    { shares: { some: { userId: session.user.id } } }
                ]
            },
            orderBy: { [sort]: order },
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
        });
        return { success: true, data: notes };
    } catch (error) {
        console.error("Failed to fetch notes:", error);
        return { success: false, error: "Failed to fetch notes" };
    }
}

// ==========================================
// SHARING MUTATIONS
// ==========================================

export async function shareNote(noteId: string, emailOrCpf: string, role: "VIEWER" | "EDITOR") {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        // Ensure owner and tenant
        const note = await prisma.note.findFirst({
            where: { id: noteId, userId: session.user.id, tenantId: tenantId || null }
        });
        if (!note) return { success: false, error: "Apenas o proprietário pode compartilhar a nota." };

        // Search user by email or CPF in same tenant
        const targetUser = await prisma.user.findFirst({
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
            return { success: false, error: "Você não pode compartilhar uma nota consigo mesmo." };
        }

        const noteShare = await prisma.noteShare.upsert({
            where: {
                noteId_userId: {
                    noteId,
                    userId: targetUser.id
                }
            },
            update: { role },
            create: {
                noteId,
                userId: targetUser.id,
                role
            }
        });

        revalidatePath("/notes");
        return { success: true, data: noteShare };
    } catch (error: any) {
        console.error("Error in shareNote:", error);
        return { success: false, error: error.message || "Failed to share note" };
    }
}

export async function unshareNote(noteId: string, userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const note = await prisma.note.findFirst({
            where: { id: noteId, tenantId: tenantId || null }
        });
        if (!note) return { success: false, error: "Nota não encontrada." };

        if (note.userId !== session.user.id && userId !== session.user.id) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.noteShare.delete({
            where: {
                noteId_userId: {
                    noteId,
                    userId
                }
            }
        });

        revalidatePath("/notes");
        return { success: true };
    } catch (error: any) {
        console.error("Error in unshareNote:", error);
        return { success: false, error: error.message || "Failed to remove note share" };
    }
}
