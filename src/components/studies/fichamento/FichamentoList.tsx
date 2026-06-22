"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FichamentoSourceType, FichamentoWithBook } from "./fichamento-utils";
import { FichamentoCard } from "./FichamentoCard";
import { FichamentoDialog } from "./FichamentoDialog";
import { FichamentoMetrics } from "./FichamentoMetrics";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  FICHAMENTO_TYPE_LABELS,
  FICHAMENTO_SOURCE_LABELS,
  FICHAMENTO_SOURCE_ICONS,
} from "./fichamento-utils";

interface FichamentoListProps {
  initialFichamentos: FichamentoWithBook[];
  books?: { id: string; title: string; author: string }[];
}

export function FichamentoList({ initialFichamentos, books = [] }: FichamentoListProps) {
  const router = useRouter();
  const [fichamentos, setFichamentos] = useState(initialFichamentos);
  const [editTarget, setEditTarget] = useState<FichamentoWithBook | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all_types");
  const [sourceFilter, setSourceFilter] = useState<string>("all_sources");

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleEdit = (f: FichamentoWithBook) => {
    setEditTarget(f);
    setEditOpen(true);
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
    setEditTarget(null);
    refresh();
  };

  // Client filtering
  const filtered = fichamentos.filter((f) => {
    if (typeFilter !== "all_types" && f.type !== typeFilter) return false;
    if (sourceFilter !== "all_sources" && f.sourceType !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        (f.keywords?.toLowerCase().includes(q) ?? false) ||
        (f.sourceTitle?.toLowerCase().includes(q) ?? false) ||
        (f.authorLastName?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const hasFilters = search !== "" || typeFilter !== "all_types" || sourceFilter !== "all_sources";

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <FichamentoMetrics fichamentos={fichamentos} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por título, autor, palavra-chave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tipo de fichamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">Todos os tipos</SelectItem>
            {Object.entries(FICHAMENTO_TYPE_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tipo de fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_sources">Todas as fontes</SelectItem>
            {Object.entries(FICHAMENTO_SOURCE_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {FICHAMENTO_SOURCE_ICONS[v as FichamentoSourceType]} {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setSearch(""); setTypeFilter("all_types"); setSourceFilter("all_sources"); }}
            title="Limpar filtros"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <FichamentoDialog books={books} onSuccess={refresh} />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <span className="text-4xl">🗂️</span>
          <p className="text-muted-foreground text-sm">
            {hasFilters
              ? "Nenhum fichamento corresponde aos filtros."
              : "Nenhum fichamento criado ainda. Comece fichando um artigo, vídeo ou livro!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((f) => (
            <FichamentoCard
              key={f.id}
              fichamento={f}
              onEdit={handleEdit}
              onDeleted={refresh}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editTarget && (
        <FichamentoDialog
          initialData={editTarget}
          books={books}
          onSuccess={handleEditSuccess}
          trigger={<span className="hidden" />}
        />
      )}
    </div>
  );
}
