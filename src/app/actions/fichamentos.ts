"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

type FichamentoType = "CITACAO" | "RESUMO" | "BIBLIOGRAFICO" | "TEMATICO" | "COMENTARIO";
type FichamentoSourceType = "LIVRO" | "ARTIGO" | "VIDEO" | "PODCAST" | "CURSO_ONLINE" | "SITE" | "OUTRO";

export type FichamentoData = {
  title: string;
  type: FichamentoType;
  sourceType: FichamentoSourceType;
  authorLastName?: string;
  authorFirstName?: string;
  sourceTitle?: string;
  year?: number | null;
  url?: string;
  edition?: string;
  city?: string;
  publisher?: string;
  pages?: string;
  platform?: string;
  duration?: string;
  accessDate?: string;
  keywords?: string;
  mainContent?: string;
  personalNote?: string;
  bookId?: string | null;
};

export async function getFichamentos(filters?: {
  type?: FichamentoType;
  sourceType?: FichamentoSourceType;
  keyword?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const where: any = { userId: session.user.id };
    if (filters?.type) where.type = filters.type;
    if (filters?.sourceType) where.sourceType = filters.sourceType;
    if (filters?.keyword) {
      where.OR = [
        { title: { contains: filters.keyword, mode: "insensitive" } },
        { keywords: { contains: filters.keyword, mode: "insensitive" } },
        { sourceTitle: { contains: filters.keyword, mode: "insensitive" } },
        { authorLastName: { contains: filters.keyword, mode: "insensitive" } },
      ];
    }

    const fichamentos = await db.fichamento.findMany({
      where,
      include: { book: { select: { id: true, title: true, author: true } } },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: fichamentos };
  } catch (error) {
    console.error("Failed to fetch fichamentos:", error);
    return { success: false, error: "Erro ao buscar fichamentos" };
  }
}

export async function getFichamentoById(id: string) {
  try {
    const fichamento = await db.fichamento.findUnique({
      where: { id },
      include: { book: { select: { id: true, title: true, author: true } } },
    });
    if (!fichamento) return { success: false, error: "Fichamento não encontrado" };
    return { success: true, data: fichamento };
  } catch (error) {
    console.error("Failed to fetch fichamento:", error);
    return { success: false, error: "Erro ao buscar fichamento" };
  }
}

export async function createFichamento(data: FichamentoData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const fichamento = await db.fichamento.create({
      data: {
        title: data.title,
        type: data.type,
        sourceType: data.sourceType,
        authorLastName: data.authorLastName || null,
        authorFirstName: data.authorFirstName || null,
        sourceTitle: data.sourceTitle || null,
        year: data.year ?? null,
        url: data.url || null,
        edition: data.edition || null,
        city: data.city || null,
        publisher: data.publisher || null,
        pages: data.pages || null,
        platform: data.platform || null,
        duration: data.duration || null,
        accessDate: data.accessDate || null,
        keywords: data.keywords || null,
        mainContent: data.mainContent || null,
        personalNote: data.personalNote || null,
        bookId: data.bookId || null,
        userId: session.user.id,
      },
    });

    revalidatePath("/studies");
    return { success: true, data: fichamento };
  } catch (error) {
    console.error("Failed to create fichamento:", error);
    return { success: false, error: "Erro ao criar fichamento" };
  }
}

export async function updateFichamento(id: string, data: Partial<FichamentoData>) {
  try {
    const fichamento = await db.fichamento.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.sourceType !== undefined && { sourceType: data.sourceType }),
        ...(data.authorLastName !== undefined && { authorLastName: data.authorLastName || null }),
        ...(data.authorFirstName !== undefined && { authorFirstName: data.authorFirstName || null }),
        ...(data.sourceTitle !== undefined && { sourceTitle: data.sourceTitle || null }),
        ...(data.year !== undefined && { year: data.year ?? null }),
        ...(data.url !== undefined && { url: data.url || null }),
        ...(data.edition !== undefined && { edition: data.edition || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.publisher !== undefined && { publisher: data.publisher || null }),
        ...(data.pages !== undefined && { pages: data.pages || null }),
        ...(data.platform !== undefined && { platform: data.platform || null }),
        ...(data.duration !== undefined && { duration: data.duration || null }),
        ...(data.accessDate !== undefined && { accessDate: data.accessDate || null }),
        ...(data.keywords !== undefined && { keywords: data.keywords || null }),
        ...(data.mainContent !== undefined && { mainContent: data.mainContent || null }),
        ...(data.personalNote !== undefined && { personalNote: data.personalNote || null }),
        ...(data.bookId !== undefined && { bookId: data.bookId || null }),
      },
    });

    revalidatePath("/studies");
    return { success: true, data: fichamento };
  } catch (error) {
    console.error("Failed to update fichamento:", error);
    return { success: false, error: "Erro ao atualizar fichamento" };
  }
}

export async function deleteFichamento(id: string) {
  try {
    await db.fichamento.delete({ where: { id } });
    revalidatePath("/studies");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete fichamento:", error);
    return { success: false, error: "Erro ao excluir fichamento" };
  }
}
