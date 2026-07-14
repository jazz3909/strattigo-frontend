/**
 * Course shelf colors — course-colors.html.
 * The ten curated subject hues (identity ONLY — buttons/states stay accent).
 * Values live in globals.css as --color-subject-* tokens; this module just
 * names them and assigns a stable default per course.
 *
 * Courses have NO persisted color field (backend `courses` = id/user_id/name/
 * created_at), so the default is derived by hashing the course id — stable
 * across reloads and sessions without inventing backend state.
 */

export interface SubjectColor {
  key: string
  name: string
  /** Solid hue (spine, tile, swatch). */
  color: string
  /** Matching wash. */
  tint: string
}

export const SUBJECT_COLORS: SubjectColor[] = [
  { key: "dusk", name: "Dusk", color: "var(--color-subject-dusk)", tint: "var(--color-subject-dusk-tint)" },
  { key: "sage", name: "Sage", color: "var(--color-subject-sage)", tint: "var(--color-subject-sage-tint)" },
  { key: "ochre", name: "Ochre", color: "var(--color-subject-ochre)", tint: "var(--color-subject-ochre-tint)" },
  { key: "clay", name: "Clay", color: "var(--color-subject-clay)", tint: "var(--color-subject-clay-tint)" },
  { key: "plum", name: "Plum", color: "var(--color-subject-plum)", tint: "var(--color-subject-plum-tint)" },
  { key: "pine", name: "Pine", color: "var(--color-subject-pine)", tint: "var(--color-subject-pine-tint)" },
  { key: "slate", name: "Slate", color: "var(--color-subject-slate)", tint: "var(--color-subject-slate-tint)" },
  { key: "terracotta", name: "Terracotta", color: "var(--color-subject-terracotta)", tint: "var(--color-subject-terracotta-tint)" },
  { key: "moss", name: "Moss gold", color: "var(--color-subject-moss)", tint: "var(--color-subject-moss-tint)" },
  { key: "cocoa", name: "Cocoa", color: "var(--color-subject-cocoa)", tint: "var(--color-subject-cocoa-tint)" },
]

/** FNV-1a over the course id → stable palette index. */
function hashIndex(courseId: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < courseId.length; i++) {
    h ^= courseId.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return Math.abs(h) % SUBJECT_COLORS.length
}

/** The stable default color for a course (hash of its id). */
export function courseColor(courseId: string): SubjectColor {
  return SUBJECT_COLORS[hashIndex(courseId)]
}
