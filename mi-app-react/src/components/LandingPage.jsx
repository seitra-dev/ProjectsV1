import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── HOOKS (PRESERVED) ────────────────────────────────────────────────────────

const useTypewriter = (words, typingSpeed = 90, deletingSpeed = 50, pause = 1800) => {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = words[wordIdx];
    const id = setTimeout(() => {
      if (!deleting) {
        if (display.length < current.length) setDisplay(current.slice(0, display.length + 1));
        else setTimeout(() => setDeleting(true), pause);
      } else {
        if (display.length === 0) { setDeleting(false); setWordIdx(i => (i + 1) % words.length); }
        else setDisplay(display.slice(0, -1));
      }
    }, deleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(id);
  }, [display, deleting, wordIdx]);
  return display;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted }) {
  const containerRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const typeword = useTypewriter(['más rápido.', 'sin caos.', 'con claridad.', 'en equipo.']);

  // Navbar scroll effect — listens to our own container, not window
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 20);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for reveal animations — uses container as root
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const revealEls = el.querySelectorAll(
      '.lp-reveal, .lp-reveal-left, .lp-reveal-right, .lp-reveal-scale, .lp-reveal-clip'
    );
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('lp-visible');
          io.unobserve(e.target);
        }
      });
    }, { root: el, threshold: 0.10, rootMargin: '0px 0px -32px 0px' });
    revealEls.forEach(node => io.observe(node));
    return () => io.disconnect();
  }, []);

  // Smooth scroll for anchor clicks — uses our container
  const scrollTo = useCallback((id) => {
    const el = containerRef.current;
    const target = el?.querySelector(id);
    if (el && target) {
      const top = target.offsetTop - 72;
      el.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  return (
    // Posición fija que ocupa toda la pantalla con scroll propio
    // (evita que overflow:hidden de index.css bloquee el scroll)
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden', fontFamily: "'Geist', system-ui, sans-serif", background: '#ffffff', color: '#0a0a0f', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital,wght@0,400;1,400&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --lp-bg: #ffffff;
          --lp-fg: #0a0a0f;
          --lp-fg-muted: #5a5a72;
          --lp-fg-subtle: #9494a8;
          --lp-border: #e8e8f0;
          --lp-blue: #3b82f6;
          --lp-purple: #a78bfa;
          --lp-teal: #2dd4bf;
          --lp-card-bg: #f8f8fc;
          --lp-radius: 12px;
          --lp-radius-lg: 20px;
          --lp-shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
          --lp-shadow-md: 0 4px 20px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04);
          --lp-shadow-lg: 0 20px 60px rgba(0,0,0,.10), 0 8px 24px rgba(0,0,0,.06);
        }

        html { scroll-behavior: smooth; }

        /* ── Scroll Animations ── */
        .lp-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
        }
        .lp-reveal.lp-visible { opacity: 1; transform: translateY(0); }

        .lp-reveal-left {
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
        }
        .lp-reveal-left.lp-visible { opacity: 1; transform: translateX(0); }

        .lp-reveal-right {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1);
        }
        .lp-reveal-right.lp-visible { opacity: 1; transform: translateX(0); }

        .lp-reveal-scale {
          opacity: 0;
          transform: scale(0.92) translateY(16px);
          transition: opacity 0.6s cubic-bezier(.22,1,.36,1), transform 0.6s cubic-bezier(.22,1,.36,1);
        }
        .lp-reveal-scale.lp-visible { opacity: 1; transform: scale(1) translateY(0); }

        .lp-reveal-clip {
          opacity: 0;
          clip-path: inset(12% 4% 0% 4% round 20px);
          transform: translateY(20px);
          transition: opacity 0.9s cubic-bezier(.22,1,.36,1), clip-path 0.9s cubic-bezier(.22,1,.36,1), transform 0.9s cubic-bezier(.22,1,.36,1);
        }
        .lp-reveal-clip.lp-visible { opacity: 1; clip-path: inset(0% 0% 0% 0% round 20px); transform: translateY(0); }

        .lp-d1 { transition-delay: 0.07s !important; }
        .lp-d2 { transition-delay: 0.14s !important; }
        .lp-d3 { transition-delay: 0.21s !important; }
        .lp-d4 { transition-delay: 0.28s !important; }
        .lp-d5 { transition-delay: 0.35s !important; }
        .lp-d6 { transition-delay: 0.42s !important; }

        /* ── Orbs ── */
        .lp-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.22;
          z-index: 0;
          animation: lpDrift 12s ease-in-out infinite alternate;
        }
        .lp-orb-blue  { width: 600px; height: 600px; background: var(--lp-blue);   top: -100px; left: -100px; animation-duration: 14s; }
        .lp-orb-purple{ width: 500px; height: 500px; background: var(--lp-purple);  top: 50px;   right: -80px; animation-duration: 18s; animation-delay: -5s; }
        .lp-orb-teal  { width: 400px; height: 400px; background: var(--lp-teal);    bottom: 0;   left: 40%;   animation-duration: 16s; animation-delay: -8s; }

        @keyframes lpDrift {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(40px, -30px) scale(1.05); }
          66%  { transform: translate(-30px, 40px) scale(0.97); }
          100% { transform: translate(20px, -10px) scale(1.02); }
        }

        /* Chip pulse */
        .lp-chip-dot {
          width: 8px; height: 8px;
          background: var(--lp-blue);
          border-radius: 50%;
          animation: lpPulseDot 2s ease-in-out infinite;
        }
        @keyframes lpPulseDot {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(59,130,246,.4); }
          50%       { opacity: .8; transform: scale(1.15); box-shadow: 0 0 0 6px rgba(59,130,246,0); }
        }

        /* Nav links hover underline */
        .lp-nav-link {
          font-size: 14px;
          font-weight: 500;
          color: var(--lp-fg-muted);
          text-decoration: none;
          cursor: pointer;
          position: relative;
          transition: color .2s;
          background: none;
          border: none;
          padding: 0;
        }
        .lp-nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 0; right: 0;
          height: 1.5px;
          background: var(--lp-blue);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .25s;
        }
        .lp-nav-link:hover { color: var(--lp-fg); }
        .lp-nav-link:hover::after { transform: scaleX(1); }

        /* Feature card top accent */
        .lp-feature-card {
          background: #fff;
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
          transition: background .2s;
          cursor: default;
        }
        .lp-feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2.5px;
          background: linear-gradient(90deg, var(--lp-blue), var(--lp-purple));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .4s cubic-bezier(.22,1,.36,1);
        }
        .lp-feature-card:hover::before { transform: scaleX(1); }
        .lp-feature-card:hover { background: var(--lp-card-bg); }

        /* Kanban card hover */
        .lp-k-card {
          background: #fff;
          border: 1px solid var(--lp-border);
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 8px;
          box-shadow: var(--lp-shadow-sm);
          transition: box-shadow .2s, transform .15s;
          cursor: pointer;
        }
        .lp-k-card:hover { box-shadow: var(--lp-shadow-md); transform: translateY(-1px); }

        /* Metric card */
        .lp-metric-card {
          padding: 40px 24px;
          background: var(--lp-card-bg);
          border: 1px solid var(--lp-border);
          border-radius: var(--lp-radius-lg);
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .lp-metric-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--lp-blue), var(--lp-purple));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .4s cubic-bezier(.22,1,.36,1);
        }
        .lp-metric-card:hover { transform: translateY(-6px); box-shadow: var(--lp-shadow-md); }
        .lp-metric-card:hover::after { transform: scaleX(1); }

        /* Sidebar items */
        .lp-sidebar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 8px;
          border-radius: 7px;
          font-size: 13px;
          color: var(--lp-fg-muted);
          cursor: pointer;
          transition: background .15s;
          margin-bottom: 2px;
        }
        .lp-sidebar-item.active { background: rgba(59,130,246,.09); color: var(--lp-blue); font-weight: 500; }
        .lp-sidebar-item:hover:not(.active) { background: var(--lp-border); }

        /* Footer links */
        .lp-footer-link {
          font-size: 14px;
          color: var(--lp-fg-muted);
          text-decoration: none;
          transition: color .2s;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .lp-footer-link:hover { color: var(--lp-fg); }

        /* Gantt bar hover */
        .lp-gantt-bar {
          height: 22px;
          border-radius: 4px;
          position: absolute;
          display: flex;
          align-items: center;
          padding: 0 8px;
          font-size: 10px;
          font-weight: 600;
          color: #fff;
          font-family: 'Geist Mono', monospace;
          transition: filter .2s;
        }
        .lp-gantt-bar:hover { filter: brightness(1.08); }

        /* Buttons */
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: var(--lp-fg);
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 4px 14px rgba(0,0,0,.15);
          text-decoration: none;
        }
        .lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.2); }

        .lp-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          background: transparent;
          color: var(--lp-fg);
          font-size: 15px;
          font-weight: 500;
          border-radius: 10px;
          border: 1.5px solid var(--lp-border);
          cursor: pointer;
          transition: border-color .2s, background .2s;
          text-decoration: none;
        }
        .lp-btn-secondary:hover { border-color: var(--lp-blue); background: rgba(59,130,246,.04); }

        .lp-btn-cta-white {
          padding: 14px 28px;
          background: #fff;
          color: var(--lp-fg);
          font-size: 15px;
          font-weight: 600;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s;
          box-shadow: 0 4px 14px rgba(0,0,0,.2);
        }
        .lp-btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.3); }

        .lp-btn-cta-ghost {
          padding: 14px 24px;
          background: transparent;
          border: 1.5px solid rgba(255,255,255,.25);
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          transition: border-color .2s, background .2s;
        }
        .lp-btn-cta-ghost:hover { border-color: rgba(255,255,255,.5); background: rgba(255,255,255,.06); }

        /* Nav CTA */
        .lp-nav-cta {
          margin-left: 24px;
          padding: 9px 20px;
          background: var(--lp-fg);
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: background .2s, transform .15s;
          text-decoration: none;
        }
        .lp-nav-cta:hover { background: #1a1a2e; transform: translateY(-1px); }

        /* Step connector */
        .lp-step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 19px; top: 44px;
          width: 1.5px; bottom: -36px;
          background: linear-gradient(to bottom, var(--lp-border), transparent);
        }

        @media (max-width: 768px) {
          .lp-features-grid { grid-template-columns: 1fr !important; }
          .lp-how-inner { grid-template-columns: 1fr !important; gap: 40px !important; }
          .lp-metrics-grid { grid-template-columns: 1fr !important; }
          .lp-mockup-body { grid-template-columns: 1fr !important; }
          .lp-mockup-sidebar { display: none !important; }
          .lp-kanban { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-nav-links { display: none !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 clamp(24px, 5vw, 80px)',
        transition: 'background .3s, backdrop-filter .3s, box-shadow .3s, border-color .3s',
        borderBottom: scrolled ? '1px solid #e8e8f0' : '1px solid transparent',
        background: scrolled ? 'rgba(255,255,255,.82)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 #e8e8f0' : 'none',
      }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, letterSpacing: '-.3px', color: '#0a0a0f', marginRight: 'auto' }}>
          Sei<span style={{ color: '#3b82f6' }}>tra</span>
        </div>
        <ul className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32, listStyle: 'none' }}>
          <li><button className="lp-nav-link" onClick={() => scrollTo('#lp-features')}>Funciones</button></li>
          <li><button className="lp-nav-link" onClick={() => scrollTo('#lp-how')}>Cómo funciona</button></li>
          <li><button className="lp-nav-link" onClick={() => scrollTo('#lp-metrics')}>Lo que lograrás</button></li>
        </ul>
        <button className="lp-nav-cta" onClick={onGetStarted}>Empezar gratis</button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px clamp(24px, 5vw, 80px) 80px', overflow: 'hidden' }}>

        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #c7c7d8 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.45, zIndex: 0, maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)' }} />

        {/* Orbs */}
        <div className="lp-orb lp-orb-blue" />
        <div className="lp-orb lp-orb-purple" />
        <div className="lp-orb lp-orb-teal" />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 860, width: '100%' }}>

          {/* Chip */}
          <div className="lp-reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 8px', background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 100, fontSize: 13, fontFamily: "'Geist Mono', monospace", color: '#3b82f6', marginBottom: 32 }}>
            <span className="lp-chip-dot" />
            <span>Acceso anticipado — ya disponible</span>
          </div>

          {/* Headline */}
          <h1 className="lp-reveal lp-d1" style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(44px, 7vw, 88px)', lineHeight: 1.05, letterSpacing: '-.02em', marginBottom: 24, background: 'linear-gradient(135deg, #0a0a0f 0%, #3b3b6e 40%, #3b82f6 70%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Todo tu equipo.<br />Un solo lugar.
          </h1>

          {/* Sub */}
          <p className="lp-reveal lp-d2" style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#5a5a72', maxWidth: 540, margin: '0 auto 40px', fontWeight: 400, lineHeight: 1.65 }}>
            Seitra elimina la fricción entre la idea y la entrega. Gestiona tareas, timelines y equipos sin saltar entre diez herramientas distintas.
          </p>

          {/* CTAs */}
          <div className="lp-reveal lp-d3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
            <button className="lp-btn-primary" onClick={onGetStarted}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L14 8L8 14.5M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Comenzar gratis
            </button>
            <button className="lp-btn-secondary" onClick={() => scrollTo('#lp-how')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 6.25C6.5 5.56 7.17 5 8 5s1.5.56 1.5 1.25c0 .6-.4 1.1-.96 1.32C8.21 7.72 8 8.08 8 8.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r=".75" fill="currentColor"/></svg>
              Ver demostración
            </button>
          </div>

          {/* Social proof */}
          <div className="lp-reveal lp-d4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {[
                { initials: 'MR', bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)' },
                { initials: 'SC', bg: 'linear-gradient(135deg,#34d399,#10b981)' },
                { initials: 'JP', bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)' },
                { initials: 'AL', bg: 'linear-gradient(135deg,#f472b6,#ec4899)' },
              ].map((av, i) => (
                <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', border: '2.5px solid #fff', marginLeft: i === 0 ? 0 : -10, background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{av.initials}</div>
              ))}
            </div>
            <div style={{ fontSize: 14, color: '#5a5a72', textAlign: 'left', lineHeight: 1.4 }}>
              <div>Únete a los primeros equipos en probar Seitra</div>
              <div style={{ fontSize: 12, color: '#9494a8', marginTop: 2 }}>Acceso gratuito durante el lanzamiento</div>
            </div>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="lp-reveal-clip lp-d5" style={{ position: 'relative', zIndex: 2, marginTop: 64, maxWidth: 1000, width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e8e8f0', boxShadow: '0 20px 60px rgba(0,0,0,.10), 0 8px 24px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.03)', overflow: 'hidden' }}>
            {/* Browser bar */}
            <div style={{ background: '#f4f4f8', borderBottom: '1px solid #e8e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#f87171' }} />
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fbbf24' }} />
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#34d399' }} />
              </div>
              <div style={{ marginLeft: 16, fontSize: 12, fontFamily: "'Geist Mono', monospace", color: '#9494a8', background: '#fff', border: '1px solid #e8e8f0', borderRadius: 6, padding: '3px 10px' }}>seitra.app / sprint-q2</div>
            </div>
            {/* Body */}
            <div className="lp-mockup-body" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 340 }}>
              {/* Sidebar */}
              <div className="lp-mockup-sidebar" style={{ background: '#fafafd', borderRight: '1px solid #e8e8f0', padding: 16 }}>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 16, color: '#0a0a0f', marginBottom: 20, paddingLeft: 4 }}>Sei<span style={{ color: '#3b82f6' }}>tra</span></div>
                <div style={{ fontSize: 10, fontFamily: "'Geist Mono', monospace", letterSpacing: '.08em', color: '#9494a8', textTransform: 'uppercase', margin: '14px 0 6px 8px' }}>Proyectos</div>
                <div className="lp-sidebar-item active">
                  <svg style={{ width: 16, height: 16, opacity: .7, flexShrink: 0 }} viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="5" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9.5" y="1.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>
                  Sprint Q2
                </div>
                <div className="lp-sidebar-item">
                  <svg style={{ width: 16, height: 16, opacity: .7, flexShrink: 0 }} viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  Roadmap
                </div>
                <div className="lp-sidebar-item">
                  <svg style={{ width: 16, height: 16, opacity: .7, flexShrink: 0 }} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  Timelines
                </div>
                <div style={{ fontSize: 10, fontFamily: "'Geist Mono', monospace", letterSpacing: '.08em', color: '#9494a8', textTransform: 'uppercase', margin: '14px 0 6px 8px' }}>Equipo</div>
                <div className="lp-sidebar-item">
                  <svg style={{ width: 16, height: 16, opacity: .7, flexShrink: 0 }} viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5S10.5 10.515 10.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 4c1.105 0 2 .895 2 2s-.895 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M14.5 13c0-2-1.5-3.5-3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  Miembros
                </div>
              </div>
              {/* Main */}
              <div style={{ padding: 20, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0a0a0f' }}>Sprint Q2 — Kanban</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['14 tareas', '6 miembros'].map((b, i) => (
                      <span key={i} style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", padding: '3px 8px', borderRadius: 4, background: '#f8f8fc', border: '1px solid #e8e8f0', color: '#5a5a72' }}>{b}</span>
                    ))}
                  </div>
                </div>
                {/* Kanban */}
                <div className="lp-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'start' }}>
                  {[
                    { col: 'Por hacer',   dot: '#94a3b8', cards: [{ label: 'Diseño', lc: 'rgba(167,139,250,.12)', lt: '#7c3aed', title: 'Rediseño pantalla de onboarding', av: { i: 'MR', bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }, date: '24 abr' }, { label: 'UX', lc: 'rgba(251,191,36,.12)', lt: '#d97706', title: 'Auditoría de accesibilidad', av: { i: 'AL', bg: 'linear-gradient(135deg,#f472b6,#ec4899)' }, date: '30 abr' }] },
                    { col: 'En progreso', dot: '#3b82f6', cards: [{ label: 'Dev', lc: 'rgba(59,130,246,.12)', lt: '#1d4ed8', title: 'API de notificaciones en tiempo real', av: { i: 'JP', bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)' }, date: '22 abr' }, { label: 'Dev', lc: 'rgba(59,130,246,.12)', lt: '#1d4ed8', title: 'Integración con Slack y Teams', av: { i: 'SC', bg: 'linear-gradient(135deg,#34d399,#10b981)' }, date: '25 abr' }] },
                    { col: 'Revisión',    dot: '#a78bfa', cards: [{ label: 'QA', lc: 'rgba(45,212,191,.12)', lt: '#0d9488', title: 'Tests E2E módulo de reportes', av: { i: 'DV', bg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)' }, date: '20 abr' }] },
                    { col: 'Listo',       dot: '#2dd4bf', cards: [{ label: 'Diseño', lc: 'rgba(167,139,250,.12)', lt: '#7c3aed', title: 'Sistema de tokens de color v3', av: { i: 'MR', bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }, date: '18 abr' }] },
                  ].map((column, ci) => (
                    <div key={ci}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: '#5a5a72' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: column.dot }} />
                        {column.col}
                      </div>
                      {column.cards.map((card, ki) => (
                        <div key={ki} className="lp-k-card">
                          <span style={{ fontSize: 10, fontFamily: "'Geist Mono', monospace", padding: '2px 6px', borderRadius: 3, marginBottom: 6, display: 'inline-block', background: card.lc, color: card.lt }}>{card.label}</span>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#0a0a0f', marginBottom: 8, lineHeight: 1.4 }}>{card.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: card.av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{card.av.i}</div>
                            <span style={{ fontSize: 10, color: '#9494a8', fontFamily: "'Geist Mono', monospace" }}>{card.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="lp-features" style={{ background: '#fff', padding: 'clamp(80px, 10vw, 120px) clamp(24px, 5vw, 80px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 60 }}>
          <p className="lp-reveal" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 14 }}>Funcionalidades</p>
          <h2 className="lp-reveal lp-d1" style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-.02em', color: '#0a0a0f', marginBottom: 16 }}>
            Todo lo que necesitas.<br />Nada que no.
          </h2>
          <p className="lp-reveal lp-d2" style={{ fontSize: 18, color: '#5a5a72', maxWidth: 520, lineHeight: 1.65 }}>
            Construido para equipos que necesitan moverse rápido sin perder visibilidad.
          </p>
        </div>

        <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#e8e8f0', border: '1px solid #e8e8f0', borderRadius: 20, overflow: 'hidden' }}>
          {[
            { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#3b82f6" strokeWidth="1.6"><rect x="2" y="4" width="7" height="14" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="13" y="14" width="7" height="4" rx="2"/></svg>, title: 'Tablero Kanban visual', desc: 'Arrastra tareas entre columnas, asigna responsables y monitorea el progreso de cada sprint en tiempo real.', delay: '' },
            { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#a78bfa" strokeWidth="1.6"><path d="M2 6h18M2 11h14M2 16h10"/><rect x="15" y="9" width="5" height="8" rx="1.5" fill="rgba(167,139,250,.15)" stroke="#a78bfa"/></svg>, title: 'Gantt inteligente', desc: 'Visualiza dependencias, detecta cuellos de botella y reajusta fechas con un simple arrastre.', delay: 'lp-d2' },
            { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#2dd4bf" strokeWidth="1.6"><circle cx="11" cy="11" r="9"/><path d="M11 7v4l3 3"/></svg>, title: 'Sprints y ciclos', desc: 'Define ciclos de trabajo, mide velocidad de equipo y exporta reportes de retrospectiva con un clic.', delay: 'lp-d4' },
            { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#3b82f6" strokeWidth="1.6"><rect x="4" y="4" width="14" height="10" rx="2"/><path d="M8 18h6M11 14v4"/><path d="M8 8h2M12 8h2M8 11h6"/></svg>, title: 'Documentación integrada', desc: 'Escribe specs, meeting notes y wikis directamente dentro de cada proyecto. Sin Notion aparte.', delay: 'lp-d1' },
            { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#a78bfa" strokeWidth="1.6"><circle cx="7" cy="8" r="3"/><circle cx="15" cy="8" r="3"/><path d="M2 18c0-2.761 2.239-5 5-5h8c2.761 0 5 2.239 5 5"/></svg>, title: 'Gestión de equipo', desc: 'Roles, permisos granulares, carga de trabajo por miembro y visibilidad total del equipo distribuido.', delay: 'lp-d3' },
            { icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#2dd4bf" strokeWidth="1.6"><path d="M4 16l4-4 3 3 3-4 4 3"/><rect x="2" y="4" width="18" height="14" rx="2"/></svg>, title: 'Reportes en tiempo real', desc: 'Dashboards automáticos con burn-down charts, métricas de entrega y KPIs del equipo sin configuración.', delay: 'lp-d5' },
          ].map((f, i) => (
            <div key={i} className={`lp-feature-card lp-reveal-scale ${f.delay}`}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, rgba(59,130,246,.1), rgba(167,139,250,.1))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#0a0a0f', marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 14.5, color: '#5a5a72', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <div id="lp-how" style={{ background: '#f8f8fc', padding: 'clamp(80px, 10vw, 120px) 0' }}>
        <div className="lp-how-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(24px, 5vw, 80px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>

          {/* Steps */}
          <div>
            <div style={{ marginBottom: 48 }}>
              <p className="lp-reveal" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 14 }}>Proceso</p>
              <h2 className="lp-reveal lp-d1" style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-.02em', color: '#0a0a0f', marginBottom: 16 }}>
                De la idea<br />a la entrega
              </h2>
              <p className="lp-reveal lp-d2" style={{ fontSize: 18, color: '#5a5a72', lineHeight: 1.65, maxWidth: 520 }}>
                Seitra convierte el caos de un proyecto en un flujo predecible y sin fricciones.
              </p>
            </div>
            {[
              { num: '01', title: 'Crea tu espacio de trabajo', desc: 'Invita a tu equipo, define áreas de proyecto y configura el flujo de trabajo en menos de 5 minutos.', delay: '' },
              { num: '02', title: 'Planifica con contexto', desc: 'Desglosa objetivos en tareas accionables. Asigna responsables, fechas y prioridades desde el primer día.', delay: 'lp-d2' },
              { num: '03', title: 'Ejecuta y monitorea', desc: 'Cada miembro sabe qué hacer hoy. Tú ves el progreso global sin tener que preguntar.', delay: 'lp-d3' },
              { num: '04', title: 'Itera y mejora', desc: 'Retrospectivas automáticas, datos de velocidad y sugerencias para el siguiente sprint.', delay: 'lp-d4' },
            ].map((step, i) => (
              <div key={i} className={`lp-step lp-reveal-left ${step.delay}`} style={{ display: 'flex', gap: 20, marginBottom: 36, position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #a78bfa)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: "'Geist Mono', monospace", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,.3)' }}>{step.num}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#0a0a0f', marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 14.5, color: '#5a5a72', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Gantt */}
          <div className="lp-reveal-right lp-d1" style={{ marginTop: 40 }}>
            <div style={{ background: '#fff', border: '1px solid #e8e8f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04)' }}>
              <div style={{ background: '#f4f4f8', borderBottom: '1px solid #e8e8f0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0a0a0f' }}>Proyecto Plataforma Core — Q2 2025</div>
                <div style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: '#5a5a72' }}>Abr — Sep</div>
              </div>
              {/* Month headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(6, 1fr)', borderBottom: '1px solid #e8e8f0', background: '#fafafd' }}>
                {['Tarea', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'].map((m, i) => (
                  <div key={i} style={{ padding: '8px 10px', fontSize: 11, fontFamily: "'Geist Mono', monospace", color: '#9494a8', textAlign: i === 0 ? 'left' : 'center', borderLeft: i === 0 ? 'none' : '1px solid #e8e8f0' }}>{m}</div>
                ))}
              </div>
              {[
                { task: 'Investigación', bar: { left: '2%', width: '28%', bg: 'linear-gradient(90deg,#3b82f6,#60a5fa)', label: 'Inv.' } },
                { task: 'Diseño UX',     bar: { left: '20%', width: '36%', bg: 'linear-gradient(90deg,#a78bfa,#c4b5fd)', label: 'UX' } },
                { task: 'Desarrollo',    bar: { left: '36%', width: '48%', bg: 'linear-gradient(90deg,#2dd4bf,#5eead4)', label: 'Dev' } },
                { task: 'QA & Testing',  bar: { left: '68%', width: '24%', bg: 'linear-gradient(90deg,#f59e0b,#fbbf24)', label: 'QA' } },
                { task: 'Lanzamiento',   bar: { left: '86%', width: '12%', bg: 'linear-gradient(90deg,#ec4899,#f472b6)', label: '🚀' } },
              ].map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', borderBottom: i < 4 ? '1px solid #e8e8f0' : 'none', alignItems: 'center', minHeight: 40 }}>
                  <div style={{ padding: '0 10px', fontSize: 12, color: '#5a5a72', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.task}</div>
                  <div style={{ position: 'relative', padding: '8px 0', gridColumn: '2 / -1' }}>
                    <div className="lp-gantt-bar" style={{ left: row.bar.left, width: row.bar.width, background: row.bar.bg }}>{row.bar.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── METRICS ── */}
      <section id="lp-metrics" style={{ padding: 'clamp(80px, 10vw, 120px) clamp(24px, 5vw, 80px)', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <p className="lp-reveal" style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 14 }}>Lo que vas a lograr</p>
        <h2 className="lp-reveal lp-d1" style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-.02em', color: '#0a0a0f', marginBottom: 16 }}>
          Diseñado para que<br />tu equipo entregue más
        </h2>
        <p className="lp-reveal lp-d2" style={{ fontSize: 18, color: '#5a5a72', maxWidth: 520, lineHeight: 1.65, margin: '0 auto' }}>
          Seitra está construido con un principio claro: menos fricción entre la decisión y la ejecución.
        </p>
        <div className="lp-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, marginTop: 60 }}>
          {[
            { num: '5 min', label: 'Para tener tu primer proyecto activo', sub: 'Sin onboarding interminable. Sin configuraciones innecesarias. Solo empieza.', delay: '' },
            { num: '1 lugar', label: 'Para tareas, docs, timelines y equipo', sub: 'Deja de saltar entre Notion, Jira, Slack y hojas de cálculo. Todo vive aquí.', delay: 'lp-d2' },
            { num: '0 dudas', label: 'Sobre quién hace qué y para cuándo', sub: 'Visibilidad total del equipo sin tener que preguntar. El avance es siempre visible.', delay: 'lp-d4' },
          ].map((m, i) => (
            <div key={i} className={`lp-metric-card lp-reveal-scale ${m.delay}`}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(48px, 6vw, 72px)', lineHeight: 1, marginBottom: 8, background: 'linear-gradient(135deg, #3b82f6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{m.num}</div>
              <div style={{ fontSize: 16, color: '#0a0a0f', fontWeight: 600, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 13.5, color: '#5a5a72', marginTop: 4, lineHeight: 1.55 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: 'clamp(60px, 8vw, 100px) 0', maxWidth: '100%' }}>
        <div className="lp-reveal" style={{ background: '#0a0a0f', position: 'relative', overflow: 'hidden', margin: '0 clamp(24px, 4vw, 60px)', borderRadius: 20, padding: 'clamp(60px, 8vw, 100px) clamp(24px, 5vw, 80px)', textAlign: 'center' }}>
          {/* Radial gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(59,130,246,.25) 0%, rgba(167,139,250,.15) 40%, transparent 75%)', pointerEvents: 'none' }} />
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', marginBottom: 16, position: 'relative' }}>Empieza hoy</p>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: 'italic', fontSize: 'clamp(32px, 5vw, 60px)', color: '#fff', lineHeight: 1.1, marginBottom: 20, position: 'relative' }}>
            El momento de ordenar<br />tu equipo es ahora
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.6)', marginBottom: 40, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65, position: 'relative' }}>
            Configura tu primer proyecto en menos de 5 minutos. Sin tarjeta de crédito. Sin contratos.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <button className="lp-btn-cta-white" onClick={onGetStarted}>Crear cuenta gratis</button>
            <button className="lp-btn-cta-ghost" onClick={() => scrollTo('#lp-how')}>Ver cómo funciona</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '48px clamp(24px, 5vw, 80px)', borderTop: '1px solid #e8e8f0', maxWidth: 1200, margin: '60px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20 }}>
          Sei<span style={{ color: '#3b82f6' }}>tra</span>
        </div>
        <ul style={{ display: 'flex', gap: 28, listStyle: 'none' }}>
          {[
            { label: 'Funciones', action: () => scrollTo('#lp-features') },
            { label: 'Cómo funciona', action: () => scrollTo('#lp-how') },
          ].map((link, i) => (
            <li key={i}><button className="lp-footer-link" onClick={link.action}>{link.label}</button></li>
          ))}
        </ul>
        <div style={{ fontSize: 13, color: '#9494a8', fontFamily: "'Geist Mono', monospace" }}>© 2025 Seitra. Hecho en Latam.</div>
      </footer>
    </div>
  );
}
