"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScopePicker, type ScopeNode } from "@/components/ui/scope-picker"
import { cn } from "@/lib/utils"

/**
 * WorkspaceTopBar — the 62px course header strip (workspace-chat.html).
 * Left: course identity (accent initial tile — NOT the per-course subject
 * hue; subject colors belong to the dashboard shelf only). Right: the shared
 * ScopePicker and the view's one primary action, Upload.
 */

interface WorkspaceTopBarProps {
  course: {
    name: string
    /** Tile letter; defaults to the first character of the name. */
    initial?: string
    materialCount: number
  }
  tree: ScopeNode[]
  scopedNodeId: string | null
  onScopeChange: (id: string | null) => void
  onUpload: () => void
  className?: string
}

function WorkspaceTopBar({
  course,
  tree,
  scopedNodeId,
  onScopeChange,
  onUpload,
  className,
}: WorkspaceTopBarProps) {
  const initial = (course.initial ?? course.name[0] ?? "C").toUpperCase()
  return (
    <header
      className={cn(
        "flex h-[62px] shrink-0 items-center gap-4 border-b border-rule px-[26px]",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-[11px]">
        <div className="grid size-[30px] shrink-0 place-items-center rounded-md bg-accent font-display text-[15px] font-semibold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-[17px] font-medium text-ink">
            {course.name}
          </div>
          <div className="flex items-center gap-1.5 font-sans text-ui-s text-ink-faint">
            <span aria-hidden="true" className="size-[5px] rounded-full bg-accent" />
            {course.materialCount} material{course.materialCount === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <ScopePicker
        courseName={course.name}
        tree={tree}
        scopedNodeId={scopedNodeId}
        onScopeChange={onScopeChange}
      />
      <Button variant="primary" onClick={onUpload}>
        <Plus />
        Upload
      </Button>
    </header>
  )
}

export { WorkspaceTopBar }
