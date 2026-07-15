"use client"

import * as React from "react"
import {
  ArrowLeft,
  FileText,
  FolderTree,
  MessageCircle,
  Settings,
  SquareCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * WorkspaceRail — the 66px left icon rail of the course workspace
 * (workspace-chat.html). Presentational and config-driven: views live in the
 * RAIL_VIEWS array so dormant ones (study plans, flashcards) can be re-added
 * without touching the component. Active state = accent tint + 3px accent
 * left-edge bar. Accent only — never subject-* hues in the shell.
 */

export type RailView =
  | "courses"
  | "chat"
  | "guides"
  | "quizzes"
  | "materials"
  | "settings"

interface RailItemConfig {
  id: RailView
  label: string
  /** Short form for the mobile tab bar (defaults to label). */
  shortLabel?: string
  icon: React.ComponentType<{ className?: string }>
}

const RAIL_VIEWS: RailItemConfig[] = [
  { id: "courses", label: "Courses", icon: ArrowLeft },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "guides", label: "Study guides", shortLabel: "Guides", icon: FileText },
  { id: "quizzes", label: "Quizzes", icon: SquareCheck },
  { id: "materials", label: "Materials", icon: FolderTree },
]

/** The phone mock's bottom bar carries only the course views — "← Courses"
    lives in the compact top bar and settings in the avatar menu. */
const TAB_VIEWS = RAIL_VIEWS.filter((v) => v.id !== "courses")

const SETTINGS_ITEM: RailItemConfig = {
  id: "settings",
  label: "Settings",
  icon: Settings,
}

function RailButton({
  item,
  active,
  expanded,
  onNavigate,
}: {
  item: RailItemConfig
  active: boolean
  /** Rail is hover/focus-expanded — reveal the text label beside the icon. */
  expanded: boolean
  onNavigate: (view: RailView) => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      // aria-label is kept regardless of expand state so keyboard / SR users
      // always have the name; the visible label is a purely visual enhancement.
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      title={item.label}
      onClick={() => onNavigate(item.id)}
      className={cn(
        "relative flex h-[42px] w-full cursor-pointer items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page",
        active
          ? "bg-accent-tint text-accent-deep"
          : "text-ink-faint hover:bg-rule-soft hover:text-ink-soft"
      )}
    >
      {/* Always in the tree so the active marker can ease in/out (grow from
          center) instead of hard-snapping between views. Anchored to the rail's
          left edge, so it reads identically at both collapsed and expanded
          widths. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[9px] bottom-[9px] -left-3 w-[3px] rounded-r-[3px] bg-accent transition-[opacity,scale] duration-(--duration-base) ease-out-soft",
          active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50"
        )}
      />
      {/* Fixed 42px icon cell keeps the icon at the same x in both widths, so
          expansion never nudges the icons. */}
      <span className="grid size-[42px] shrink-0 place-items-center">
        <Icon className="size-[19px]" />
      </span>
      <span
        className={cn(
          "whitespace-nowrap pr-3 font-sans text-[13.5px] font-medium transition-opacity duration-(--duration-base) ease-out-soft",
          expanded ? "opacity-100" : "opacity-0"
        )}
      >
        {item.label}
      </span>
    </button>
  )
}

interface WorkspaceRailProps {
  activeView: RailView
  onNavigate: (view: RailView) => void
  className?: string
}

function WorkspaceRail({ activeView, onNavigate, className }: WorkspaceRailProps) {
  // Expand on genuine hover (with a small open-delay so a near-miss along the
  // screen edge doesn't flicker it open) OR on keyboard focus landing inside
  // the rail (so keyboard users get the same label affordance). Collapse is
  // immediate on leave. The width/opacity transitions are neutralized by the
  // global prefers-reduced-motion block, so reduced-motion users get an
  // instant, non-animated expand.
  const [hoverOpen, setHoverOpen] = React.useState(false)
  const [focusOpen, setFocusOpen] = React.useState(false)
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = hoverOpen || focusOpen

  const clearOpenTimer = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
  }
  const handleMouseEnter = () => {
    clearOpenTimer()
    openTimer.current = setTimeout(() => setHoverOpen(true), 110)
  }
  const handleMouseLeave = () => {
    clearOpenTimer()
    setHoverOpen(false)
  }
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    // Only collapse once focus leaves the rail entirely (not while tabbing
    // between its own buttons).
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocusOpen(false)
    }
  }
  React.useEffect(() => () => clearOpenTimer(), [])

  return (
    <>
      <WorkspaceTabBar activeView={activeView} onNavigate={onNavigate} />
      {/* Desktop rail. The outer element reserves a fixed 66px gutter in the
          flex row; the nav is absolutely positioned within it and expands OVER
          the page content on hover/focus, so the page never reflows. */}
      <div className="relative hidden w-[66px] shrink-0 md:block">
        <nav
          aria-label="Workspace"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={() => setFocusOpen(true)}
          onBlur={handleBlur}
          className={cn(
            "absolute inset-y-0 left-0 z-30 flex flex-col gap-1.5 overflow-hidden border-r border-rule bg-page px-3 py-4 transition-[width] duration-(--duration-base) ease-out-soft",
            expanded
              ? "w-[232px] shadow-[6px_0_24px_-10px_rgba(15,23,42,0.18)]"
              : "w-[66px]",
            className
          )}
        >
          <div className="mb-3.5 flex h-[34px] items-center">
            <span className="grid size-[42px] shrink-0 place-items-center">
              <span className="grid size-[34px] place-items-center rounded-md bg-accent font-display text-lg font-semibold text-white">
                S
              </span>
            </span>
            <span
              className={cn(
                "whitespace-nowrap font-display text-[17px] font-semibold text-ink transition-opacity duration-(--duration-base) ease-out-soft",
                expanded ? "opacity-100" : "opacity-0"
              )}
            >
              Strattigo
            </span>
          </div>
          {RAIL_VIEWS.map((item) => (
            <RailButton
              key={item.id}
              item={item}
              active={activeView === item.id}
              expanded={expanded}
              onNavigate={onNavigate}
            />
          ))}
          <div className="flex-1" />
          <RailButton
            item={SETTINGS_ITEM}
            active={activeView === "settings"}
            expanded={expanded}
            onNavigate={onNavigate}
          />
        </nav>
      </div>
    </>
  )
}

/**
 * WorkspaceTabBar — the rail's mobile form (workspace-chat.html
 * `.m-bottomnav`): one fixed, thumb-reachable bottom bar with the four
 * course views. Pages keep a matching bottom padding on their root
 * (`max-md:pb-…`) so scroll content clears the bar.
 */
function WorkspaceTabBar({
  activeView,
  onNavigate,
}: {
  activeView: RailView
  onNavigate: (view: RailView) => void
}) {
  return (
    <nav
      aria-label="Workspace"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-rule bg-page pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {TAB_VIEWS.map((item) => {
        const Icon = item.icon
        const active = activeView === item.id
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              active ? "text-accent-deep" : "text-ink-faint"
            )}
          >
            <Icon className={cn("size-5", active && "text-accent")} />
            <span className="font-sans text-[10.5px] font-medium">
              {item.shortLabel ?? item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export { WorkspaceRail }
