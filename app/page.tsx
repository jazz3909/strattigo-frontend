"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    const handleScroll = () => {
      if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Intersection Observer — reveal on scroll with stagger
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target as HTMLElement;
        const parent = el.parentElement;
        if (!parent) return;
        const siblings = Array.from(parent.children).filter(c => c.classList.contains(el.classList[0]));
        const idx = siblings.indexOf(el);
        const delay = Math.max(0, idx) * 80;

        setTimeout(() => el.classList.add('visible'), delay);
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll(
      '.hiw-label, .hiw-title-row, .hiw-step, ' +
      '.feat-label, .feat-title-wrap, .feat-card, ' +
      '.canvas-right, ' +
      '.testi-main-q, .testi-card, ' +
      '.pricing-atm-label, .pricing-atm-title-row, .pricing-atm-card, ' +
      '.cta-final-content'
    ).forEach(el => {
      (el as HTMLElement).classList.add('reveal');
      revealObserver.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealObserver.disconnect();
    };
  }, []);

  return (
    <div className="page-wrap">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,300;1,9..144,700&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #2A5F8D;
          --mauve: #A880A0;
          --salmon: #E19485;
          --rose: #C1726F;
          --terracotta: #B05857;
          --dark: #0D1420;
          --text: #F5EDE8;
          --text-2: rgba(245,237,232,0.6);
          --text-3: rgba(245,237,232,0.3);
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Outfit', sans-serif;
          background: #0D1420;
          color: var(--text);
          overflow-x: hidden;
        }

        /* Noise overlay */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 9999;
        }

        /* ── NAVBAR ── */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          z-index: 1000;
          background: rgba(13, 16, 24, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: background 0.3s ease, backdrop-filter 0.3s ease;
        }

        nav.scrolled {
          background: rgba(13,20,32,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .nav-logo {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: var(--text);
          text-decoration: none;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-signin {
          font-size: 14px;
          color: var(--text-2);
          text-decoration: none;
          transition: color 0.2s;
          cursor: pointer;
        }
        .nav-signin:hover { color: var(--text); }

        .nav-cta {
          background: rgba(225,148,133,0.15);
          border: 1px solid rgba(225,148,133,0.4);
          color: var(--salmon);
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 20px;
          border-radius: 100px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s, border-color 0.2s;
        }
        .nav-cta:hover {
          background: rgba(225,148,133,0.25);
        }

        /* ── HERO ── */
        #hero {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 700px;
          padding-top: 64px;
          overflow: hidden;
        }

        .hero-left {
          position: absolute;
          left: 5%;
          top: 64px;    /* below navbar */
          bottom: 80px; /* above stats bar */
          width: 52%;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-bottom: 120px;
        }

        .hero-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          opacity: 0;
          transform: translateY(24px);
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0ms forwards;
        }

        .hero-label-line {
          width: 32px;
          height: 1px;
          background: var(--salmon);
          flex-shrink: 0;
        }

        .hero-label-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.25em;
          color: var(--salmon);
          text-transform: uppercase;
        }

        .hero-headline {
          line-height: 1.0;
          letter-spacing: -0.02em;
        }

        .hero-line {
          display: block;
          font-family: 'Fraunces', serif;
          font-size: clamp(72px, 9vw, 130px);
          opacity: 0;
          transform: translateY(24px);
        }

        .hero-line-1 {
          font-style: italic;
          font-weight: 400;
          color: var(--text);
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 150ms forwards;
        }
        .hero-line-2 {
          font-style: normal;
          font-weight: 700;
          color: var(--text);
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 250ms forwards;
        }
        .hero-line-3 {
          font-style: italic;
          font-weight: 400;
          color: var(--text-2);
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 350ms forwards;
        }
        .hero-line-4 {
          font-style: normal;
          font-weight: 700;
          color: var(--salmon);
          animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 450ms forwards;
        }

        .hero-body {
          margin-top: 40px;
          max-width: 420px;
          font-size: 17px;
          color: var(--text-2);
          line-height: 1.75;
          opacity: 0;
          transform: translateY(24px);
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 650ms forwards;
        }

        .hero-ctas {
          margin-top: 32px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(24px);
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 650ms forwards;
        }

        .btn-primary {
          background: var(--salmon);
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 600;
          padding: 14px 32px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .btn-primary:hover {
          background: var(--rose);
          box-shadow: 0 8px 32px rgba(225,148,133,0.3);
        }

        .btn-secondary {
          border: 1px solid rgba(245,237,232,0.2);
          color: var(--text-2);
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 500;
          padding: 14px 32px;
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-secondary:hover {
          border-color: rgba(245,237,232,0.4);
          color: var(--text);
        }

        /* ── DASHBOARD CARD ── */
        .hero-right {
          position: absolute;
          right: 60px;
          top: 50%;
          z-index: 2;
          opacity: 0;
          animation: cardIn 0.9s cubic-bezier(0.16,1,0.3,1) 800ms forwards;
        }

        .dashboard-card {
          width: 380px;
          background: rgba(13,20,32,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(225,148,133,0.2);
          border-radius: 12px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(225,148,133,0.1);
          padding: 20px;
          transform: translateY(-50%) rotate(2deg);
          animation: float 7s ease-in-out 1.7s infinite;
        }

        .card-topbar {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 14px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot-1 { background: var(--salmon); }
        .dot-2 { background: var(--rose); }
        .dot-3 { background: var(--terracotta); }

        .card-course-label {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          color: var(--text-2);
          margin-bottom: 12px;
        }

        .card-sep {
          height: 1px;
          background: rgba(245,237,232,0.06);
          margin-bottom: 16px;
        }

        .card-header-line {
          height: 3px;
          background: var(--salmon);
          opacity: 0.6;
          border-radius: 2px;
          margin-bottom: 12px;
        }

        .card-lines {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .card-line {
          height: 8px;
          border-radius: 4px;
          background: rgba(245,237,232,0.08);
        }

        .card-line-highlight {
          height: 28px;
          border-radius: 4px;
          background: rgba(225,148,133,0.1);
          border-left: 2px solid var(--salmon);
          display: flex;
          align-items: center;
          padding-left: 10px;
          position: relative;
        }

        .cursor-blink {
          width: 2px;
          height: 16px;
          background: var(--salmon);
          animation: blink 1s step-end infinite;
        }

        .card-footer {
          margin-top: 14px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--text-3);
        }

        /* ── STATS BAR ── */
        .stats-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: rgba(13,20,32,0.5);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(245,237,232,0.08);
          padding: 20px 0;
          display: flex;
          justify-content: center;
          gap: 0;
          opacity: 0;
          animation: fadeIn 0.4s ease 900ms forwards;
        }

        .stat-item {
          text-align: center;
          padding: 0 60px;
          position: relative;
        }

        .stat-item + .stat-item::before {
          content: '';
          position: absolute;
          left: 0; top: 10%; bottom: 10%;
          width: 1px;
          background: rgba(245,237,232,0.08);
        }

        .stat-number {
          font-family: 'Outfit', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: var(--salmon);
          display: block;
        }

        .stat-label {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          color: var(--text-3);
          display: block;
          margin-top: 2px;
        }

        /* ── PAGE GRADIENT WRAP ── */
        .page-wrap {
          background: linear-gradient(
            180deg,
            #0D1420 0%,
            #112040 8%,
            #1A2D50 15%,
            #2A5F8D 28%,
            #3D4570 40%,
            #4A3060 52%,
            #3D2040 62%,
            #2A1830 72%,
            #1E1428 80%,
            #150F20 88%,
            #0D1018 100%
          );
          min-height: 100vh;
        }

        /* ── ATM PALETTE VARS ── */
        :root {
          --atm-dark: #0D1018;
          --text-warm: #F5EDE8;
          --text-warm-2: rgba(245,237,232,0.6);
          --text-warm-3: rgba(245,237,232,0.25);
        }

        /* ── SECTION 2: HOW IT WORKS ── */
        #how-it-works {
          padding: 100px 5%;
        }

        .hiw-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .hiw-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #E19485;
          text-transform: uppercase;
          margin-bottom: 24px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .hiw-label.visible { opacity: 1; transform: translateY(0); }

        .hiw-title-row {
          display: flex;
          align-items: baseline;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 80px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s, transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s;
        }

        .hiw-title-row.visible { opacity: 1; transform: translateY(0); }

        .hiw-t1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(48px, 6vw, 72px);
          font-style: italic;
          font-weight: 400;
          color: #F5EDE8;
          line-height: 1;
        }

        .hiw-t2 {
          font-family: 'Fraunces', serif;
          font-size: clamp(48px, 6vw, 72px);
          font-style: italic;
          font-weight: 400;
          color: rgba(245,237,232,0.2);
          line-height: 1;
        }

        .hiw-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 48px;
          position: relative;
        }

        .hiw-connector {
          position: absolute;
          top: 5px;
          left: calc(100% / 6);
          right: calc(100% / 6);
          border-top: 2px dashed rgba(225,148,133,0.3);
          pointer-events: none;
          z-index: 0;
        }

        .hiw-step {
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .hiw-step.visible { opacity: 1; transform: translateY(0); }

        .hiw-dot-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .hiw-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #E19485;
          flex-shrink: 0;
        }

        .hiw-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #E19485;
          letter-spacing: 0.1em;
        }

        .hiw-step-title {
          font-family: 'Fraunces', serif;
          font-size: 32px;
          font-weight: 400;
          color: #F5EDE8;
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .hiw-step-body {
          font-size: 15px;
          color: rgba(245,237,232,0.6);
          line-height: 1.7;
          max-width: 260px;
          margin-bottom: 24px;
        }

        .hiw-mockup {
          width: 220px;
          background: rgba(13,16,24,0.8);
          border: 1px solid rgba(245,237,232,0.08);
          border-radius: 8px;
          padding: 14px;
        }

        .hiw-file-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: rgba(245,237,232,0.04);
          border: 1px solid rgba(245,237,232,0.08);
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .hiw-file-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #E19485;
          border: 1px solid #E19485;
          border-radius: 2px;
          padding: 2px 6px;
          flex-shrink: 0;
        }

        .hiw-file-name {
          height: 6px;
          background: rgba(245,237,232,0.15);
          border-radius: 3px;
          flex: 1;
        }

        .hiw-progress-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(245,237,232,0.5);
          margin-bottom: 10px;
        }

        .hiw-progress-track {
          height: 4px;
          background: rgba(245,237,232,0.08);
          border-radius: 2px;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .hiw-progress-fill {
          height: 100%;
          width: 73%;
          background: #E19485;
          border-radius: 2px;
          animation: progressPulse 2s ease-in-out infinite;
        }

        @keyframes progressPulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .hiw-out-line {
          height: 7px;
          background: rgba(245,237,232,0.06);
          border-radius: 3px;
          margin-bottom: 6px;
        }

        .hiw-out-highlight {
          height: 22px;
          background: rgba(225,148,133,0.15);
          border-left: 2px solid #E19485;
          border-radius: 0 3px 3px 0;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          padding-left: 8px;
        }

        .hiw-cursor {
          width: 2px;
          height: 14px;
          background: #E19485;
          animation: blink 1s step-end infinite;
        }

        /* ── SECTION 3: FEATURES ── */
        #features-atm {
          padding: 100px 5%;
        }

        .feat-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        .feat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #E19485;
          text-transform: uppercase;
          margin-bottom: 20px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .feat-label.visible { opacity: 1; transform: translateY(0); }

        .feat-title-wrap {
          margin-bottom: 72px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s, transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s;
        }

        .feat-title-wrap.visible { opacity: 1; transform: translateY(0); }

        .feat-t1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(40px, 5vw, 64px);
          font-style: italic;
          font-weight: 400;
          color: #F5EDE8;
          display: block;
          line-height: 1.1;
        }

        .feat-t2 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(40px, 5vw, 64px);
          font-weight: 800;
          color: #E19485;
          display: block;
          line-height: 1.1;
        }

        .feat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .feat-card {
          background: rgba(245,237,232,0.02);
          border: 1px solid rgba(245,237,232,0.06);
          border-radius: 4px;
          padding: 40px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1), border-color 250ms ease, background 250ms ease, box-shadow 250ms ease;
          cursor: default;
        }

        .feat-card.visible { opacity: 1; transform: translateY(0); }

        .feat-card:hover {
          border-color: rgba(225,148,133,0.25);
          background: rgba(225,148,133,0.03);
          transform: translateY(-4px) !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .feat-accent-bar {
          width: 40px;
          height: 2px;
          background: #E19485;
          margin-bottom: 24px;
        }

        .feat-accent-bar.mauve { background: #A880A0; }

        .feat-name {
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #F5EDE8;
          margin-bottom: 12px;
        }

        .feat-desc {
          font-size: 15px;
          color: rgba(245,237,232,0.55);
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .feat-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(225,148,133,0.6);
        }

        /* ── SECTION 4: CANVAS SPOTLIGHT ── */
        #canvas-spotlight {
          padding: 100px 5%;
        }

        .canvas-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }

        .canvas-left {
          position: sticky;
          top: 120px;
        }

        .canvas-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #E19485;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .canvas-t1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(36px, 4.5vw, 56px);
          font-style: italic;
          font-weight: 400;
          color: #F5EDE8;
          display: block;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .canvas-t2 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(36px, 4.5vw, 56px);
          font-weight: 700;
          color: #E19485;
          display: block;
          line-height: 1.1;
          margin-bottom: 28px;
        }

        .canvas-body {
          font-size: 16px;
          color: rgba(245,237,232,0.6);
          line-height: 1.75;
          margin-bottom: 36px;
        }

        .canvas-bullets {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .canvas-bullets li {
          font-size: 15px;
          color: rgba(245,237,232,0.7);
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .canvas-arrow { color: #E19485; font-weight: 700; flex-shrink: 0; }

        .canvas-right {
          display: flex;
          justify-content: center;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .canvas-right.visible { opacity: 1; transform: translateY(0); }

        .canvas-modal {
          width: 380px;
          background: rgba(13,16,24,0.8);
          border: 1px solid rgba(225,148,133,0.2);
          border-radius: 8px;
          padding: 28px;
        }

        .canvas-modal-title {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #F5EDE8;
          margin-bottom: 16px;
        }

        .canvas-step-dots {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .canvas-sdot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(225,148,133,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(245,237,232,0.4);
        }

        .canvas-sdot.active { background: #E19485; color: #fff; }

        .canvas-module-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        .canvas-mod-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 4px;
        }

        .canvas-cb {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1.5px solid rgba(225,148,133,0.4);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .canvas-cb.checked { background: #E19485; border-color: #E19485; }
        .canvas-cb.partial { background: rgba(225,148,133,0.3); border-color: rgba(225,148,133,0.5); }

        .canvas-check {
          width: 8px;
          height: 5px;
          border-left: 2px solid #fff;
          border-bottom: 2px solid #fff;
          transform: rotate(-45deg) translateY(-1px);
        }

        .canvas-mod-name {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: #F5EDE8;
          flex: 1;
        }

        .canvas-file-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(245,237,232,0.4);
          background: rgba(245,237,232,0.06);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .canvas-prog-note {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(225,148,133,0.6);
          margin-bottom: 16px;
        }

        .canvas-import-btn {
          width: 100%;
          background: #E19485;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-align: center;
          transition: background 0.2s;
        }

        .canvas-import-btn:hover { background: #C1726F; }

        /* ── SECTION 5: TESTIMONIALS ── */
        #testimonials-atm {
          padding: 100px 5%;
          text-align: center;
        }

        .testi-inner {
          max-width: 1000px;
          margin: 0 auto;
        }

        .testi-pull-wrap {
          position: relative;
          padding: 40px 20px 0;
          margin-bottom: 48px;
        }

        .testi-open-quote {
          font-family: 'Fraunces', serif;
          font-size: 120px;
          color: #E19485;
          opacity: 0.3;
          position: absolute;
          top: -20px;
          left: 0;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        .testi-main-q {
          font-family: 'Fraunces', serif;
          font-size: clamp(24px, 3.5vw, 42px);
          font-style: italic;
          font-weight: 400;
          color: #F5EDE8;
          max-width: 800px;
          margin: 0 auto 20px;
          line-height: 1.4;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .testi-main-q.visible { opacity: 1; transform: translateY(0); }

        .testi-attr {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: rgba(245,237,232,0.5);
        }

        .testi-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 60px;
        }

        .testi-card {
          background: rgba(245,237,232,0.02);
          border: 1px solid rgba(245,237,232,0.06);
          border-radius: 4px;
          padding: 28px;
          text-align: left;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .testi-card.visible { opacity: 1; transform: translateY(0); }

        .testi-card:nth-child(1) { border-left: 2px solid #2A5F8D; }
        .testi-card:nth-child(2) { border-left: 2px solid #A880A0; }
        .testi-card:nth-child(3) { border-left: 2px solid #E19485; }

        .testi-stars {
          color: #E19485;
          font-size: 14px;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }

        .testi-text {
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          color: #F5EDE8;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .testi-name {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: rgba(245,237,232,0.5);
        }

        /* ── SECTION 6: PRICING ── */
        #pricing-atm {
          padding: 100px 5%;
        }

        .pricing-atm-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .pricing-atm-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #E19485;
          text-transform: uppercase;
          margin-bottom: 20px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .pricing-atm-label.visible { opacity: 1; transform: translateY(0); }

        .pricing-atm-title-row {
          display: flex;
          align-items: baseline;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 72px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s, transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1) 0.1s;
        }

        .pricing-atm-title-row.visible { opacity: 1; transform: translateY(0); }

        .pricing-t1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(48px, 6vw, 72px);
          font-style: italic;
          font-weight: 400;
          color: #F5EDE8;
          line-height: 1;
        }

        .pricing-t2 {
          font-family: 'Fraunces', serif;
          font-size: clamp(48px, 6vw, 72px);
          font-style: italic;
          font-weight: 400;
          color: rgba(245,237,232,0.2);
          line-height: 1;
        }

        .pricing-atm-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }

        .pricing-atm-card {
          border-radius: 8px;
          padding: 40px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .pricing-atm-card.visible { opacity: 1; transform: translateY(0); }

        .pac-free {
          background: rgba(245,237,232,0.02);
          border: 1px solid rgba(245,237,232,0.06);
        }

        .pac-pro {
          background: linear-gradient(135deg, rgba(42,95,141,0.15) 0%, rgba(176,88,87,0.15) 100%);
          border: 1px solid rgba(225,148,133,0.35);
          box-shadow: 0 0 80px rgba(225,148,133,0.06), inset 0 1px 0 rgba(225,148,133,0.1);
        }

        .pac-plan-free {
          font-family: 'Fraunces', serif;
          font-size: 56px;
          font-style: italic;
          font-weight: 400;
          color: rgba(245,237,232,0.4);
          display: block;
          line-height: 1;
          margin-bottom: 8px;
        }

        .pac-plan-pro {
          font-family: 'Fraunces', serif;
          font-size: 56px;
          font-style: italic;
          font-weight: 400;
          color: #E19485;
          display: block;
          line-height: 1;
          margin-bottom: 8px;
        }

        .pac-price-free {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          color: rgba(245,237,232,0.3);
          margin-bottom: 24px;
        }

        .pac-price-pro {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 16px;
        }

        .pac-dollar {
          font-family: 'Outfit', sans-serif;
          font-size: 72px;
          font-weight: 800;
          color: #F5EDE8;
          line-height: 1;
        }

        .pac-per {
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          color: rgba(245,237,232,0.5);
        }

        .pac-beta-badge {
          display: inline-block;
          background: rgba(225,148,133,0.1);
          border: 1px solid #E19485;
          border-radius: 4px;
          padding: 6px 12px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #E19485;
          margin-bottom: 24px;
        }

        .pac-features {
          list-style: none;
          margin-bottom: 32px;
        }

        .pac-features li {
          font-size: 15px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(245,237,232,0.05);
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .pac-free .pac-features li {
          color: rgba(245,237,232,0.35);
        }

        .pac-free .pac-features li::before {
          content: '✗';
          color: rgba(245,237,232,0.2);
          flex-shrink: 0;
        }

        .pac-pro .pac-features li {
          color: rgba(245,237,232,0.75);
        }

        .pac-pro .pac-features li::before {
          content: '→';
          color: #E19485;
          font-weight: 600;
          flex-shrink: 0;
        }

        .pac-cta {
          width: 100%;
          background: #E19485;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 600;
          padding: 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          display: block;
          transition: background 0.2s, box-shadow 0.2s;
        }

        .pac-cta:hover {
          background: #C1726F;
          box-shadow: 0 8px 32px rgba(225,148,133,0.3);
        }

        /* ── SECTION 7: FINAL CTA ── */
        #cta-final {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        #cta-final::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n3)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }

        .cta-final-content {
          text-align: center;
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .cta-final-content.visible { opacity: 1; transform: translateY(0); }

        .cta-final-l1 {
          font-family: 'Fraunces', serif;
          font-size: clamp(52px, 8vw, 96px);
          font-style: italic;
          font-weight: 400;
          color: #F5EDE8;
          display: block;
          line-height: 1.05;
        }

        .cta-final-l2 {
          font-family: 'Fraunces', serif;
          font-size: clamp(52px, 8vw, 96px);
          font-style: normal;
          font-weight: 700;
          color: #fff;
          display: block;
          line-height: 1.05;
          margin-bottom: 48px;
        }

        .cta-final-btn {
          background: #E19485;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          font-weight: 600;
          padding: 16px 40px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s, box-shadow 0.2s;
        }

        .cta-final-btn:hover {
          background: #C1726F;
          box-shadow: 0 12px 40px rgba(225,148,133,0.35);
        }

        .cta-final-note {
          margin-top: 24px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: rgba(245,237,232,0.35);
        }

        /* ── FOOTER ── */
        footer {
          border-top: 1px solid rgba(245,237,232,0.06);
          padding: 40px 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .footer-logo {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #F5EDE8;
        }

        .footer-center {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: rgba(245,237,232,0.4);
        }

        .footer-right {
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          color: rgba(245,237,232,0.4);
        }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes cardIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes float {
          0%,100% { transform: translateY(-50%) rotate(2deg); }
          50%      { transform: translateY(calc(-50% - 12px)) rotate(2deg); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }

        /* ── SCROLL REVEAL ── */
        .reveal {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 800ms cubic-bezier(0.25, 0.1, 0.25, 1),
                      transform 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .hero-right { display: none; }
          .hero-left { width: 88%; }
          .hiw-steps { grid-template-columns: 1fr; gap: 48px; }
          .hiw-connector { display: none; }
          .canvas-inner { grid-template-columns: 1fr; }
          .canvas-left { position: static; }
          .canvas-modal { width: 100%; }
        }

        @media (max-width: 1024px) {
          .feat-grid { grid-template-columns: 1fr; }
          .pricing-atm-cards { grid-template-columns: 1fr; }
          .testi-cards { grid-template-columns: 1fr; }
          nav { padding: 0 24px; }
          .stat-item { padding: 0 32px; }
        }

        @media (max-width: 768px) {
          .hero-line { font-size: clamp(52px, 14vw, 80px); }
          .hero-left { width: 92%; bottom: 160px; }
          .stats-bar { flex-wrap: wrap; gap: 0; }
          .stat-item { width: 50%; padding: 12px 0; }
          .stat-item + .stat-item::before { display: none; }
          footer { flex-direction: column; gap: 12px; text-align: center; }
          #how-it-works, #features-atm, #canvas-spotlight,
          #testimonials-atm, #pricing-atm { padding: 80px 5%; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav id="navbar">
        <a href="#" className="nav-logo" aria-label="Strattigo home">STRATTIGO</a>
        <div className="nav-right">
          <a href="/login" className="nav-signin">Sign in</a>
          <a href="#pricing" className="nav-cta">Get started</a>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section id="hero" aria-label="Hero">

        {/* Left content */}
        <div className="hero-left">
          <h1 className="hero-headline">
            <span className="hero-line hero-line-1">Study</span>
            <span className="hero-line hero-line-2">like you</span>
            <span className="hero-line hero-line-3">have the</span>
            <span className="hero-line hero-line-4">answers.</span>
          </h1>

          <p className="hero-body">
            Upload your course materials. Strattigo&apos;s AI reads them and generates study guides, quizzes, and answers tailored to exactly what you need to know.
          </p>

          <div className="hero-ctas">
            <a href="#pricing" className="btn-primary">Begin studying →</a>
            <a href="#process" className="btn-secondary">See how it works</a>
          </div>
        </div>

        {/* Floating dashboard card */}
        <div className="hero-right" aria-hidden="true">
          <div className="dashboard-card">
            <div className="card-topbar">
              <div className="dot dot-1"></div>
              <div className="dot dot-2"></div>
              <div className="dot dot-3"></div>
            </div>
            <div className="card-course-label">Calculus II — Exam 3 Study Guide</div>
            <div className="card-sep"></div>
            <div className="card-header-line"></div>
            <div className="card-lines">
              <div className="card-line" style={{width:'100%'}}></div>
              <div className="card-line" style={{width:'85%'}}></div>
              <div className="card-line" style={{width:'92%'}}></div>
              <div className="card-line" style={{width:'70%'}}></div>
              <div className="card-line-highlight">
                <div className="cursor-blink"></div>
              </div>
              <div className="card-line" style={{width:'88%'}}></div>
              <div className="card-line" style={{width:'60%'}}></div>
              <div className="card-line" style={{width:'95%'}}></div>
              <div className="card-line" style={{width:'75%'}}></div>
            </div>
            <div className="card-footer">Generated in 4.2s</div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar" aria-label="Platform statistics">
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Study guides</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50K+</span>
            <span className="stat-label">Quiz questions</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Students</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">4.9★</span>
            <span className="stat-label">Rating</span>
          </div>
        </div>

      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section id="how-it-works" aria-label="How it works">
        <div className="hiw-inner">

          <div className="hiw-label">HOW IT WORKS</div>
          <div className="hiw-title-row">
            <span className="hiw-t1">Three steps.</span>
            <span className="hiw-t2">That&apos;s it.</span>
          </div>

          <div className="hiw-steps">
            <div className="hiw-connector" aria-hidden="true"></div>

            {/* Step 1 */}
            <div className="hiw-step">
              <div className="hiw-dot-row">
                <div className="hiw-dot"></div>
                <span className="hiw-num">01</span>
              </div>
              <h2 className="hiw-step-title">Upload your files</h2>
              <p className="hiw-step-body">Drop in your PDFs, slides, and notes. Everything your professor gave you.</p>
              <div className="hiw-mockup" aria-hidden="true">
                <div className="hiw-file-row">
                  <span className="hiw-file-badge">PDF</span>
                  <div className="hiw-file-name" style={{width:'70%'}}></div>
                </div>
                <div className="hiw-file-row">
                  <span className="hiw-file-badge">PPTX</span>
                  <div className="hiw-file-name" style={{width:'55%'}}></div>
                </div>
                <div className="hiw-file-row">
                  <span className="hiw-file-badge">DOCX</span>
                  <div className="hiw-file-name" style={{width:'80%'}}></div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="hiw-step">
              <div className="hiw-dot-row">
                <div className="hiw-dot"></div>
                <span className="hiw-num">02</span>
              </div>
              <h2 className="hiw-step-title">AI processes everything</h2>
              <p className="hiw-step-body">Not summarized — fully understood. Every concept, formula, and definition from your exact content.</p>
              <div className="hiw-mockup" aria-hidden="true">
                <div className="hiw-progress-label">Analyzing materials...</div>
                <div className="hiw-progress-track">
                  <div className="hiw-progress-fill"></div>
                </div>
                <div className="hiw-out-line" style={{width:'90%'}}></div>
                <div className="hiw-out-line" style={{width:'65%'}}></div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="hiw-step">
              <div className="hiw-dot-row">
                <div className="hiw-dot"></div>
                <span className="hiw-num">03</span>
              </div>
              <h2 className="hiw-step-title">Study smarter</h2>
              <p className="hiw-step-body">Guides, quizzes, and answers from YOUR materials — not generic internet noise.</p>
              <div className="hiw-mockup" aria-hidden="true">
                <div className="hiw-out-line" style={{width:'100%'}}></div>
                <div className="hiw-out-highlight">
                  <div className="hiw-cursor"></div>
                </div>
                <div className="hiw-out-line" style={{width:'85%'}}></div>
                <div className="hiw-out-line" style={{width:'70%'}}></div>
                <div className="hiw-out-line" style={{width:'92%'}}></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES */}
      <section id="features-atm" aria-label="Features">
        <div className="feat-inner">
          <div className="feat-label">FEATURES</div>
          <div className="feat-title-wrap">
            <span className="feat-t1">Everything you need</span>
            <span className="feat-t2">to ace your exams.</span>
          </div>

          <div className="feat-grid">

            <div className="feat-card">
              <div className="feat-accent-bar"></div>
              <div className="feat-name">Study Guides</div>
              <p className="feat-desc">Comprehensive guides from your exact materials. Choose In-Depth or Quick Reference. Save up to 5 per course.</p>
              <div className="feat-tag">→ From YOUR files</div>
            </div>

            <div className="feat-card">
              <div className="feat-accent-bar mauve"></div>
              <div className="feat-name">Practice Quizzes</div>
              <p className="feat-desc">Exam-style questions pulled from YOUR content. Progressive streaming. Save your best sets.</p>
              <div className="feat-tag">→ From YOUR files</div>
            </div>

            <div className="feat-card">
              <div className="feat-accent-bar mauve"></div>
              <div className="feat-name">Canvas Import</div>
              <p className="feat-desc">Connect Canvas. Import entire modules automatically. Each module becomes an organized collection.</p>
              <div className="feat-tag">→ From YOUR files</div>
            </div>

            <div className="feat-card">
              <div className="feat-accent-bar"></div>
              <div className="feat-name">AI Chat Tutor</div>
              <p className="feat-desc">Ask anything. Get answers grounded in your uploaded materials, not generic knowledge.</p>
              <div className="feat-tag">→ From YOUR files</div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: CANVAS SPOTLIGHT */}
      <section id="canvas-spotlight" aria-label="Canvas LMS integration">
        <div className="canvas-inner">

          {/* Left: sticky copy */}
          <div className="canvas-left">
            <div className="canvas-label">CANVAS LMS</div>
            <span className="canvas-t1">Your entire course.</span>
            <span className="canvas-t2">Imported in seconds.</span>
            <p className="canvas-body">Stop downloading files one by one. Connect Canvas once and pull in everything — organized exactly how your professor structured it.</p>
            <ul className="canvas-bullets">
              <li><span className="canvas-arrow">→</span> Connect with your Canvas API token</li>
              <li><span className="canvas-arrow">→</span> Browse and select any course module</li>
              <li><span className="canvas-arrow">→</span> Materials import and organize automatically</li>
              <li><span className="canvas-arrow">→</span> External links (OpenStax) followed automatically</li>
            </ul>
          </div>

          {/* Right: modal mockup */}
          <div className="canvas-right">
            <div className="canvas-modal" aria-hidden="true">
              <div className="canvas-modal-title">Import from Canvas</div>
              <div className="canvas-step-dots">
                <div className="canvas-sdot active">1</div>
                <div className="canvas-sdot">2</div>
                <div className="canvas-sdot">3</div>
              </div>
              <div className="canvas-module-list">
                <div className="canvas-mod-item">
                  <div className="canvas-cb checked"><div className="canvas-check"></div></div>
                  <span className="canvas-mod-name">Week 1–4: Foundations</span>
                  <span className="canvas-file-badge">12 files</span>
                </div>
                <div className="canvas-mod-item">
                  <div className="canvas-cb checked"><div className="canvas-check"></div></div>
                  <span className="canvas-mod-name">Midterm Review</span>
                  <span className="canvas-file-badge">8 files</span>
                </div>
                <div className="canvas-mod-item">
                  <div className="canvas-cb partial"></div>
                  <span className="canvas-mod-name">Week 5–8: Advanced</span>
                  <span className="canvas-file-badge">15 files</span>
                </div>
                <div className="canvas-mod-item">
                  <div className="canvas-cb"></div>
                  <span className="canvas-mod-name">Final Exam Prep</span>
                  <span className="canvas-file-badge">6 files</span>
                </div>
              </div>
              <div className="canvas-prog-note">23 files selected</div>
              <button className="canvas-import-btn">Import 3 modules →</button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: TESTIMONIALS */}
      <section id="testimonials-atm" aria-label="Testimonials">
        <div className="testi-inner">

          <div className="testi-pull-wrap">
            <div className="testi-open-quote" aria-hidden="true">&ldquo;</div>
            <blockquote className="testi-main-q">
              &ldquo;I uploaded my Calc 2 notes and had a complete study guide in under a minute. Got a B+ on the exam I was going to fail.&rdquo;
            </blockquote>
            <p className="testi-attr">— Marcus T., Florida Polytechnic University</p>
          </div>

          <div className="testi-cards">

            <div className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">&ldquo;The Canvas import is insane. All my modules organized automatically.&rdquo;</p>
              <div className="testi-name">— Sofia R., USF</div>
            </div>

            <div className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">&ldquo;Other AI tools give generic answers. This reads my professor&apos;s actual slides.&rdquo;</p>
              <div className="testi-name">— Jaylen K., FSU</div>
            </div>

            <div className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">&ldquo;Generated a full quiz from my notes in 30 seconds. Passed my stats exam.&rdquo;</p>
              <div className="testi-name">— Priya M., UCF</div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6: PRICING */}
      <section id="pricing-atm" aria-label="Pricing">
        <div className="pricing-atm-inner">
          <div className="pricing-atm-label">PRICING</div>
          <div className="pricing-atm-title-row">
            <span className="pricing-t1">Simple.</span>
            <span className="pricing-t2">No tricks.</span>
          </div>

          <div className="pricing-atm-cards">

            {/* Free */}
            <div className="pricing-atm-card pac-free">
              <span className="pac-plan-free">Free</span>
              <div className="pac-price-free">$0 / month</div>
              <ul className="pac-features" aria-label="Free plan features">
                <li>3 study guide generations / month</li>
                <li>1 quiz set / month</li>
                <li>Up to 10MB uploads</li>
                <li>Basic AI chat</li>
              </ul>
              <a href="/signup" className="btn-secondary" style={{width:'100%', textAlign:'center', display:'block'}}>Get started free</a>
            </div>

            {/* Pro */}
            <div className="pricing-atm-card pac-pro">
              <span className="pac-plan-pro">Pro</span>
              <div className="pac-price-pro">
                <span className="pac-dollar">$7</span>
                <span className="pac-per">/ month</span>
              </div>
              <div className="pac-beta-badge">Use BETA15 — 3 months free</div>
              <ul className="pac-features" aria-label="Pro plan features">
                <li>Unlimited study guide generations</li>
                <li>Unlimited quizzes — save &amp; organize sets</li>
                <li>Canvas LMS integration</li>
                <li>Upload up to 500MB per course</li>
                <li>Priority AI processing</li>
                <li>Full AI chat tutor access</li>
                <li>Early access to new features</li>
              </ul>
              <a href="/signup" className="pac-cta">Start free with BETA15 →</a>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 7: FINAL CTA */}
      <section id="cta-final" aria-label="Call to action">
        <div className="cta-final-content">
          <span className="cta-final-l1">Ready to study</span>
          <span className="cta-final-l2">smarter?</span>
          <a href="/signup" className="cta-final-btn">Begin for free →</a>
          <p className="cta-final-note">No credit card required &nbsp;•&nbsp; Use code BETA15 for 3 months free</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">STRATTIGO</div>
        <div className="footer-center">© 2026 Strattigo. Built for students.</div>
        <div className="footer-right">strattigo.com</div>
      </footer>
    </div>
  );
}
