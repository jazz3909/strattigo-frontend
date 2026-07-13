"use client"

import * as React from "react"
import { Menu } from "@base-ui/react/menu"
import { Check, ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * ScopePicker — "Generate from:" (THE MOAT).
 *
 * Expresses nested-collection scoping: course → collections → subcollections.
 * It is first-class, shared, and IDENTICAL across chat, study guides, quizzes,
 * and every generation modal. Never fork it per-surface, never relabel it —
 * the label is deliberately hardcoded.
 *
 * Built on Base UI Menu (radio-group selection): full keyboard nav (arrows,
 * Enter to select, Escape to close, typeahead), focus management, and
 * aria-checked on the scoped node come from the primitive. Expand/collapse
 * carets are mouse affordances only; keyboard users always traverse the full
 * tree (max depth is 3, so the list stays short).
 *
 * `tree` is structurally identical to CollectionNode from
 * app/lib/collectionTree.ts (built from the flat Collection list, where each
 * row carries `parent_id: string | null`) — pass buildCollectionTree(...)
 * output straight in, no reshaping.
 */
export interface ScopeNode {
  id: string
  name: string
  children: ScopeNode[]
}

/** Sentinel radio value for the whole-course root (scopedNodeId === null). */
const ROOT = "__course__"

interface ScopePickerProps {
  /** Course name — renders as the whole-course root option. */
  courseName: string
  /** Nested collection tree (CollectionNode[] passes as-is). */
  tree: ScopeNode[]
  /** Currently scoped collection id, or null for the entire course. */
  scopedNodeId: string | null
  onScopeChange: (id: string | null) => void
  className?: string
}

function findNode(nodes: ScopeNode[], id: string): ScopeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const hit = findNode(n.children, id)
    if (hit) return hit
  }
  return null
}

function ScopePicker({
  courseName,
  tree,
  scopedNodeId,
  onScopeChange,
  className,
}: ScopePickerProps) {
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())

  const scopedName =
    (scopedNodeId != null && findNode(tree, scopedNodeId)?.name) || courseName

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function renderNode(node: ScopeNode, depth: number): React.ReactNode {
    const hasChildren = node.children.length > 0
    const isCollapsed = collapsed.has(node.id)
    return (
      <React.Fragment key={node.id}>
        <Menu.RadioItem
          value={node.id}
          closeOnClick
          className="flex cursor-pointer items-center gap-1.5 rounded-sm py-[7px] pr-3 font-sans text-ui text-ink-soft outline-none select-none data-[highlighted]:bg-rule-soft data-[checked]:bg-accent-tint data-[checked]:font-medium data-[checked]:text-accent-deep"
          style={{ paddingLeft: `${8 + (depth - 1) * 16}px` }}
        >
          {hasChildren ? (
            <span
              aria-hidden="true"
              className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-[4px] text-ink-faint hover:bg-rule-soft hover:text-ink-soft"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleCollapsed(node.id)
              }}
            >
              {isCollapsed ? (
                <ChevronRight className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </span>
          ) : (
            <span aria-hidden="true" className="size-5 shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
          <Menu.RadioItemIndicator className="shrink-0">
            <Check className="size-3.5" />
          </Menu.RadioItemIndicator>
        </Menu.RadioItem>
        {hasChildren && !isCollapsed && node.children.map((c) => renderNode(c, depth + 1))}
      </React.Fragment>
    )
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-sm border border-rule-strong bg-raised px-[13px] py-2 font-sans text-ui-s text-ink-soft outline-none transition-colors select-none hover:border-rule-strong hover:bg-sheet focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-tint)]",
          className
        )}
      >
        <span className="shrink-0">Generate from:</span>
        <span className="max-w-56 truncate font-medium text-accent-deep">{scopedName}</span>
        <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-ink-faint" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className="max-h-[min(420px,var(--available-height))] w-72 overflow-y-auto rounded-md border border-rule bg-raised p-1.5 shadow-popover outline-none">
            <Menu.RadioGroup
              value={scopedNodeId ?? ROOT}
              onValueChange={(value) => onScopeChange(value === ROOT ? null : (value as string))}
            >
              <Menu.RadioItem
                value={ROOT}
                closeOnClick
                className="flex cursor-pointer items-center gap-1.5 rounded-sm py-[7px] pr-3 pl-2 font-sans text-ui text-ink outline-none select-none data-[highlighted]:bg-rule-soft data-[checked]:bg-accent-tint data-[checked]:font-medium data-[checked]:text-accent-deep"
              >
                <span aria-hidden="true" className="size-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {courseName}
                  <span className="ml-1.5 font-normal text-ink-faint">· all materials</span>
                </span>
                <Menu.RadioItemIndicator className="shrink-0">
                  <Check className="size-3.5" />
                </Menu.RadioItemIndicator>
              </Menu.RadioItem>
              {tree.length > 0 && <Menu.Separator className="mx-2 my-1 h-px bg-rule-soft" />}
              {tree.map((n) => renderNode(n, 1))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

export { ScopePicker }
