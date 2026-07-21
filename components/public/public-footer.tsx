import Link from "next/link"

import { Brand } from "@/components/public/brand"

/**
 * Public-page footer — landing.html `footer`. Used by /contact; the landing
 * page carries its own single-row footer variant, and /pricing + the legal
 * pages close inside their framed sheet instead.
 */
function PublicFooter() {
  return (
    <footer className="border-t border-rule bg-sheet py-11">
      <div className="mx-auto w-full max-w-[1080px] px-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-5">
          <Brand />
          <div className="flex-1" />
          <nav className="flex gap-5 font-sans text-ui-s text-ink-faint">
            <Link href="/pricing" className="hover:text-ink-soft">
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-ink-soft">
              Contact
            </Link>
            <Link href="/login" className="hover:text-ink-soft">
              Log in
            </Link>
            <Link href="/terms" className="hover:text-ink-soft">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink-soft">
              Privacy
            </Link>
          </nav>
        </div>
        <p className="mt-5 font-sans text-[12.5px] text-ink-faint">
          © {new Date().getFullYear()} Strattigo · Study like you already know
          the answers.
        </p>
      </div>
    </footer>
  )
}

export { PublicFooter }
