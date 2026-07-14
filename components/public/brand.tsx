import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Strattigo brand lockup for public pages — landing.html / auth-public.html
 * `.brand`: accent S-mark tile + Fraunces wordmark. Never subject hues.
 */
function Brand({
  href = "/",
  size = "md",
  className,
}: {
  /** Where the lockup links; pass null to render a non-link. */
  href?: string | null
  /** md = nav (32px mark), lg = auth card head (34px mark). */
  size?: "md" | "lg"
  className?: string
}) {
  const mark = size === "lg" ? "size-[34px] text-lg" : "size-8 text-[17px]"
  const name = size === "lg" ? "text-xl" : "text-[19px]"

  const inner = (
    <>
      <span
        className={cn(
          "grid place-items-center rounded-[9px] bg-accent font-display font-semibold text-white",
          mark
        )}
      >
        S
      </span>
      <span
        className={cn(
          "font-display font-semibold tracking-[-0.01em] text-ink",
          name
        )}
      >
        Strattigo
      </span>
    </>
  )

  const layout = cn("inline-flex items-center gap-2.5", className)
  if (href == null) return <span className={layout}>{inner}</span>
  return (
    <Link href={href} className={layout}>
      {inner}
    </Link>
  )
}

export { Brand }
