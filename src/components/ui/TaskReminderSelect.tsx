"use client";

import * as React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Bell } from "lucide-react";

// Encoding convention for day-based task reminders:
// null  = sem lembrete
// 0     = no dia da tarefa (às 8h)
// 10000 = 1 dia antes (às 8h)
// 20000 = 2 dias antes (às 8h)
// 70000 = 1 semana antes (às 8h)

interface TaskReminderSelectProps {
    value: number | null;
    onChange: (value: number | null) => void;
    className?: string;
    disabled?: boolean;
}

export function TaskReminderSelect({ value, onChange, className, disabled }: TaskReminderSelectProps) {
    const handleChange = (val: string) => {
        if (val === "none") {
            onChange(null);
        } else {
            onChange(parseInt(val, 10));
        }
    };

    const stringValue = value === null ? "none" : value.toString();

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <Select value={stringValue} onValueChange={handleChange} disabled={disabled}>
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-zinc-400" />
                        <SelectValue placeholder="Adicionar lembrete" />
                    </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="none">Sem lembrete</SelectItem>
                    <SelectItem value="0">No dia da tarefa (às 8h)</SelectItem>
                    <SelectItem value="10000">1 dia antes (às 8h)</SelectItem>
                    <SelectItem value="20000">2 dias antes (às 8h)</SelectItem>
                    <SelectItem value="70000">1 semana antes (às 8h)</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
