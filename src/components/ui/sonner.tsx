"use client"

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-950/90 group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-800/60 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-zinc-400",
          actionButton: "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-950 group-[.toast]:font-bold group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-400 group-[.toast]:rounded-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
