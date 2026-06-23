"use client";

import React from "react";
import { WikiLink } from "./WikiLink";
import { Mention } from "./Mention";
import { cn } from "@/lib/utils";

interface SmartViewerProps {
    content: string;
    notes?: any[];
}

export function SmartViewer({ content, notes = [] }: SmartViewerProps) {
    if (!content) return null;

    // If content is HTML, strip tags for the preview to avoid showing raw tags
    // and to keep the "Smart" parsing clean.
    const isHtml = content.trim().startsWith("<");
    const cleanContent = isHtml 
        ? content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() 
        : content;

    // Pattern for [[Wiki Links]]
    const wikiRegex = /\[\[(.*?)\]\]/g;

    const parts = cleanContent.split(/(\[\[.*?\]\]|^-\s|^\[\s\]\s|^\[x\]\s|^###\s)/gm);

    return (
        <div className="whitespace-pre-wrap break-words leading-relaxed text-zinc-300">
            {parts.map((part, i) => {
                // Wiki Links
                if (part.startsWith("[[") && part.endsWith("]]")) {
                    const title = part.slice(2, -2);
                    const note = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
                    return <WikiLink key={i} title={title} noteId={note?.id} />;
                }

                // Checkboxes
                if (part.startsWith("[ ]")) {
                    return (
                        <span key={i} className="inline-flex items-center group/checkbox cursor-default select-none">
                            <span className="w-4 h-4 rounded border border-zinc-700 bg-zinc-900 group-hover/checkbox:border-sidebar-primary/50 mr-1.5 align-middle transition-colors" />
                        </span>
                    );
                }
                if (part.startsWith("[x]")) {
                    return (
                        <span key={i} className="inline-flex items-center group/checkbox cursor-default select-none">
                            <span className="w-4 h-4 rounded border border-sidebar-primary/50 bg-sidebar-primary/20 mr-1.5 align-middle flex items-center justify-center transition-colors">
                                <span className="w-2.5 h-2.5 bg-sidebar-primary rounded-ss-[1px]" />
                            </span>
                        </span>
                    );
                }

                // Bullets
                if (part.startsWith("-")) {
                    return (
                        <span key={i} className="inline-block w-1.5 h-1.5 rounded-full bg-sidebar-primary/60 mr-2.5 mb-0.5" />
                    );
                }

                // Headers
                if (part.startsWith("###")) {
                    return (
                        <span key={i} className="text-base font-bold text-white block mt-3 mb-1 tracking-tight">
                            —
                        </span>
                    ); // Returning a visual dash for header trigger
                }

                // Normal Text + Header styling via conditional class
                const isHeader = part.startsWith("###") || parts[i - 1]?.startsWith("###");
                return (
                    <span
                        key={i}
                        className={cn(
                            isHeader && "text-base font-bold text-white block mb-1 tracking-tight"
                        )}
                    >
                        {part.replace(/^###\s/, "")}
                    </span>
                );
            })}
        </div>
    );
}
