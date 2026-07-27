"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

/**
 * WelcomeModal — the one-time beta welcome popup, shown on a user's first
 * dashboard load (dashboard/layout.tsx decides via the server-side
 * welcome-seen flag). Same cream modal pattern as FeedbackModal
 * (backdrop-enter/panel-enter, sheet panel, footer action). Every exit —
 * button, Escape, backdrop click — goes through onDismiss, which records
 * the flag so the popup never returns.
 */

function WelcomeModal({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onDismiss])

  if (!open) return null

  return (
    <div
      className="backdrop-enter fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[rgba(35,33,28,0.32)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      <div className="panel-enter w-full max-w-[480px] overflow-hidden rounded-xl border border-rule bg-sheet shadow-lg">
        <div className="px-7 pt-6">
          <div className="mb-2.5 font-sans text-eyebrow font-semibold tracking-[0.08em] text-accent-deep uppercase">
            Beta
          </div>
          <h3 id="welcome-title" className="mb-2.5 font-display text-[23px] font-semibold text-ink">
            Welcome to Strattigo 🎉
          </h3>
          <p className="font-read text-[14.5px] leading-relaxed text-ink-soft">
            You&rsquo;ve got full unlimited access for the entire beta — every
            feature, on us. Strattigo works best when you build your library:
            upload your class materials, organize them into collections, and
            generate study guides, quizzes, and tutor chat scoped to exactly
            what you pick. One ask: use the feedback button on your dashboard
            whenever anything feels off — you&rsquo;re shaping what this
            becomes.
          </p>
        </div>
        <div className="mt-6 flex justify-end border-t border-rule-soft px-7 py-4">
          <Button type="button" variant="primary" onClick={onDismiss}>
            Let&rsquo;s go
          </Button>
        </div>
      </div>
    </div>
  )
}

export { WelcomeModal }
