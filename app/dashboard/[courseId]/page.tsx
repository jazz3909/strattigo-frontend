import { redirect } from "next/navigation";

/**
 * The old dark course workspace (in-page tabs) is retired — every view lives
 * at its own cream route. This index only routes: the bare course URL lands on
 * Chat (the workspace default), and legacy ?tab= deep links map to the
 * matching cream route. Study Plan / Flashcards have no cream surface yet
 * (dormant — see dormant-views.tsx), so their old tabs also land on Chat.
 */
const TAB_ROUTES: Record<string, string> = {
  chat: "chat",
  "study-guide": "guides",
  quiz: "quizzes",
  materials: "materials",
};

export default async function CourseIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { courseId } = await params;
  const { tab, scope } = await searchParams;
  const segment = (typeof tab === "string" && TAB_ROUTES[tab]) || "chat";
  const scopeQuery =
    typeof scope === "string" && scope ? `?scope=${encodeURIComponent(scope)}` : "";
  redirect(`/dashboard/${encodeURIComponent(courseId)}/${segment}${scopeQuery}`);
}
