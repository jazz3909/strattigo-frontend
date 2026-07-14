# Future enhancements

Backend items that are **out of scope for the presentation-layer UI rebuild**
(`ui-rebuild`) but on the record. The reading view and its components are built
to render these the moment the backend provides the data.

## 1. Persist guide metadata on save

`saveStudyGuide` currently stores only `id / title / content / created_at`
(`StudyGuideSaved`). Persisting the **scope/collection**, **style**
(detailed/bullet), and **source-material count** at save time would let the
reader show the richer byline the design intends — e.g.
_"Generated from 6 materials · Detailed · Unit 3"_ — instead of only the created
date + derived reading time.

- Small backend change; do it the next time the guide-save endpoint is touched.
- Front end already has the values in-session during generation (title, style,
  focus, scoped collection id) — they're simply not sent to / stored by save.
- Note: there is also no single-guide GET endpoint today; the reader lists
  `getSavedStudyGuides(courseId)` and finds by id. A `GET /ai/study-guide/{id}`
  would be a natural companion but isn't required.

## 2. Structured guide generation (highest value)

Guides are currently **flat markdown**, so the reader's Key-idea and Recall
callout components (already built — `components/ui/guide-blocks.tsx`) have no
structured data to render. Only display-math (`$$…$$`) auto-maps to the
formula-block treatment today.

Updating the generation prompt/response to emit **structured guides** — marked
key ideas and a dedicated recall/summary section — would unlock those callouts.

- This is the **highest-value** enhancement: it makes guides materially better
  to study from, and the UI is already built to render it (drop the structured
  fields into `KeyIdeaCallout` / `RecallBox`, math already flows to
  `FormulaBlock` via `.reader-doc`).
