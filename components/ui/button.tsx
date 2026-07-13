import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Strattigo button — design-system.html §04.
 * Usage rule: at most ONE primary per view; sibling actions use secondary/ghost.
 * Accent (Dusk Blue) is functional only — never subject-* hues here.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm border border-transparent font-sans font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-hover",
        secondary:
          "border-rule-strong bg-transparent text-ink-soft hover:bg-rule-soft",
        ghost: "bg-transparent text-accent-deep hover:bg-accent-tint",
        danger: "border-error bg-transparent text-error hover:bg-error-tint",
      },
      size: {
        default: "px-4 py-[9px] text-ui",
        /* lg: larger padding + 15px label (per spec; no 15px type role exists) */
        lg: "px-[22px] py-[11px] text-[15px]",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "secondary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
