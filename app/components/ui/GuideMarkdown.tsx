"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * GuideMarkdown — the study-guide reader's document renderer.
 *
 * A real markdown pipeline (react-markdown + remark-gfm + remark-math +
 * remark-breaks + rehype-katex) so **bold**, headings, lists, paragraphs,
 * tables and $math$ all render as proper block elements — not the minimal regex
 * pass of MarkdownWithMath, which emitted no <p> wrappers and left bold as
 * literal asterisks. remark-breaks keeps single source newlines as tight line
 * breaks (label lines stay on their own line) instead of collapsing to a
 * run-on. Output is plain semantic HTML; the document typography (serif body,
 * paragraph rhythm, h2/h3 treatment, display-math → formula block) comes from
 * the .reader-doc styles in globals.css.
 *
 * Scoped to the reader on purpose: MarkdownWithMath still backs the inline chat
 * and quiz surfaces, which rely on its current inline behavior.
 */
export function GuideMarkdown({ content }: { content: string }) {
  return (
    <div className="reader-doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
