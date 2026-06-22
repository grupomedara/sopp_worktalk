"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmModal({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Você tem certeza?",
  description = "Esta ação não pode ser desfeita.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
}: ConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-zinc-800/60 shadow-2xl rounded-2xl sm:rounded-2xl gap-6 p-8">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-black text-zinc-100 tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-zinc-100 rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest transition-all">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`${
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            } rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
