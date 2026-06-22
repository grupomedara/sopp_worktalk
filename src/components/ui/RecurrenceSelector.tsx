"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export enum RecurrenceType {
    NONE = "NONE",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    WEEKLY_MWF = "WEEKLY_MWF",
    WEEKLY_TTH = "WEEKLY_TTH",
    WEEKDAYS = "WEEKDAYS",
    WEEKDAYS_SAT = "WEEKDAYS_SAT",
    BIWEEKLY = "BIWEEKLY",
    MONTHLY = "MONTHLY",
    CUSTOM = "CUSTOM",
}

interface RecurrenceSelectorProps {
    type: RecurrenceType;
    interval?: number;
    endDate?: Date;
    onTypeChange: (type: RecurrenceType) => void;
    onIntervalChange: (interval: number) => void;
    onEndDateChange: (date?: Date) => void;
}

export function RecurrenceSelector({
    type,
    interval,
    endDate,
    onTypeChange,
    onIntervalChange,
    onEndDateChange,
}: RecurrenceSelectorProps) {
    return (
        <div className="space-y-4 rounded-md border p-4">
            <div className="space-y-2">
                <Label>Repetição</Label>
                <Select
                    value={type}
                    onValueChange={(value) => onTypeChange(value as RecurrenceType)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NONE">Não repetir</SelectItem>
                        <SelectItem value="DAILY">Diariamente</SelectItem>
                        <SelectItem value="WEEKLY">Semanalmente</SelectItem>
                        <SelectItem value="WEEKLY_MWF">2ª, 4ª e 6ª</SelectItem>
                        <SelectItem value="WEEKLY_TTH">3ª e 5ª</SelectItem>
                        <SelectItem value="WEEKDAYS">Dias de semana (2ª a 6ª)</SelectItem>
                        <SelectItem value="WEEKDAYS_SAT">2ª a Sábado</SelectItem>
                        <SelectItem value="BIWEEKLY">Quinzenalmente</SelectItem>
                        <SelectItem value="MONTHLY">Mensalmente</SelectItem>
                        <SelectItem value="CUSTOM">Personalizado (A cada X dias)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {type === "CUSTOM" && (
                <div className="space-y-2">
                    <Label>A cada quantos dias?</Label>
                    <Input
                        type="number"
                        min={1}
                        value={interval || ""}
                        onChange={(e) => onIntervalChange(parseInt(e.target.value) || 1)}
                        placeholder="Ex: 3"
                    />
                </div>
            )}

            {type !== "NONE" && (
                <div className="space-y-2 flex flex-col">
                    <Label>Termina em (Opcional)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !endDate && "text-muted-foreground"
                                )}
                            >
                                {endDate ? (
                                    format(endDate, "PPP", { locale: ptBR })
                                ) : (
                                    <span>Selecione uma data final</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={onEndDateChange}
                                disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <p className="text-[0.8rem] text-muted-foreground">
                        Se não preenchido, será gerado automaticamente por 1 ano.
                    </p>
                </div>
            )}
        </div>
    );
}
