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

/** Stable hue for a collection spine — the exact courses pattern (id-hash
    into the ten subject hues); no picker, no persistence. */
export const collectionColor = courseColor

/* ── User-chosen colors ──────────────────────────────────────────────────────
   There is no backend column to store a choice (see FUTURE-ENHANCEMENTS.md),
   so a picked color is persisted as a presentation preference in
   localStorage — honest about its scope: it survives reloads on this
   browser, not across devices. Falls back to the id-hash default. */

const STORAGE_KEY = "strattigo_course_colors"

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
  } catch {
    return {}
  }
}

/** Persist a user-chosen palette key for a course. */
export function setStoredCourseColor(courseId: string, key: string): void {
  if (typeof window === "undefined") return
  const map = readMap()
  map[courseId] = key
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

/** Drop a course's stored color (course deleted — don't let the map grow stale). */
export function removeStoredCourseColor(courseId: string): void {
  if (typeof window === "undefined") return
  const map = readMap()
  if (!(courseId in map)) return
  delete map[courseId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

/** User-chosen color if one was picked on this browser, else the stable default. */
export function resolveCourseColor(courseId: string): SubjectColor {
  const stored = readMap()[courseId]
  return SUBJECT_COLORS.find((c) => c.key === stored) ?? courseColor(courseId)
}
