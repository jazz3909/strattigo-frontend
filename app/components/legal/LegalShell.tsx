import Link from "next/link";

import { PublicNav, PublicBody } from "@/components/public/public-shell";

/**
 * Shared chrome + typography primitives for the static legal pages
 * (/terms, /privacy). Server components — no client JS needed.
 * Cream design system: auth-public.html "LEGAL SHELL" section.
 */

export function LegalShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-page px-4 pb-16 font-sans text-ink sm:px-6">
      <PublicNav brandHref="/">
        <Link
          href="/"
          className="text-ui font-medium text-ink-soft transition-colors hover:text-ink"
        >
          Back to site
        </Link>
      </PublicNav>

      <PublicBody>
        {/* Legal head — `.legal-head` */}
        <div className="text-center">
          <p className="mb-3 text-eyebrow font-semibold text-accent-deep uppercase">
            {eyebrow}
          </p>
          <h1 className="font-display text-[32px] leading-[1.15] font-semibold text-ink">
            {title}
          </h1>
        </div>

        {/* Document column — `.legal-doc` (intro carries the Last-updated line) */}
        <div className="mx-auto mt-9 max-w-[640px]">
          <div className="legal-prose mb-10">{intro}</div>
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-rule pt-8 text-center text-ui-s text-ink-faint">
          <p>&copy; {year} Strattigo. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-6">
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms of Service
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </PublicBody>
    </div>
  );
}

export function LegalToc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav
      aria-label="Table of contents"
      className="mb-12 rounded-lg border border-rule bg-raised px-6 py-5"
    >
      <p className="mb-3 text-eyebrow font-semibold text-ink-faint uppercase">
        Contents
      </p>
      <ol className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="inline-flex items-baseline gap-2.5 py-0.5 text-ui text-ink-soft transition-colors hover:text-ink"
            >
              <span className="text-ui-s font-medium text-accent-deep tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function LegalSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-11 scroll-mt-24">
      <h2 className="mb-3.5 flex items-baseline gap-3 border-b border-rule pb-2.5 font-display text-[20px] font-semibold text-ink">
        <span className="font-sans text-ui-s font-medium text-accent-deep tabular-nums">
          {String(number).padStart(2, "0")}
        </span>
        {title}
      </h2>
      <div className="legal-prose">{children}</div>
    </section>
  );
}

/** Visible marker for a value the founder must fill in before publishing. */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return <mark className="legal-placeholder">[PLACEHOLDER: {children}]</mark>;
}
