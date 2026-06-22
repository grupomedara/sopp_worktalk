"use server";

import { db } from "@/lib/db";
import { ParsedNLP } from "@/lib/nlp-parser";
import { Context, Status } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function quickCreate(parsed: ParsedNLP) {
    try {
        // 1. Resolve Context
        let context: Context = Context.REALIZACAO; // Default to Realizacao
        
        const contextMap: Record<string, Context> = {
            // New 12 Areas Aliases
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
            // Legacy Mappings
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

        // 2. Resolve @Mentions (Person or Project)
        let personId: string | undefined;
        let projectId: string | undefined;

        if (parsed.mentions.length > 0) {
            const mention = parsed.mentions[0];

            // Try to find a person
            const person = await db.person.findFirst({
                where: { name: { contains: mention, mode: "insensitive" } }
            });
            if (person) personId = person.id;

            // Try to find a project (if not found person or just check both)
            const project = await db.project.findFirst({
                where: { name: { contains: mention, mode: "insensitive" } }
            });
            if (project) projectId = project.id;
        }

        // 3. Create Task or Event
        // If there's a date/time, we create a Task for now (mapped to tactical agenda)

        const task = await db.task.create({
            data: {
                title: parsed.text || "Nova Captura",
                context,
                status: Status.PENDING,
                priority: "MEDIUM",
                date: parsed.date,
                projectId: projectId,
                responsibleId: personId
            }
        });

        revalidatePath("/");
        revalidatePath("/tasks");

        return {
            success: true,
            message: `Captura realizada: ${task.title}`,
            data: task
        };

    } catch (error) {
        console.error("NLP QuickCreate Error:", error);
        return { success: false, message: "Erro ao realizar captura inteligente." };
    }
}
