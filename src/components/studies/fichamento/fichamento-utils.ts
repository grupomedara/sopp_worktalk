// Inline types matching Prisma enums (avoids IDE stale cache issue)
export type FichamentoType =
  | "CITACAO"
  | "RESUMO"
  | "BIBLIOGRAFICO"
  | "TEMATICO"
  | "COMENTARIO";

export type FichamentoSourceType =
  | "LIVRO"
  | "ARTIGO"
  | "VIDEO"
  | "PODCAST"
  | "CURSO_ONLINE"
  | "SITE"
  | "OUTRO";

export type FichamentoWithBook = {
  id: string;
  title: string;
  type: FichamentoType;
  sourceType: FichamentoSourceType;
  authorLastName: string | null;
  authorFirstName: string | null;
  sourceTitle: string | null;
  year: number | null;
  url: string | null;
  edition: string | null;
  city: string | null;
  publisher: string | null;
  pages: string | null;
  platform: string | null;
  duration: string | null;
  accessDate: string | null;
  keywords: string | null;
  mainContent: string | null;
  personalNote: string | null;
  bookId: string | null;
  createdAt: Date;
  updatedAt: Date;
  book?: { id: string; title: string; author: string } | null;
};

// Labels for display
export const FICHAMENTO_TYPE_LABELS: Record<FichamentoType, string> = {
  CITACAO: "Citação",
  RESUMO: "Resumo",
  BIBLIOGRAFICO: "Bibliográfico",
  TEMATICO: "Temático",
  COMENTARIO: "Comentário",
};

export const FICHAMENTO_SOURCE_LABELS: Record<FichamentoSourceType, string> = {
  LIVRO: "Livro",
  ARTIGO: "Artigo",
  VIDEO: "Vídeo",
  PODCAST: "Podcast",
  CURSO_ONLINE: "Curso Online",
  SITE: "Site",
  OUTRO: "Outro",
};

export const FICHAMENTO_TYPE_COLORS: Record<FichamentoType, string> = {
  CITACAO: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  RESUMO: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  BIBLIOGRAFICO: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  TEMATICO: "bg-slate-400/15 text-slate-300 border-slate-400/20",
  COMENTARIO: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

export const FICHAMENTO_SOURCE_ICONS: Record<FichamentoSourceType, string> = {
  LIVRO: "📚",
  ARTIGO: "📄",
  VIDEO: "🎬",
  PODCAST: "🎙️",
  CURSO_ONLINE: "💻",
  SITE: "🌐",
  OUTRO: "📎",
};

// Build ABNT-style reference string from fichamento data
export function buildAbntReference(f: {
  authorLastName?: string | null;
  authorFirstName?: string | null;
  sourceTitle?: string | null;
  edition?: string | null;
  city?: string | null;
  publisher?: string | null;
  year?: number | null;
  pages?: string | null;
  url?: string | null;
  platform?: string | null;
  duration?: string | null;
  accessDate?: string | null;
  sourceType: FichamentoSourceType;
}): string {
  const parts: string[] = [];

  const hasAuthor = f.authorLastName || f.authorFirstName;
  if (hasAuthor) {
    const name = [f.authorLastName?.toUpperCase(), f.authorFirstName]
      .filter(Boolean)
      .join(", ");
    parts.push(name + ".");
  }

  if (f.sourceTitle) {
    parts.push(`**${f.sourceTitle}**`);
  }

  if (f.sourceType === "LIVRO" || f.sourceType === "ARTIGO") {
    if (f.edition) parts.push(`${f.edition} ed.`);
    const publishInfo = [f.city, f.publisher].filter(Boolean).join(": ");
    if (publishInfo) parts.push(publishInfo + ",");
    if (f.year) parts.push(`${f.year}.`);
    if (f.pages) parts.push(f.pages + ".");
  } else if (f.sourceType === "VIDEO" || f.sourceType === "PODCAST") {
    if (f.platform) parts.push(f.platform + ".");
    if (f.year) parts.push(`${f.year}.`);
    if (f.duration) parts.push(`Duração: ${f.duration}.`);
  } else if (f.sourceType === "CURSO_ONLINE") {
    if (f.platform) parts.push(f.platform + ".");
    if (f.year) parts.push(`${f.year}.`);
  } else if (f.sourceType === "SITE") {
    if (f.url) parts.push(`Disponível em: ${f.url}.`);
    if (f.accessDate) parts.push(`Acesso em: ${f.accessDate}.`);
  }

  if (
    f.url &&
    f.sourceType !== "SITE" &&
    (f.sourceType === "VIDEO" || f.sourceType === "PODCAST" || f.sourceType === "CURSO_ONLINE")
  ) {
    parts.push(`Disponível em: ${f.url}.`);
  }

  return parts.join(" ") || "Referência não informada";
}

export function isPrintSource(sourceType: FichamentoSourceType) {
  return sourceType === "LIVRO" || sourceType === "ARTIGO";
}

export function isMediaSource(sourceType: FichamentoSourceType) {
  return sourceType === "VIDEO" || sourceType === "PODCAST" || sourceType === "CURSO_ONLINE";
}
