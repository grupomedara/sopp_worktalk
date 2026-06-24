"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

import { verifyNoteEditorRights } from "./notes";

const prisma = db;

export async function saveMindMap(id: string, content: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const note = await prisma.note.findFirst({
            where: { mindMapId: id, tenantId: tenantId || null }
        });
        if (!note) return { success: false, error: "Nota associada não encontrada." };

        const hasRights = await verifyNoteEditorRights(note.id, session.user.id);
        if (!hasRights) return { success: false, error: "Apenas leitura: Permissão de Editor necessária." };

        const safeContent = JSON.parse(JSON.stringify(content));

        const mindMap = await prisma.mindMap.update({
            where: { id },
            data: { content: safeContent },
        });
        return { success: true, data: mindMap };
    } catch (error: any) {
        console.error("Failed to save mind map:", error);
        return { success: false, error: error?.message ?? String(error) };
    }
}

export async function getMindMap(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const note = await prisma.note.findFirst({
            where: { mindMapId: id, tenantId: tenantId || null }
        });
        if (!note) return { success: false, error: "Nota associada não encontrada." };

        const isOwner = note.userId === session.user.id;
        const share = await prisma.noteShare.findFirst({
            where: { noteId: note.id, userId: session.user.id }
        });

        if (!isOwner && !share) {
            return { success: false, error: "Sem acesso a este mapa mental." };
        }

        const isReadOnly = !isOwner && share?.role === "VIEWER";

        const mindMap = await prisma.mindMap.findUnique({
            where: { id },
        });
        return { success: true, data: mindMap, isReadOnly };
    } catch (error: any) {
        console.error("Failed to fetch mind map:", error);
        return { success: false, error: error?.message ?? String(error) };
    }
}

export async function createVisualNote(data: {
    title: string;
    theme?: string;
    content?: string;
    context: any;
}) {
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
                type: "MINDMAP",
                tenantId: tenantId || null,
                user: {
                    connect: { id: session.user.id }
                },
                mindMap: {
                    create: {
                        title: data.title,
                        content: {},
                    }
                }
            },
            include: { mindMap: true }
        });

        revalidatePath("/notes");
        return { success: true, data: note };
    } catch (error: any) {
        console.error("Failed to create visual note:", error);
        return { success: false, error: error?.message ?? "Failed to create" };
    }
}
