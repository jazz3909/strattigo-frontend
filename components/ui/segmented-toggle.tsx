"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * SegmentedToggle — small 2–3 option pill-group (design-system.html §04),
 * e.g. "Detailed / Bullet points" in the guide-generation modal. Generic:
 * options in, one value out. Radio semantics; every option is tabbable and
 * Enter/Space selects.
 */

interface SegmentedToggleOption<T extends string> {
  value: T
  label: React.ReactNode
}

interface SegmentedToggleProps<T extends string> {
  options: SegmentedToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Accessible name for the group, e.g. "Guide style". */
  "aria-label"?: string
  className?: string
}

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  className,
  ...props
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={props["aria-label"]}
      className={cn("inline-flex rounded-sm bg-sunk p-[3px]", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "cursor-pointer rounded-[6px] px-3.5 py-1.5 font-sans text-ui-s outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent max-md:py-2.5",
              active
                ? "bg-raised font-medium text-ink shadow-sm"
                : "text-ink-faint hover:text-ink-soft"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedToggle }
