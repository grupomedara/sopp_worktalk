"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getBooks() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const books = await db.book.findMany({
      where: { userId: session.user.id },
      include: { notes: true },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: books };
  } catch (error) {
    console.error("Failed to fetch books:", error);
    return { success: false, error: "Failed to fetch books" };
  }
}

export async function createBook(data: { title: string; author: string; totalChapters: number }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    if (!data.title || data.totalChapters <= 0) {
      return { success: false, error: "Dados inválidos: Título e capítulos são obrigatórios." };
    }

    const book = await db.book.create({
      data: {
        title: data.title,
        author: data.author || "Autor Desconhecido",
        totalChapters: data.totalChapters,
        currentChapter: 0,
        status: "READING",
        userId: session.user.id,
      },
    });

    revalidatePath("/studies");
    return { success: true, data: book };
  } catch (error) {
    console.error("Failed to create book:", error);
    return { success: false, error: "Failed to create book" };
  }
}

export async function updateBookProgress(bookId: string, currentChapter: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const book = await db.book.findUnique({ where: { id: bookId } });
    if (!book || book.userId !== session.user.id) {
      return { success: false, error: "Book not found or access denied" };
    }

    const nextChapter = Math.min(currentChapter, book.totalChapters);
    const status = nextChapter >= book.totalChapters ? "COMPLETED" : "READING";

    const updated = await db.book.update({
      where: { id: bookId },
      data: {
        currentChapter: nextChapter,
        status,
      },
    });

    revalidatePath("/studies");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update book progress:", error);
    return { success: false, error: "Failed to update book progress" };
  }
}

export async function deleteBook(bookId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const book = await db.book.findUnique({ where: { id: bookId } });
    if (!book || book.userId !== session.user.id) {
      return { success: false, error: "Book not found or access denied" };
    }

    await db.book.delete({ where: { id: bookId } });

    revalidatePath("/studies");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete book:", error);
    return { success: false, error: "Failed to delete book" };
  }
}
