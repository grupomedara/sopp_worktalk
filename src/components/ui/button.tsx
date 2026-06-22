import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-bold uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 shadow-[0_0_20px_rgba(255_255_255_/_0.1)] active:scale-95 transition-all text-sm",
        destructive: "bg-destructive text-destructive-foreground font-black uppercase tracking-widest hover:bg-destructive/90",
        outline: "border-2 border-white/20 bg-transparent text-white font-black uppercase tracking-widest hover:bg-white hover:text-black hover:border-white active:scale-95 transition-all",
        secondary: "bg-white/10 text-white font-black uppercase tracking-widest border border-white/5 hover:bg-white/20 shadow-xl active:scale-95 transition-all",
        ghost: "text-zinc-400 font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white",
        link: "text-white underline-offset-4 hover:underline font-bold uppercase tracking-widest",
      },
      size: {
        default: "h-12 px-8 py-2",
        sm: "h-9 rounded-xl px-4",
        lg: "h-14 rounded-2xl px-12 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
