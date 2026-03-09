import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight, Sparkles, FolderKanban, BarChart3, Users,
  CheckCircle2, Target, TrendingUp, Star, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { DESIGN_TOKENS } from '../styles/tokens';

// ─── HOOKS ────────────────────────────────────────────────────────────────────

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
  }, [display, deleting, wordIdx, words, typingSpeed, deletingSpeed, pause]);
  return display;
};

const useCountUp = (target, duration = 1800, active = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVal(0);
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return val;
};

// ─── DASHBOARD MOCKUP ─────────────────────────────────────────────────────────

const DashboardMockup = () => {
  const tasks = [
    { color: '#10b981', label: 'Diseño UI', prog: 75, tag: 'En progreso' },
    { color: '#6366f1', label: 'API Backend', prog: 45, tag: 'En progreso' },
    { color: '#f59e0b', label: 'QA Testing', prog: 90, tag: 'Revisión' },
    { color: '#ec4899', label: 'Deploy v2.1', prog: 20, tag: 'Pendiente' },
  ];
  return (
    <div style={{ background: '#111827', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6)', userSelect: 'none' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px', background: '#0d1117' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, margin: '0 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '3px 10px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          app.seitra.io/dashboard
        </div>
      </div>
      <div style={{ display: 'flex', height: '240px' }}>
        <div style={{ width: '52px', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          {[FolderKanban, BarChart3, Users, Target].map((Icon, i) => (
            <div key={i} style={{ width: '30px', height: '30px', borderRadius: '8px', background: i === 0 ? 'rgba(99,102,241,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#6366f1' : 'rgba(255,255,255,0.2)' }}>
              <Icon size={13} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: '14px', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Sprint Actual</span>
            <span style={{ fontSize: '10px', padding: '1px 8px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '20px' }}>Activo</span>
          </div>
          {tasks.map((t, i) => (
            <div key={i} style={{ marginBottom: '8px', animation: `mockupFadeIn 0.5s ease ${0.1 * i + 0.3}s backwards` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.color }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{t.label}</span>
                </div>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', padding: '1px 5px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>{t.tag}</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${t.prog}%`, borderRadius: '3px', background: t.color, animation: `progressGrow 1s ease ${0.2 * i + 0.5}s backwards` }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Velocidad del equipo</div>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '28px' }}>
              {[30, 55, 40, 70, 60, 85, 75].map((h, i) => (
                <div key={i} style={{ flex: 1, background: i === 6 ? '#6366f1' : 'rgba(99,102,241,0.3)', borderRadius: '2px 2px 0 0', height: `${h}%`, animation: `barGrow 0.6s ease ${0.08 * i + 0.8}s backwards` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── KANBAN MOCKUP ─────────────────────────────────────────────────────────────

const KanbanMockup = () => {
  const cols = [
    { title: 'Por hacer', color: '#94a3b8', cards: ['Investigación UX', 'Benchmark'] },
    { title: 'En progreso', color: '#6366f1', cards: ['Wireframes', 'API usuarios'] },
    { title: 'Revisión', color: '#f59e0b', cards: ['Tests integración'] },
    { title: 'Listo', color: '#10b981', cards: ['Diseño sistema', 'Auth módulo'] },
  ];
  return (
    <div style={{ background: '#111827', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', userSelect: 'none' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px', background: '#0d1117' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, margin: '0 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '3px 10px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          Tablero Kanban · Sprint 12
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', padding: '12px' }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{col.title}</span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{col.cards.length}</span>
            </div>
            {col.cards.map((card, ki) => (
              <div key={ki} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '7px 8px', marginBottom: '5px', border: '1px solid rgba(255,255,255,0.06)', animation: `mockupFadeIn 0.4s ease ${ci * 0.1 + ki * 0.07}s backwards` }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.3, marginBottom: '5px' }}>{card}</div>
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${35 + ki * 25 + ci * 8}%`, background: col.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── STAT CARD (usa useCountUp como componente individual) ────────────────────

const StatCard = ({ value, suffix, label, active }) => {
  const count = useCountUp(value, 1800, active);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', fontWeight: 900, letterSpacing: '-2px', color: 'white', lineHeight: 1, marginBottom: '6px' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3px' }}>{label}</div>
    </div>
  );
};

// ─── SLIDE 1: HERO ────────────────────────────────────────────────────────────

const SlideHero = ({ onGetStarted, typeword }) => (
  <div style={{ height: '100%', background: '#080c14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 10vw, 80px) clamp(16px, 6vw, 40px)', position: 'relative', overflow: 'hidden' }}>
    {/* Orbs */}
    <div style={{ position: 'absolute', top: '8%', left: '10%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'orbFloat1 12s ease-in-out infinite', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', animation: 'orbFloat2 15s ease-in-out infinite', pointerEvents: 'none' }} />
    {/* Grid overlay */}
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

    {/* Content */}
    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '820px', width: '100%' }}>
      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '50px', marginBottom: '28px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '13px', fontWeight: 600, color: '#a5b4fc', animation: 'fadeIn 1s ease 0.2s backwards' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'pulse 2s infinite' }} />
        Gestión de proyectos reimaginada
      </div>

      {/* Headline */}
      <h1 style={{ fontSize: 'clamp(38px, 6.5vw, 80px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1.05, color: 'white', margin: '0 0 16px', animation: 'fadeUp 0.9s ease 0.4s backwards' }}>
        Tu equipo entrega
        <br />
        <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {typeword}
          <span style={{ WebkitTextFillColor: '#6366f1', animation: 'blink 0.9s step-end infinite' }}>|</span>
        </span>
      </h1>

      <p style={{ fontSize: 'clamp(14px, 1.6vw, 18px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: '540px', margin: '20px auto 36px', animation: 'fadeUp 0.9s ease 0.6s backwards' }}>
        SEITRA une proyectos, tareas, sprints y analítica en un solo lugar. Menos ruido. Más ejecución.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.9s ease 0.8s backwards' }}>
        <button onClick={onGetStarted}
          style={{ padding: '13px 30px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
          Comenzar gratis <ArrowRight size={16} />
        </button>
        <button onClick={onGetStarted}
          style={{ padding: '13px 30px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
          Iniciar sesión
        </button>
      </div>

      {/* Social proof */}
      <div style={{ marginTop: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', animation: 'fadeIn 1s ease 1s backwards' }}>
        <div style={{ display: 'flex' }}>
          {['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'].map((c, i) => (
            <div key={i} style={{ width: '26px', height: '26px', borderRadius: '50%', background: c, border: '2px solid #080c14', marginLeft: i === 0 ? 0 : '-7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'white' }}>
              {['J', 'M', 'A', 'P', 'R'][i]}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[...Array(5)].map((_, i) => <Star key={i} size={11} style={{ fill: '#f59e0b', color: '#f59e0b' }} />)}
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginLeft: '4px' }}>+500 equipos activos</span>
        </div>
      </div>
    </div>

    {/* Dashboard preview */}
    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '680px', marginTop: '40px', animation: 'fadeUp 1s ease 1s backwards' }}>
      <DashboardMockup />
      <div style={{ position: 'absolute', bottom: '-30px', left: '10%', right: '10%', height: '50px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(16px)', pointerEvents: 'none' }} />
    </div>
  </div>
);

// ─── SLIDE 2: FEATURES ────────────────────────────────────────────────────────

const SlideFeatures = () => {
  const features = [
    {
      icon: FolderKanban, color: '#6366f1', bg: 'rgba(99,102,241,0.07)',
      title: 'Kanban & Sprints',
      desc: 'Tableros arrastrables, backlog priorizado y sprints con burndown en tiempo real.',
      items: ['Tableros Kanban multi-columna', 'Sprints con planning automático', 'Backlog y epics organizados']
    },
    {
      icon: BarChart3, color: '#10b981', bg: 'rgba(16,185,129,0.07)',
      title: 'Analítica en vivo',
      desc: 'Visualiza el progreso, detecta cuellos de botella y toma decisiones con datos reales.',
      items: ['Dashboards personalizables', 'Reportes de velocidad del equipo', 'Métricas por miembro']
    },
    {
      icon: Users, color: '#f59e0b', bg: 'rgba(245,158,11,0.07)',
      title: 'Colaboración total',
      desc: 'Comentarios en contexto, menciones y actividad en tiempo real. Siempre sincronizados.',
      items: ['Comentarios y menciones', 'Gestión de roles y permisos', 'Historial de actividad']
    }
  ];

  return (
    <div style={{ height: '100%', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 10vw, 80px) clamp(16px, 6vw, 40px)' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#6366f1', marginBottom: '12px' }}>
          Por qué elegir SEITRA
        </p>
        <h2 style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-2px', color: '#0f172a', lineHeight: 1.1, maxWidth: '560px', margin: '0 auto' }}>
          Todo lo que tu equipo necesita para ejecutar
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))', gap: '20px', maxWidth: '980px', width: '100%' }}>
        {features.map((f, i) => (
          <div key={i}
            style={{ background: f.bg, borderRadius: '20px', padding: '28px', border: `1px solid ${f.color}20`, transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 60px ${f.color}25`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <f.icon size={20} color={f.color} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.3px' }}>{f.title}</h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '18px' }}>{f.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {f.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={13} color={f.color} />
                  <span style={{ fontSize: '13px', color: '#475569' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SLIDE 3: DEMO ────────────────────────────────────────────────────────────

const SlideDemo = () => {
  const steps = [
    { icon: Zap, color: '#6366f1', text: 'Crea sprints en segundos con el planning automático' },
    { icon: TrendingUp, color: '#10b981', text: 'Mide velocidad real del equipo con burndown en vivo' },
    { icon: Target, color: '#f59e0b', text: 'Cierra sprints y genera reportes con un solo clic' },
  ];

  return (
    <div style={{ height: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 10vw, 80px) clamp(16px, 6vw, 40px)', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1080px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '60px', alignItems: 'center' }}>
        {/* Text */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#10b981', marginBottom: '16px' }}>
            Así se ve en acción
          </p>
          <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 46px)', fontWeight: 900, letterSpacing: '-2px', color: 'white', lineHeight: 1.1, marginBottom: '18px' }}>
            Del tablero al sprint, sin fricción
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '30px' }}>
            Arrastra, prioriza y asigna. Tu equipo siempre sabe qué hacer y qué viene después.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {steps.map(({ icon: Icon, color, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, paddingTop: '7px' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Kanban */}
        <div>
          <KanbanMockup />
        </div>
      </div>
    </div>
  );
};

// ─── SLIDE 4: CTA ─────────────────────────────────────────────────────────────

const SlideCTA = ({ onGetStarted, active }) => {
  const stats = [
    { value: 10000, suffix: '+', label: 'Proyectos gestionados' },
    { value: 98, suffix: '%', label: 'Satisfacción' },
    { value: 500, suffix: '+', label: 'Equipos activos' },
    { value: 40, suffix: '%', label: 'Más velocidad' },
  ];
  const perks = ['Sin tarjeta de crédito', 'Gratis para siempre', 'Setup en 5 minutos'];

  return (
    <div style={{ height: '100%', background: 'linear-gradient(135deg, #080c14 0%, #0f172a 60%, #0c1a3e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(40px, 10vw, 80px) clamp(16px, 6vw, 40px)', position: 'relative', overflow: 'hidden' }}>
      {/* glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '60px' }}>
          {stats.map((s, i) => <StatCard key={i} {...s} active={active} />)}
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-2.5px', color: 'white', lineHeight: 1.05, marginBottom: '18px' }}>
          Empieza a entregar
          <br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            resultados hoy
          </span>
        </h2>

        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 36px' }}>
          Sin configuración compleja. Tu equipo productivo desde el primer día.
        </p>

        <button onClick={onGetStarted}
          style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '28px', transition: 'all 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(99,102,241,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
          Crear cuenta gratuita <ArrowRight size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {perks.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
              <CheckCircle2 size={13} color="#10b981" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted }) {
  const [slide, setSlide] = useState(0);
  const TOTAL = 4;
  const wheelLocked = useRef(false);
  const typeword = useTypewriter(['más rápido.', 'sin caos.', 'con claridad.', 'en equipo.']);

  const go = useCallback((n) => {
    const next = Math.max(0, Math.min(TOTAL - 1, n));
    setSlide(next);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') go(slide + 1);
      if (e.key === 'ArrowUp' || e.key === 'PageUp') go(slide - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [slide, go]);

  // Wheel/scroll navigation
  useEffect(() => {
    const h = e => {
      e.preventDefault();
      if (wheelLocked.current) return;
      wheelLocked.current = true;
      if (e.deltaY > 20) go(slide + 1);
      else if (e.deltaY < -20) go(slide - 1);
      setTimeout(() => { wheelLocked.current = false; }, 900);
    };
    window.addEventListener('wheel', h, { passive: false });
    return () => window.removeEventListener('wheel', h);
  }, [slide, go]);

  const slideLabels = ['Inicio', 'Funciones', 'Demo', 'Empezar'];

  return (
    <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse    { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes blink    { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes orbFloat1{ 0%, 100% { transform: translate(0,0); } 50% { transform: translate(30px,-40px); } }
        @keyframes orbFloat2{ 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-25px,30px); } }
        @keyframes mockupFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes progressGrow { from { width: 0; } to { width: 100%; } }
        @keyframes barGrow  { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); } }
      `}</style>

      {/* ── NAVBAR (fixed, visible en todos los slides) ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500, padding: '0 clamp(16px, 5vw, 40px)', height: '58px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(8,12,20,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', fontWeight: 900, letterSpacing: '-0.5px', color: 'white' }}>
          <div style={{ width: '27px', height: '27px', borderRadius: '7px', background: 'linear-gradient(135deg, #6366f1, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} color="white" />
          </div>
          SEITRA
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onGetStarted} style={{ padding: '7px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '7px', color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}>
            Iniciar sesión
          </button>
          <button onClick={onGetStarted} style={{ padding: '7px 18px', background: 'white', border: 'none', borderRadius: '7px', color: '#0f172a', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.88'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* ── DOT NAV (derecha) ── */}
      <div style={{ position: 'fixed', right: 'clamp(12px, 4vw, 20px)', top: '50%', transform: 'translateY(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        {slideLabels.map((label, i) => (
          <button
            key={i}
            title={label}
            onClick={() => go(i)}
            style={{ width: i === slide ? 10 : 7, height: i === slide ? 10 : 7, borderRadius: '50%', background: i === slide ? 'white' : 'rgba(255,255,255,0.28)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.35s ease', outline: 'none' }}
          />
        ))}
      </div>

      {/* ── ARROW NAV (abajo centro) ── */}
      <div style={{ position: 'fixed', bottom: 'clamp(12px, 4vw, 20px)', left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.5px', fontFamily: DESIGN_TOKENS.typography.fontFamily }}>
          {slide + 1} / {TOTAL}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => go(slide - 1)}
            disabled={slide === 0}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: slide === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: slide === 0 ? 'rgba(255,255,255,0.15)' : 'white', cursor: slide === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', outline: 'none' }}
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => go(slide + 1)}
            disabled={slide === TOTAL - 1}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: slide === TOTAL - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: slide === TOTAL - 1 ? 'rgba(255,255,255,0.15)' : 'white', cursor: slide === TOTAL - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', outline: 'none' }}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* ── SLIDES ── */}
      {[
        <SlideHero key={0} onGetStarted={onGetStarted} typeword={typeword} />,
        <SlideFeatures key={1} active={slide === 1} />,
        <SlideDemo key={2} active={slide === 2} />,
        <SlideCTA key={3} onGetStarted={onGetStarted} active={slide === 3} />,
      ].map((SlideEl, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${(i - slide) * 100}%)`,
            transition: 'transform 0.75s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
            overflow: 'hidden'
          }}
        >
          {SlideEl}
        </div>
      ))}
    </div>
  );
}
