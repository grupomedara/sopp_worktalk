"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Search, StickyNote, FolderKanban, CheckSquare, User } from "lucide-react";
import { unifiedSearch } from "@/app/actions/search";
import { useRouter } from "next/navigation";
import { parseNaturalLanguage, ParsedNLP } from "@/lib/nlp-parser";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tag, AtSign, Zap, Loader2 } from "lucide-react";
import { quickCreate } from "@/app/actions/nlp";
import { toast } from "sonner";

function useDebounce<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

export function CommandCenter() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [nlpResult, setNlpResult] = useState<ParsedNLP | null>(null);
    const router = useRouter();
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (query.length > 2) {
            setNlpResult(parseNaturalLanguage(query));
        } else {
            setNlpResult(null);
        }
    }, [query]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const performSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        const result = await unifiedSearch(q);
        if (result.success) {
            setResults(result.data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        performSearch(debouncedQuery);
    }, [debouncedQuery, performSearch]);

    const onSelect = (url: string) => {
        setOpen(false);
        router.push(url);
    };

    const handleQuickCreate = async () => {
        if (!nlpResult) return;
        setLoading(true);
        const res = await quickCreate(nlpResult);
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
            setQuery("");
        } else {
            toast.error(res.message);
        }
        setLoading(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "Nota": return <StickyNote className="mr-2 h-4 w-4" />;
            case "Projeto": return <FolderKanban className="mr-2 h-4 w-4" />;
            case "Tarefa": return <CheckSquare className="mr-2 h-4 w-4" />;
            case "Pessoa": return <User className="mr-2 h-4 w-4" />;
            default: return <Search className="mr-2 h-4 w-4" />;
        }
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Busca universal (Notas, Projetos, Tarefas...)"
                value={query}
                onValueChange={setQuery}
            />
            <CommandList className="noir-glass border-t border-zinc-800">
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                {results.length > 0 && (
                    <CommandGroup heading="Resultados">
                        {results.map((item) => (
                            <CommandItem
                                key={`${item.type}-${item.id}`}
                                onSelect={() => onSelect(item.url)}
                                className="cursor-pointer"
                            >
                                {getIcon(item.type)}
                                <span>{item.title}</span>
                                <span className="ml-auto text-[10px] uppercase font-bold text-muted-foreground opacity-50">
                                    {item.type}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {nlpResult && (nlpResult.date || nlpResult.mentions.length > 0 || nlpResult.contexts.length > 0) && (
                    <CommandGroup heading="Captura Inteligente">
                        <CommandItem
                            value={query} // Force visibility during filtering
                            onSelect={handleQuickCreate}
                            disabled={loading}
                            className="flex flex-col items-start gap-1 py-3 group cursor-pointer"
                        >
                            <div className="flex items-center gap-2 text-primary">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : <Zap className="h-4 w-4 animate-pulse" />}
                                <span className="font-bold text-sm">Criar: "{nlpResult.text || "Nova Captura"}"</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {nlpResult.date && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px]">
                                        <Calendar className="h-3 w-3" />
                                        {format(nlpResult.date, "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                                    </div>
                                )}
                                {nlpResult.mentions.map(m => (
                                    <div key={m} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px]">
                                        <AtSign className="h-3 w-3" /> {m}
                                    </div>
                                ))}
                                {nlpResult.contexts.map(c => (
                                    <div key={c} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px]">
                                        <Tag className="h-3 w-3" /> {c}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 italic opacity-50">Pressione Enter para salvar esta tarefa agora</span>
                        </CommandItem>
                    </CommandGroup>
                )}
                <CommandGroup heading="Atalhos Rapidos">
                    <CommandItem onSelect={() => onSelect("/notes")}>
                        <StickyNote className="mr-2 h-4 w-4" /> Ver Todas as Notas
                    </CommandItem>
                    <CommandItem onSelect={() => onSelect("/agile")}>
                        <FolderKanban className="mr-2 h-4 w-4" /> Agile Boards
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
