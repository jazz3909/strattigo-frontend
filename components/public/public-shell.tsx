import { Brand } from "@/components/public/brand"

import { cn } from "@/lib/utils"

/**
 * Framed public surface — auth-public.html `.pub-nav` + `.pub-body`.
 * A contained sheet (nav bar joined to a body panel) floating on the page
 * canvas. Used by /pricing and the legal pages; the landing page has its own
 * full-bleed nav.
 */

function PublicNav({
  brandHref = "/",
  children,
}: {
  brandHref?: string
  /** Right-aligned nav actions (links / CTA). */
  children?: React.ReactNode
}) {
  return (
    <div className="mx-auto mt-5 flex h-[66px] w-full max-w-[1100px] items-center gap-6 rounded-t-2xl border border-b-0 border-rule bg-sheet px-6 sm:px-8">
      <Brand href={brandHref} />
      <div className="flex-1" />
      {children}
    </div>
  )
}

function PublicBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1100px] rounded-b-2xl border border-t-0 border-rule bg-sheet px-6 pt-14 pb-16 sm:px-8",
        className
      )}
    >
      {children}
    </div>
  )
}

/** Centered page header inside PublicBody — `.pub-head`. */
function PublicHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string
  title: React.ReactNode
  /** Sub line, set in the reading serif. */
  children?: React.ReactNode
}) {
  return (
    <div className="mb-11 text-center">
      {eyebrow && (
        <div className="mb-3 font-sans text-eyebrow font-semibold tracking-[0.08em] text-accent-deep uppercase">
          {eyebrow}
        </div>
      )}
      <h1 className="mb-3 font-display text-[38px] leading-[1.1] font-semibold tracking-[-0.015em] text-ink">
        {title}
      </h1>
      {children && (
        <p className="mx-auto max-w-xl font-read text-[17px] text-ink-soft">
          {children}
        </p>
      )}
    </div>
  )
}

export { PublicNav, PublicBody, PublicHead }
