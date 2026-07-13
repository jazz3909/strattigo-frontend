import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalToc, LegalSection } from "../components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — Strattigo",
  description: "The terms and conditions that govern your use of Strattigo, the AI-powered study partner.",
};

const SECTIONS = [
  { id: "eligibility", label: "Eligibility" },
  { id: "account", label: "Your Account" },
  { id: "your-content", label: "Your Content" },
  { id: "acceptable-use", label: "Acceptable Use" },
  { id: "ai-disclaimer", label: "AI-Generated Content & Academic Disclaimer" },
  { id: "billing", label: "Subscriptions & Payments" },
  { id: "usage-limits", label: "Free Tier & Usage Limits" },
  { id: "third-party", label: "Third-Party Services" },
  { id: "termination", label: "Termination & Account Deletion" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "indemnification", label: "Indemnification" },
  { id: "changes", label: "Changes to These Terms" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
];

const CONTACT_EMAIL = "zomirj2@gmail.com";

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Terms of Service"
      intro={
        <>
          <p>
            <strong>Last updated: July 13, 2026</strong>
          </p>
          <p>
            Welcome to Strattigo. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use
            of Strattigo (the &ldquo;Service&rdquo;), a study platform that lets you upload course materials
            and generate study guides, quizzes, and AI-assisted study help scoped to those materials.
          </p>
          <p>
            Please read these Terms carefully. By creating an account or using the Service, you agree
            to be bound by these Terms. If you do not agree, do not use the Service.
          </p>
        </>
      }
    >
      <LegalToc items={SECTIONS} />

      <LegalSection id="eligibility" number={1} title="Eligibility">
        <p>
          You must be at least 18 years old to use Strattigo. By using the Service, you represent
          and warrant that you are 18 or older and that you have the legal capacity to enter into
          these Terms.
        </p>
        <p>If we learn that a user is under 18, we may suspend or terminate that account.</p>
      </LegalSection>

      <LegalSection id="account" number={2} title="Your Account">
        <p>To use most features, you must create an account. You agree to:</p>
        <ul>
          <li>Provide accurate information (including a valid email address and name).</li>
          <li>Keep your login credentials confidential and secure.</li>
          <li>Be responsible for all activity that occurs under your account.</li>
          <li>
            Notify us promptly at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you
            suspect unauthorized use of your account.
          </li>
        </ul>
        <p>
          You are responsible for your account. We are not liable for any loss arising from
          unauthorized use of your account that results from your failure to keep your credentials
          secure.
        </p>
      </LegalSection>

      <LegalSection id="your-content" number={3} title="Your Content">
        <p>
          <strong>You own your content.</strong> When you upload course materials, notes, documents,
          or other files (&ldquo;Your Content&rdquo;) to Strattigo, you retain all ownership rights to that
          content. We do not claim ownership of Your Content.
        </p>
        <p>
          <strong>License to operate the Service.</strong> To provide the Service, you grant
          Strattigo a limited, non-exclusive license to store, process, and transmit Your Content
          solely for the purpose of operating and providing the Service to you — for example,
          extracting text, generating embeddings, and producing study guides, quizzes, and chat
          responses scoped to your materials. This license exists only so that we can run the
          Service for you, and it ends when you delete Your Content or your account (see{" "}
          <a href="#termination">Section 9</a>).
        </p>
        <p>
          <strong>We do not use Your Content to train AI models.</strong> Your uploaded materials
          and the content you generate are used only to provide the Service to you. We do not use
          Your Content to train, fine-tune, or improve any artificial intelligence or machine
          learning models.
        </p>
        <p>
          <strong>Your responsibilities regarding content.</strong> You represent that you have the
          right to upload and use Your Content, and that doing so does not violate any law or
          infringe anyone else&rsquo;s rights (including copyright). You are solely responsible for Your
          Content and for ensuring you have permission to upload any materials you did not create.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" number={4} title="Acceptable Use">
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any law or regulation.</li>
          <li>Infringe the intellectual property or other rights of any person or entity.</li>
          <li>
            Upload malicious code, or attempt to disrupt, damage, overload, or gain unauthorized
            access to the Service or its infrastructure.
          </li>
          <li>Attempt to access other users&rsquo; accounts, data, or content.</li>
          <li>
            Reverse engineer, scrape, or attempt to extract the underlying source code or systems of
            the Service, except as permitted by law.
          </li>
          <li>
            Use the Service to cheat in violation of your school&rsquo;s academic integrity policies, or
            in any manner that violates your institution&rsquo;s rules.
          </li>
          <li>Resell, sublicense, or commercially exploit the Service without our permission.</li>
        </ul>
        <p>We may suspend or terminate accounts that violate these rules.</p>
      </LegalSection>

      <LegalSection id="ai-disclaimer" number={5} title="AI-Generated Content and Academic Disclaimer">
        <p>
          Strattigo uses artificial intelligence to generate study guides, quizzes, summaries, and
          chat responses based on the materials you provide.
        </p>
        <p>
          <strong>AI output can be inaccurate.</strong> AI-generated content may contain errors,
          omissions, or misleading information, even when it appears confident and plausible. You
          should not rely on Strattigo as your sole source of truth. Always verify important
          information against your original course materials, instructors, and other authoritative
          sources.
        </p>
        <p>
          <strong>Not professional advice.</strong> Strattigo is a study aid. It does not provide
          academic, legal, medical, financial, or professional advice, and its output should not be
          treated as such.
        </p>
        <p>
          <strong>Your academic responsibility.</strong> You are responsible for your own academic
          work and for complying with your institution&rsquo;s academic integrity policies. Strattigo is
          a tool to help you study; it is not a substitute for your own learning, and we make no
          guarantees about grades, exam results, or academic outcomes.
        </p>
      </LegalSection>

      <LegalSection id="billing" number={6} title="Subscriptions and Payments">
        <p>Strattigo offers a free tier and a paid subscription (&ldquo;Strattigo Pro&rdquo;).</p>
        <ul>
          <li>
            <strong>Billing.</strong> Paid subscriptions are billed on a recurring monthly basis
            through our payment processor, Stripe. By subscribing, you authorize us (via Stripe) to
            charge your payment method the applicable subscription fee (currently $7.99/month) until
            you cancel.
          </li>
          <li>
            <strong>Renewal.</strong> Your subscription automatically renews each billing period
            unless you cancel before the renewal date.
          </li>
          <li>
            <strong>Cancellation.</strong> You may cancel at any time through your account&rsquo;s
            billing settings. When you cancel, you will retain Pro access until the end of your
            current billing period, after which your account reverts to the free tier. We do not
            provide prorated refunds for partial billing periods unless required by law.
          </li>
          <li>
            <strong>Price changes.</strong> We may change subscription prices. If we do, we will
            provide notice, and any change will apply to your next billing period, not the current
            one.
          </li>
          <li>
            <strong>Refunds.</strong> Except where required by law, payments are non-refundable. If
            you believe you were charged in error, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="usage-limits" number={7} title="Free Tier and Usage Limits">
        <p>
          The Service includes usage limits, which may differ between the free tier and Strattigo
          Pro (for example, limits on the number of study guides, quizzes, chat messages, stored
          materials, and file sizes). We may adjust these limits over time. We may also enforce
          fair-use limits to protect the Service and its infrastructure.
        </p>
      </LegalSection>

      <LegalSection id="third-party" number={8} title="Third-Party Services">
        <p>
          Strattigo relies on third-party services to operate, including cloud hosting, storage, AI
          processing, and payment processing (see our{" "}
          <Link href="/privacy">Privacy Policy</Link> for details). Your use of the Service may be
          subject to those providers&rsquo; terms where applicable. We are not responsible for the acts
          or omissions of third-party providers.
        </p>
      </LegalSection>

      <LegalSection id="termination" number={9} title="Termination and Account Deletion">
        <p>
          <strong>You may delete your account at any time.</strong> When you delete your account, we
          delete Your Content and associated personal data as described in our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          <strong>We may suspend or terminate your access</strong> if you violate these Terms, if
          required by law, or to protect the Service or other users. Where reasonable, we will try
          to notify you.
        </p>
        <p>
          <strong>Effect of termination.</strong> Upon termination, your right to use the Service
          ends. Sections that by their nature should survive termination (including ownership,
          disclaimers, limitation of liability, and dispute provisions) will survive.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" number={10} title="Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTIES OF ANY KIND,
          WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT.
        </p>
        <p>
          We do not warrant that the Service will be uninterrupted, error-free, secure, or that any
          content (including AI-generated content) will be accurate or reliable. You use the Service
          at your own risk.
        </p>
      </LegalSection>

      <LegalSection id="liability" number={11} title="Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL STRATTIGO BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA,
          PROFITS, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF (OR INABILITY TO USE) THE
          SERVICE.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF
          OR RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN
          THE TWELVE MONTHS BEFORE THE CLAIM, OR (B) FIFTY U.S. DOLLARS ($50).
        </p>
        <p>
          Some jurisdictions do not allow certain limitations, so some of the above may not apply to
          you.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" number={12} title="Indemnification">
        <p>
          You agree to indemnify and hold harmless Strattigo from any claims, damages, losses, or
          expenses (including reasonable legal fees) arising out of your use of the Service, Your
          Content, or your violation of these Terms or applicable law.
        </p>
      </LegalSection>

      <LegalSection id="changes" number={13} title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will update
          the &ldquo;Last updated&rdquo; date and, where appropriate, provide additional notice. Your
          continued use of the Service after changes take effect constitutes acceptance of the
          updated Terms.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" number={14} title="Governing Law">
        <p>
          These Terms are governed by the laws of the State of Florida, United States, without
          regard to its conflict-of-laws principles. You agree that any disputes will be subject to
          the exclusive jurisdiction of the state and federal courts located in Florida, except
          where prohibited by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="contact" number={15} title="Contact">
        <p>If you have questions about these Terms, contact us at:</p>
        <p>
          <strong>Email:</strong> <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalSection>

      <p className="text-sm italic mt-2" style={{ color: "var(--text-tertiary)" }}>
        By using Strattigo, you acknowledge that you have read, understood, and agree to these Terms
        of Service.
      </p>
    </LegalShell>
  );
}
