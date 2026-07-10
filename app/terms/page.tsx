/*
  ══════════════════════════════════════════════════════════════════════════
  ⚠️  AI-GENERATED TEMPLATE — NOT LEGAL ADVICE
  This Terms of Service page was drafted by an AI as a starting point. It
  MUST be reviewed by the founder and, ideally, a qualified attorney before
  it is relied upon. Search this file for "[PLACEHOLDER:" to find the values
  that must be filled in before publishing:
    - Effective date
    - Company legal name (appears twice: §1 and §13)
    - Governing law jurisdiction (state/country)
    - Contact email
  ══════════════════════════════════════════════════════════════════════════
*/
import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalToc, LegalSection, Placeholder } from "../components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — Strattigo",
  description: "The terms and conditions that govern your use of Strattigo, the AI-powered study partner.",
};

const SECTIONS = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "service", label: "Description of the Service" },
  { id: "accounts", label: "Accounts & Eligibility" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "your-content", label: "Your Content & License to Us" },
  { id: "our-ip", label: "Our Intellectual Property" },
  { id: "ai-disclaimer", label: "AI-Generated Content" },
  { id: "billing", label: "Subscriptions & Billing" },
  { id: "termination", label: "Termination" },
  { id: "warranty", label: "Disclaimer of Warranties" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "changes", label: "Changes to These Terms" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Terms of Service"
      intro={
        <>
          <p>
            <strong>Effective date:</strong> <Placeholder>Effective date</Placeholder>
          </p>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Strattigo — the
            website, applications, and services that help you turn your course materials into study
            guides, quizzes, and AI-assisted study sessions (together, the &ldquo;Service&rdquo;). Please read
            them carefully. Our <Link href="/privacy">Privacy Policy</Link> explains how we handle your
            data and forms part of these Terms.
          </p>
        </>
      }
    >
      <LegalToc items={SECTIONS} />

      <LegalSection id="acceptance" number={1} title="Acceptance of Terms">
        <p>
          By creating an account, or by accessing or using the Service, you agree to be bound by
          these Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do
          not use the Service. The Service is operated by{" "}
          <Placeholder>Company legal name</Placeholder> (&ldquo;Strattigo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
        </p>
      </LegalSection>

      <LegalSection id="service" number={2} title="Description of the Service">
        <p>
          Strattigo is an AI-powered study tool. You upload your course materials — such as PDFs,
          lecture slides, and documents — and the Service processes and stores them so it can
          generate study guides, practice quizzes, and study plans, and answer your questions
          through an AI chat grounded in those materials. We may add, change, or remove features of
          the Service over time.
        </p>
      </LegalSection>

      <LegalSection id="accounts" number={3} title="Accounts & Eligibility">
        <p>
          You must be at least 13 years old to use the Service. If you are under the age of
          majority where you live, you may use the Service only with the consent of a parent or
          legal guardian who agrees to these Terms on your behalf.
        </p>
        <p>When you create an account, you agree to:</p>
        <ul>
          <li>provide accurate account information, including a valid email address;</li>
          <li>keep your login credentials confidential and not share your account with others;</li>
          <li>notify us promptly if you suspect unauthorized use of your account; and</li>
          <li>accept responsibility for all activity that occurs under your account.</li>
        </ul>
      </LegalSection>

      <LegalSection id="acceptable-use" number={4} title="Acceptable Use">
        <p>You agree not to misuse the Service. In particular, you will not:</p>
        <ul>
          <li>
            upload materials you do not have the right to use — for example, textbooks, test banks,
            or other copyrighted works distributed in violation of the rights holder&rsquo;s terms;
          </li>
          <li>
            use the Service to cheat on exams or otherwise violate your school&rsquo;s academic
            integrity policies — Strattigo is a study aid, not a substitute for doing your own work;
          </li>
          <li>
            reverse-engineer, decompile, scrape, or attempt to extract the source code, models, or
            underlying data of the Service;
          </li>
          <li>
            probe, disrupt, or circumvent the Service&rsquo;s security, rate limits, or usage
            restrictions, or access it by automated means other than interfaces we provide;
          </li>
          <li>upload malware or content that is unlawful, harassing, or harmful to others; or</li>
          <li>resell, sublicense, or provide the Service to third parties without our permission.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate this section (see{" "}
          <a href="#termination">Termination</a>).
        </p>
      </LegalSection>

      <LegalSection id="your-content" number={5} title="Your Content & License to Us">
        <p>
          <strong>You own your materials.</strong> Course materials you upload and any other content
          you submit to the Service (&ldquo;Your Content&rdquo;) remain yours. We claim no ownership over
          them.
        </p>
        <p>
          So that we can operate the Service, you grant us a limited, worldwide, non-exclusive,
          royalty-free license to host, store, process, reproduce, and display Your Content — solely
          to provide and maintain the Service for you. This includes sending Your Content to the
          third-party processors described in our <Link href="/privacy">Privacy Policy</Link> (for
          example, our AI provider) for the purpose of generating your study materials. This license
          ends when you delete Your Content or your account, except where limited copies persist in
          routine backups for a short period.
        </p>
        <p>
          You are responsible for Your Content and must have the necessary rights to upload it. We
          may remove content that we reasonably believe violates these Terms or the law.
        </p>
      </LegalSection>

      <LegalSection id="our-ip" number={6} title="Our Intellectual Property">
        <p>
          The Service itself — including the software, design, branding, and everything other than
          Your Content — is owned by Strattigo or its licensors and is protected by intellectual
          property laws. We grant you a limited, non-exclusive, non-transferable, revocable license
          to use the Service for your personal, non-commercial studying while these Terms are in
          effect. No other rights are granted.
        </p>
        <p>
          Study guides, quizzes, and other output generated for you from Your Content are yours to
          use for your personal study purposes.
        </p>
      </LegalSection>

      <LegalSection id="ai-disclaimer" number={7} title="AI-Generated Content">
        <p>
          Study guides, quizzes, chat answers, and other output are generated by artificial
          intelligence. <strong>AI-generated content can be wrong.</strong> It may contain
          inaccuracies, omissions, or statements that sound confident but are incorrect.
        </p>
        <ul>
          <li>
            Always verify generated material against your original course materials and your
            instructor&rsquo;s guidance;
          </li>
          <li>
            generated content is a study aid only — it is not a substitute for attending class,
            completing your coursework, or professional advice of any kind (academic, legal,
            medical, financial, or otherwise); and
          </li>
          <li>you use AI-generated content at your own discretion and risk.</li>
        </ul>
      </LegalSection>

      <LegalSection id="billing" number={8} title="Subscriptions & Billing">
        <p>
          Parts of the Service are free; others require a paid subscription. By subscribing, you
          agree to the pricing and billing cycle shown at checkout.
        </p>
        <ul>
          <li>
            <strong>Payments.</strong> Payments are processed by our payment provider, Stripe. We do
            not store your full card details; Stripe&rsquo;s own terms and privacy policy apply to the
            payment process.
          </li>
          <li>
            <strong>Renewal.</strong> Subscriptions renew automatically at the end of each billing
            period until you cancel.
          </li>
          <li>
            <strong>Cancellation.</strong> You can cancel at any time from your account settings.
            Cancellation takes effect at the end of the current billing period, and you keep access
            to paid features until then.
          </li>
          <li>
            <strong>Refunds.</strong> Except where required by law, payments are non-refundable. If
            you believe you have been charged in error, contact us and we will review it in good
            faith.
          </li>
          <li>
            <strong>Price changes.</strong> We may change subscription prices with reasonable
            advance notice; changes apply from your next billing period.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="termination" number={9} title="Termination">
        <p>
          You may stop using the Service and delete your account at any time. We may suspend or
          terminate your access if you materially breach these Terms, if required by law, or if we
          discontinue the Service. Where practical, we will give you notice and an opportunity to
          export your data first. Sections of these Terms that by their nature should survive
          termination — including ownership, disclaimers, and limitations of liability — survive.
        </p>
      </LegalSection>

      <LegalSection id="warranty" number={10} title="Disclaimer of Warranties">
        <p>
          The Service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>, without
          warranties of any kind, whether express, implied, or statutory — including implied
          warranties of merchantability, fitness for a particular purpose, accuracy, and
          non-infringement. We do not warrant that the Service will be uninterrupted, error-free,
          or secure, or that generated content will be accurate or complete. Some jurisdictions do
          not allow certain warranty disclaimers, so parts of this section may not apply to you.
        </p>
      </LegalSection>

      <LegalSection id="liability" number={11} title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Strattigo and its officers, employees, and
          suppliers will not be liable for any indirect, incidental, special, consequential, or
          punitive damages — including lost profits, lost data, or academic outcomes (such as
          grades or exam results) — arising from or relating to your use of the Service, even if
          advised of the possibility of such damages.
        </p>
        <p>
          To the maximum extent permitted by law, our total aggregate liability for all claims
          relating to the Service is limited to the greater of (a) the amount you paid us in the
          twelve months before the claim arose, or (b) fifty US dollars (US$50). Some jurisdictions
          do not allow certain limitations of liability, so parts of this section may not apply to
          you.
        </p>
      </LegalSection>

      <LegalSection id="changes" number={12} title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will notify
          you — for example by email or an in-app notice — before the changes take effect. Your
          continued use of the Service after the effective date of updated Terms constitutes
          acceptance of them. The &ldquo;Effective date&rdquo; at the top of this page shows when these Terms
          were last revised.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" number={13} title="Governing Law">
        <p>
          These Terms are governed by the laws of{" "}
          <Placeholder>Governing law jurisdiction (state/country)</Placeholder>, without regard to
          its conflict-of-laws rules. Any disputes arising from these Terms or the Service will be
          brought in the courts of that jurisdiction, and both parties consent to their
          jurisdiction, except where applicable law gives you the right to bring claims elsewhere.
        </p>
      </LegalSection>

      <LegalSection id="contact" number={14} title="Contact">
        <p>
          Questions about these Terms? Contact us at <Placeholder>Contact email</Placeholder>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
