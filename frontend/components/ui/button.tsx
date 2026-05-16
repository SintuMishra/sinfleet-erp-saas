import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-sky-500 to-cyan-500 text-primary-foreground shadow-lg shadow-sky-500/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/25",
        secondary: "border border-slate-200 bg-white/85 text-slate-800 shadow-sm hover:bg-white hover:shadow-md",
        ghost: "text-slate-700 hover:bg-slate-100/80"
      },
      size: {
        default: "h-10 px-4 py-2",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);

Button.displayName = "Button";
