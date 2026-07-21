"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { getEmail, sendContactMessage } from "@/app/lib/api"
import { useToast } from "@/app/providers/ToastProvider"
import { Button } from "@/components/ui/button"
import { Callout } from "@/components/ui/callout"
import { Textarea } from "@/components/ui/input"

/**
 * FeedbackModal — in-app feedback, posted to the public /contact inbox.
 * Same cream modal pattern as the dashboard's add/delete-course dialogs
 * (backdrop-enter/panel-enter, sheet panel, footer actions). Opened from
 * GlobalNav's "Feedback" text link and UserMenu's "Send feedback" item;
 * it is not a route. Typed text survives cancel/close — only a sent
 * message resets the form.
 */

/* 4,000 keeps the user's text + the context line comfortably under the
   endpoint's 5,000-char message cap (api/routes/contact.py). */
const TEXT_MAX = 4000

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { addToast } = useToast()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [text, setText] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Close on Escape (never mid-send). Focus via effect, not autoFocus:
  // when opened from UserMenu, base-ui returns focus to the menu trigger
  // as it closes, which would race a mount-time autoFocus.
  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => textareaRef.current?.focus(), 50)
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !sending) handleClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sending])

  function handleClose() {
    onClose()
    if (sent) {
      setSent(false)
      setText("")
      setError(null)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    const trimmed = text.trim()
    if (!trimmed) {
      setError("Tell us what's going on first — the message is the one thing we need.")
      return
    }
    setError(null)
    setSending(true)
    try {
      const email = getEmail() ?? ""
      const ua =
        typeof navigator === "undefined" ? "unknown" : navigator.userAgent.slice(0, 300)
      await sendContactMessage({
        name: "In-app feedback",
        email: email || undefined,
        message: `${trimmed}\n\n—\n[in-app · ${email || "unknown"} · ${pathname} · ${ua}]`,
      })
      setSent(true)
      addToast("Feedback sent — thank you!", "success")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong — please try again."
      )
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="backdrop-enter fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[rgba(35,33,28,0.32)] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sending) handleClose()
      }}
    >
      <div className="panel-enter w-full max-w-[480px] overflow-hidden rounded-xl border border-rule bg-sheet shadow-lg">
        {sent ? (
          <>
            <div className="px-7 pt-6">
              <div className="mb-2.5 font-sans text-eyebrow font-semibold tracking-[0.08em] text-accent-deep uppercase">
                Feedback
              </div>
              <h3 id="feedback-title" className="mb-1.5 font-display text-[23px] font-semibold text-ink">
                Got it — thanks.
              </h3>
              <p className="font-read text-[14.5px] leading-normal text-ink-soft">
                If it&rsquo;s a bug, we&rsquo;re on it.
              </p>
            </div>
            <div className="mt-5 flex justify-end border-t border-rule-soft px-7 py-4">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSend}>
            <div className="px-7 pt-6">
              <div className="mb-2.5 font-sans text-eyebrow font-semibold tracking-[0.08em] text-accent-deep uppercase">
                Feedback
              </div>
              <h3 id="feedback-title" className="mb-1.5 font-display text-[23px] font-semibold text-ink">
                Send feedback
              </h3>
              <p className="font-read text-[14.5px] leading-normal text-ink-soft">
                Bug, idea, or anything else — it goes straight to us.
              </p>
            </div>

            <div className="space-y-4 px-7 py-5">
              {error && <Callout variant="error">{error}</Callout>}
              <Textarea
                ref={textareaRef}
                label="Message"
                counter={`${text.length} / ${TEXT_MAX}`}
                rows={6}
                required
                maxLength={TEXT_MAX}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's going on?"
              />
            </div>

            <div className="flex justify-end gap-2.5 border-t border-rule-soft px-7 py-4">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={sending}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={sending}>
                {sending && <Spinner />}
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export { FeedbackModal }
