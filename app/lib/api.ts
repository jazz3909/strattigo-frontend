export const API_BASE = "http://45.79.221.129:8000";

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
      const err = await res.json();
      message = err.detail || err.message || message;
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

// AI Features
// All AI endpoints return {content, cached, content_id}

export interface AiResponse {
  content: string;
  cached: boolean;
  content_id: string;
}

export async function generateStudyGuide(courseId: string): Promise<AiResponse> {
  return apiPost<AiResponse>(`/ai/study-guide`, { course_id: courseId });
}

export async function generateStudyPlan(courseId: string, examDate?: string): Promise<AiResponse> {
  return apiPost<AiResponse>(`/ai/study-plan`, { course_id: courseId, exam_date: examDate });
}

// Quiz: returns {content, cached, content_id} where content is raw markdown
export async function generateQuizRaw(courseId: string): Promise<AiResponse> {
  return apiPost<AiResponse>(`/ai/quiz`, { course_id: courseId });
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer?: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

/**
 * Parses raw quiz markdown into structured QuizQuestion[].
 * Expected format:
 *   **1. Question text**
 *   A. option one
 *   B. option two
 *   C. option three
 *   D. option four
 *   Answer: A   (optional)
 */
export function parseQuizMarkdown(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const lines = content.split("\n");

  let currentQuestion: string | null = null;
  let currentOptions: string[] = [];
  let currentAnswer: string | undefined;

  function flush() {
    if (currentQuestion) {
      questions.push({
        question: currentQuestion,
        options: currentOptions,
        answer: currentAnswer,
      });
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match question line: **1. Question text** or **1. Question text
    const questionMatch = trimmed.match(/^\*\*\d+\.\s+(.+?)\*?\*?$/);
    if (questionMatch) {
      flush();
      currentQuestion = questionMatch[1].replace(/\*+$/, "").trim();
      currentOptions = [];
      currentAnswer = undefined;
      continue;
    }

    // Match option line: A. option text
    const optionMatch = trimmed.match(/^([A-D])\.\s+(.+)$/);
    if (optionMatch && currentQuestion !== null) {
      currentOptions.push(`${optionMatch[1]}. ${optionMatch[2]}`);
      continue;
    }

    // Match answer line: Answer: A, Correct: B, **Answer: A**, etc.
    const answerMatch = trimmed.match(/^\*?\*?(?:correct\s+)?answer[:\s]\*?\*?\s*([A-D])/i);
    if (answerMatch && currentQuestion !== null) {
      const letter = answerMatch[1].toUpperCase();
      const matchingOption = currentOptions.find((o) => o.startsWith(`${letter}.`));
      currentAnswer = matchingOption || letter;
    }
  }

  flush();
  return questions;
}

export async function generateQuiz(courseId: string): Promise<Quiz> {
  const raw = await generateQuizRaw(courseId);
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
