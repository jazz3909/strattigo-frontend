import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav, PublicBody, PublicHead } from "@/components/public/public-shell";
import { PublicFooter } from "@/components/public/public-footer";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — Strattigo",
  description:
    "Questions, bugs, ideas — get in touch with the Strattigo team. We read everything.",
};

const CONTACT_EMAIL = "zomirj2@gmail.com";

/**
 * Public contact page — quiet framed-sheet treatment like /terms and
 * /privacy (PublicNav + PublicBody on the page canvas), ending in the
 * shared PublicFooter. The form itself is the client island.
 */
export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-page font-sans text-ink">
      <div className="w-full px-4 sm:px-6">
        <PublicNav>
          <Link
            href="/"
            className="text-ui font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Back to site
          </Link>
        </PublicNav>

        <PublicBody>
          <PublicHead eyebrow="Contact" title="Get in touch.">
            Questions, bugs, ideas — we read everything.
          </PublicHead>

          <div className="mx-auto max-w-[560px]">
            <div className="mb-8 rounded-lg border border-rule bg-raised px-5 py-4 text-center">
              <p className="font-read text-[15.5px] text-ink-soft">
                Prefer email? Write us directly at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-accent-deep hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>

            <ContactForm />
          </div>
        </PublicBody>
      </div>

      <div className="flex-1" />
      <div className="mt-14">
        <PublicFooter />
      </div>
    </div>
  );
}
