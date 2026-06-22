"use client";

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from "react";
import {
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Flame,
    Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CommandsList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex(
            (selectedIndex + props.items.length - 1) % props.items.length
        );
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                upHandler();
                return true;
            }

            if (event.key === "ArrowDown") {
                downHandler();
                return true;
            }

            if (event.key === "Enter") {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    return (
        <div className="z-50 min-w-[180px] overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 p-1 text-zinc-300 shadow-xl animate-in fade-in zoom-in-95 duration-100">
            {props.items.length ? (
                props.items.map((item: any, index: number) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={index}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectItem(index);
                            }}
                            className={cn(
                                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                                index === selectedIndex
                                    ? "bg-zinc-800 text-white"
                                    : "hover:bg-zinc-900"
                            )}
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded border border-zinc-700 bg-zinc-900 group-hover:border-zinc-600">
                                <Icon className="h-3 w-3" />
                            </div>
                            <span>{item.title}</span>
                        </button>
                    );
                })
            ) : (
                <div className="px-2 py-1.5 text-xs text-zinc-500 italic">
                    Nenhum comando...
                </div>
            )}
        </div>
    );
});

CommandsList.displayName = "CommandsList";
