"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface StudyFiltersProps {
    courses: string[];
    subjects: string[];
    topics: string[];
}

export function StudyFilters({ courses, subjects, topics }: StudyFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const course = searchParams.get("course") || "all";
    const subject = searchParams.get("subject") || "all";
    const topic = searchParams.get("topic") || "all";

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        // Reset page if we had pagination (not needed here yet but good practice)
        // params.delete("page"); 

        router.push(`/studies?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("course");
        params.delete("subject");
        params.delete("topic");
        router.push(`/studies?${params.toString()}`);
    };

    const hasFilters = course !== "all" || subject !== "all" || topic !== "all";

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm mb-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground">Filtros</h3>
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 lg:px-3 text-red-500 hover:text-red-600">
                        <X className="mr-2 h-4 w-4" />
                        Limpar Filtros
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="course-filter" className="text-xs">Curso / Fonte</Label>
                    <Select value={course} onValueChange={(val) => updateFilter("course", val)}>
                        <SelectTrigger id="course-filter">
                            <SelectValue placeholder="Todos os cursos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os cursos</SelectItem>
                            {courses.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subject-filter" className="text-xs">Disciplina</Label>
                    <Select value={subject} onValueChange={(val) => updateFilter("subject", val)}>
                        <SelectTrigger id="subject-filter">
                            <SelectValue placeholder="Todas as disciplinas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as disciplinas</SelectItem>
                            {subjects.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="topic-filter" className="text-xs">Tema</Label>
                    <Select value={topic} onValueChange={(val) => updateFilter("topic", val)}>
                        <SelectTrigger id="topic-filter">
                            <SelectValue placeholder="Todos os temas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os temas</SelectItem>
                            {topics.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
