"use client";

import React from "react";
import { InlineMath, BlockMath } from "react-katex";
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

function MathFallback({ formula }: { formula: string }) {
  return <code className="text-xs text-slate-500">{formula}</code>;
}

function RenderSegment({ seg }: { seg: Segment }) {
  if (seg.type === "block-math") {
    return (
      <div className="my-2">
        <React.Suspense fallback={<MathFallback formula={seg.value} />}>
          <BlockMathSafe formula={seg.value} />
        </React.Suspense>
      </div>
    );
  }
  if (seg.type === "inline-math") {
    return (
      <React.Suspense fallback={<MathFallback formula={seg.value} />}>
        <InlineMathSafe formula={seg.value} />
      </React.Suspense>
    );
  }
  // Plain text segment — render with markdown
  return (
    <span dangerouslySetInnerHTML={{ __html: renderMarkdown(seg.value) }} />
  );
}

class MathErrorBoundary extends React.Component<
  { formula: string; block: boolean; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <MathFallback formula={this.props.formula} />;
    }
    return this.props.children;
  }
}

function BlockMathSafe({ formula }: { formula: string }) {
  return (
    <MathErrorBoundary formula={formula} block>
      <BlockMath math={formula} />
    </MathErrorBoundary>
  );
}

function InlineMathSafe({ formula }: { formula: string }) {
  return (
    <MathErrorBoundary formula={formula} block={false}>
      <InlineMath math={formula} />
    </MathErrorBoundary>
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
