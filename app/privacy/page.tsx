import type { Metadata } from "next";
import { LegalShell, LegalToc, LegalSection } from "../components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Strattigo",
  description: "How Strattigo collects, uses, stores, and protects your information.",
};

const SECTIONS = [
  { id: "information-we-collect", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use Your Information" },
  { id: "ai-processing", label: "How Your Content Is Processed by AI" },
  { id: "sub-processors", label: "Third-Party Service Providers" },
  { id: "storage-security", label: "How We Store & Protect Your Information" },
  { id: "retention-deletion", label: "Data Retention & Deletion" },
  { id: "your-rights", label: "Your Rights & Choices" },
  { id: "cookies", label: "Cookies & Similar Technologies" },
  { id: "age-requirement", label: "Age Requirement" },
  { id: "international", label: "International Users" },
  { id: "changes", label: "Changes to This Privacy Policy" },
  { id: "contact", label: "Contact Us" },
];

const CONTACT_EMAIL = "zomirj2@gmail.com";

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro={
        <>
          <p>
            <strong>Last updated: July 13, 2026</strong>
          </p>
          <p>
            This Privacy Policy explains how Strattigo (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects,
            uses, stores, and protects your information when you use Strattigo (the &ldquo;Service&rdquo;).
            By using the Service, you agree to the practices described here.
          </p>
          <p>
            We built Strattigo to help you study — not to profit from your data. We keep our data
            practices as limited and transparent as we can.
          </p>
        </>
      }
    >
      <LegalToc items={SECTIONS} />

      <LegalSection id="information-we-collect" number={1} title="Information We Collect">
        <p>
          <strong>Information you provide:</strong>
        </p>
        <ul>
          <li>
            <strong>Account information</strong> — your name and email address when you create an
            account.
          </li>
          <li>
            <strong>Your content</strong> — the course materials, notes, documents, and files you
            upload, along with the study guides, quizzes, and chat content generated from them.
          </li>
          <li>
            <strong>Payment information</strong> — if you subscribe to Strattigo Pro, your payment
            is processed by Stripe. We do not store your full payment card details; Stripe handles
            that. We receive limited information such as your subscription status and the fact that
            a payment succeeded or failed.
          </li>
        </ul>
        <p>
          <strong>Information collected automatically:</strong>
        </p>
        <ul>
          <li>
            <strong>Usage data</strong> — information about how you use the Service, such as which
            features you use and how often, to enforce plan limits, understand product usage, and
            improve the Service.
          </li>
          <li>
            <strong>Technical/error data</strong> — if something goes wrong, we collect error and
            diagnostic information to diagnose and fix problems. We configure our error-monitoring
            tools to avoid collecting the content of your materials or your personal identity
            wherever possible.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="how-we-use" number={2} title="How We Use Your Information">
        <p>We use your information to:</p>
        <ul>
          <li>
            Provide and operate the Service — including storing your materials and generating study
            guides, quizzes, and chat responses scoped to them.
          </li>
          <li>Create and manage your account.</li>
          <li>Process your subscription and payments (through Stripe).</li>
          <li>Enforce usage limits and prevent abuse.</li>
          <li>Monitor, diagnose, and fix errors and improve the Service.</li>
          <li>
            Communicate with you about your account or the Service (for example, important
            notices).
          </li>
        </ul>
        <p>
          <strong>
            We do not sell your personal information. We do not use your uploaded content to train
            AI models.
          </strong>{" "}
          Your materials and generated content are used only to provide the Service to you.
        </p>
      </LegalSection>

      <LegalSection id="ai-processing" number={3} title="How Your Content Is Processed by AI">
        <p>
          To generate study guides, quizzes, and chat responses, the text of your uploaded materials
          is sent to third-party AI providers (see <a href="#sub-processors">Section 4</a>) that
          process it to produce results and return them to you. This processing happens only to
          provide the Service. These providers process your content to generate a response; per our
          arrangements and their terms for API use, this content is not used to train their models.
        </p>
      </LegalSection>

      <LegalSection id="sub-processors" number={4} title="Third-Party Service Providers (Sub-processors)">
        <p>
          We rely on trusted third-party providers to operate the Service. These providers process
          your information only to provide their services to us, under their own terms and privacy
          policies:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — database and file storage (stores your account data and
            uploaded materials).
          </li>
          <li>
            <strong>Anthropic (Claude)</strong> — AI processing to generate study guides, quizzes,
            and chat responses.
          </li>
          <li>
            <strong>Voyage AI</strong> — generating embeddings (numerical representations of your
            materials) used to make study help accurate and scoped to your content.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing for subscriptions.
          </li>
          <li>
            <strong>Vercel</strong> — hosting and delivery of the application.
          </li>
          <li>
            <strong>Sentry</strong> — error monitoring and diagnostics (configured to minimize
            collection of personal data and content).
          </li>
        </ul>
        <p>
          We may add or change providers as the Service evolves and will update this Policy
          accordingly. Each provider maintains its own security and privacy practices.
        </p>
      </LegalSection>

      <LegalSection id="storage-security" number={5} title="How We Store and Protect Your Information">
        <p>
          Your data is stored on cloud infrastructure located in the United States. We use
          industry-standard measures to protect your information, including access controls,
          encryption in transit, and restricting data access to what is needed to operate the
          Service.
        </p>
        <p>
          No method of storage or transmission is completely secure, and we cannot guarantee
          absolute security. You are responsible for keeping your account credentials safe.
        </p>
      </LegalSection>

      <LegalSection id="retention-deletion" number={6} title="Data Retention and Deletion">
        <p>
          <strong>We keep your information for as long as your account is active.</strong>
        </p>
        <p>
          <strong>When you delete your account, we delete your personal data and Your Content</strong>,
          including your uploaded materials and associated generated content. Some information may
          persist for a limited time in backups or with our sub-processors before it is fully
          removed, and we may retain limited records where required by law (for example, certain
          transaction records for tax or accounting purposes).
        </p>
        <p>
          You can delete your account at any time through your account settings. If you need help,
          contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" number={7} title="Your Rights and Choices">
        <p>
          Depending on where you live, you may have rights regarding your personal information, such
          as the right to access, correct, delete, or export your data, or to object to certain
          processing.
        </p>
        <p>You can:</p>
        <ul>
          <li>
            <strong>Access and update</strong> much of your account information directly in the app.
          </li>
          <li>
            <strong>Delete your account and data</strong> through your account settings.
          </li>
          <li>
            <strong>Contact us</strong> at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{" "}
            to make a privacy request.
          </li>
        </ul>
        <p>We will respond to valid requests as required by applicable law.</p>
      </LegalSection>

      <LegalSection id="cookies" number={8} title="Cookies and Similar Technologies">
        <p>
          We use cookies and similar technologies (such as browser storage) that are necessary to
          operate the Service — for example, to keep you logged in and maintain your session. We do
          not use them to sell your data or serve third-party advertising.
        </p>
      </LegalSection>

      <LegalSection id="age-requirement" number={9} title="Age Requirement">
        <p>
          Strattigo is intended for users <strong>18 years of age or older</strong>. We do not
          knowingly collect personal information from anyone under 18. If you believe someone under
          18 has provided us with personal information, please contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will take steps to delete
          it.
        </p>
      </LegalSection>

      <LegalSection id="international" number={10} title="International Users">
        <p>
          Strattigo is operated from the United States, and your information is processed and stored
          in the United States. If you access the Service from outside the U.S., you understand that
          your information will be transferred to and processed in the U.S., where data protection
          laws may differ from those in your country.
        </p>
      </LegalSection>

      <LegalSection id="changes" number={11} title="Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will
          update the &ldquo;Last updated&rdquo; date and, where appropriate, provide additional notice. Your
          continued use of the Service after changes take effect constitutes acceptance of the
          updated Policy.
        </p>
      </LegalSection>

      <LegalSection id="contact" number={12} title="Contact Us">
        <p>If you have questions or requests regarding this Privacy Policy or your data, contact us at:</p>
        <p>
          <strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalSection>

      <p className="text-sm italic mt-2" style={{ color: "var(--text-tertiary)" }}>
        This Privacy Policy is provided to help you understand how Strattigo handles your
        information. We aim to collect only what we need, use it only to run the Service, and give
        you control over your data.
      </p>
    </LegalShell>
  );
}
