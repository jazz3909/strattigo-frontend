"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Menu } from "@base-ui/react/menu"

import { clearToken, getEmail } from "@/app/lib/api"
import { cn } from "@/lib/utils"

/**
 * UserMenu — the mobile avatar menu (workspace-chat.html phone mock:
 * "Billing / settings live in the avatar menu"). Trigger is the same
 * initials avatar as GlobalNav; the popup carries the account links that
 * have no room in a phone-width bar, plus log out. Mobile-shell only —
 * desktop keeps GlobalNav's inline links and logout button.
 */

const MENU_LINKS = [
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

const ITEM_CLASS =
  "flex cursor-pointer items-center rounded-sm px-2.5 py-2 font-sans text-ui text-ink-soft outline-none select-none data-[highlighted]:bg-rule-soft"

function UserMenu({ className }: { className?: string }) {
  const router = useRouter()
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
    <Menu.Root>
      <Menu.Trigger
        aria-label="Account menu"
        className={cn(
          "-m-1.5 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page",
          className
        )}
      >
        <span className="grid size-8 place-items-center rounded-full bg-accent-tint font-sans text-ui-s font-semibold text-accent-deep">
          {email ? initials(email) : "?"}
        </span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className="max-h-[min(420px,var(--available-height))] w-56 overflow-y-auto rounded-md border border-rule bg-raised p-1.5 shadow-popover outline-none">
            {email && (
              <>
                <div className="truncate px-2.5 py-2 font-sans text-ui-s text-ink-faint">
                  {email}
                </div>
                <Menu.Separator className="mx-2 my-1 h-px bg-rule-soft" />
              </>
            )}
            {MENU_LINKS.map((link) => (
              <Menu.Item
                key={link.href}
                closeOnClick
                onClick={() => router.push(link.href)}
                className={ITEM_CLASS}
              >
                {link.label}
              </Menu.Item>
            ))}
            <Menu.Separator className="mx-2 my-1 h-px bg-rule-soft" />
            <Menu.Item
              closeOnClick
              onClick={handleLogout}
              className={cn(ITEM_CLASS, "data-[highlighted]:bg-error-tint data-[highlighted]:text-error")}
            >
              Log out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export { UserMenu }
