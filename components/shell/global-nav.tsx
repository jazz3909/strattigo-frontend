"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Brand } from "@/components/public/brand"
import { clearToken, getEmail } from "@/app/lib/api"
import { cn } from "@/lib/utils"

/**
 * GlobalNav — dashboard.html `.globalnav`. The ONE shared signed-in top bar
 * (dashboard + settings; previously duplicated in both layouts). Brand,
 * section links, user identity, logout. Cream system.
 */

// Canvas is hidden until the feature ships — its routes/components stay
// dormant (see app/settings/canvas, CanvasImportModal); re-add the link here.
const NAV_LINKS = [
  { href: "/dashboard", label: "Courses" },
  { href: "/settings/billing", label: "Billing" },
  { href: "/pricing", label: "Pricing" },
]

/** "jordan.smith@…" → "JS"; single-word local parts fall back to 1 letter. */
function initials(email: string): string {
  const parts = email.split("@")[0].split(/[._+-]+/).filter(Boolean)
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0] ?? "?").slice(0, 1)
  return letters.toUpperCase()
}

function GlobalNav() {
  const pathname = usePathname()
  const [email, setEmail] = React.useState("")

  React.useEffect(() => {
    const e = getEmail()
    if (e) setEmail(e)
  }, [])

  function handleLogout() {
    clearToken()
    document.cookie = "strattigo_token=; path=/; max-age=0"
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-sheet">
      <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center gap-5 px-4 sm:gap-6 sm:px-6">
        <Brand href="/dashboard" className="[&>span:last-child]:hidden min-[420px]:[&>span:last-child]:inline" />

        <nav className="flex items-center gap-4 sm:gap-5">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard" || /^\/dashboard\/.+/.test(pathname)
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-sans text-ui font-medium transition-colors",
                  isActive ? "text-ink" : "text-ink-faint hover:text-ink-soft"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2.5">
          {email && (
            <>
              <span
                className="grid size-8 place-items-center rounded-full bg-accent-tint font-sans text-ui-s font-semibold text-accent-deep"
                title={email}
              >
                {initials(email)}
              </span>
              <span className="hidden max-w-[160px] truncate font-sans text-ui-s text-ink-faint md:inline">
                {email}
              </span>
            </>
          )}
          <button
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1.5 font-sans text-ui-s font-medium text-ink-faint transition-colors hover:bg-error-tint hover:text-error"
          >
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export { GlobalNav }
