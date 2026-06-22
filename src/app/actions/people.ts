"use server";

import { PrismaClient, PersonType, Context, PersonKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export type CreatePersonData = {
    name: string;
    fantasyName?: string;
    kind: PersonKind;
    type: PersonType;
    context: Context;
    document?: string;
    rg?: string;
    stateRegistration?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    website?: string;
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    birthDate?: Date;
    relationship?: string;
    occupation?: string;
    notes?: string;
    // CRM
    nextFollowUpAt?: Date;
    stage?: string;
    reminderMinutes?: number | null;
};

export type UpdatePersonData = CreatePersonData & { id: string };

export async function createPerson(data: CreatePersonData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const person = await prisma.person.create({ data: { ...data, userId: session.user.id } });
        revalidatePath("/people");
        return { success: true, data: person };
    } catch (error) {
        console.error("Failed to create person:", error);
        return { success: false, error: "Failed to create person" };
    }
}

export async function updatePerson(data: UpdatePersonData) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const { id, ...updateData } = data;
        const person = await prisma.person.update({ where: { id }, data: updateData });
        revalidatePath("/people");
        return { success: true, data: person };
    } catch (error) {
        console.error("Failed to update person:", error);
        return { success: false, error: "Failed to update person" };
    }
}

export async function deletePerson(id: string) {
    try {
        await prisma.person.delete({ where: { id } });
        revalidatePath("/people");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete person:", error);
        return { success: false, error: "Failed to delete person" };
    }
}

export async function getPeople(
    sortBy: "name" | "type" | "context" | "createdAt" = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const people = await prisma.person.findMany({
            where: { userId: session.user.id },
            orderBy: { [sortBy]: sortOrder },
            include: {
                interactions: {
                    orderBy: { date: "desc" },
                    take: 5,
                },
            },
        });
        return { success: true, data: people };
    } catch (error) {
        console.error("Failed to fetch people:", error);
        return { success: false, error: "Failed to fetch people" };
    }
}

export async function createInteraction(data: {
    personId: string;
    subject: string;
    type: string;
    date: Date;
    notes?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const interaction = await prisma.interaction.create({ data: { ...data, userId: session.user.id } });
        revalidatePath("/people");
        return { success: true, data: interaction };
    } catch (error) {
        console.error("Failed to create interaction:", error);
        return { success: false, error: "Failed to create interaction" };
    }
}

export async function deleteInteraction(id: string) {
    try {
        await prisma.interaction.delete({ where: { id } });
        revalidatePath("/people");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete interaction:", error);
        return { success: false, error: "Failed to delete interaction" };
    }
}
