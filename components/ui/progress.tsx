import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Progress — two forms (design-system.html §04, quiz-view.html).
 * ProgressBar: continuous thin track with an accent fill.
 * SegmentedProgress: N discrete segments — done = accent, current =
 * accent-tint2, remaining = sunk (the quiz question strip).
 */

function ProgressBar({
  value,
  className,
  ...props
}: React.ComponentProps<"div"> & { value: number }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("h-1.5 overflow-hidden rounded-full bg-sunk", className)}
      {...props}
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${clamped}%` }} />
    </div>
  )
}

function SegmentedProgress({
  total,
  current,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  total: number
  /** 1-based position; segments before it are done, it renders as current. */
  current: number
}) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className={cn("flex h-1.5 gap-[3px]", className)}
      {...props}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 rounded-[2px]",
            i < current - 1 ? "bg-accent" : i === current - 1 ? "bg-accent-tint2" : "bg-sunk"
          )}
        />
      ))}
    </div>
  )
}

export { ProgressBar, SegmentedProgress }
