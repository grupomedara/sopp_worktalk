"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, BookMarked } from "lucide-react";
import { FichamentoForm } from "./FichamentoForm";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FichamentoDialogProps {
  initialData?: any;
  books?: { id: string; title: string; author: string }[];
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function FichamentoDialog({
  initialData,
  books = [],
  onSuccess,
  trigger,
}: FichamentoDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            Novo Fichamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookMarked className="h-5 w-5 text-primary" />
            {initialData ? "Editar Fichamento" : "Novo Fichamento"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="px-6 py-5">
            <FichamentoForm
              initialData={initialData}
              books={books}
              onSuccess={handleSuccess}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
