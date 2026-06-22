"use client";

import dynamic from "next/dynamic";
import type { FichamentoWithBook } from "./fichamento-utils";

// Load FichamentoList only on the client — avoids SSR/hydration crashes.
const FichamentoListDynamic = dynamic(
  () => import("./FichamentoList").then((m) => m.FichamentoList),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
        <span className="animate-spin text-lg">⏳</span>
        Carregando fichamentos...
      </div>
    ),
  }
);

interface FichamentoTabProps {
  initialFichamentos: FichamentoWithBook[];
  books: { id: string; title: string; author: string }[];
}

export function FichamentoTab({ initialFichamentos, books }: FichamentoTabProps) {
  return (
    <FichamentoListDynamic
      initialFichamentos={initialFichamentos}
      books={books}
    />
  );
}
