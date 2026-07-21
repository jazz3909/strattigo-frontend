"use client";

import { useState } from "react";

import { sendContactMessage } from "../lib/api";
import { Callout } from "@/components/ui/callout";
import { Input, Textarea } from "@/components/ui/input";

/* Caps mirror the backend exactly (api/routes/contact.py). */
const MESSAGE_MAX = 5000;
const NAME_MAX = 100;
const EMAIL_MAX = 200;

/* Ink pill submit — the landing's pill treatment, requested for this one
   button. Page-local on purpose (like app/page.tsx's darkPill): still not a
   shared Button variant. Motion (hover lift, press scale) comes from the
   global button transition in globals.css. */
const inkPill =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-[26px] py-[13px] font-sans text-[14.5px] font-medium text-page shadow-[0_10px_26px_rgba(35,33,28,.16)] hover:-translate-y-px hover:shadow-[0_14px_30px_rgba(35,33,28,.22)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60";

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!message.trim()) {
      setError("Please write a message — that's the one thing we need.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await sendContactMessage({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        message: message.trim(),
        website: website || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong — please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-rule bg-raised p-8 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-success-tint text-success-deep">
          <CheckIcon />
        </div>
        <h2 className="font-display text-[22px] font-semibold text-ink">
          Got it — thanks for writing.
        </h2>
        <p className="mt-2 font-read text-[15.5px] text-ink-soft">
          If you left an email, we&rsquo;ll reply there.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative rounded-xl border border-rule bg-raised p-7"
    >
      <div className="space-y-[18px]">
        <Input
          label={
            <>
              Name <span className="font-normal text-ink-faint">(optional)</span>
            </>
          }
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <Input
          label={
            <>
              Email <span className="font-normal text-ink-faint">(so we can reply)</span>
            </>
          }
          type="email"
          autoComplete="email"
          maxLength={EMAIL_MAX}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
        />
        <Textarea
          label="Message"
          counter={`${message.length} / ${MESSAGE_MAX}`}
          rows={6}
          required
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Questions, bugs, ideas — whatever's on your mind."
        />
      </div>

      {/* Honeypot — off-screen and out of the tab order, but not display:none.
          The backend silently discards any submission that fills it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <Callout variant="error" className="mt-5">
          {error}
        </Callout>
      )}

      <button type="submit" disabled={submitting} className={`${inkPill} mt-6`}>
        {submitting && <Spinner />}
        {submitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
