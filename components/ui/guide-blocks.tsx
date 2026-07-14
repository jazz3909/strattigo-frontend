import * as React from "react"

import { Callout } from "@/components/ui/callout"
import { cn } from "@/lib/utils"

/**
 * Study-guide reading-view content blocks (reading-view-variants.html Variant B).
 * The three structured block types a guide document composes, built on the
 * Tier-1 Callout and the design tokens — never re-derived. Body text on a tint
 * uses the -deep color per the tint rule.
 *
 * These are the reader's block vocabulary. The reader styles real rendered
 * display-math with the FormulaBlock treatment via .reader-doc CSS; the
 * KeyIdeaCallout and RecallBox await a structured-content model (saved guides
 * are currently flat markdown). Showcased in /dev/components.
 */

/** Accent "Key idea" callout — a thin wrapper over the Tier-1 Callout. */
function KeyIdeaCallout({
  label = "Key idea",
  className,
  children,
  ...props
}: React.ComponentProps<typeof Callout>) {
  return (
    <Callout
      variant="accent"
      label={label}
      className={cn("my-[34px] text-[17.5px] leading-[1.6]", className)}
      {...props}
    >
      {children}
    </Callout>
  )
}

/** Worked-formula block — centered, page-tinted, serif, on a hairline border. */
function FormulaBlock({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "my-[30px] rounded-lg border border-rule bg-page px-[26px] py-[22px] text-center font-read text-[21px] text-ink",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/** "Remember for the exam" recall box — accent tint, uppercase kicker, clean bullets. */
function RecallBox({
  label = "Remember for the exam",
  items,
  className,
  ...props
}: {
  label?: React.ReactNode
  items: React.ReactNode[]
} & Omit<React.ComponentProps<"div">, "children">) {
  return (
    <div
      className={cn(
        "my-10 rounded-lg bg-accent-tint px-[26px] py-[22px] text-accent-deep",
        className
      )}
      {...props}
    >
      <div className="mb-3.5 font-sans text-[11.5px] font-semibold tracking-[0.08em] uppercase text-accent-deep">
        {label}
      </div>
      <ul className="space-y-2 font-read text-[17px] leading-[1.5]">
        {items.map((item, i) => (
          <li
            key={i}
            className="relative pl-[26px] before:absolute before:top-[10px] before:left-1 before:size-[6px] before:rounded-full before:bg-accent before:content-['']"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export { KeyIdeaCallout, FormulaBlock, RecallBox }
