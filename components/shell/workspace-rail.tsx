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
  onNavigate,
}: {
  item: RailItemConfig
  active: boolean
  onNavigate: (view: RailView) => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      title={item.label}
      onClick={() => onNavigate(item.id)}
      className={cn(
        "relative grid size-[42px] cursor-pointer place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-page",
        active
          ? "bg-accent-tint text-accent-deep"
          : "text-ink-faint hover:bg-rule-soft hover:text-ink-soft"
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute top-[9px] bottom-[9px] -left-3 w-[3px] rounded-r-[3px] bg-accent"
        />
      )}
      <Icon className="size-[19px]" />
    </button>
  )
}

interface WorkspaceRailProps {
  activeView: RailView
  onNavigate: (view: RailView) => void
  className?: string
}

function WorkspaceRail({ activeView, onNavigate, className }: WorkspaceRailProps) {
  return (
    <>
      <WorkspaceTabBar activeView={activeView} onNavigate={onNavigate} />
      <nav
        aria-label="Workspace"
        className={cn(
          "hidden w-[66px] shrink-0 flex-col items-center gap-1.5 border-r border-rule bg-page py-4 md:flex",
          className
        )}
      >
        <div className="mb-3.5 grid size-[34px] place-items-center rounded-md bg-accent font-display text-lg font-semibold text-white">
          S
        </div>
        {RAIL_VIEWS.map((item) => (
          <RailButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            onNavigate={onNavigate}
          />
        ))}
        <div className="flex-1" />
        <RailButton
          item={SETTINGS_ITEM}
          active={activeView === "settings"}
          onNavigate={onNavigate}
        />
      </nav>
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
