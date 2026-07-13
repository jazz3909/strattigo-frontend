import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Callout } from "@/components/ui/callout"
import { Card } from "@/components/ui/card"
import { Input, Textarea } from "@/components/ui/input"
import { Pill } from "@/components/ui/pill"

/**
 * Primitive preview — /dev/components
 *
 * Every Tier-1 primitive in every variant, for eyeball comparison against
 * design-system.html §04. Dev reference only; sibling of /dev/tokens.
 */

function SectionHead({ num, title, lead }: { num: string; title: string; lead: string }) {
  return (
    <>
      <div className="font-sans text-ui-s font-semibold tracking-[0.08em] text-ink-faint">{num}</div>
      <h2 className="mt-1 font-display text-display-m text-ink">{title}</h2>
      <p className="mt-2 mb-8 max-w-xl font-read text-read-s text-ink-soft">{lead}</p>
    </>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-rule bg-sheet p-[22px]">
      <div className="mb-4 font-sans text-[11.5px] font-semibold tracking-[0.07em] uppercase text-ink-faint">
        {label}
      </div>
      {children}
    </div>
  )
}

export default function ComponentsPreviewPage() {
  return (
    <div className="min-h-screen bg-page font-sans text-ui text-ink">
      <div className="mx-auto max-w-5xl px-6 pb-28 sm:px-10">
        <header className="border-b border-rule pt-16 pb-10">
          <div className="font-sans text-eyebrow uppercase text-accent-deep">
            Strattigo · Tier-1 primitives
          </div>
          <h1 className="mt-4 font-display text-display-xl text-ink">Core components</h1>
          <p className="mt-4 max-w-xl font-read text-read text-ink-soft">
            The shared vocabulary every page is built from. Compare against{" "}
            <code className="font-sans text-ui-s">design-system.html</code> — tokens live at{" "}
            <Link href="/dev/tokens" className="text-accent-deep underline underline-offset-2">
              /dev/tokens
            </Link>
            .
          </p>
        </header>

        {/* 01 Button */}
        <section className="border-b border-rule-soft py-12">
          <SectionHead
            num="01"
            title="Button"
            lead="Four variants, two sizes. One primary per view maximum — siblings use secondary or ghost."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Cell label="Variants">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary">Generate guide</Button>
                <Button variant="secondary">Cancel</Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <Button variant="ghost">Bullet view</Button>
                <Button variant="danger">Delete</Button>
              </div>
            </Cell>
            <Cell label="Sizes · icon · disabled">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="primary" size="lg">
                  Start free
                </Button>
                <Button variant="primary">
                  <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add course
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <Button variant="primary" disabled>
                  Generating…
                </Button>
                <Button variant="secondary" disabled>
                  Cancel
                </Button>
              </div>
            </Cell>
          </div>
        </section>

        {/* 02 Input */}
        <section className="border-b border-rule-soft py-12">
          <SectionHead
            num="02"
            title="Input / Textarea"
            lead="Raised field on a hairline border. Focus is border-accent plus a 3px accent-tint halo. Textarea reads in the serif."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Cell label="Input · label · counter">
              <Input label="Course name" placeholder="Biochemistry 301" />
              <div className="h-4" />
              <Input
                label="Course name"
                counter="18 / 100"
                defaultValue="Biochemistry 301"
                maxLength={100}
              />
              <div className="h-4" />
              <Input placeholder="No label — bare control" aria-label="Bare control" />
            </Cell>
            <Cell label="Textarea · disabled">
              <Textarea
                label={
                  <>
                    Description <span className="font-normal text-ink-faint">· optional</span>
                  </>
                }
                rows={3}
                placeholder="Metabolism, enzymes, and the pathways that power the cell."
              />
              <div className="h-4" />
              <Input label="Disabled" disabled placeholder="Can't touch this" />
            </Cell>
          </div>
        </section>

        {/* 03 Card */}
        <section className="border-b border-rule-soft py-12">
          <SectionHead
            num="03"
            title="Card"
            lead="The neutral bounded container — surface, hairline, radius, padding. Everything else is composed at the call site."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <div className="mb-3.5 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-[9px] bg-accent font-display text-[17px] font-semibold text-white">
                  B
                </div>
                <div>
                  <div className="font-display text-read-s font-medium text-ink">Biochemistry 301</div>
                  <div className="text-ui-s text-ink-faint">24 materials · updated today</div>
                </div>
              </div>
              <p className="mb-3.5 font-read text-[15px] leading-normal text-ink-soft">
                Metabolism, enzymes, and the pathways that power the cell.
              </p>
              <div className="flex items-center gap-2 text-ui-s font-medium text-accent-deep">
                Study now →
              </div>
            </Card>
            <Card className="grid place-items-center text-ui-s text-ink-faint">
              Empty card — just the container
            </Card>
          </div>
        </section>

        {/* 04 Pill */}
        <section className="border-b border-rule-soft py-12">
          <SectionHead
            num="04"
            title="Pill / Badge"
            lead="Small status labels. Text on a tint always uses the matching deep or role color, never plain ink."
          />
          <Cell label="All variants">
            <div className="flex flex-wrap items-center gap-2.5">
              <Pill variant="accent">Scoped</Pill>
              <Pill variant="success">Correct</Pill>
              <Pill variant="caution">Generating</Pill>
              <Pill variant="error">Wrong</Pill>
              <Pill variant="neutral">Unit 3</Pill>
            </div>
          </Cell>
        </section>

        {/* 05 Callout */}
        <section className="py-12">
          <SectionHead
            num="05"
            title="Callout"
            lead="Tinted key-info boxes for guides, quiz explanations, and chat. Separation by tint — never a border."
          />
          <div className="flex max-w-xl flex-col gap-3">
            <Callout variant="accent" label="Key idea">
              Glycolysis nets 2 ATP and 2 NADH per glucose.
            </Callout>
            <Callout variant="success" label="Correct">
              Phosphofructokinase is the committed step.
            </Callout>
            <Callout variant="error" label="Not quite">
              That&apos;s the payoff phase, not the prep phase.
            </Callout>
            <Callout variant="accent">Label is optional — body-only callout.</Callout>
          </div>
        </section>
      </div>
    </div>
  )
}
