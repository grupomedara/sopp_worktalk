"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function unifiedSearch(query: string) {
    if (!query || query.length < 2) return { success: true, data: [] };

    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = session.user.id;

        const [notes, projects, tasks, people] = await Promise.all([
            prisma.note.findMany({
                where: {
                    userId,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { content: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            }),
            prisma.project.findMany({
                where: {
                    OR: [
                        { ownerId: userId },
                        { members: { some: { id: userId } } }
                    ],
                    name: { contains: query, mode: 'insensitive' }
                },
                take: 5
            }),
            prisma.task.findMany({
                where: {
                    userId,
                    title: { contains: query, mode: 'insensitive' }
                },
                take: 5
            }),
            prisma.person.findMany({
                where: {
                    userId,
                    name: { contains: query, mode: 'insensitive' }
                },
                take: 5
            })
        ]);

        const results = [
            ...notes.map(n => ({ id: n.id, title: n.title, type: 'Nota', url: `/notes?id=${n.id}` })),
            ...projects.map(p => ({ id: p.id, title: p.name, type: 'Projeto', url: p.type === 'AGILE' ? `/agile/${p.id}` : `/projects` })),
            ...tasks.map(t => ({ id: t.id, title: t.title, type: 'Tarefa', url: `/tasks` })),
            ...people.map(p => ({ id: p.id, title: p.name, type: 'Pessoa', url: `/people` }))
        ];

        return { success: true, data: results };
    } catch (error) {
        console.error("Search failed:", error);
        return { success: false, error: "Search failed" };
    }
}
