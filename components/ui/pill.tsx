import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Strattigo pill / badge — design-system.html §04.
 * Small rounded-full status label. Text on a tint always uses the matching
 * deep/role color, never plain ink. 12px per the reference sheet (the ui-s
 * token is 13px — the pill is deliberately one step smaller).
 */
const pillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-[11px] py-1 font-sans text-[12px]/[1.3] font-medium",
  {
    variants: {
      variant: {
        accent: "bg-accent-tint text-accent-deep",
        success: "bg-success-tint text-success",
        caution: "bg-caution-tint text-caution-deep",
        error: "bg-error-tint text-error",
        neutral: "bg-sunk text-ink-soft",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Pill({
  className,
  variant = "neutral",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof pillVariants>) {
  return (
    <span
      data-slot="pill"
      className={cn(pillVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Pill, pillVariants }
