import Link from "next/link";

/**
 * Shared chrome + typography primitives for the static legal pages
 * (/terms, /privacy). Server components — no client JS needed.
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-40 glass-dark"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-lg font-bold gradient-text">Strattigo</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            &larr; Back to Strattigo
          </Link>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-20 page-enter">
        <p
          className="font-mono text-xs font-medium tracking-[0.2em] uppercase mb-4"
          style={{ color: "var(--accent)" }}
        >
          {eyebrow}
        </p>
        <h1
          className="font-display text-4xl sm:text-5xl font-semibold mb-5"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
        >
          {title}
        </h1>
        <div className="legal-prose mb-10">{intro}</div>

        {children}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div
          className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          <p>&copy; {year} Strattigo. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="transition-colors hover:text-[var(--text-primary)]">
              Terms of Service
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-[var(--text-primary)]">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LegalToc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav
      aria-label="Table of contents"
      className="rounded-2xl px-6 py-5 mb-12"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p
        className="text-xs font-semibold tracking-[0.15em] uppercase mb-3"
        style={{ color: "var(--text-tertiary)" }}
      >
        Contents
      </p>
      <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="group inline-flex items-baseline gap-2.5 text-sm py-0.5 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <span
                className="font-mono text-xs tabular-nums group-hover:text-[var(--accent)] transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
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
    <section id={id} className="scroll-mt-24 mb-11">
      <h2
        className="flex items-baseline gap-3 text-xl font-bold mb-3.5 pb-2.5"
        style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--accent-dim)" }}
      >
        <span className="font-mono text-sm font-medium tabular-nums" style={{ color: "var(--accent)" }}>
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
