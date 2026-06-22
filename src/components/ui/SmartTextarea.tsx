"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SmartTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    notes?: any[];
    people?: any[];
    projects?: any[];
    onValueChange?: (value: string) => void;
}

export function SmartTextarea({
    notes = [],
    people = [],
    projects = [],
    onValueChange,
    className,
    value = "",
    ...props
}: SmartTextareaProps) {
    const [open, setOpen] = useState(false);
    const [trigger, setTrigger] = useState<"@" | "[[" | "/">("@");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [triggerPos, setTriggerPos] = useState(0);

    const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        const val = target.value;
        const pos = target.selectionStart;
        const lastChar = val[pos - 1];

        if (lastChar === "@") {
            setTrigger("@");
            setTriggerPos(pos);
            setOpen(true);
        } else if (lastChar === "[" && val[pos - 2] === "[") {
            setTrigger("[[");
            setTriggerPos(pos);
            setOpen(true);
        } else if (lastChar === "/") {
            // Only trigger / at start of line or after space
            if (pos === 1 || val[pos - 2] === " " || val[pos - 2] === "\n") {
                setTrigger("/");
                setTriggerPos(pos);
                setOpen(true);
            }
        }

        onValueChange?.(val);
    }, [onValueChange]);

    const handleSelect = (selectedValue: string) => {
        if (!textareaRef.current) return;

        const target = textareaRef.current;
        const val = target.value;

        const before = val.substring(0, triggerPos - (trigger === "[[" ? 2 : 1));
        const after = val.substring(triggerPos);

        let insertion = "";
        if (trigger === "@") insertion = `@${selectedValue} `;
        if (trigger === "[[") insertion = `[[${selectedValue}]] `;
        if (trigger === "/") insertion = `${selectedValue} `; // / remains part of the command label usually, but here we replace it

        const newValue = before + insertion + after;
        onValueChange?.(newValue);
        setOpen(false);

        // refocus and set cursor
        setTimeout(() => {
            target.focus();
            const newPos = before.length + insertion.length;
            target.setSelectionRange(newPos, newPos);
        }, 10);
    };

    const suggestions = () => {
        if (trigger === "@") {
            // deduplicate and format
            const items = [...people.map(p => ({ label: p.name, value: p.name })), ...projects.map(p => ({ label: p.name, value: p.name }))];
            return items.filter((v, i, a) => a.findIndex(t => t.value === v.value) === i);
        }
        if (trigger === "[[") {
            return notes.map(n => ({ label: n.title, value: n.title }));
        }
        if (trigger === "/") {
            return [
                { label: "Todo / Checkbox", value: "[ ] " },
                { label: "Bullet List", value: "- " },
                { label: "Título / Header", value: "### " },
                { label: "Urgente", value: "🔥 URGENTE: " },
            ];
        }
        return [];
    };

    return (
        <div className="relative w-full">
            <Textarea
                {...props}
                ref={textareaRef}
                value={value}
                className={cn("min-h-[150px] resize-none focus-visible:ring-sidebar-primary/20", className)}
                onInput={handleInput}
            />

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="absolute bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none" />
                </PopoverTrigger>
                <PopoverContent
                    className="w-64 p-0 shadow-2xl border-sidebar-primary/30 bg-zinc-950/95 backdrop-blur-md"
                    align="end"
                    side="top"
                    sideOffset={10}
                >
                    <Command className="bg-transparent">
                        <CommandInput placeholder="Filtrar..." autoFocus className="h-9" />
                        <CommandList className="max-h-[200px]">
                            <CommandEmpty>Nenhum resultado.</CommandEmpty>
                            <CommandGroup heading={trigger === "@" ? "Menções" : trigger === "[[" ? "Notas" : "Comandos"}>
                                {suggestions().map((item) => (
                                    <CommandItem
                                        key={item.label}
                                        onSelect={() => handleSelect(item.value)}
                                        className="cursor-pointer py-2"
                                    >
                                        {item.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
