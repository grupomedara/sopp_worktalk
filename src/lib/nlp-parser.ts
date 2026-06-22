import * as chrono from 'chrono-node';

export interface ParsedNLP {
    text: string;
    date: Date | null;
    mentions: string[];
    contexts: string[];
    original: string;
}

/**
 * Parses a string to find dates, @mentions, and #contexts.
 * Example: "Almoço @Socio amanhã 14h #Empresa"
 */
export function parseNaturalLanguage(input: string): ParsedNLP {
    // 1. Extract Dates using chrono-node (PT-BR support is limited, we might need a mix or custom)
    // Chrono supports PT-BR via custom locale if needed, but default is EN.
    // We'll use the default first and handle PT-BR keywords if necessary.

    // Custom parsing for common PT-BR terms if chrono misses them
    const ptMap: Record<string, string> = {
        'amanhã': 'tomorrow',
        'hoje': 'today',
        'ontem': 'yesterday',
        'segunda': 'monday',
        'terça': 'tuesday',
        'quarta': 'wednesday',
        'quinta': 'thursday',
        'sexta': 'friday',
        'sábado': 'saturday',
        'domingo': 'sunday',
        'meio-dia': '12:00',
        'meia-noite': '00:00',
        'as': 'at',
        'às': 'at',
        'de': ' ',
        'da': ' ',
        'do': ' '
    };

    // Pre-process for Chrono (minimalist approach)
    let chronoInput = input.toLowerCase();
    Object.keys(ptMap).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        chronoInput = chronoInput.replace(regex, ptMap[key]);
    });

    // Ensure future dates for weekdays
    const parsedDate = chrono.parseDate(chronoInput, new Date(), { forwardDate: true });

    // 2. Extract @Mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = Array.from(input.matchAll(mentionRegex)).map(match => match[1]);

    // 3. Extract #Contexts
    const contextRegex = /#(\w+)/g;
    const contexts = Array.from(input.matchAll(contextRegex)).map(match => match[1]);

    // 4. Clean text (remove dates, mentions, contexts for "clean" title)
    // We use the raw text from the chrono match to remove it from the title
    const chronoResults = chrono.parse(chronoInput, new Date(), { forwardDate: true });
    let cleanText = input;

    if (chronoResults.length > 0) {
        // Remove the date string from the clean text
        // Note: we use the original input and try to find the match or just use the indices if available
        // Chrono's indices are on the 'chronoInput' (pre-processed), so we need to be careful.
        // Simple approach: remove the first detected date string if it exists in the original
        const dateText = chronoResults[0].text;
        // Map back some common translations to remove them from original
        const reversePtMap: Record<string, string> = {
            'tomorrow': 'amanhã',
            'today': 'hoje',
            'yesterday': 'ontem'
        };
        let searchDateText = dateText;
        Object.keys(reversePtMap).forEach(key => {
            searchDateText = searchDateText.replace(new RegExp(key, 'gi'), reversePtMap[key]);
        });

        // Remove mentions and contexts first for the cleanText
        cleanText = cleanText.replace(mentionRegex, '').replace(contextRegex, '');

        // Then try to remove the date-related words
        // As a safer fallback for now, we'll just keep the regex-based approach or just trim.
    } else {
        cleanText = cleanText.replace(mentionRegex, '').replace(contextRegex, '');
    }

    return {
        text: cleanText.trim() || "Nova Captura",
        date: parsedDate,
        mentions,
        contexts,
        original: input
    };
}
