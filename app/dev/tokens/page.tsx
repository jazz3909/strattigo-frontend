/**
 * Token preview — /dev/tokens
 *
 * Renders every design token from the @theme block in app/globals.css so the
 * foundation can be eyeballed against design-system.html before any component
 * is built. Dev reference only; not linked from app navigation.
 */

const SURFACES = [
  { cls: "bg-page", name: "page", hex: "#F4F1E9", role: "App canvas" },
  { cls: "bg-sheet", name: "sheet", hex: "#FBFAF6", role: "Document / panel" },
  { cls: "bg-raised", name: "raised", hex: "#FFFFFF", role: "Cards, inputs" },
  { cls: "bg-sunk", name: "sunk", hex: "#EFEBE1", role: "Tracks, wells, icon tiles" },
];

const INKS = [
  { cls: "bg-ink", name: "ink", hex: "#23211C", role: "Body text, headings" },
  { cls: "bg-ink-soft", name: "ink-soft", hex: "#4A4740", role: "Secondary text" },
  { cls: "bg-ink-faint", name: "ink-faint", hex: "#86827A", role: "Metadata, captions" },
];

const RULES = [
  { cls: "bg-rule", name: "rule", hex: "#E3DED2", role: "Default hairline" },
  { cls: "bg-rule-soft", name: "rule-soft", hex: "#EDE9DF", role: "Soft hairline" },
  { cls: "bg-rule-strong", name: "rule-strong", hex: "#D6D0C2", role: "Input borders" },
];

const ACCENTS = [
  { cls: "bg-accent", name: "accent", hex: "#5E7185", role: "Primary buttons, active states" },
  { cls: "bg-accent-hover", name: "accent-hover", hex: "#4E6072", role: "Button hover" },
  { cls: "bg-accent-deep", name: "accent-deep", hex: "#3B4A5A", role: "Text on tint, links, terms" },
  { cls: "bg-accent-tint", name: "accent-tint", hex: "#E5EAF0", role: "Callouts, active-item bg" },
  { cls: "bg-accent-tint2", name: "accent-tint2", hex: "#D9E1EA", role: "Hover on tint, borders" },
];

const SEMANTICS = [
  { cls: "bg-success", name: "success", hex: "#4E7A57", role: "Right answers, success" },
  { cls: "bg-success-tint", name: "success-tint", hex: "#E6EEE4", role: "Success wash" },
  { cls: "bg-caution", name: "caution", hex: "#9A7B2A", role: "Warnings, pending" },
  { cls: "bg-caution-tint", name: "caution-tint", hex: "#F3EAD5", role: "Caution wash" },
  { cls: "bg-error", name: "error", hex: "#A6503F", role: "Wrong answers, destructive" },
  { cls: "bg-error-tint", name: "error-tint", hex: "#F2E1DA", role: "Error wash" },
];

const SUBJECTS = [
  { cls: "bg-subject-dusk", tintCls: "bg-subject-dusk-tint", name: "dusk", hex: "#5E7185" },
  { cls: "bg-subject-sage", tintCls: "bg-subject-sage-tint", name: "sage", hex: "#6E7F5E" },
  { cls: "bg-subject-ochre", tintCls: "bg-subject-ochre-tint", name: "ochre", hex: "#A07A34" },
  { cls: "bg-subject-clay", tintCls: "bg-subject-clay-tint", name: "clay", hex: "#9E5847" },
  { cls: "bg-subject-plum", tintCls: "bg-subject-plum-tint", name: "plum", hex: "#6E5A7A" },
  { cls: "bg-subject-pine", tintCls: "bg-subject-pine-tint", name: "pine", hex: "#4E7A6E" },
  { cls: "bg-subject-slate", tintCls: "bg-subject-slate-tint", name: "slate", hex: "#38607A" },
  { cls: "bg-subject-terracotta", tintCls: "bg-subject-terracotta-tint", name: "terracotta", hex: "#B06A50" },
  { cls: "bg-subject-moss", tintCls: "bg-subject-moss-tint", name: "moss", hex: "#8A7B4A" },
  { cls: "bg-subject-cocoa", tintCls: "bg-subject-cocoa-tint", name: "cocoa", hex: "#7A5E5A" },
];

const TYPE_ROLES = [
  { label: "Display XL", spec: "Fraunces 600 · 46px", cls: "font-display text-display-xl", sample: "Glycolysis" },
  { label: "Display L", spec: "Fraunces 600 · 34px", cls: "font-display text-display-l", sample: "Study guide title" },
  { label: "Display M", spec: "Fraunces 600 · 25px", cls: "font-display text-display-m", sample: "Section heading" },
  { label: "Display S", spec: "Fraunces 500 · 19px", cls: "font-display text-display-s", sample: "Subsection heading" },
  {
    label: "Read body",
    spec: "Newsreader · 18.5px / 1.72",
    cls: "font-read text-read",
    sample:
      "The reading body face. Set at a comfortable measure with generous line-height, this is what a study guide is actually read in.",
  },
  { label: "Read small", spec: "Newsreader · 16px", cls: "font-read text-read-s", sample: "Secondary reading text, captions inside documents." },
  { label: "UI body", spec: "Outfit · 14px", cls: "font-sans text-ui", sample: "Interface text — labels, list rows, menus, buttons." },
  { label: "UI small", spec: "Outfit · 13px", cls: "font-sans text-ui-s", sample: "Dense metadata, secondary UI." },
  { label: "Eyebrow", spec: "Outfit 600 · 12.5px · .09em", cls: "font-sans text-eyebrow uppercase text-accent-deep", sample: "Study guide · Unit 3" },
];

const RADII = [
  { cls: "rounded-sm", name: "radius-sm", px: "8px", role: "controls" },
  { cls: "rounded-md", name: "radius-md", px: "10px", role: "buttons, inputs" },
  { cls: "rounded-lg", name: "radius-lg", px: "12px", role: "cards" },
  { cls: "rounded-xl", name: "radius-xl", px: "16px", role: "modals, panels" },
  { cls: "rounded-2xl", name: "radius-2xl", px: "20px", role: "hero, feature cards" },
];

function Swatch({ cls, name, hex, role }: { cls: string; name: string; hex: string; role?: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-rule bg-sheet">
      <div className={`h-16 ${cls}`} />
      <div className="px-3 py-2.5">
        <div className="font-sans text-ui-s font-semibold text-ink">{name}</div>
        <div className="font-sans text-[12px] text-ink-faint">{hex}</div>
        {role && <div className="mt-1 font-sans text-[11.5px] leading-snug text-ink-faint">{role}</div>}
      </div>
    </div>
  );
}

function SwatchGrid({ items }: { items: { cls: string; name: string; hex: string; role?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((s) => (
        <Swatch key={s.name} {...s} />
      ))}
    </div>
  );
}

function SectionHead({ num, title, lead }: { num: string; title: string; lead: string }) {
  return (
    <>
      <div className="font-sans text-ui-s font-semibold tracking-[0.08em] text-ink-faint">{num}</div>
      <h2 className="mt-1 font-display text-display-m text-ink">{title}</h2>
      <p className="mt-2 mb-8 max-w-xl font-read text-read-s text-ink-soft">{lead}</p>
    </>
  );
}

/* Density demo block — reads ONLY the density variables, so the same markup
   renders differently under data-density="app" vs "document". */
function DensityDemo() {
  return (
    <div
      className="font-read text-ink"
      style={{ fontSize: "var(--density-body)", lineHeight: "var(--density-leading)" }}
    >
      <p style={{ marginBottom: "var(--density-space)" }}>
        The reactions divide into two phases. The first spends energy to destabilize glucose; the second collects the
        return.
      </p>
      <p>Because two fragments travel through the payoff phase, everything in it happens twice per glucose.</p>
    </div>
  );
}

export default function TokensPreviewPage() {
  return (
    <div className="min-h-screen bg-page font-sans text-ui text-ink">
      <div className="mx-auto max-w-5xl px-6 pb-28 sm:px-10">
        {/* Header */}
        <header className="border-b border-rule pt-16 pb-10">
          <div className="font-sans text-eyebrow uppercase text-accent-deep">Strattigo · Token foundation</div>
          <h1 className="mt-4 font-display text-display-xl text-ink">The system, before the pages</h1>
          <p className="mt-4 max-w-xl font-read text-read text-ink-soft">
            Every token in <code className="font-sans text-ui-s">app/globals.css</code>, rendered for eyeball
            comparison against <code className="font-sans text-ui-s">design-system.html</code>.
          </p>
        </header>

        {/* 01 Color */}
        <section className="border-b border-rule-soft py-12">
          <SectionHead
            num="01"
            title="Color"
            lead="Cream surfaces, warm ink, warm hairlines. Dusk Blue appears only on functional states. Semantic colors are for correctness and system state only."
          />
          <h3 className="mb-4 font-sans text-ui-s font-semibold uppercase tracking-[0.04em] text-ink-faint">Surfaces</h3>
          <SwatchGrid items={SURFACES} />
          <h3 className="mt-9 mb-4 font-sans text-ui-s font-semibold uppercase tracking-[0.04em] text-ink-faint">Ink</h3>
          <SwatchGrid items={INKS} />
          <h3 className="mt-9 mb-4 font-sans text-ui-s font-semibold uppercase tracking-[0.04em] text-ink-faint">Rules</h3>
          <SwatchGrid items={RULES} />
          <h3 className="mt-9 mb-4 font-sans text-ui-s font-semibold uppercase tracking-[0.04em] text-ink-faint">
            Accent — Dusk Blue (functional only)
          </h3>
          <SwatchGrid items={ACCENTS} />
          <h3 className="mt-9 mb-4 font-sans text-ui-s font-semibold uppercase tracking-[0.04em] text-ink-faint">
            Semantic — states only
          </h3>
          <SwatchGrid items={SEMANTICS} />
        </section>

        {/* 02 Subject colors */}
        <section className="border-b border-rule-soft py-12">
          <SectionHead
            num="02"
            title="Subject colors"
            lead="Course identity only — shelf spines, course tiles, the picker. Never buttons, states, or links. Each hue with its tint wash."
          />
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            {SUBJECTS.map((s) => (
              <div key={s.name} className="overflow-hidden rounded-md border border-rule bg-sheet">
                <div className={`h-12 ${s.cls}`} />
                <div className={`h-6 ${s.tintCls}`} />
                <div className="px-3 py-2.5">
                  <div className="font-sans text-ui-s font-semibold text-ink">subject-{s.name}</div>
                  <div className="font-sans text-[12px] text-ink-faint">{s.hex} + tint</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 03 Type */}
        <section className="border-b border-rule-soft py-12">
          <SectionHead
            num="03"
            title="Typography"
            lead="Three families, three jobs. Fraunces for headings, Newsreader for long-form reading, Outfit for quiet UI."
          />
          {TYPE_ROLES.map((t) => (
            <div key={t.label} className="flex items-baseline gap-5 border-b border-rule-soft py-4">
              <div className="w-36 shrink-0 font-sans text-[12px] leading-snug text-ink-faint">
                <b className="block font-semibold text-ink-soft">{t.label}</b>
                {t.spec}
              </div>
              <div className={`min-w-0 ${t.cls}`}>{t.sample}</div>
            </div>
          ))}
        </section>

        {/* 04 Radii */}
        <section className="border-b border-rule-soft py-12">
          <SectionHead num="04" title="Radii" lead="Five steps, from controls to hero panels." />
          <div className="flex flex-wrap items-end gap-6">
            {RADII.map((r) => (
              <div key={r.name} className="text-center">
                <div className={`h-24 w-32 border border-rule-strong bg-raised ${r.cls}`} />
                <div className="mt-2.5 font-sans text-ui-s font-semibold text-ink">{r.name}</div>
                <div className="font-sans text-[12px] text-ink-faint">
                  {r.px} · {r.role}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 05 Density */}
        <section className="py-12">
          <SectionHead
            num="05"
            title="Two densities"
            lead="Identical markup under each mode — only the data-density attribute on the wrapper changes. App is the default; document is for the study-guide reader and quiz review only."
          />
          <div className="grid gap-6 md:grid-cols-2">
            <div data-density="app" className="overflow-hidden rounded-lg border border-rule bg-sheet">
              <div className="flex items-baseline gap-2.5 border-b border-rule-soft px-4 py-3">
                <b className="font-display text-read-s font-medium text-ink">App</b>
                <span className="font-sans text-[12px] text-ink-faint">
                  default · materials · chat · lists · 14px / 1.5 / 12px rhythm
                </span>
              </div>
              <div className="p-[var(--density-pad)]">
                <DensityDemo />
              </div>
            </div>
            <div data-density="document" className="overflow-hidden rounded-lg border border-rule bg-sheet">
              <div className="flex items-baseline gap-2.5 border-b border-rule-soft px-4 py-3">
                <b className="font-display text-read-s font-medium text-ink">Document</b>
                <span className="font-sans text-[12px] text-ink-faint">
                  guides · quiz review · 18.5px / 1.72 / 22px rhythm · 660px measure
                </span>
              </div>
              <div className="max-w-(--density-measure) p-6">
                <DensityDemo />
              </div>
            </div>
          </div>
          <p className="mt-6 font-read text-read-s italic text-ink-faint">
            Note: density variables cascade — components inside a wrapper inherit its mode and never pick density
            themselves.
          </p>
        </section>
      </div>
    </div>
  );
}
