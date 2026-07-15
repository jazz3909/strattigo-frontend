import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Strattigo card — design-system.html §04.
 * The neutral bounded container: surface + hairline + radius + padding,
 * nothing else. Composition happens at the call site.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-lg border border-rule bg-raised px-5 py-[18px]",
        className
      )}
      {...props}
    />
  )
}

export { Card }
