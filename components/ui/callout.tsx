import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Strattigo callout — the tinted key-info box used in study guides, quiz
 * explanations, and chat (reading-view-variants.html, quiz-view.html).
 * Separation by tint, never by border. Body reads in the serif.
 * Body-length text on a tint uses the -deep color (short labels, as in Pill,
 * use the plain role color).
 */
const calloutVariants = cva(
  "rounded-lg px-[18px] py-4 font-read text-read-s leading-[1.55]",
  {
    variants: {
      variant: {
        accent: "bg-accent-tint text-accent-deep",
        success: "bg-success-tint text-success-deep",
        error: "bg-error-tint text-error-deep",
      },
    },
    defaultVariants: {
      variant: "accent",
    },
  }
)

interface CalloutProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof calloutVariants> {
  /** Optional uppercase kicker above the body, e.g. "Key idea" / "Correct". */
  label?: React.ReactNode
}

function Callout({
  className,
  variant = "accent",
  label,
  children,
  ...props
}: CalloutProps) {
  return (
    <div
      data-slot="callout"
      className={cn(calloutVariants({ variant, className }))}
      {...props}
    >
      {label != null && (
        <span className="mb-1.5 block font-sans text-[11.5px] font-semibold tracking-[0.08em] uppercase">
          {label}
        </span>
      )}
      {children}
    </div>
  )
}

export { Callout, calloutVariants }
