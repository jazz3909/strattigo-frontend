export const API_BASE = "/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("strattigo_token");
}

export function clearToken(): void {
  localStorage.removeItem("strattigo_token");
  localStorage.removeItem("strattigo_refresh_token");
  localStorage.removeItem("strattigo_user_id");
  localStorage.removeItem("strattigo_email");
}

export function getEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("strattigo_email");
}

/**
 * Persist a full auth session: the access token in localStorage (API calls)
 * and in the cookie proxy.ts gates on, PLUS the refresh token. The refresh
 * token is what lets the session outlive the ~1h Supabase access-JWT expiry —
 * without it, the first 401 (e.g. the subscription poll right after the
 * Stripe checkout round-trip) hard-logged a paying user out to /login.
 */
export function persistSession(session: AuthResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("strattigo_token", session.access_token);
  if (session.refresh_token) {
    localStorage.setItem("strattigo_refresh_token", session.refresh_token);
  }
  if (session.user_id) localStorage.setItem("strattigo_user_id", session.user_id);
  if (session.email) localStorage.setItem("strattigo_email", session.email);
  document.cookie = `strattigo_token=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
}

function handle401(): never {
  clearToken();
  if (typeof window !== "undefined") {
    document.cookie = "strattigo_token=; path=/; max-age=0";
    window.location.href = "/login";
  }
  throw new Error("Session expired. Please log in again.");
}

// Supabase rotates refresh tokens (each is single-use), so concurrent 401s
// must share one in-flight /auth/refresh exchange instead of racing.
let refreshInFlight: Promise<string | null> | null = null;

async function tryRefreshSession(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("strattigo_refresh_token");
  if (!refreshToken) return null;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return null;
        const session: AuthResponse = await res.json();
        persistSession(session);
        return session.access_token;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * fetch with Bearer auth and automatic session renewal: on a 401, exchange
 * the stored refresh token for a new session and retry the request once.
 * Only when that fails too (no refresh token, or it was revoked/expired)
 * does handle401 log the user out.
 */
async function authFetch(
  path: string,
  init: RequestInit = {},
  auth = true
): Promise<Response> {
  const doFetch = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (auth && token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, { ...init, headers });
  };

  let res = await doFetch(auth ? getToken() : null);
  if (res.status === 401 && auth) {
    const freshToken = await tryRefreshSession();
    if (freshToken) res = await doFetch(freshToken);
    if (res.status === 401) handle401();
  }
  return res;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await authFetch(path, { ...options, headers }, auth);

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      const detail = body.detail;
      const msg = body.message;
      if (typeof detail === "string" && detail) message = detail;
      else if (Array.isArray(detail)) message = detail.map((e: Record<string, unknown>) => String(e.msg ?? e)).join("; ");
      else if (typeof msg === "string" && msg) message = msg;
    } catch {}
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export async function apiGet<T>(
  path: string,
  auth = true,
  init: RequestInit = {}
): Promise<T> {
  return request<T>(path, { method: "GET", ...init }, auth);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  auth = true
): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) }, auth);
}

export async function apiPostForm<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const res = await authFetch(path, { method: "POST", body: formData });

  if (!res.ok) {
    let message = `Upload failed: ${res.status}`;
    try {
      const err = await res.json();
      message = err.detail || err.message || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

// Auth
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  email: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/login", { email, password }, false);
}

// Fixed: spec says /auth/signup, not /auth/register
export async function signup(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/signup", { email, password }, false);
}

// Courses
export interface Course {
  id: string;
  user_id?: string;
  name: string;
  created_at?: string;
  description?: string;
}

export async function getCourses(): Promise<Course[]> {
  return apiGet<Course[]>("/courses");
}

export async function createCourse(name: string, description?: string): Promise<Course> {
  return apiPost<Course>("/courses", { name, description });
}

export async function getCourse(courseId: string): Promise<Course> {
  const courses = await getCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) throw new Error(`Course not found: ${courseId}`);
  return course;
}

// Materials
// Spec: {id, course_id, user_id, file_name, file_url, content, created_at}
export interface Material {
  id: string;
  course_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  content: string;
  created_at: string;
}

export async function getMaterials(courseId: string): Promise<Material[]> {
  try {
    return await apiGet<Material[]>(`/materials/course/${courseId}`);
  } catch (err) {
    // API returns 404 when no materials exist; treat as empty list
    if (err instanceof Error && /404|not found/i.test(err.message)) return [];
    throw err;
  }
}

export async function uploadMaterial(courseId: string, file: File): Promise<Material> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("course_id", courseId);
  return apiPostForm<Material>(`/materials/upload`, formData);
}

export async function deleteMaterial(materialId: string): Promise<void> {
  return apiDelete<void>(`/materials/${materialId}`);
}

export async function getMaterialWithDownload(materialId: string): Promise<Material & { download_url: string }> {
  return apiGet<Material & { download_url: string }>(`/materials/${materialId}`);
}

export async function renameMaterial(materialId: string, fileName: string): Promise<Material> {
  return apiPatch<Material>(`/materials/${materialId}`, { file_name: fileName });
}

// Collections
export interface Collection {
  id: string;
  course_id: string;
  user_id?: string;
  name: string;
  /** null for a top-level collection; the parent's id for a sub-folder. */
  parent_id: string | null;
  created_at: string;
  /** OWN direct file count (does NOT include sub-folders' files). */
  material_count?: number;
  /** Number of direct child sub-folders. */
  subfolder_count?: number;
}

/**
 * Shape returned by GET /collections/course/{course_id}: a flat list of every
 * collection in the course, each carrying parent_id (used to build the tree)
 * plus its OWN direct material_count and direct subfolder_count. Structurally
 * identical to Collection — aliased for clarity where the flat list is meant.
 */
export type CollectionSummary = Collection;

export async function getCollections(courseId: string): Promise<CollectionSummary[]> {
  try {
    return await apiGet<CollectionSummary[]>(`/collections/course/${courseId}`);
  } catch (err) {
    if (err instanceof Error && /404|not found/i.test(err.message)) return [];
    throw err;
  }
}

/**
 * Create a collection. Omit parentId (or pass null) for a top-level collection;
 * pass a parent's id to create a sub-folder under it.
 */
export async function createCollection(courseId: string, name: string, parentId?: string | null): Promise<Collection> {
  const body: Record<string, unknown> = { course_id: courseId, name };
  if (parentId) body.parent_id = parentId;
  return apiPost<Collection>("/collections", body);
}

/** Rename a collection. PATCH /collections/{id} { name }. */
export async function renameCollection(collectionId: string, name: string): Promise<Collection> {
  return apiPatch<Collection>(`/collections/${collectionId}`, { name });
}

/**
 * Move/reparent a collection. PATCH /collections/{id}/parent { parent_id }.
 * Pass null to promote to top-level. (Wired for Phase 4 drag-and-drop; the
 * helper exists now but the Phase 3 UI does not call it.)
 */
export async function moveCollection(collectionId: string, parentId: string | null): Promise<Collection> {
  return apiPatch<Collection>(`/collections/${collectionId}/parent`, { parent_id: parentId });
}

/** GET /collections/{id}/delete-preview — what a cascade delete would remove. */
export interface DeleteCollectionPreview {
  collection_id: string;
  /** Number of descendant sub-folders that would also be deleted. */
  descendant_count: number;
  /** Names of the descendant collections that would be deleted. */
  affected_collection_names: string[];
}

export async function deleteCollectionPreview(collectionId: string): Promise<DeleteCollectionPreview> {
  return apiGet<DeleteCollectionPreview>(`/collections/${collectionId}/delete-preview`);
}

export interface DeleteCollectionResult {
  deleted_collection_id: string;
  deleted_descendant_count: number;
  total_deleted: number;
}

export async function deleteCollection(collectionId: string): Promise<DeleteCollectionResult> {
  return apiDelete<DeleteCollectionResult>(`/collections/${collectionId}`);
}

export async function addMaterialToCollection(collectionId: string, materialId: string): Promise<void> {
  return apiPost<void>(`/collections/${collectionId}/materials`, { material_id: materialId });
}

export async function removeMaterialFromCollection(collectionId: string, materialId: string): Promise<void> {
  return apiDelete<void>(`/collections/${collectionId}/materials/${materialId}`);
}

export async function getCollectionMaterials(collectionId: string): Promise<Material[]> {
  try {
    return await apiGet<Material[]>(`/collections/${collectionId}/materials`);
  } catch (err) {
    if (err instanceof Error && /404|not found/i.test(err.message)) return [];
    throw err;
  }
}

// AI Features
// All AI endpoints return {content, cached, content_id}

/** Returns true only when the value is a non-empty UUID (not "" or "all"). */
function isRealCollectionId(id?: string): id is string {
  return !!id && id !== "all";
}

export interface AiResponse {
  content: string;
  cached: boolean;
  content_id: string;
}

export interface StudyGuideSaved {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
}

export interface QuizSaved {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
}

export async function getSavedStudyGuides(courseId: string): Promise<StudyGuideSaved[]> {
  return apiGet<StudyGuideSaved[]>(`/ai/study-guides/${courseId}`);
}

export async function getSavedQuizzes(courseId: string): Promise<QuizSaved[]> {
  return apiGet<QuizSaved[]>(`/ai/quizzes/${courseId}`);
}

export async function saveQuiz(courseId: string, title: string, content: string): Promise<QuizSaved> {
  return apiPost<QuizSaved>("/ai/quiz/save", { course_id: courseId, title, content });
}

export async function deleteSavedQuiz(contentId: string): Promise<void> {
  return apiDelete<void>(`/ai/quiz/${contentId}`);
}

export async function generateStudyGuide(courseId: string, title: string, forceRegenerate = false, collectionId?: string): Promise<AiResponse> {
  const path = forceRegenerate ? `/ai/study-guide?force_regenerate=true` : `/ai/study-guide`;
  const body: Record<string, unknown> = { course_id: courseId, title };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;
  return apiPost<AiResponse>(path, body);
}

export async function deleteStudyGuide(contentId: string): Promise<void> {
  return apiDelete<void>(`/ai/study-guide/${contentId}`);
}

export async function generateStudyPlan(courseId: string, examDate?: string, forceRegenerate = false, collectionId?: string): Promise<AiResponse> {
  const path = forceRegenerate ? `/ai/study-plan?force_regenerate=true` : `/ai/study-plan`;
  const body: Record<string, unknown> = { course_id: courseId, exam_date: examDate };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;
  return apiPost<AiResponse>(path, body);
}

// Quiz: returns {content, cached, content_id} where content is raw markdown
export async function generateQuizRaw(courseId: string, forceRegenerate = false, collectionId?: string): Promise<AiResponse> {
  const path = forceRegenerate ? `/ai/quiz?force_regenerate=true` : `/ai/quiz`;
  const body: Record<string, unknown> = { course_id: courseId };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;
  return apiPost<AiResponse>(path, body);
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: { letter: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

/**
 * Parses raw quiz markdown into structured QuizQuestion[].
 * Expected format (blocks separated by ---):
 *
 *   **1. Question text here**
 *
 *   A. Option A
 *   B. Option B
 *   C. Option C
 *   D. Option D
 *
 *   **Correct Answer: C**
 *   **Explanation: explanation text here**
 */
export function parseQuizMarkdown(content: string): QuizQuestion[] {
  // Normalise line endings then split on the exact separator the API uses
  const normalised = content.replace(/\r\n/g, "\n");
  const blocks = normalised.split("\n---\n");
  const questions: QuizQuestion[] = [];
  let id = 1;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // ── 1. Question text ──────────────────────────────────────────────────────
    // Strip the "**N. " prefix with a minimal regex that only touches the prefix,
    // leaving all LaTeX in the question body completely untouched.
    const prefixMatch = /^\*\*\d+\.\s*/.exec(trimmed);
    if (!prefixMatch) continue;
    const afterPrefix = trimmed.slice(prefixMatch[0].length);

    // Question text ends at the first blank line followed by "A." (double newline)
    // or, as a fallback, a single newline before "A.".
    let qEnd = afterPrefix.indexOf("\n\nA.");
    const hasDoubleNl = qEnd !== -1;
    if (!hasDoubleNl) qEnd = afterPrefix.indexOf("\nA.");
    if (qEnd === -1) continue;

    let question = afterPrefix.slice(0, qEnd);
    // Strip the optional closing "**" that wraps the question header
    if (question.endsWith("**")) question = question.slice(0, -2);
    question = question.trim();
    if (!question) continue;

    // ── 2. Options ────────────────────────────────────────────────────────────
    // Inspect every line in the remainder; detect "X. " prefix by checking
    // individual characters — no regex, so LaTeX in the option text is safe.
    const restStart = qEnd + (hasDoubleNl ? 2 : 1); // skip the blank line(s)
    const rest = afterPrefix.slice(restStart);

    const optionMap: Record<string, string> = {};
    for (const line of rest.split("\n")) {
      if (
        line.length > 3 &&
        "ABCD".includes(line[0]) &&
        line[1] === "." &&
        line[2] === " "
      ) {
        // Preserve everything after "X. " verbatim — LaTeX included
        optionMap[line[0]] = line.slice(3);
      }
    }

    const options: { letter: string; text: string }[] = ["A", "B", "C", "D"].map(
      (letter) => ({ letter, text: optionMap[letter] ?? "" })
    );
    if (options.every((o) => o.text === "")) continue;

    // ── 3. Correct answer ─────────────────────────────────────────────────────
    // Find "**Correct Answer:" then read the very next non-space letter.
    const answerTag = "**Correct Answer:";
    const answerIdx = trimmed.indexOf(answerTag);
    let correctAnswer = "A";
    if (answerIdx !== -1) {
      const afterTag = trimmed.slice(answerIdx + answerTag.length).trimStart();
      if (afterTag.length > 0 && "ABCD".includes(afterTag[0].toUpperCase())) {
        correctAnswer = afterTag[0].toUpperCase();
      }
    }

    // ── 4. Explanation ────────────────────────────────────────────────────────
    // Everything after "**Explanation:" to end of block; strip trailing "**".
    let explanation: string | undefined;
    const expTag = "**Explanation:";
    const expIdx = trimmed.indexOf(expTag);
    if (expIdx !== -1) {
      let expText = trimmed.slice(expIdx + expTag.length).trimStart();
      if (expText.endsWith("**")) expText = expText.slice(0, -2);
      explanation = expText.trim() || undefined;
    }

    questions.push({ id: id++, question, options, correctAnswer, explanation });
  }

  console.log("[parseQuizMarkdown] first question:", questions[0]);
  return questions;
}

export async function generateQuiz(courseId: string, forceRegenerate = false, collectionId?: string): Promise<Quiz> {
  const raw = await generateQuizRaw(courseId, forceRegenerate, collectionId);
  return { questions: parseQuizMarkdown(raw.content) };
}

// Chat
// Spec: body {course_id, question} — field is "question" NOT "message"
// Spec: returns {content, cached, content_id}
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  cached: boolean;
  content_id: string;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithCourse(
  courseId: string,
  question: string,
  history: ChatHistoryMessage[] = [],
  collectionId?: string
): Promise<ChatResponse> {
  const body: Record<string, unknown> = { course_id: courseId, question, history };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;
  console.log("[chat] Sending request body:", JSON.stringify(body));
  const response = await apiPost<ChatResponse>(`/ai/chat`, body);
  console.log("[chat] Received response:", JSON.stringify(response));
  return response;
}

async function* readSseStream(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;
      let parsed: { chunk?: string; error?: string } | null = null;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      if (parsed?.error) throw new Error(parsed.error);
      if (parsed?.chunk) yield parsed.chunk;
    }
  }
}

export async function* streamQuiz(courseId: string, collectionId?: string): AsyncGenerator<string> {
  const body: Record<string, unknown> = { course_id: courseId };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;
  const response = await authFetch(`/ai/quiz/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
  yield* readSseStream(response);
}

export async function* streamStudyGuide(
  courseId: string,
  title: string,
  collectionId?: string,
  focusTopics?: string,
  style: "detailed" | "bullet" = "detailed",
): AsyncGenerator<string> {
  const body: Record<string, unknown> = { course_id: courseId, title, style };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;
  if (focusTopics && focusTopics.trim()) body.focus_topics = focusTopics.trim();
  const response = await authFetch(`/ai/study-guide/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
  yield* readSseStream(response);
}

export async function* streamChat(courseId: string, question: string, history: ChatHistoryMessage[] = [], collectionId?: string): AsyncGenerator<string> {
  const body: Record<string, unknown> = { course_id: courseId, question, history };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;
  const response = await authFetch(`/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
  yield* readSseStream(response);
}

export async function saveStudyGuide(courseId: string, title: string, content: string): Promise<StudyGuideSaved> {
  return apiPost<StudyGuideSaved>("/ai/study-guide/save", { course_id: courseId, title, content });
}

// Analytics
export interface UsageStats {
  courses: number;
  materials: number;
  generations: number;
}

export async function getUsageStats(): Promise<UsageStats> {
  return { courses: 0, materials: 0, generations: 0 };
}

// Canvas
// Spec: POST /canvas/connect {canvas_domain, api_token}
//       DELETE /canvas/disconnect
//       GET /canvas/assignments
//       GET /canvas/grades
export async function canvasConnect(canvasDomain: string, token: string): Promise<void> {
  return apiPost<void>("/canvas/connect", { canvas_domain: canvasDomain, api_token: token });
}

export async function canvasDisconnect(): Promise<void> {
  return apiDelete<void>("/canvas/disconnect");
}

export async function getCanvasAssignments<T>(): Promise<T> {
  return apiGet<T>("/canvas/assignments");
}

export async function getCanvasGrades<T>(): Promise<T> {
  return apiGet<T>("/canvas/grades");
}

// Canvas module import

export interface CanvasCourse {
  canvas_id: number;
  name: string;
  course_code: string;
}

export interface CanvasFileItem {
  file_id: number;
  display_name: string;
  size: number;
  content_type: string;
  url?: string;
  item_type: "file" | "link" | "page";
}

export interface CanvasModule {
  module_id: number;
  module_name: string;
  suggested_collection_name: string;
  items: CanvasFileItem[];
}

export interface CanvasLinkItem {
  file_id: number;
  display_name: string;
  url: string;
}

export interface CanvasPageItem {
  file_id: number;
  display_name: string;
  url: string;
}

export interface CanvasImportModule {
  module_id: number;
  collection_name: string;
  file_ids: number[];
  link_items: CanvasLinkItem[];
  page_items: CanvasPageItem[];
}

export interface CanvasImportResult {
  imported: { file_name: string; collection_name: string }[];
  skipped: { file_name: string; reason: string }[];
  failed: { file_name: string; error: string }[];
}

export async function getCanvasCourses(): Promise<CanvasCourse[]> {
  return apiGet<CanvasCourse[]>("/canvas/courses");
}

export async function getCanvasModules(canvasCourseId: number): Promise<CanvasModule[]> {
  return apiGet<CanvasModule[]>(`/canvas/courses/${canvasCourseId}/modules`);
}

export async function importCanvasModules(
  courseId: string,
  canvasCourseId: number,
  modules: CanvasImportModule[],
  overwrite: boolean,
): Promise<CanvasImportResult> {
  return apiPost<CanvasImportResult>("/canvas/import", {
    course_id: courseId,
    canvas_course_id: canvasCourseId,
    modules,
    overwrite,
  });
}

// ============================================================
// Study Events
// ============================================================

export interface StudyEvent {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  event_type: "exam" | "quiz" | "assignment" | "other";
  event_date: string; // ISO date "YYYY-MM-DD"
  notes?: string | null;
  created_at: string;
}

export async function getStudyEvents(courseId: string): Promise<StudyEvent[]> {
  return apiGet<StudyEvent[]>(`/study-plan/events?course_id=${courseId}`);
}

export async function createStudyEvent(
  courseId: string,
  title: string,
  eventType: StudyEvent["event_type"],
  eventDate: string,
  notes?: string,
): Promise<StudyEvent> {
  return apiPost<StudyEvent>("/study-plan/events", {
    course_id: courseId,
    title,
    event_type: eventType,
    event_date: eventDate,
    notes: notes || null,
  });
}

export async function updateStudyEvent(
  eventId: string,
  updates: Partial<Pick<StudyEvent, "title" | "event_type" | "event_date" | "notes">>,
): Promise<StudyEvent> {
  return apiPatch<StudyEvent>(`/study-plan/events/${eventId}`, updates);
}

export async function deleteStudyEvent(eventId: string): Promise<void> {
  return apiDelete<void>(`/study-plan/events/${eventId}`);
}

export async function getEventPlan(eventId: string): Promise<{ content: string | null; created_at?: string }> {
  return apiGet(`/study-plan/events/${eventId}/plan`);
}

export async function* streamEventPlan(
  eventId: string,
  hoursPerDay: number,
  collectionId?: string,
): AsyncGenerator<string> {
  const body: Record<string, unknown> = { event_id: eventId, hours_per_day: hoursPerDay };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;

  const response = await authFetch(`/study-plan/events/${eventId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
  yield* readSseStream(response);
}

// ============================================================
// Flashcards
// ============================================================

export interface FlashcardSet {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  created_at: string;
  flashcard_count?: number;
}

export interface Flashcard {
  id: string;
  set_id: string;
  front: string;
  back: string;
  created_at: string;
}

export async function getFlashcardSets(courseId: string): Promise<FlashcardSet[]> {
  return apiGet<FlashcardSet[]>(`/flashcards/sets?course_id=${courseId}`);
}

export async function getFlashcards(setId: string): Promise<Flashcard[]> {
  return apiGet<Flashcard[]>(`/flashcards/sets/${setId}/cards`);
}

export async function deleteFlashcardSet(setId: string): Promise<void> {
  return apiDelete<void>(`/flashcards/sets/${setId}`);
}

export async function* streamGenerateFlashcards(
  courseId: string,
  title: string,
  collectionId?: string,
): AsyncGenerator<string> {
  const body: Record<string, unknown> = { course_id: courseId, title };
  if (isRealCollectionId(collectionId)) body.collection_id = collectionId;

  const response = await authFetch(`/flashcards/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
  yield* readSseStream(response);
}
