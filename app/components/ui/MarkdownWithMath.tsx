"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// Split content into segments: math (inline/block) vs plain text
type Segment =
  | { type: "block-math"; value: string }
  | { type: "inline-math"; value: string }
  | { type: "text"; value: string };

function splitMath(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match $$...$$ first, then $...$
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", value: text.slice(last, match.index) });
    }
    const raw = match[1];
    if (raw.startsWith("$$")) {
      segments.push({ type: "block-math", value: raw.slice(2, -2).trim() });
    } else {
      segments.push({ type: "inline-math", value: raw.slice(1, -1).trim() });
    }
    last = match.index + raw.length;
  }

  if (last < text.length) {
    segments.push({ type: "text", value: text.slice(last) });
  }

  return segments;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<ul><li>$1</li></ul>")
    .replace(/^(\d+)\. (.+)$/gm, "<ol><li>$2</li></ol>");
}

function renderKatex(formula: string, displayMode: boolean): string {
  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      // output: 'html' prevents MathML from being emitted alongside the HTML.
      // Without this, KaTeX 0.16 defaults to 'htmlAndMathml', and browsers
      // without native MathML support render the MathML as raw text (e.g.
      // "x ˉ") alongside the HTML output, causing visible duplication.
      output: "html",
      strict: false,
    });
  } catch (e) {
    console.error("[KaTeX] render error for formula:", formula, e);
    return `<code>${formula}</code>`;
  }
}

function RenderSegment({ seg }: { seg: Segment }) {
  if (seg.type === "block-math") {
    const html = renderKatex(seg.value, true);
    return (
      <div
        className="my-2 overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  if (seg.type === "inline-math") {
    const html = renderKatex(seg.value, false);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }
  // Plain text segment — render with markdown
  return (
    <span dangerouslySetInnerHTML={{ __html: renderMarkdown(seg.value) }} />
  );
}

export function MarkdownWithMath({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const segments = splitMath(content);
  return (
    <div className={className}>
      {segments.map((seg, i) => (
        <RenderSegment key={i} seg={seg} />
      ))}
    </div>
  );
}
