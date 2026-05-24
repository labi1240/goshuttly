import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-blue/10 text-brand-blue",
        success: "bg-brand-success/10 text-brand-success",
        warning: "bg-brand-warning/10 text-amber-700",
        danger: "bg-brand-danger/10 text-brand-danger",
        muted: "bg-slate-100 text-slate-700",
        outline: "border border-brand-border text-brand-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
