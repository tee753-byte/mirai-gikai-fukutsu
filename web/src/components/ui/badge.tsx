import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-mirai-gradient text-black [a&]:hover:opacity-90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        muted:
          "border-muted-foreground/50 bg-white text-muted-foreground [a&]:hover:bg-gray-50",
        dark: "border-transparent bg-gray-300 text-black [a&]:hover:bg-gray-400",
        light:
          "border-primary bg-transparent text-primary [a&]:hover:opacity-90",
        // 議案の議決結果。可決・否決を色で見分けられるようにする
        billApproved:
          "border-bill-approved-border bg-bill-approved-bg text-bill-approved-text",
        billRejected:
          "border-bill-rejected-border bg-bill-rejected-bg text-bill-rejected-text",
        billReviewing:
          "border-bill-reviewing-border bg-bill-reviewing-bg text-bill-reviewing-text",
        billSubmitted:
          "border-bill-submitted-border bg-bill-submitted-bg text-bill-submitted-text",
        billNeutral:
          "border-bill-neutral-border bg-bill-neutral-bg text-bill-neutral-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
