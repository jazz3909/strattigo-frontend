/**
 * File-type badge — the solid PDF/DOC/PPT/TXT tile (materials-tab.html).
 * Colors come from the --color-filetype-* tokens (their own category, like
 * subject colors — never accent/state). Unknown types fall back to a neutral
 * sunk tile. White label on the colored tiles.
 */

const FILETYPE: Record<string, { label: string; token: string }> = {
  pdf: { label: "PDF", token: "--color-filetype-pdf" },
  doc: { label: "DOC", token: "--color-filetype-doc" },
  docx: { label: "DOC", token: "--color-filetype-doc" },
  ppt: { label: "PPT", token: "--color-filetype-ppt" },
  pptx: { label: "PPT", token: "--color-filetype-ppt" },
  txt: { label: "TXT", token: "--color-filetype-txt" },
};

/** Lowercased extension without the dot, or "" if none. */
export function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Coarse type bucket used by the All Files filter chips. */
export function fileCategory(name: string): "pdf" | "slides" | "docs" | "other" {
  const ext = fileExt(name);
  if (ext === "pdf") return "pdf";
  if (ext === "ppt" || ext === "pptx") return "slides";
  if (ext === "doc" || ext === "docx" || ext === "txt") return "docs";
  return "other";
}

export function FileTypeBadge({ name, size = 38 }: { name: string; size?: number }) {
  const meta = FILETYPE[fileExt(name)];
  const label = meta?.label ?? (fileExt(name) || "?").slice(0, 3).toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-[9px] font-sans text-[11px] font-semibold"
      style={{
        width: size,
        height: size,
        background: meta ? `var(${meta.token})` : "var(--color-sunk)",
        color: meta ? "#fff" : "var(--color-ink-faint)",
      }}
    >
      {label}
    </span>
  );
}
