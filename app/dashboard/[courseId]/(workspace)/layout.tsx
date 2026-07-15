"use client";

import { use, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { WorkspaceRail, type RailView } from "@/components/shell/workspace-rail";
import { WorkspaceTopBar } from "@/components/shell/workspace-top-bar";
import { buildCollectionTree } from "@/app/lib/collectionTree";

import { WorkspaceProvider, useWorkspace } from "./workspace-context";

const SURFACE_VIEWS: RailView[] = ["chat", "guides", "quizzes", "materials"];

/**
 * The persistent course-workspace frame. Introduced to fix switch-lag: the
 * four surfaces (chat / guides / quizzes / materials) used to be sibling
 * routes that each re-rendered the rail + top bar and refetched the frame data
 * on every navigation. They now share this layout — so the rail, top bar, and
 * fetched data (via WorkspaceProvider) persist across switches, and only the
 * page body swaps. The reader/generation routes (guide/[id], quiz/[id]) and
 * the bare-course redirect stay outside this group and keep their own chrome.
 */
export default function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  return (
    <WorkspaceProvider courseId={courseId}>
      <WorkspaceFrame courseId={courseId}>{children}</WorkspaceFrame>
    </WorkspaceProvider>
  );
}

function WorkspaceFrame({
  courseId,
  children,
}: {
  courseId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { course, collections, materialCount, scopedId, setScopedId, uploadActionRef } =
    useWorkspace();

  const tree = useMemo(() => buildCollectionTree(collections), [collections]);

  const activeView: RailView =
    SURFACE_VIEWS.find((v) => pathname.endsWith(`/${v}`)) ?? "chat";

  // Optimistic active state + non-blocking navigation so a switch highlights
  // the target immediately instead of waiting for the route (and its chunk /
  // loading.tsx skeleton) to commit. The optimistic override is only honored
  // while the transition is in flight; once it commits, `activeView` (derived
  // from the new pathname) takes over — so there's nothing to clear in an
  // effect, and no stale highlight.
  const [isPending, startTransition] = useTransition();
  const [pendingView, setPendingView] = useState<RailView | null>(null);
  const displayView = isPending && pendingView ? pendingView : activeView;

  // Warm the sibling surfaces' chunks + RSC so the first visit to each isn't a
  // cold click-time fetch (the rail uses onNavigate/router.push, not <Link>,
  // so nothing prefetches on its own).
  useEffect(() => {
    for (const v of SURFACE_VIEWS) router.prefetch(`/dashboard/${courseId}/${v}`);
  }, [courseId, router]);

  function navTab(view: RailView) {
    const dest =
      view === "courses"
        ? "/dashboard"
        : view === "settings"
          ? "/settings/billing"
          : `/dashboard/${courseId}/${view}`;
    if (SURFACE_VIEWS.includes(view)) {
      if (pathname.endsWith(`/${view}`)) return; // already here
      setPendingView(view);
    }
    startTransition(() => router.push(dest));
  }

  function handleUpload() {
    if (uploadActionRef.current) uploadActionRef.current();
    else router.push(`/dashboard/${courseId}/materials`);
  }

  return (
    <div
      className="flex h-screen overflow-hidden bg-page text-ink max-md:h-dvh max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]"
      data-nav-pending={isPending ? "" : undefined}
    >
      <WorkspaceRail activeView={displayView} onNavigate={navTab} />

      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopBar
          course={{ name: course?.name ?? "…", materialCount }}
          tree={tree}
          scopedNodeId={scopedId}
          onScopeChange={setScopedId}
          onUpload={handleUpload}
        />
        {children}
      </div>
    </div>
  );
}
