/**
 * Transition fallback for the workspace surfaces. Rendered in the page slot
 * (below the persistent rail + top bar) while a surface's chunk / data commits
 * on a cold switch, so navigation shows an immediate cream skeleton instead of
 * a frozen previous page. Warm (prefetched) switches skip straight to content.
 */
export default function WorkspaceLoading() {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="mx-auto w-full max-w-[1040px] px-10 py-8 max-md:px-4">
        <div className="skeleton-sheen mb-6 h-8 w-48 rounded bg-sunk" />
        <div className="overflow-hidden rounded-lg border border-rule">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-3.5 px-4 py-3.5 ${i ? "border-t border-rule-soft" : ""}`}
            >
              <div className="skeleton-sheen size-[38px] shrink-0 rounded-[9px] bg-sunk" />
              <div className="flex-1">
                <div className="skeleton-sheen mb-2 h-3.5 w-2/3 rounded bg-sunk" />
                <div className="skeleton-sheen h-3 w-24 rounded bg-sunk" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
