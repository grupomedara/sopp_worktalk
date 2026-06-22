"use client";

import React from "react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { User, FolderKanban } from "lucide-react";
import { stripHtml } from "@/lib/utils";

interface MentionProps {
    name: string;
    item: any;
    type: "person" | "project";
}

export function Mention({ name, item, type }: MentionProps) {
    return (
        <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
                <span className="text-sidebar-primary font-semibold bg-sidebar-primary/10 px-1 rounded-sm cursor-pointer hover:bg-sidebar-primary/20 transition-colors">
                    @{name}
                </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-4 noir-glass border-sidebar-primary/20">
                <div className="flex justify-between space-x-4">
                    <div className="rounded-full bg-sidebar-primary/20 p-2 h-10 w-10 flex items-center justify-center shrink-0">
                        {type === "person" ? <User className="h-6 w-6" /> : <FolderKanban className="h-6 w-6" />}
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold">{item.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {stripHtml(item.notes || item.description || "Sem descrição adicional.")}
                        </p>
                        <div className="flex items-center pt-2">
                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
                                {type === "person" ? item.type : item.context}
                            </span>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
