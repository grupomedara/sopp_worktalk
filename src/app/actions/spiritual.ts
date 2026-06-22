"use server";

import { Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { BIBLE_BOOKS } from "@/lib/bible-api";


// Remove const prisma = new PrismaClient();


// --- PRAYERS ---

export async function getPrayers() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const prayers = await db.prayer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: prayers };
  } catch (error) {
    console.error("Failed to fetch prayers:", error);
    return { success: false, error: "Failed to fetch prayers" };
  }
}

export async function createPrayer(data: { title: string; description?: string; category: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const prayer = await db.prayer.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
        userId: session.user.id,
      },
    });

    revalidatePath("/spiritual");
    return { success: true, data: prayer };
  } catch (error) {
    console.error("Failed to create prayer:", error);
    return { success: false, error: "Failed to create prayer" };
  }
}

export async function updatePrayerStatus(id: string, status: Status) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Verify ownership
    const prayer = await db.prayer.findUnique({ where: { id } });
    if (!prayer || prayer.userId !== session.user.id) {
      return { success: false, error: "Prayer not found or access denied" };
    }

    const updated = await db.prayer.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/spiritual");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update prayer:", error);
    return { success: false, error: "Failed to update prayer" };
  }
}

export async function updatePrayer(id: string, data: { title: string; description?: string; category: string }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Verify ownership
    const prayer = await db.prayer.findUnique({ where: { id } });
    if (!prayer || prayer.userId !== session.user.id) {
      return { success: false, error: "Prayer not found or access denied" };
    }

    const updated = await db.prayer.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
      },
    });

    revalidatePath("/spiritual");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update prayer:", error);
    return { success: false, error: "Failed to update prayer" };
  }
}

export async function deletePrayer(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const prayer = await db.prayer.findUnique({ where: { id } });
    if (!prayer || prayer.userId !== session.user.id) {
      return { success: false, error: "Prayer not found or access denied" };
    }

    await db.prayer.delete({ where: { id } });

    revalidatePath("/spiritual");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete prayer:", error);
    return { success: false, error: "Failed to delete prayer" };
  }
}

// --- READING PLANS ---

export async function getReadingPlans() {
  try {
    const plans = await db.bibleReadingPlan.findMany({
      include: { readings: { orderBy: { day: "asc" } } },
    });
    return { success: true, data: plans };
  } catch (error) {
    console.error("Failed to fetch reading plans:", error);
    return { success: false, error: "Failed to fetch reading plans" };
  }
}

export async function deleteReadingPlan(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // In a real multi-tenant app, only super admins should do this.
    // For now, we allow it.
    await db.bibleReadingPlan.delete({
      where: { id },
    });

    revalidatePath("/spiritual");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete reading plan template:", error);
    return { success: false, error: "Failed to delete reading plan template" };
  }
}


export async function getUserPlans() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const plans = await db.userBiblePlan.findMany({
      where: { userId: session.user.id },
      include: { plan: { include: { readings: { orderBy: { day: "asc" } } } } },
    });

    const fixedPlans = plans.map(up => ({
      ...up,
      progress: Math.min(((up.currentDay - 1) / up.plan.totalDays) * 100, 100)
    }));

    return { success: true, data: fixedPlans };

  } catch (error) {
    console.error("Failed to fetch user plans:", error);
    return { success: false, error: "Failed to fetch user plans" };
  }
}

export async function enrollInPlan(planId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Check if already enrolled
    const existing = await db.userBiblePlan.findFirst({
      where: { userId: session.user.id, planId },
    });

    if (existing) return { success: true, data: existing };

    const userPlan = await db.userBiblePlan.create({
      data: {
        userId: session.user.id,
        planId,
        currentDay: 1,
        status: "IN_PROGRESS",
      },
    });

    revalidatePath("/spiritual");
    return { success: true, data: userPlan };
  } catch (error) {
    console.error("Failed to enroll in plan:", error);
    return { success: false, error: "Failed to enroll in plan" };
  }
}

export async function updatePlanProgress(userPlanId: string, currentDay: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const userPlan = await db.userBiblePlan.findUnique({
      where: { id: userPlanId },
      include: { plan: { include: { readings: true } } },
    });

    if (!userPlan || userPlan.userId !== session.user.id) {
      return { success: false, error: "Plan not found or access denied" };
    }

    const totalDays = userPlan.plan.totalDays;
    const progress = Math.min(((currentDay - 1) / totalDays) * 100, 100);
    const status = currentDay >= totalDays ? "COMPLETED" : "IN_PROGRESS";

    const updated = await db.userBiblePlan.update({
      where: { id: userPlanId },
      data: {
        currentDay,
        progress,
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });


    revalidatePath("/spiritual");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update plan progress:", error);
    return { success: false, error: "Failed to update plan progress" };
  }
}

export async function deleteUserPlan(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const userPlan = await db.userBiblePlan.findUnique({
      where: { id },
    });

    if (!userPlan || userPlan.userId !== session.user.id) {
      return { success: false, error: "Plan not found or access denied" };
    }

    await db.userBiblePlan.delete({
      where: { id },
    });

    revalidatePath("/spiritual");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user plan:", error);
    return { success: false, error: "Failed to delete user plan" };
  }
}

// --- AUTOMATIC PLAN GENERATOR ---

export async function createAutomaticPlan(data: { title: string; bookId: string; days: number }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const book = BIBLE_BOOKS.find(b => b.id === data.bookId);
    if (!book) return { success: false, error: "Livro não encontrado" };

    const totalChapters = book.chapters;
    const days = data.days;

    if (days <= 0 || days > totalChapters) {
      return { success: false, error: "Quantidade de dias inválida (deve ser entre 1 e o total de capítulos)" };
    }

    const itemsPerDay = Math.floor(totalChapters / days);
    const remainder = totalChapters % days;

    const readingsData = [];
    let currentChapter = 1;

    for (let d = 1; d <= days; d++) {
      const countForThisDay = itemsPerDay + (d <= remainder ? 1 : 0);
      if (countForThisDay === 0) continue;

      const endChapter = currentChapter + countForThisDay - 1;
      const range = endChapter === currentChapter ? `${currentChapter}` : `${currentChapter}-${endChapter}`;
      const reference = `${book.name} ${range}`;

      readingsData.push({
        day: d,
        reference,
        books: book.id,
        chapters: range,
      });

      currentChapter = endChapter + 1;
    }

    // Create the plan
    const plan = await db.bibleReadingPlan.create({
      data: {
        title: data.title || `Leitura de ${book.name}`,
        description: `Plano automático de leitura gerado para ${book.name}.`,
        type: "TEMATICO",
        totalDays: days,
        readings: {
          create: readingsData,
        },
      },
      include: {
        readings: {
          orderBy: { day: "asc" }
        }
      }
    });

    // Automatically enroll the user
    await db.userBiblePlan.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        currentDay: 1,
        progress: 0,
        status: "IN_PROGRESS",
      },
    });

    revalidatePath("/spiritual");
    return { success: true, data: plan };
  } catch (error) {
    console.error("Failed to generate automatic plan:", error);
    return { success: false, error: "Falha ao gerar o plano automático" };
  }
}

// --- RECOMMENDED PLANS CATALOGUE ---

export async function createRecommendedPlan(type: "BIBLE_365" | "NT_90" | "WISDOM_30" | "BIBLE_180" | "PENTATEUCH" | "CHRONOLOGICAL") {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const CHRONO_ORDER = [
      "GEN", "JOB", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1CH", "PSA", "1KI", "PRO", "ECC", "SNG", "2CH", "2KI", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAH", "HAB", "ZEP", "HAG", "ZEC", "MAL", "EZR", "NEH", "EST",
      "MAT", "MRK", "LUK", "JHN", "ACT", "GAL", "1TH", "2TH", "1CO", "2CO", "ROM", "PHP", "COL", "PHM", "EPH", "1TI", "TIT", "2TI", "HEB", "1PE", "2PE", "JUD", "1JN", "2JN", "3JN", "JAS", "REV"
    ];

    let filterBooks = BIBLE_BOOKS;
    if (type === "NT_90") {
      filterBooks = BIBLE_BOOKS.filter(b => ["MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"].includes(b.id));
    } else if (type === "WISDOM_30") {
      filterBooks = BIBLE_BOOKS.filter(b => ["PSA", "PRO"].includes(b.id));
    } else if (type === "PENTATEUCH") {
      filterBooks = BIBLE_BOOKS.filter(b => ["GEN", "EXO", "LEV", "NUM", "DEU"].includes(b.id));
    } else if (type === "CHRONOLOGICAL") {
      filterBooks = CHRONO_ORDER.map(id => BIBLE_BOOKS.find(b => b.id === id)).filter(Boolean) as typeof BIBLE_BOOKS;
    }

    const allChapters = [];
    for (const book of filterBooks) {
      for (let c = 1; c <= book.chapters; c++) {
        allChapters.push({ bookId: book.id, bookName: book.name, chapter: c });
      }
    }

    const totalChapters = allChapters.length;
    let targetDays = 365; // Default 1 year
    if (type === "BIBLE_180") targetDays = 180;
    else if (type === "NT_90") targetDays = 90;
    else if (type === "WISDOM_30") targetDays = 30;
    else if (type === "PENTATEUCH") targetDays = 60;

    const itemsPerDay = Math.floor(totalChapters / targetDays);
    const remainder = totalChapters % targetDays;

    const readingsData = [];
    let currentIndex = 0;
    let dayCounter = 1;

    // Use totalChapters as loop end since truncations might expand day list slightly
    while (currentIndex < totalChapters) {
      const countForThisDay = itemsPerDay + (dayCounter <= remainder ? 1 : 0);
      const sliceEnd = Math.min(currentIndex + (countForThisDay || 1), totalChapters);
      const dayChapters = allChapters.slice(currentIndex, sliceEnd);

      const currentBookId = dayChapters[0].bookId;
      const hasBoundaryOverlap = dayChapters.some(c => c.bookId !== currentBookId);

      if (hasBoundaryOverlap) {
        // Truncate overlap segment
        const sameBookChapters = [];
        for (const cap of dayChapters) {
          if (cap.bookId === currentBookId) sameBookChapters.push(cap);
          else break;
        }
        
        const min = sameBookChapters[0].chapter;
        const max = sameBookChapters[sameBookChapters.length - 1].chapter;
        const range = min === max ? `${min}` : `${min}-${max}`;

        readingsData.push({
          day: dayCounter,
          reference: `${sameBookChapters[0].bookName} ${range}`,
          books: currentBookId,
          chapters: range,
        });

        currentIndex += sameBookChapters.length;
      } else {
        const min = dayChapters[0].chapter;
        const max = dayChapters[dayChapters.length - 1].chapter;
        const range = min === max ? `${min}` : `${min}-${max}`;

        readingsData.push({
          day: dayCounter,
          reference: `${dayChapters[0].bookName} ${range}`,
          books: currentBookId,
          chapters: range,
        });

        currentIndex += dayChapters.length;
      }

      dayCounter++;
    }

    const titles = {
      "BIBLE_365": "Bíblia Toda em 365 Dias",
      "BIBLE_180": "Bíblia Toda em 180 Dias",
      "NT_90": "Novo Testamento em 90 Dias",
      "WISDOM_30": "Sabedoria: Salmos e Provérbios",
      "PENTATEUCH": "O Pentateuco em 60 dias",
      "CHRONOLOGICAL": "Bíblia em Ordem Cronológica"
    };

    const plan = await db.bibleReadingPlan.create({
      data: {
        title: titles[type] || `Plano Dinâmico`,
        description: `Plano estruturado gerado automaticamente pelo algoritmo Catálogo Clássico.`,
        type: type === "WISDOM_30" ? "TEMATICO" : "CANONICO",
        totalDays: readingsData.length,
        readings: {
          create: readingsData,
        },
      },
      include: {
        readings: {
          orderBy: { day: "asc" }
        }
      }
    });

    await db.userBiblePlan.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        currentDay: 1,
        progress: 0,
        status: "IN_PROGRESS",
      },
    });

    revalidatePath("/spiritual");
    return { success: true, data: plan };
  } catch (error) {
    console.error("Failed to create recommended plan:", error);
    return { success: false, error: "Falha ao gerar o plano recomendado" };
  }
}

