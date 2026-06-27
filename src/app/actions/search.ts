"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function unifiedSearch(query: string) {
    if (!query || query.length < 2) return { success: true, data: [] };

    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };

        const userId = session.user.id;

        // @ts-ignore
        const tenantId = session.user.tenantId;

        const [notes, tasks, lists] = await Promise.all([
            db.note.findMany({
                where: {
                    userId,
                    tenantId: tenantId || null,
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { content: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            }),
            db.task.findMany({
                where: {
                    userId,
                    deletedAt: null,
                    OR: [
                        { list: { space: { tenantId: tenantId || null } } },
                        { listId: null }
                    ],
                    title: { contains: query, mode: 'insensitive' }
                },
                take: 5
            }),
            db.list.findMany({
                where: {
                    space: {
                        tenantId: tenantId || null,
                        OR: [
                            { userId },
                            { shares: { some: { userId } } }
                        ]
                    },
                    name: { contains: query, mode: 'insensitive' }
                },
                take: 5
            })
        ]);

        const results = [
            ...notes.map(n => ({ id: n.id, title: n.title, type: 'Nota', url: `/notes?id=${n.id}` })),
            ...tasks.map(t => ({ id: t.id, title: t.title, type: 'Tarefa', url: t.listId ? `/processes/${t.listId}` : `/processes` })),
            ...lists.map(l => ({ id: l.id, title: l.name, type: 'Lista', url: `/processes/${l.id}` }))
        ];

        return { success: true, data: results };
    } catch (error) {
        console.error("Search failed:", error);
        return { success: false, error: "Search failed" };
    }
}
