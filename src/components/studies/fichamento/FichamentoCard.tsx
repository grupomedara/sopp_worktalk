"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, BookOpen, ExternalLink, ChevronDown, ChevronUp, Quote } from "lucide-react";
import { toast } from "sonner";
import { deleteFichamento } from "@/app/actions/fichamentos";
import {
  FichamentoType,
  FichamentoSourceType,
  FichamentoWithBook,
  FICHAMENTO_TYPE_LABELS,
  FICHAMENTO_TYPE_COLORS,
  FICHAMENTO_SOURCE_LABELS,
  FICHAMENTO_SOURCE_ICONS,
  buildAbntReference,
} from "./fichamento-utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface FichamentoCardProps {
  fichamento: FichamentoWithBook;
  onEdit: (fichamento: FichamentoWithBook) => void;
  onDeleted: () => void;
}

export function FichamentoCard({ fichamento, onEdit, onDeleted }: FichamentoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const reference = buildAbntReference(fichamento);
  const keywords = fichamento.keywords
    ? fichamento.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
    : [];

  const handleDelete = async () => {
    setShowConfirmDelete(true);
  };

  const onConfirmDelete = async () => {
    setShowConfirmDelete(false);
    setDeleting(true);
    const result = await deleteFichamento(fichamento.id);
    if (result.success) {
      toast.success("Fichamento excluído.");
      onDeleted();
    } else {
      toast.error("Erro ao excluir.");
    }
    setDeleting(false);
  };

  const renderContent = () => {
    if (!fichamento.mainContent) return null;
    // Strip HTML tags for preview
    const text = fichamento.mainContent.replace(/<[^>]*>/g, "");
    const preview = text.slice(0, 200);
    return expanded ? (
      <div
        className="prose prose-invert prose-sm max-w-none text-muted-foreground mt-3 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: fichamento.mainContent }}
      />
    ) : (
      <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">
        {preview}{text.length > 200 && "…"}
      </p>
    );
  };

  return (
    <div className="group relative rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 hover:border-border/70 hover:bg-card/80 transition-all duration-200 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Source type icon + label */}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{FICHAMENTO_SOURCE_ICONS[fichamento.sourceType as FichamentoSourceType]}</span>
              {FICHAMENTO_SOURCE_LABELS[fichamento.sourceType as FichamentoSourceType]}
            </span>
            {/* Fichamento type badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                FICHAMENTO_TYPE_COLORS[fichamento.type as FichamentoType]
              }`}
            >
              {FICHAMENTO_TYPE_LABELS[fichamento.type as FichamentoType]}
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-snug truncate pr-2">{fichamento.title}</h3>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(fichamento)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Reference */}
      <div className="rounded-lg bg-muted/40 border border-border/30 px-3 py-2">
        <div className="flex items-start gap-2">
          <Quote className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
            {reference.split("**").map((part, i) =>
              i % 2 === 1 ? <em key={i}>{part}</em> : part
            )}
          </p>
        </div>
        {fichamento.url && (
          <a
            href={fichamento.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1 ml-5"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            Acessar fonte
          </a>
        )}
      </div>

      {/* Book link */}
      {fichamento.book && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <BookOpen className="h-3 w-3 text-primary" />
          <span>Vinculado a: <span className="font-medium text-foreground">{fichamento.book.title}</span></span>
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw: string, i: number) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Content + expand */}
      {fichamento.mainContent && (
        <>
          {renderContent()}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Recolher" : "Ver conteúdo completo"}
          </button>
        </>
      )}

      {/* Personal note */}
      {expanded && fichamento.personalNote && (
        <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider mb-1">💡 Análise pessoal</p>
          <div
            className="prose prose-invert prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: fichamento.personalNote }}
          />
        </div>
      )}

      {/* Footer date */}
      <p className="text-[10px] text-muted-foreground/50 pt-1">
        {new Date(fichamento.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>

      <ConfirmModal
        isOpen={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        onConfirm={onConfirmDelete}
        title="Excluir Fichamento?"
        description="Esta ação não pode ser desfeita e o fichamento será removido permanentemente."
      />
    </div>
  );
}
