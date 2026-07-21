import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge doesn't know the project's @theme font-size tokens
 * (--text-ui, --text-read-s, …), so it classified `text-ui` etc. into the
 * text-COLOR group and dropped whichever text color preceded them in the
 * class list. Concretely: every Button variant's text color was silently
 * stripped by the size's `text-ui` (primary rendered inherited ink instead
 * of white, secondary inherited ink instead of ink-soft). Registering the
 * size tokens in the font-size group keeps text-<size> and text-<color>
 * orthogonal, as in stock Tailwind.
 *
 * If a new --text-* size token is added to @theme, add it here too.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-l",
            "display-m",
            "display-s",
            "eyebrow",
            "read",
            "read-s",
            "ui",
            "ui-s",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
