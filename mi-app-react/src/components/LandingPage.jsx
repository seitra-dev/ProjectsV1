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
  }, [display, deleting, wordIdx]);
  return display;
};

const useCountUp = (target, duration = 1800, active = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
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
      <div style={{ display: 'flex', height: '220px' }}>
        <div style={{ width: '48px', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {[FolderKanban, BarChart3, Users, Target].map((Icon, i) => (
            <div key={i} style={{ width: '28px', height: '28px', borderRadius: '7px', background: i === 0 ? 'rgba(99,102,241,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#6366f1' : 'rgba(255,255,255,0.2)' }}>
              <Icon size={12} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: '12px', overflow: 'hidden' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Sprint Actual</span>
            <span style={{ fontSize: '10px', padding: '1px 8px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '20px' }}>Activo</span>
          </div>
          {tasks.map((t, i) => (
            <div key={i} style={{ marginBottom: '7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.color }} />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{t.label}</span>
                </div>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', padding: '1px 4px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>{t.tag}</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${t.prog}%`, borderRadius: '3px', background: t.color }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', padding: '7px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>Velocidad del equipo</div>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '24px' }}>
              {[30, 55, 40, 70, 60, 85, 75].map((h, i) => (
                <div key={i} style={{ flex: 1, background: i === 6 ? '#6366f1' : 'rgba(99,102,241,0.3)', borderRadius: '2px 2px 0 0', height: `${h}%` }} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '7px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{col.title}</span>
            </div>
            {col.cards.map((card, ki) => (
              <div key={ki} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '6px 7px', marginBottom: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.3, marginBottom: '4px' }}>{card}</div>
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

// ─── STAT CARD ────────────────────────────────────────────────────────────────

const StatCard = ({ value, suffix, label, active }) => {
  const count = useCountUp(value, 1800, active);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(22px, 3vw, 42px)', fontWeight: 900, letterSpacing: '-2px', color: 'white', lineHeight: 1, marginBottom: '5px' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 'clamp(10px, 1.2vw, 12px)', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.3px' }}>{label}</div>
    </div>
  );
};

// ─── SLIDE 1: HERO ────────────────────────────────────────────────────────────

const SlideHero = ({ onGetStarted, typeword }) => (
  <section style={{ minHeight: '100vh', background: '#080c14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(80px, 10vw, 100px) clamp(16px, 5vw, 60px) clamp(60px, 8vw, 80px)', position: 'relative', overflow: 'hidden' }}>
    {/* Orbs */}
    <div style={{ position: 'absolute', top: '8%', left: '10%', width: 'clamp(200px, 35vw, 480px)', height: 'clamp(200px, 35vw, 480px)', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'orbFloat1 12s ease-in-out infinite', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 'clamp(160px, 28vw, 360px)', height: 'clamp(160px, 28vw, 360px)', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', animation: 'orbFloat2 15s ease-in-out infinite', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

    <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '820px', width: '100%' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '50px', marginBottom: 'clamp(16px, 3vw, 28px)', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 'clamp(11px, 1.3vw, 13px)', fontWeight: 600, color: '#a5b4fc', animation: 'fadeIn 1s ease 0.2s backwards' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'pulse 2s infinite' }} />
        Gestión de proyectos reimaginada
      </div>

      <h1 style={{ fontSize: 'clamp(32px, 6.5vw, 80px)', fontWeight: 900, letterSpacing: 'clamp(-1px, -0.04em, -3px)', lineHeight: 1.05, color: 'white', margin: '0 0 clamp(12px, 2vw, 16px)', animation: 'fadeUp 0.9s ease 0.4s backwards' }}>
        Tu equipo entrega
        <br />
        <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {typeword}
          <span style={{ WebkitTextFillColor: '#6366f1', animation: 'blink 0.9s step-end infinite' }}>|</span>
        </span>
      </h1>

      <p style={{ fontSize: 'clamp(13px, 1.6vw, 18px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: '540px', margin: 'clamp(12px, 2vw, 20px) auto clamp(24px, 4vw, 36px)', animation: 'fadeUp 0.9s ease 0.6s backwards' }}>
        SEITRA une proyectos, tareas, sprints y analítica en un solo lugar. Menos ruido. Más ejecución.
      </p>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.9s ease 0.8s backwards' }}>
        <button onClick={onGetStarted}
          style={{ padding: 'clamp(10px, 1.5vw, 13px) clamp(20px, 3vw, 30px)', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '10px', color: 'white', fontSize: 'clamp(13px, 1.4vw, 15px)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
          Comenzar gratis <ArrowRight size={15} />
        </button>
        <button onClick={onGetStarted}
          style={{ padding: 'clamp(10px, 1.5vw, 13px) clamp(20px, 3vw, 30px)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: 'white', fontSize: 'clamp(13px, 1.4vw, 15px)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
          Iniciar sesión
        </button>
      </div>

      <div style={{ marginTop: 'clamp(20px, 3vw, 36px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', animation: 'fadeIn 1s ease 1s backwards' }}>
        <div style={{ display: 'flex' }}>
          {['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'].map((c, i) => (
            <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: '2px solid #080c14', marginLeft: i === 0 ? 0 : '-7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'white' }}>
              {['J', 'M', 'A', 'P', 'R'][i]}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[...Array(5)].map((_, i) => <Star key={i} size={10} style={{ fill: '#f59e0b', color: '#f59e0b' }} />)}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: '4px' }}>+500 equipos activos</span>
        </div>
      </div>
    </div>

    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 'clamp(300px, 80vw, 660px)', marginTop: 'clamp(30px, 5vw, 48px)', animation: 'fadeUp 1s ease 1s backwards' }}>
      <DashboardMockup />
      <div style={{ position: 'absolute', bottom: '-24px', left: '10%', right: '10%', height: '40px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(12px)', pointerEvents: 'none' }} />
    </div>
  </section>
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
    <section style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(80px, 10vw, 100px) clamp(16px, 5vw, 60px) clamp(60px, 8vw, 80px)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(28px, 5vw, 48px)' }}>
        <p style={{ fontSize: 'clamp(10px, 1.1vw, 11px)', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#6366f1', marginBottom: '12px' }}>
          Por qué elegir SEITRA
        </p>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 48px)', fontWeight: 900, letterSpacing: 'clamp(-1px, -0.04em, -2px)', color: '#0f172a', lineHeight: 1.1, maxWidth: '560px', margin: '0 auto' }}>
          Todo lo que tu equipo necesita para ejecutar
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'clamp(12px, 2vw, 20px)', maxWidth: '960px', width: '100%' }}>
        {features.map((f, i) => (
          <div key={i}
            style={{ background: f.bg, borderRadius: '18px', padding: 'clamp(18px, 2.5vw, 28px)', border: `1px solid ${f.color}20`, transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 60px ${f.color}25`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ width: 'clamp(36px, 4vw, 46px)', height: 'clamp(36px, 4vw, 46px)', borderRadius: '12px', background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'clamp(12px, 2vw, 18px)' }}>
              <f.icon size={18} color={f.color} />
            </div>
            <h3 style={{ fontSize: 'clamp(15px, 1.6vw, 18px)', fontWeight: 800, color: '#0f172a', marginBottom: '7px', letterSpacing: '-0.3px' }}>{f.title}</h3>
            <p style={{ fontSize: 'clamp(12px, 1.3vw, 14px)', color: '#64748b', lineHeight: 1.6, marginBottom: 'clamp(12px, 2vw, 18px)' }}>{f.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {f.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <CheckCircle2 size={12} color={f.color} />
                  <span style={{ fontSize: 'clamp(11px, 1.2vw, 13px)', color: '#475569' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
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
    <section style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(80px, 10vw, 100px) clamp(16px, 5vw, 60px) clamp(60px, 8vw, 80px)', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1040px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'clamp(24px, 5vw, 60px)', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 'clamp(10px, 1.1vw, 11px)', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#10b981', marginBottom: 'clamp(10px, 1.5vw, 16px)' }}>
            Así se ve en acción
          </p>
          <h2 style={{ fontSize: 'clamp(22px, 3.8vw, 46px)', fontWeight: 900, letterSpacing: 'clamp(-1px, -0.04em, -2px)', color: 'white', lineHeight: 1.1, marginBottom: 'clamp(10px, 2vw, 18px)' }}>
            Del tablero al sprint, sin fricción
          </h2>
          <p style={{ fontSize: 'clamp(13px, 1.4vw, 15px)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 'clamp(18px, 3vw, 30px)' }}>
            Arrastra, prioriza y asigna. Tu equipo siempre sabe qué hacer y qué viene después.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.5vw, 14px)' }}>
            {steps.map(({ icon: Icon, color, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: 'clamp(28px, 3vw, 34px)', height: 'clamp(28px, 3vw, 34px)', borderRadius: '9px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </div>
                <span style={{ fontSize: 'clamp(12px, 1.3vw, 14px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, paddingTop: '6px' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <KanbanMockup />
        </div>
      </div>
    </section>
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
    <section style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #080c14 0%, #0f172a 60%, #0c1a3e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(80px, 10vw, 100px) clamp(16px, 5vw, 60px) clamp(60px, 8vw, 80px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 'clamp(300px, 50vw, 700px)', height: 'clamp(300px, 50vw, 700px)', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(12px, 2.5vw, 24px)', marginBottom: 'clamp(36px, 6vw, 60px)' }}>
          {stats.map((s, i) => <StatCard key={i} {...s} active={active} />)}
        </div>

        <h2 style={{ fontSize: 'clamp(26px, 5vw, 64px)', fontWeight: 900, letterSpacing: 'clamp(-1px, -0.04em, -2.5px)', color: 'white', lineHeight: 1.05, marginBottom: 'clamp(12px, 2vw, 18px)' }}>
          Empieza a entregar
          <br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            resultados hoy
          </span>
        </h2>

        <p style={{ fontSize: 'clamp(13px, 1.5vw, 16px)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto clamp(24px, 4vw, 36px)' }}>
          Sin configuración compleja. Tu equipo productivo desde el primer día.
        </p>

        <button onClick={onGetStarted}
          style={{ padding: 'clamp(12px, 1.5vw, 16px) clamp(24px, 3.5vw, 40px)', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '12px', color: 'white', fontSize: 'clamp(13px, 1.5vw, 16px)', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: 'clamp(18px, 3vw, 28px)', transition: 'all 0.3s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(99,102,241,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
          Crear cuenta gratuita <ArrowRight size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(10px, 2vw, 20px)', flexWrap: 'wrap' }}>
          {perks.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: 'clamp(11px, 1.2vw, 13px)', color: 'rgba(255,255,255,0.35)' }}>
              <CheckCircle2 size={12} color="#10b981" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted }) {
  const [activeSection, setActiveSection] = useState(0);
  const containerRef = useRef(null);
  const TOTAL = 4;
  const typeword = useTypewriter(['más rápido.', 'sin caos.', 'con claridad.', 'en equipo.']);

  // Track active section on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const sectionHeight = container.clientHeight;
      const idx = Math.round(scrollTop / sectionHeight);
      setActiveSection(Math.max(0, Math.min(TOTAL - 1, idx)));
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const goToSection = useCallback((idx) => {
    const container = containerRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(TOTAL - 1, idx));
    container.scrollTo({ top: clamped * container.clientHeight, behavior: 'smooth' });
  }, []);

  // Keyboard nav
  useEffect(() => {
    const h = e => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') goToSection(activeSection + 1);
      if (e.key === 'ArrowUp' || e.key === 'PageUp') goToSection(activeSection - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activeSection, goToSection]);

  const slideLabels = ['Inicio', 'Funciones', 'Demo', 'Empezar'];

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <style>{`
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse    { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes blink    { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes orbFloat1{ 0%, 100% { transform: translate(0,0); } 50% { transform: translate(30px,-40px); } }
        @keyframes orbFloat2{ 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-25px,30px); } }

        .landing-scroll-container {
          height: 100%;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .landing-scroll-container section {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }

        @media (max-width: 640px) {
          .landing-scroll-container {
            scroll-snap-type: y proximity;
          }
          .landing-scroll-container section {
            min-height: 100svh;
          }
          .dot-nav { display: none !important; }
          .arrow-nav { display: none !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        padding: '0 clamp(12px, 4vw, 40px)', height: '52px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(8,12,20,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'clamp(14px, 1.6vw, 17px)', fontWeight: 900, letterSpacing: '-0.5px', color: 'white' }}>
          <div style={{ width: '25px', height: '25px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={12} color="white" />
          </div>
          SEITRA
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onGetStarted}
            style={{ padding: '6px clamp(12px, 2vw, 18px)', background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '7px', color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 600, cursor: 'pointer' }}>
            Iniciar sesión
          </button>
          <button onClick={onGetStarted}
            style={{ padding: '6px clamp(12px, 2vw, 18px)', background: 'white', border: 'none', borderRadius: '7px', color: '#0f172a', fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, cursor: 'pointer' }}>
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* ── DOT NAV ── */}
      <div className="dot-nav" style={{ position: 'fixed', right: '18px', top: '50%', transform: 'translateY(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {slideLabels.map((label, i) => (
          <button key={i} title={label} onClick={() => goToSection(i)}
            style={{ width: i === activeSection ? 10 : 7, height: i === activeSection ? 10 : 7, borderRadius: '50%', background: i === activeSection ? 'white' : 'rgba(255,255,255,0.28)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.35s ease', outline: 'none' }}
          />
        ))}
      </div>

      {/* ── ARROW NAV ── */}
      <div className="arrow-nav" style={{ position: 'fixed', bottom: '18px', left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.5px' }}>
          {activeSection + 1} / {TOTAL}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => goToSection(activeSection - 1)} disabled={activeSection === 0}
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: activeSection === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: activeSection === 0 ? 'rgba(255,255,255,0.15)' : 'white', cursor: activeSection === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}>
            <ChevronUp size={13} />
          </button>
          <button onClick={() => goToSection(activeSection + 1)} disabled={activeSection === TOTAL - 1}
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: activeSection === TOTAL - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: activeSection === TOTAL - 1 ? 'rgba(255,255,255,0.15)' : 'white', cursor: activeSection === TOTAL - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}>
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* ── SCROLL CONTAINER ── */}
      <div ref={containerRef} className="landing-scroll-container">
        <SlideHero onGetStarted={onGetStarted} typeword={typeword} />
        <SlideFeatures />
        <SlideDemo />
        <SlideCTA onGetStarted={onGetStarted} active={activeSection === 3} />
      </div>
    </div>
  );
}