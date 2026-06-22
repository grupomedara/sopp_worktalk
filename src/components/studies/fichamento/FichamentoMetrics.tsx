"use client";

import { FichamentoType, FichamentoWithBook, FICHAMENTO_TYPE_LABELS } from "./fichamento-utils";
import { BookMarked, FileText, Quote, Layers, MessageSquare } from "lucide-react";

interface FichamentoMetricsProps {
  fichamentos: FichamentoWithBook[];
}

const TYPE_ICONS: Record<FichamentoType, React.ReactNode> = {
  CITACAO: <Quote className="h-4 w-4" />,
  RESUMO: <FileText className="h-4 w-4" />,
  BIBLIOGRAFICO: <BookMarked className="h-4 w-4" />,
  TEMATICO: <Layers className="h-4 w-4" />,
  COMENTARIO: <MessageSquare className="h-4 w-4" />,
};

const TYPE_GRADIENT: Record<FichamentoType, string> = {
  CITACAO: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400",
  RESUMO: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
  BIBLIOGRAFICO: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
  TEMATICO: "from-slate-400/20 to-slate-400/5 border-slate-400/20 text-slate-300",
  COMENTARIO: "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400",
};

export function FichamentoMetrics({ fichamentos }: FichamentoMetricsProps) {
  const total = fichamentos.length;

  const byType = Object.keys(FICHAMENTO_TYPE_LABELS).map((type) => ({
    type: type as FichamentoType,
    count: fichamentos.filter((f) => f.type === type).length,
  }));

  const withBooks = fichamentos.filter((f) => f.bookId).length;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className="font-bold text-2xl">{total}</span>
        <span className="text-muted-foreground">fichamentos registrados</span>
        {withBooks > 0 && (
          <span className="text-xs text-muted-foreground border border-border/40 rounded-full px-2.5 py-0.5 ml-auto">
            📚 {withBooks} vinculados a livros
          </span>
        )}
      </div>

      {/* Type breakdown */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {byType.map(({ type, count }) => (
            <div
              key={type}
              className={`rounded-xl border bg-gradient-to-b ${TYPE_GRADIENT[type]} p-3 flex flex-col gap-1`}
            >
              <div className="flex items-center justify-between">
                {TYPE_ICONS[type]}
                <span className="text-lg font-bold">{count}</span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                {FICHAMENTO_TYPE_LABELS[type]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
