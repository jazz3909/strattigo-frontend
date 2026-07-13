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
  icon: React.ComponentType<{ className?: string }>
}

const RAIL_VIEWS: RailItemConfig[] = [
  { id: "courses", label: "Courses", icon: ArrowLeft },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "guides", label: "Study guides", icon: FileText },
  { id: "quizzes", label: "Quizzes", icon: SquareCheck },
  { id: "materials", label: "Materials", icon: FolderTree },
]

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
    <nav
      aria-label="Workspace"
      className={cn(
        "flex w-[66px] shrink-0 flex-col items-center gap-1.5 border-r border-rule bg-page py-4",
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
  )
}

export { WorkspaceRail }
