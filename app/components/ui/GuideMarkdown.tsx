"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { cn } from "@/lib/utils";

/**
 * The ONE markdown pipeline (react-markdown + remark-gfm + remark-math +
 * remark-breaks + rehype-katex): **bold**, headings, lists, tables and $math$
 * all render as proper elements — not the minimal regex pass of
 * MarkdownWithMath. remark-breaks keeps single source newlines as tight line
 * breaks instead of collapsing to a run-on.
 *
 * Two density wrappers share it — parsing is identical everywhere; only the
 * CSS scope differs:
 * - GuideMarkdown → .reader-doc: document typography for the study-guide
 *   reader (serif body, Fraunces heads, formula blocks). globals.css.
 * - AppMarkdown → .app-md: app density for compact working surfaces (quiz
 *   prompts/options/explanations, chat). Typography inherits from the parent;
 *   the class only adds block rhythm + inline treatments.
 *
 * MarkdownWithMath still backs the old inline chat surface; new surfaces use
 * AppMarkdown.
 */
function MarkdownPipeline({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  );
}

/** Document density — the study-guide reader. `isStreaming` adds the shared
    stream treatment (caret on the last block, per-block fade-in). */
export function GuideMarkdown({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <div className={cn("reader-doc", isStreaming && "stream-md")}>
      <MarkdownPipeline content={content} />
    </div>
  );
}

/** App density — quiz and other compact surfaces. Typography inherits. */
export function AppMarkdown({
  content,
  className,
  isStreaming,
}: {
  content: string;
  className?: string;
  isStreaming?: boolean;
}) {
  return (
    <div className={cn("app-md", isStreaming && "stream-md", className)}>
      <MarkdownPipeline content={content} />
    </div>
  );
}
