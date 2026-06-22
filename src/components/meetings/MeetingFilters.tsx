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
import { X, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MeetingFiltersProps {
    companies: string[];
    themes: string[];
}

export function MeetingFilters({ companies, themes }: MeetingFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const companyOrPerson = searchParams.get("companyOrPerson") || "all";
    const theme = searchParams.get("theme") || "all";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/meetings?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("companyOrPerson");
        params.delete("theme");
        params.delete("startDate");
        params.delete("endDate");
        router.push(`/meetings?${params.toString()}`);
    };

    const hasFilters = companyOrPerson !== "all" || theme !== "all" || startDate !== "" || endDate !== "";

    return (
        <div className="flex flex-col gap-4 p-4 border border-zinc-800 rounded-lg bg-zinc-950/40 text-card-foreground shadow-md mb-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" /> Filtros
                </h3>
                {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 lg:px-3 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                        <X className="mr-2 h-4 w-4" />
                        Limpar Filtros
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company-filter" className="text-xs font-semibold text-muted-foreground">Empresa / Pessoa</Label>
                    <Select value={companyOrPerson} onValueChange={(val) => updateFilter("companyOrPerson", val === "all" ? "" : val)}>
                        <SelectTrigger id="company-filter" className="border-zinc-800 bg-zinc-950">
                            <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-800 bg-zinc-950">
                            <SelectItem value="all">Todas</SelectItem>
                            {companies.map((c) => (
                                <SelectItem key={c} value={c}>
                                    {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="theme-filter" className="text-xs font-semibold text-muted-foreground">Tema</Label>
                    <Select value={theme} onValueChange={(val) => updateFilter("theme", val === "all" ? "" : val)}>
                        <SelectTrigger id="theme-filter" className="border-zinc-800 bg-zinc-950">
                            <SelectValue placeholder="Todos os temas" />
                        </SelectTrigger>
                        <SelectContent className="border-zinc-800 bg-zinc-950">
                            <SelectItem value="all">Todos os temas</SelectItem>
                            {themes.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="start-date-filter" className="text-xs font-semibold text-muted-foreground">De (Data)</Label>
                    <Input
                        id="start-date-filter"
                        type="date"
                        value={startDate}
                        onChange={(e) => updateFilter("startDate", e.target.value)}
                        className="border-zinc-800 bg-zinc-950 min-h-[40px] text-foreground"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="end-date-filter" className="text-xs font-semibold text-muted-foreground">Até (Data)</Label>
                    <Input
                        id="end-date-filter"
                        type="date"
                        value={endDate}
                        onChange={(e) => updateFilter("endDate", e.target.value)}
                        className="border-zinc-800 bg-zinc-950 min-h-[40px] text-foreground"
                    />
                </div>
            </div>
        </div>
    );
}
