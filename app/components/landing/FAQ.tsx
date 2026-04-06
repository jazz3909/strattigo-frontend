"use client";

import { useState } from "react";
import { useInView } from "../../hooks/useInView";

const faqs = [
  {
    question: "What file types does Strattigo support?",
    answer:
      "Strattigo supports PDF, PowerPoint (PPTX), Word documents (DOCX), and plain text files. You can upload lecture slides, textbook chapters, your own notes — anything you study from.",
  },
  {
    question: "How accurate are the AI-generated study guides and quizzes?",
    answer:
      "Strattigo uses your actual uploaded materials as the source of truth, so the content is directly derived from your course documents. The AI focuses on extracting key concepts, definitions, and testable information from what you've uploaded.",
  },
  {
    question: "Can I use Strattigo with Canvas LMS?",
    answer:
      "Yes! If your institution uses Canvas LMS, you can connect your account in Settings → Canvas. Once connected, Strattigo can automatically import your course materials so you don't have to upload them manually.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Your uploaded materials are used only to generate study content for your account. We don't share your documents with other users or use them to train AI models. Your academic work stays private.",
  },
  {
    question: "How does the Study Plan feature work?",
    answer:
      "Just tell Strattigo your exam date, and it will analyze your uploaded materials to create a personalized day-by-day study schedule. Each day includes specific topics to focus on and estimated study time, working backwards from your exam.",
  },
  {
    question: "Is there a limit on how many materials I can upload?",
    answer:
      "Free accounts can upload materials for up to 3 courses. Pro accounts get unlimited courses and uploads. Individual files can be up to 25MB each.",
  },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`rounded-2xl overflow-hidden transition-all duration-500 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{
        border: "1px solid var(--border)",
        transitionDelay: `${index * 60}ms`,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors cursor-pointer"
        style={{
          background: open ? "var(--accent-dim)" : "var(--surface)",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--surface-2)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "var(--surface)"; }}
      >
        <span className="font-semibold text-sm sm:text-base leading-snug" style={{ color: open ? "var(--accent)" : "var(--text-primary)" }}>
          {faq.question}
        </span>
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: open ? "var(--accent)" : "var(--surface-2)",
            color: open ? "#0a0a0f" : "var(--text-secondary)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-6 pb-5 animate-slide-down" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <p className="text-sm leading-relaxed pt-4" style={{ color: "var(--text-secondary)" }}>{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section id="faq" className="py-24 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-12 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-5"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
          >
            Got questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: "var(--text-primary)" }}>
            Frequently asked questions
          </h2>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Everything you need to know about Strattigo.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.question} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
