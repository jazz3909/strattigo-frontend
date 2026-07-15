"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

import { UserMenu } from "@/components/shell/user-menu"
import { Button } from "@/components/ui/button"
import { ScopePicker, type ScopeNode } from "@/components/ui/scope-picker"
import { cn } from "@/lib/utils"

/**
 * WorkspaceTopBar — the 62px course header strip (workspace-chat.html).
 * Left: course identity (accent initial tile — NOT the per-course subject
 * hue; subject colors belong to the dashboard shelf only). Right: the shared
 * ScopePicker and the view's one primary action, Upload.
 *
 * Below md it becomes the phone mock's two-row header (`.m-topbar`):
 * back-to-courses + condensed identity + avatar menu, with the ScopePicker
 * (label untouched — it's the moat) and an icon-sized Upload on their own
 * row beneath. Desktop markup is unchanged; mobile bits are md:hidden twins.
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
    <>
      <header
        className={cn(
          "flex h-[62px] shrink-0 items-center gap-4 border-b border-rule px-[26px] max-md:h-14 max-md:gap-2.5 max-md:px-3",
          className
        )}
      >
        <Link
          href="/dashboard"
          aria-label="Back to courses"
          className="grid size-[38px] shrink-0 place-items-center rounded-md text-ink-soft outline-none hover:bg-rule-soft focus-visible:ring-2 focus-visible:ring-accent md:hidden"
        >
          <ArrowLeft className="size-[18px]" />
        </Link>
        <div className="flex min-w-0 items-center gap-[11px]">
          <div className="hidden size-[30px] shrink-0 place-items-center rounded-md bg-accent font-display text-[15px] font-semibold text-white md:grid">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-[17px] font-medium text-ink max-md:text-[15px]">
              {course.name}
            </div>
            <div className="flex items-center gap-1.5 font-sans text-ui-s text-ink-faint max-md:text-[11.5px]">
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
          className="max-md:hidden"
        />
        <Button variant="primary" onClick={onUpload} className="max-md:hidden">
          <Plus />
          Upload
        </Button>
        <UserMenu className="md:hidden" />
      </header>
      {/* Mobile scope row — the moat control keeps its full label; Upload
          shrinks to an icon beside it. */}
      <div className="flex shrink-0 items-center gap-2 border-b border-rule px-3 py-2 md:hidden">
        <ScopePicker
          courseName={course.name}
          tree={tree}
          scopedNodeId={scopedNodeId}
          onScopeChange={onScopeChange}
          className="min-w-0 [&>span:nth-child(2)]:min-w-0 [&>span:nth-child(2)]:flex-1"
        />
        <div className="flex-1" />
        <Button
          variant="primary"
          onClick={onUpload}
          aria-label="Upload materials"
          className="size-[38px] p-0"
        >
          <Plus className="size-[18px]" />
        </Button>
      </div>
    </>
  )
}

export { WorkspaceTopBar }
