"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CreatableComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  onCreate?: (value: string) => void;
  disabled?: boolean;
}

export function CreatableCombobox({
  options,
  value,
  onChange,
  placeholder = "Selecione ou digite...",
  emptyText = "Nenhum item encontrado.",
  onCreate,
  disabled,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Filter options based on input value
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  // Check if the current input exactly matches any option
  const exactMatch = React.useMemo(() => {
    return options.some(
      (option) => option.toLowerCase() === inputValue.toLowerCase()
    );
  }, [options, inputValue]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleCreate = () => {
    const newValue = inputValue.trim();
    if (newValue) {
      if (onCreate) {
        onCreate(newValue);
      } else {
        onChange(newValue);
      }
      setOpen(false);
      setInputValue("");
    }
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal normal-case hover:bg-zinc-900/50 border-zinc-800 bg-zinc-950 px-3"
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-zinc-800 bg-zinc-950">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {filteredOptions.length === 0 && !inputValue && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>

            {inputValue && !exactMatch && (
              <CommandGroup heading="Novo item">
                <CommandItem
                  value={inputValue}
                  onSelect={handleCreate}
                  className="text-primary font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {`Criar "${inputValue}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
