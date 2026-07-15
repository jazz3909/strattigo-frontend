import { GuideMarkdown } from "@/app/components/ui/GuideMarkdown";

/**
 * GuideDocument — the ONE rendering of a study-guide document.
 *
 * Deliberately the single path for BOTH the live streaming preview and the
 * saved-guide reader: they pass the same `content` here, so a guide is
 * byte-for-byte identical while generating and after save (same article shell,
 * same equal-gutter full-width layout, same GuideMarkdown pipeline + .reader-doc
 * document typography). Nothing else renders guide content — do not add a
 * second path.
 */
export function GuideDocument({
  scopeName,
  title,
  subtitle,
  style,
  readingMinutes,
  savedDate,
  streaming,
  statusMessage,
  content,
}: {
  scopeName: string;
  title: string;
  subtitle?: string;
  /** Known only while generating; saved guides don't persist it. */
  style: "detailed" | "bullet" | null;
  readingMinutes: number | null;
  savedDate: string | null;
  streaming: boolean;
  statusMessage: string;
  content: string;
}) {
  return (
    <article data-density="document" className="w-full px-14 pt-14 pb-32 max-md:px-5 max-md:pt-8">
      <div className="mb-[18px] font-sans text-eyebrow font-semibold uppercase tracking-[0.09em] text-accent-deep">
        Study guide{scopeName ? ` · ${scopeName}` : ""}
      </div>
      <h1 className="mb-5 font-display text-[40px] font-semibold leading-[1.12] tracking-[-0.012em] text-ink max-md:text-[31px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mb-6 font-read text-[18px] leading-[1.55] text-ink-soft">{subtitle}</p>
      )}
      <div className="mb-11 flex flex-wrap items-center gap-x-3.5 gap-y-1 border-b border-rule pb-[30px] font-sans text-ui-s text-ink-faint">
        {style && (
          <>
            <span>{style === "detailed" ? "Detailed" : "Bullet"} style</span>
            <BylineDot />
          </>
        )}
        {scopeName && (
          <>
            <span>Scoped to {scopeName}</span>
            <BylineDot />
          </>
        )}
        {readingMinutes != null && <span>{readingMinutes} min read</span>}
        {savedDate && (
          <>
            <BylineDot />
            <span>Saved {savedDate}</span>
          </>
        )}
        {streaming && (
          <>
            <BylineDot />
            <span className="text-accent-deep">Generating…</span>
          </>
        )}
      </div>

      {content ? (
        <>
          <GuideMarkdown content={content} />
          {streaming && <span className="streaming-cursor text-accent" />}
        </>
      ) : streaming ? (
        <div className="flex items-center gap-3 py-4 font-sans text-ui text-ink-faint">
          <span className="flex gap-1">
            <Dot delay="0ms" />
            <Dot delay="160ms" />
            <Dot delay="320ms" />
          </span>
          <span>{statusMessage}</span>
        </div>
      ) : null}
    </article>
  );
}

function BylineDot() {
  return <span aria-hidden="true" className="size-[3px] rounded-full bg-ink-faint" />;
}

function Dot({ delay }: { delay: string }) {
  return <span className="typing-dot" style={{ animationDelay: delay }} />;
}
