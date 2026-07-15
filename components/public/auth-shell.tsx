import { Brand } from "@/components/public/brand"

/**
 * Centered auth frame — auth-public.html `.auth-card`.
 * Brand lockup, serif heading pair, raised card holding the form, and an
 * alternate-action line under the card. Shared by /login and /signup.
 */
function AuthShell({
  title,
  subtitle,
  alt,
  children,
}: {
  title: string
  /** One serif sentence under the title. */
  subtitle: string
  /** "New here? / Already have an account?" line under the card. */
  alt: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-12 text-ink">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <Brand size="lg" />
        </div>
        <div className="mb-7 text-center">
          <h1 className="mb-1.5 font-display text-[27px] font-semibold text-ink">
            {title}
          </h1>
          <p className="font-read text-[15px] text-ink-soft">{subtitle}</p>
        </div>
        <div className="rounded-xl border border-rule bg-raised p-7">
          {children}
        </div>
        <p className="mt-5 text-center font-sans text-[13.5px] text-ink-soft">
          {alt}
        </p>
      </div>
    </div>
  )
}

export { AuthShell }
