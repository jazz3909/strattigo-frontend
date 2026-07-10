/*
  ══════════════════════════════════════════════════════════════════════════
  ⚠️  AI-GENERATED TEMPLATE — NOT LEGAL ADVICE
  This Privacy Policy page was drafted by an AI as a starting point. It
  MUST be reviewed by the founder and, ideally, a qualified attorney before
  it is relied upon. Search this file for "[PLACEHOLDER:" to find the values
  that must be filled in before publishing:
    - Effective date
    - Company legal name (§ intro)
    - Contact email (appears twice: §5 data-deletion contact and §10)
  ══════════════════════════════════════════════════════════════════════════
*/
import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalToc, LegalSection, Placeholder } from "../components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Strattigo",
  description: "How Strattigo collects, uses, stores, and protects your data.",
};

const SECTIONS = [
  { id: "data-we-collect", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Your Information" },
  { id: "processors", label: "Third-Party Service Providers" },
  { id: "storage-security", label: "Data Storage & Security" },
  { id: "retention", label: "Data Retention & Deletion" },
  { id: "cookies", label: "Cookies & Analytics" },
  { id: "children", label: "Children's Privacy" },
  { id: "your-rights", label: "Your Rights" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact" },
];

const PROCESSORS = [
  {
    name: "Anthropic",
    role: "AI processing",
    detail:
      "Your uploaded materials and chat messages are sent to Anthropic's API to generate study guides, quizzes, and chat responses.",
  },
  {
    name: "Supabase",
    role: "Database & storage",
    detail:
      "Hosts our database and file storage, including your account data, uploaded materials, embeddings, and generated content.",
  },
  {
    name: "Stripe",
    role: "Payments",
    detail:
      "Processes subscription payments. Your card details go directly to Stripe — we never see or store your full card number.",
  },
  {
    name: "Vercel",
    role: "Hosting",
    detail:
      "Hosts the Strattigo web application and serves it to your browser, which involves processing standard request data such as IP addresses.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro={
        <>
          <p>
            <strong>Effective date:</strong> <Placeholder>Effective date</Placeholder>
          </p>
          <p>
            This Privacy Policy explains how <Placeholder>Company legal name</Placeholder>{" "}
            (&ldquo;Strattigo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects your information when you
            use our AI-powered study service. The short version: we collect what we need to run the
            Service for you, we don&rsquo;t sell your data, and you can ask us to delete it. Our{" "}
            <Link href="/terms">Terms of Service</Link> govern your use of the Service.
          </p>
        </>
      }
    >
      <LegalToc items={SECTIONS} />

      <LegalSection id="data-we-collect" number={1} title="Information We Collect">
        <ul>
          <li>
            <strong>Account information.</strong> Your email address, password (stored in hashed
            form), and account settings.
          </li>
          <li>
            <strong>Uploaded course materials.</strong> The PDFs, slides, documents, and other
            files you upload, along with data derived from them for search and generation (such as
            extracted text and embeddings).
          </li>
          <li>
            <strong>Generated content.</strong> Study guides, quizzes, study plans, and chat
            conversations created in your account.
          </li>
          <li>
            <strong>Usage data.</strong> Information about how you use the Service — features used,
            generation counts, timestamps, and technical logs (such as IP address, browser type,
            and error reports) — used to operate, secure, and improve the Service.
          </li>
          <li>
            <strong>Payment information.</strong> Handled by Stripe, our payment processor. We
            receive subscription status and billing metadata (such as plan and payment outcome) but
            never your full card details.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="how-we-use" number={2} title="How We Use Your Information">
        <p>We use your information to:</p>
        <ul>
          <li>
            <strong>provide the Service</strong> — process and store your materials, generate study
            guides, quizzes, and plans, and answer your questions via AI chat grounded in your
            materials;
          </li>
          <li>
            <strong>run your account</strong> — authenticate you, manage your subscription, enforce
            plan limits, and send service-related emails;
          </li>
          <li>
            <strong>improve the product</strong> — understand how features are used, fix bugs, and
            make the Service faster and more reliable; and
          </li>
          <li>
            <strong>keep the Service safe</strong> — detect abuse, enforce our{" "}
            <Link href="/terms">Terms</Link>, and comply with legal obligations.
          </li>
        </ul>
        <p>
          We do not sell your personal information, and we do not use your uploaded course
          materials to advertise to you.
        </p>
      </LegalSection>

      <LegalSection id="processors" number={3} title="Third-Party Service Providers">
        <p>
          We rely on a small number of service providers to run Strattigo. Each processes your data
          only to provide their service to us, under their own privacy and security commitments:
        </p>
        <ul>
          {PROCESSORS.map((p) => (
            <li key={p.name}>
              <strong>
                {p.name} — {p.role}.
              </strong>{" "}
              {p.detail}
            </li>
          ))}
        </ul>
        <p>
          We may add or replace providers over time; where a change materially affects how your
          data is handled, we will update this policy.
        </p>
      </LegalSection>

      <LegalSection id="storage-security" number={4} title="Data Storage & Security">
        <p>
          Your data is stored with our infrastructure providers (see above). We take reasonable
          technical and organizational measures to protect it, including:
        </p>
        <ul>
          <li>encryption in transit (HTTPS/TLS) and encryption at rest where supported by our providers;</li>
          <li>access controls so that your materials and generated content are tied to your account;</li>
          <li>hashed password storage and authenticated API access; and</li>
          <li>limiting internal access to personal data to what is needed to operate the Service.</li>
        </ul>
        <p>
          No system is perfectly secure. If we learn of a security breach affecting your personal
          data, we will notify you as required by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="retention" number={5} title="Data Retention & Deletion">
        <p>
          We keep your account data, uploaded materials, and generated content for as long as your
          account is active, so the Service keeps working for you. When you delete individual
          materials or content, they are removed from your account.
        </p>
        <p>
          You can request deletion of your entire account and its data at any time by contacting us
          at <Placeholder>Contact email</Placeholder>. We will delete your personal data within a
          reasonable period, except where limited copies must be retained for legal, billing, or
          security reasons (for example, transaction records) or persist briefly in routine
          backups.
        </p>
      </LegalSection>

      <LegalSection id="cookies" number={6} title="Cookies & Analytics">
        <p>
          We use cookies and similar browser storage that are necessary for the Service to work —
          for example, to keep you signed in and remember your preferences. We do not currently use
          third-party advertising cookies.
        </p>
        <p>
          If we add analytics tools in the future, we will update this policy to name them and
          explain what they collect, and where required we will ask for your consent.
        </p>
      </LegalSection>

      <LegalSection id="children" number={7} title="Children's Privacy">
        <p>
          Strattigo is built for college and university students and is not directed at children.
          You must be at least 13 years old to use the Service, and users under the age of majority
          in their jurisdiction need a parent or guardian&rsquo;s consent. We do not knowingly collect
          personal information from children under 13; if we learn that we have, we will delete it.
          If you believe a child under 13 has provided us personal information, please contact us.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" number={8} title="Your Rights">
        <p>
          Depending on where you live, you may have legal rights over your personal data. We extend
          the following to all users, regardless of location:
        </p>
        <ul>
          <li>
            <strong>Access</strong> — ask us what personal data we hold about you;
          </li>
          <li>
            <strong>Export</strong> — request a copy of your uploaded materials and generated
            content in a portable format;
          </li>
          <li>
            <strong>Correction</strong> — update inaccurate account information (most of it directly
            in your settings); and
          </li>
          <li>
            <strong>Deletion</strong> — request deletion of your account and personal data, as
            described in <a href="#retention">Data Retention &amp; Deletion</a>.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us using the details below. We may need to
          verify your identity before acting on a request.
        </p>
      </LegalSection>

      <LegalSection id="changes" number={9} title="Changes to This Policy">
        <p>
          We may update this Privacy Policy as the Service evolves. If we make material changes, we
          will notify you — for example by email or an in-app notice — before they take effect. The
          &ldquo;Effective date&rdquo; at the top of this page shows when this policy was last revised.
        </p>
      </LegalSection>

      <LegalSection id="contact" number={10} title="Contact">
        <p>
          Questions about privacy or your data? Contact us at{" "}
          <Placeholder>Contact email</Placeholder>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
