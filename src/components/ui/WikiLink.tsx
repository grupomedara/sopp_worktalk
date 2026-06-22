"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WikiLinkProps {
    title: string;
    noteId?: string;
}

export function WikiLink({ title, noteId }: WikiLinkProps) {
    if (!noteId) {
        return (
            <span className="text-muted-foreground italic decoration-dotted underline cursor-help" title="Nota não encontrada">
                {title}
            </span>
        );
    }

    return (
        <Link
            href={`/notes?id=${noteId}`}
            className={cn(
                "text-sidebar-primary font-medium hover:underline decoration-sidebar-primary/30 underline-offset-4 transition-all",
                "bg-sidebar-primary/5 px-1 rounded-sm"
            )}
        >
            {title}
        </Link>
    );
}
