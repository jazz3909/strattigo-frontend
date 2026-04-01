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
      className={`border border-slate-200 rounded-2xl overflow-hidden transition-all duration-500 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors ${
          open ? "bg-violet-50" : "bg-white hover:bg-slate-50"
        }`}
      >
        <span className={`font-semibold text-sm sm:text-base leading-snug ${open ? "text-violet-800" : "text-slate-800"}`}>
          {faq.question}
        </span>
        <span
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
            open
              ? "bg-violet-600 text-white rotate-180"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-6 pb-5 bg-white border-t border-slate-100 animate-slide-down">
          <p className="text-sm text-slate-600 leading-relaxed pt-4">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <section id="faq" className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`text-center mb-12 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
            Got questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-slate-500">
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
