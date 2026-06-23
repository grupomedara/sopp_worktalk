"use server";

import { db } from "@/lib/db";
import { ParsedNLP } from "@/lib/nlp-parser";
import { Context, Status } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function quickCreate(parsed: ParsedNLP) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, message: "Não autorizado" };

        const userId = session.user.id;

        // 1. Resolve Context
        let context: Context = Context.REALIZACAO; // Default to Realizacao
        
        const contextMap: Record<string, Context> = {
            'SAUDE': Context.SAUDE,
            'HEALTH': Context.SAUDE,
            'CORPO': Context.SAUDE,
            'DISPOSICAO': Context.SAUDE,
            'INTELECTUAL': Context.INTELECTUAL,
            'ESTUDO': Context.INTELECTUAL,
            'LEITURA': Context.INTELECTUAL,
            'EMOCIONAL': Context.EMOCIONAL,
            'EQUILIBRIO': Context.EMOCIONAL,
            'MENTAL': Context.EMOCIONAL,
            'REALIZACAO': Context.REALIZACAO,
            'PROPOSITO': Context.REALIZACAO,
            'EMPRESA': Context.REALIZACAO,
            'PROFISSIONAL': Context.REALIZACAO,
            'TRABALHO': Context.REALIZACAO,
            'NEGOCIO': Context.REALIZACAO,
            'FINANCEIRO': Context.FINANCEIRO,
            'DINHEIRO': Context.FINANCEIRO,
            'RECURSOS': Context.FINANCEIRO,
            'SOCIAL': Context.SOCIAL,
            'CONTRIBUICAO': Context.SOCIAL,
            'VOLUNTARIADO': Context.SOCIAL,
            'FAMILIA': Context.FAMILIA,
            'CASA': Context.FAMILIA,
            'FILHOS': Context.FAMILIA,
            'RELACIONAMENTO': Context.RELACIONAMENTO,
            'AMOR': Context.RELACIONAMENTO,
            'CONJUGE': Context.RELACIONAMENTO,
            'VIDASOCIAL': Context.VIDA_SOCIAL,
            'AMIGOS': Context.VIDA_SOCIAL,
            'SOCIAL_VIDA': Context.VIDA_SOCIAL,
            'LAZER': Context.LAZER,
            'HOBBY': Context.LAZER,
            'DIVERSAO': Context.LAZER,
            'VIAGEM': Context.LAZER,
            'FELICIDADE': Context.FELICIDADE,
            'PLENITUDE': Context.FELICIDADE,
            'ESPIRITUAL': Context.ESPIRITUAL,
            'ESPIRITUALIDADE': Context.ESPIRITUAL,
            'RELIGIAO': Context.ESPIRITUAL,
            'BIBLE': Context.ESPIRITUAL,
            'ORAÇÃO': Context.ESPIRITUAL,
            'PESSOAL': Context.SAUDE,
        };

        if (parsed.contexts.length > 0) {
            const tag = parsed.contexts[0].toUpperCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents
            
            if (contextMap[tag]) {
                context = contextMap[tag];
            } else if (Object.values(Context).includes(tag as Context)) {
                context = tag as Context;
            }
        }

        // 2. Find a list to assign this task to
        const userList = await db.list.findFirst({
            where: {
                space: {
                    OR: [
                        { userId },
                        { shares: { some: { userId } } }
                    ]
                }
            }
        });

        // 3. Create Task
        const task = await db.task.create({
            data: {
                title: parsed.text || "Nova Captura",
                context,
                status: Status.PENDING,
                priority: "NORMAL",
                date: parsed.date,
                userId: userId,
                listId: userList?.id || null
            }
        });

        revalidatePath("/");
        revalidatePath("/processes");
        if (userList?.id) {
            revalidatePath(`/processes/${userList.id}`);
        }

        return {
            success: true,
            message: `Captura realizada: ${task.title}${userList ? ` (adicionada em ${userList.name})` : ""}`,
            data: task
        };

    } catch (error) {
        console.error("NLP QuickCreate Error:", error);
        return { success: false, message: "Erro ao realizar captura inteligente." };
    }
}
