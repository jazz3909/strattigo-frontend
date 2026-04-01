import { LandingNavbar } from "./components/landing/LandingNavbar";
import { HeroSection } from "./components/landing/HeroSection";
import { FeaturesGrid } from "./components/landing/FeaturesGrid";
import { HowItWorks } from "./components/landing/HowItWorks";
import { SocialProof } from "./components/landing/SocialProof";
import { Pricing } from "./components/landing/Pricing";
import { FAQ } from "./components/landing/FAQ";
import { LandingFooter } from "./components/landing/LandingFooter";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <SocialProof />
      <Pricing />
      <FAQ />

      {/* Final CTA Banner */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden p-10 sm:p-14 text-center"
            style={{ background: "var(--gradient-brand-vivid)" }}
          >
            {/* Background dots */}
            <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
            {/* Glow orbs */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                Ready to study smarter?
              </h2>
              <p className="text-base sm:text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join 500+ Florida students using Strattigo to save hours of study time and improve
                their grades. Start free — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link
                  href="/signup"
                  className="btn-press inline-flex items-center gap-2.5 px-8 py-4 text-base font-bold text-violet-700 bg-white rounded-2xl hover:bg-violet-50 shadow-xl transition-all"
                >
                  Create free account
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="btn-press inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white/90 border border-white/30 rounded-2xl hover:bg-white/10 transition-all"
                >
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
