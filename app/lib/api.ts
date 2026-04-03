export const API_BASE = "/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("strattigo_token");
}

export function setToken(token: string): void {
  localStorage.setItem("strattigo_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("strattigo_token");
  localStorage.removeItem("strattigo_user_id");
  localStorage.removeItem("strattigo_email");
}

export function setUser(userId: string, email: string): void {
  localStorage.setItem("strattigo_user_id", userId);
  localStorage.setItem("strattigo_email", email);
}

export function getEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("strattigo_email");
}

function handle401(): never {
  clearToken();
  if (typeof window !== "undefined") {
    document.cookie = "strattigo_token=; path=/; max-age=0";
    window.location.href = "/login";
  }
  throw new Error("Session expired. Please log in again.");
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

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    handle401();
  }

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

export async function apiGet<T>(path: string, auth = true): Promise<T> {
  return request<T>(path, { method: "GET" }, auth);
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
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (res.status === 401) {
    handle401();
  }

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

// AI Features
// All AI endpoints return {content, cached, content_id}

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

export async function getSavedStudyGuides(courseId: string): Promise<StudyGuideSaved[]> {
  return apiGet<StudyGuideSaved[]>(`/ai/study-guides/${courseId}`);
}

export async function generateStudyGuide(courseId: string, title: string, forceRegenerate = false): Promise<AiResponse> {
  const path = forceRegenerate ? `/ai/study-guide?force_regenerate=true` : `/ai/study-guide`;
  return apiPost<AiResponse>(path, { course_id: courseId, title });
}

export async function deleteStudyGuide(contentId: string): Promise<void> {
  return apiDelete<void>(`/ai/study-guide/${contentId}`);
}

export async function generateStudyPlan(courseId: string, examDate?: string, forceRegenerate = false): Promise<AiResponse> {
  const path = forceRegenerate ? `/ai/study-plan?force_regenerate=true` : `/ai/study-plan`;
  return apiPost<AiResponse>(path, { course_id: courseId, exam_date: examDate });
}

// Quiz: returns {content, cached, content_id} where content is raw markdown
export async function generateQuizRaw(courseId: string, forceRegenerate = false): Promise<AiResponse> {
  const path = forceRegenerate ? `/ai/quiz?force_regenerate=true` : `/ai/quiz`;
  return apiPost<AiResponse>(path, { course_id: courseId });
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

    // Question: first line is "**N. Question text**" — capture everything after "N. " up to the closing "**"
    const questionMatch = trimmed.match(/^\*\*\d+\.\s+([\s\S]+?)\*\*/);
    if (!questionMatch) continue;
    const question = questionMatch[1].trim();
    if (!question) continue;

    // Options: lines that start with "A. " / "B. " / "C. " / "D. "
    const optionMap: Record<string, string> = {};
    for (const line of trimmed.split("\n")) {
      const m = line.match(/^([A-D])\.\s+(.+)$/);
      if (m) optionMap[m[1]] = m[2].trim();
    }
    const options: { letter: string; text: string }[] = ["A", "B", "C", "D"].map((letter) => ({
      letter,
      text: optionMap[letter] ?? "",
    }));
    if (options.every((o) => o.text === "")) continue;

    // Correct answer: single letter from "**Correct Answer: X**"
    const answerMatch = trimmed.match(/\*\*Correct Answer:\s*([A-D])\*\*/i);
    const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : "A";

    // Explanation: text after "**Explanation:" up to the closing "**" or end of block
    let explanation: string | undefined;
    const expMatch = trimmed.match(/\*\*Explanation:\s*([\s\S]+?)(\*\*|$)/i);
    if (expMatch) explanation = expMatch[1].trim();

    questions.push({ id: id++, question, options, correctAnswer, explanation });
  }

  console.log("[parseQuizMarkdown] first question:", questions[0]);
  return questions;
}

export async function generateQuiz(courseId: string, forceRegenerate = false): Promise<Quiz> {
  const raw = await generateQuizRaw(courseId, forceRegenerate);
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

export async function chatWithCourse(
  courseId: string,
  question: string
): Promise<ChatResponse> {
  const body = { course_id: courseId, question };
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

export async function* streamStudyGuide(courseId: string, title: string): AsyncGenerator<string> {
  const token = getToken();
  const response = await fetch(`${API_BASE}/ai/study-guide/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ course_id: courseId, title }),
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      document.cookie = "strattigo_token=; path=/; max-age=0";
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) throw new Error(`Stream failed: ${response.status}`);
  yield* readSseStream(response);
}

export async function* streamChat(courseId: string, question: string): AsyncGenerator<string> {
  const token = getToken();
  const response = await fetch(`${API_BASE}/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ course_id: courseId, question }),
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      document.cookie = "strattigo_token=; path=/; max-age=0";
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

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
