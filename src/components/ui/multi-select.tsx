"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

type Framework = Record<"value" | "label", string>;

interface MultiSelectProps {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Select items...", className, disabled = false }: MultiSelectProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    const handleUnselect = (item: string) => {
        if (disabled) return;
        onChange(selected.filter((i) => i !== item));
    };

    const selectedLabels = selected.map(
        (s) => options.find((o) => o.value === s)?.label || s
    );

    return (
        <Command onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Backspace" && inputValue === "" && selected.length > 0) {
                onChange(selected.slice(0, -1));
            }
            if (e.key === "Escape") {
                inputRef.current?.blur();
            }
        }} className={`h-auto overflow-visible bg-transparent border-none shadow-none p-0 ${className || ''}`}>
            <div
                className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
                <div className="flex gap-1 flex-wrap">
                    {selected.map((item) => {
                        const label = options.find((o) => o.value === item)?.label || item;
                        return (
                            <Badge key={item} variant="secondary">
                                {label}
                                {!disabled && (
                                    <button
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleUnselect(item);
                                            }
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={() => handleUnselect(item)}
                                    >
                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                )}
                            </Badge>
                        )
                    })}
                    {/* Avoid having the "Search" Input be too small */}
                    {!disabled && (
                        <CommandPrimitive.Input
                            ref={inputRef}
                            value={inputValue}
                            onValueChange={setInputValue}
                            onBlur={() => setOpen(false)}
                            onFocus={() => setOpen(true)}
                            placeholder={placeholder}
                            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
                        />
                    )}
                </div>
            </div>
            <div className="relative mt-2">
                {open && (
                    // Selectables
                    <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in bg-zinc-950">
                        <CommandList>
                            <CommandGroup className="h-full overflow-auto max-h-60">
                                {options.map((option) => {
                                    if (selected.includes(option.value)) return null; // Hide selected

                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onSelect={(value) => {
                                                setInputValue("");
                                                onChange([...selected, option.value]);
                                            }}
                                            className={"cursor-pointer"}
                                        >
                                            {option.label}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </div>
                )}
            </div>
        </Command>
    );
}
