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

## 3. Persist quiz attempts (answers + score)

Saved quizzes (`QuizSaveRequest` → `generated_content`) store only
`id / title / content / created_at`, where `content` is the raw question
markdown — **not** the student's picks or score. So the results screen
(just-finished, answers in memory) and reopening a saved quiz are necessarily
different views: a reopened quiz starts a fresh take instead of replaying
"you chose A · correct: B".

Persisting an attempt record (per-question picked letter + score + taken-at)
would let the quiz view replay results/review for past attempts and let the
Quizzes list show "8/10 · Jul 14" instead of just title/date/question count.

- The quiz surface is already built for it: `QuizResults` takes
  `questions + answers` — feed it a stored attempt and the review view is done.
- Same note as guides: there's also no single-quiz GET; the view lists
  `getSavedQuizzes(courseId)` and finds by id.

## 4. Quiz focus-topics parameter

`StudyGuideRequest` accepts `focus_topics`; `QuizRequest` does not (only
`num_questions`, `difficulty`, `collection_id`). The quiz generation modal
therefore omits the focus-topics field the reference mock shows — add the
param to the backend and the modal can grow the input.

## 5. Per-question source references — MOAT REINFORCEMENT (high value)

**This is a moat item, not a routine nice-to-have.** The product's edge is
grounded, cited answers — quiz explanations that point back to the exact
material they came from. The generation format currently carries no source
refs, so explanations can't show the "From: Lecture 04, p.7" citation chip the
reference design includes, and the surface can't yet make its strongest claim
(this answer is backed by *your* materials, here's where).

Emitting a source line per question in the generation prompt/format (the RAG
context already knows which chunks/materials each question draws from) unlocks
this directly:

- **The UI is already wired for it.** `QuizQuestionCard`'s explanation
  `Callout` just needs the ref to render the citation chip — the moment quiz
  generation returns source refs, the chips light up with no further UI work.
- Same grounding story as the guide surface; doing both is what makes the
  cited-answers claim real across the product, so weight this above the
  routine items above.

## 6. Material preview / open

The materials-tab.html mock implies an "Open" action on each file, but there
is no in-app preview: the only way to see a material is Download (signed URL).
So the rebuilt materials surface's ⋯ menu is Download / Rename / Add to
collection / Delete — no "Open".

A real preview (render the stored file — PDF/slide/doc/txt — inline or in a
pane) would let "Open" join the menu. It needs a backend/UI viewer, not just a
presentation change:

- The `Material` object already carries `file_url` + a signed `download_url`;
  an inline viewer could start from those.
- Lowest-effort first step: an "Open in new tab" that points at the signed URL
  (browser-native PDF/text preview) — but that's a browser behavior, not a
  product preview, so it's parked here rather than shipped as "Open".

## 7. File size on materials

The mock shows a file size ("2.4 MB") in each row's metadata, but `Material`
has no size field and the upload endpoint doesn't return one. The rebuilt rows
show date only. Persisting `file_size` on upload (and adding it to
`MaterialResponse`) would let the row meta read "2.4 MB · Jul 14" as designed.
