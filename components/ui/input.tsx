import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Strattigo input / textarea — design-system.html §04.
 * Optional label row (label left, char-counter right — see the Add Course
 * modal in dashboard.html). Focus is border-accent + a 3px accent-tint halo,
 * no outline. Textarea reads in the serif (font-read) and never resizes.
 */

const fieldClasses =
  "w-full rounded-sm border border-rule-strong bg-raised px-3 py-2.5 font-sans text-ui text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-tint)] disabled:pointer-events-none disabled:opacity-50"

function FieldLabelRow({
  htmlFor,
  label,
  counter,
}: {
  htmlFor: string
  label: React.ReactNode
  counter?: React.ReactNode
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="font-sans text-ui-s font-medium text-ink-soft"
      >
        {label}
      </label>
      {counter != null && (
        <span className="font-sans text-ui-s text-ink-faint">{counter}</span>
      )}
    </div>
  )
}

interface InputProps extends React.ComponentProps<"input"> {
  /** Optional label rendered above the control, associated via htmlFor. */
  label?: React.ReactNode
  /** Optional char counter (e.g. "18 / 100") on the right of the label row. */
  counter?: React.ReactNode
}

function Input({ className, label, counter, id, ...props }: InputProps) {
  const autoId = React.useId()
  const inputId = id ?? autoId

  const control = (
    <input
      id={inputId}
      data-slot="input"
      className={cn(fieldClasses, className)}
      {...props}
    />
  )

  if (label == null) return control
  return (
    <div>
      <FieldLabelRow htmlFor={inputId} label={label} counter={counter} />
      {control}
    </div>
  )
}

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: React.ReactNode
  counter?: React.ReactNode
}

function Textarea({ className, label, counter, id, ...props }: TextareaProps) {
  const autoId = React.useId()
  const inputId = id ?? autoId

  const control = (
    <textarea
      id={inputId}
      data-slot="textarea"
      className={cn(fieldClasses, "resize-none font-read leading-normal", className)}
      {...props}
    />
  )

  if (label == null) return control
  return (
    <div>
      <FieldLabelRow htmlFor={inputId} label={label} counter={counter} />
      {control}
    </div>
  )
}

export { Input, Textarea }
