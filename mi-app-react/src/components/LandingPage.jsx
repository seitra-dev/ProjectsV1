import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight, Sparkles, FolderKanban, BarChart3, Users,
  CheckCircle2, Target, TrendingUp, Star, Zap, ChevronDown, ChevronUp
} from 'lucide-react';

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
    { label: 'Diseño UI',   prog: 75  },
    { label: 'API Backend', prog: 45  },
    { label: 'QA Testing',  prog: 90  },
    { label: 'Deploy v2.1', prog: 20  },
  ];
  return (
    <div style={{ background:'#18181b', borderRadius:'14px', border:'1px solid rgba(255,255,255,0.1)', overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)', userSelect:'none' }}>
      {/* Titlebar */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:'6px', background:'#111113' }}>
        {['#ef4444','#eab308','#22c55e'].map((c,i)=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:c,opacity:0.7}}/>)}
        <div style={{ flex:1, margin:'0 10px', background:'rgba(255,255,255,0.06)', borderRadius:'4px', padding:'2px 10px', fontSize:'10px', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>
          app.seitra.io/dashboard
        </div>
      </div>
      <div style={{ display:'flex', height:'220px' }}>
        {/* Sidebar */}
        <div style={{ width:'44px', borderRight:'1px solid rgba(255,255,255,0.06)', padding:'10px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
          {[FolderKanban,BarChart3,Users,Target].map((Icon,i)=>(
            <div key={i} style={{ width:'26px', height:'26px', borderRadius:'7px', background: i===0 ? 'rgba(59,130,246,0.2)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', color: i===0 ? '#60a5fa' : 'rgba(255,255,255,0.2)' }}>
              <Icon size={12}/>
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex:1, padding:'14px', overflow:'hidden' }}>
          <div style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.8)', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Sprint Actual</span>
            <span style={{ fontSize:'9px', padding:'2px 8px', background:'rgba(34,197,94,0.15)', color:'#4ade80', borderRadius:'20px', fontWeight:500 }}>● Activo</span>
          </div>
          {tasks.map((t,i)=>(
            <div key={i} style={{ marginBottom:'9px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontSize:'10px', color: i===0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)', fontWeight: i===0 ? 500 : 400 }}>{t.label}</span>
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)' }}>{t.prog}%</span>
              </div>
              <div style={{ height:'2px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${t.prog}%`, borderRadius:'2px', background: i===0 ? '#3b82f6' : 'rgba(255,255,255,0.15)' }}/>
              </div>
            </div>
          ))}
          {/* Sparkline */}
          <div style={{ marginTop:'12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'8px 10px', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', marginBottom:'6px', fontWeight:500, letterSpacing:'0.4px', textTransform:'uppercase' }}>Velocidad</div>
            <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'24px' }}>
              {[30,55,40,70,60,85,75].map((h,i)=>(
                <div key={i} style={{ flex:1, background: i===6 ? '#3b82f6' : 'rgba(255,255,255,0.08)', borderRadius:'2px 2px 0 0', height:`${h}%` }}/>
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
    { title:'Por hacer',   dot:'rgba(255,255,255,0.2)', cards:['Investigación UX','Benchmark'] },
    { title:'En progreso', dot:'#3b82f6',               cards:['Wireframes v2','API usuarios'] },
    { title:'Revisión',    dot:'#f59e0b',               cards:['Tests integración'] },
    { title:'Listo',       dot:'#22c55e',               cards:['Auth módulo'] },
  ];
  return (
    <div style={{ background:'#18181b', borderRadius:'14px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', userSelect:'none' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:'6px', background:'#111113' }}>
        {['#ef4444','#eab308','#22c55e'].map((c,i)=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:c,opacity:0.7}}/>)}
        <div style={{ flex:1, margin:'0 10px', background:'rgba(255,255,255,0.06)', borderRadius:'4px', padding:'2px 10px', fontSize:'10px', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>
          Kanban · Sprint 12
        </div>
      </div>
      <div style={{ display:'flex', gap:'6px', padding:'12px' }}>
        {cols.map((col,ci)=>(
          <div key={ci} style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'7px' }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:col.dot }}/>
              <span style={{ fontSize:'9px', fontWeight:500, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{col.title}</span>
            </div>
            {col.cards.map((card,ki)=>(
              <div key={ki} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'7px', padding:'7px 8px', marginBottom:'4px', border:'1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', lineHeight:1.4 }}>{card}</div>
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
    <div style={{ textAlign:'center', padding:'clamp(16px,2vw,24px) 12px', background:'rgba(255,255,255,0.04)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize:'clamp(24px,3vw,44px)', fontWeight:600, letterSpacing:'-2px', color:'white', lineHeight:1, marginBottom:'6px' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:400 }}>{label}</div>
    </div>
  );
};

// ─── SLIDE 1: HERO (DARK) ─────────────────────────────────────────────────────

const SlideHero = ({ onGetStarted, typeword }) => (
  <section style={{ minHeight:'100vh', background:'#09090b', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'clamp(100px,12vw,130px) clamp(20px,6vw,80px) clamp(60px,8vw,80px)', position:'relative', overflow:'hidden' }}>

    {/* Mesh gradient background */}
    <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.15) 0%, transparent 60%)', pointerEvents:'none' }}/>
    <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.07) 0%, transparent 55%)', pointerEvents:'none' }}/>

    {/* Dot grid */}
    <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none', maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)', WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }}/>

    <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:'800px', width:'100%' }}>

      {/* Badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'5px 14px 5px 6px', borderRadius:'50px', marginBottom:'clamp(28px,4vw,44px)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.6)', backdropFilter:'blur(8px)', animation:'fadeIn 0.6s ease 0.1s backwards' }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Sparkles size={9} color="white"/>
        </div>
        Gestión de proyectos reimaginada
      </div>

      {/* Headline */}
      <h1 style={{ fontSize:'clamp(40px,7vw,88px)', fontWeight:700, letterSpacing:'-0.04em', lineHeight:1.02, color:'white', margin:'0 0 6px', animation:'fadeUp 0.6s ease 0.2s backwards' }}>
        Tu equipo entrega
      </h1>
      <h1 style={{ fontSize:'clamp(40px,7vw,88px)', fontWeight:700, letterSpacing:'-0.04em', lineHeight:1.02, margin:'0 0 clamp(22px,3vw,34px)', animation:'fadeUp 0.6s ease 0.3s backwards' }}>
        <span style={{ background:'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          {typeword}
        </span>
        <span style={{ WebkitTextFillColor:'#60a5fa', animation:'blink 0.9s step-end infinite' }}>|</span>
      </h1>

      {/* Subtext */}
      <p style={{ fontSize:'clamp(15px,1.7vw,19px)', color:'rgba(255,255,255,0.4)', lineHeight:1.75, maxWidth:'480px', margin:'0 auto clamp(30px,4vw,46px)', animation:'fadeUp 0.6s ease 0.4s backwards', fontWeight:300 }}>
        SEITRA une proyectos, tareas, sprints y analítica en un solo lugar. Menos ruido. Más ejecución.
      </p>

      {/* CTAs */}
      <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap', animation:'fadeUp 0.6s ease 0.5s backwards' }}>
        <button onClick={onGetStarted}
          style={{ padding:'clamp(12px,1.5vw,15px) clamp(24px,3vw,36px)', background:'white', border:'none', borderRadius:'10px', color:'#09090b', fontSize:'14px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', transition:'all 0.2s ease' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='#f4f4f5'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(255,255,255,0.15)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='white'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
          Comenzar gratis <ArrowRight size={14}/>
        </button>
        <button onClick={onGetStarted}
          style={{ padding:'clamp(12px,1.5vw,15px) clamp(24px,3vw,36px)', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'10px', color:'rgba(255,255,255,0.75)', fontSize:'14px', fontWeight:500, cursor:'pointer', transition:'all 0.2s ease', backdropFilter:'blur(8px)' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; }}>
          Iniciar sesión
        </button>
      </div>

      {/* Social proof */}
      <div style={{ marginTop:'clamp(28px,4vw,48px)', display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', flexWrap:'wrap', animation:'fadeIn 0.7s ease 0.7s backwards' }}>
        <div style={{ display:'flex' }}>
          {['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b'].map((c,i)=>(
            <div key={i} style={{ width:'26px', height:'26px', borderRadius:'50%', background:c, border:'2px solid #09090b', marginLeft:i===0?0:'-7px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'white' }}>
              {['J','M','A','P','R'][i]}
            </div>
          ))}
        </div>
        <div style={{ width:'1px', height:'16px', background:'rgba(255,255,255,0.1)' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          {[...Array(5)].map((_,i)=><Star key={i} size={11} style={{ fill:'#f59e0b', color:'#f59e0b' }}/>)}
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', marginLeft:'5px', fontWeight:400 }}>+500 equipos activos</span>
        </div>
      </div>
    </div>

    {/* Dashboard mockup */}
    <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'clamp(320px,72vw,680px)', marginTop:'clamp(40px,6vw,64px)', animation:'fadeUp 0.9s ease 0.7s backwards' }}>
      <DashboardMockup/>
      {/* Glow under mockup */}
      <div style={{ position:'absolute', bottom:'-30px', left:'20%', right:'20%', height:'60px', background:'radial-gradient(ellipse, rgba(59,130,246,0.3) 0%, transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }}/>
    </div>

    {/* Bottom fade */}
    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'120px', background:'linear-gradient(to bottom, transparent, #09090b)', pointerEvents:'none' }}/>
  </section>
);

// ─── SLIDE 2: FEATURES (LIGHT) ────────────────────────────────────────────────

const SlideFeatures = () => {
  const cards = [
    {
      icon: FolderKanban,
      accent: '#3b82f6',
      accentBg: '#eff6ff',
      title: 'Kanban & Sprints',
      desc: 'Tableros arrastrables, backlog priorizado y sprints con burndown en tiempo real.',
      items: ['Tableros Kanban multi-columna', 'Sprints con planning automático', 'Backlog y epics organizados'],
      span: 1,
    },
    {
      icon: BarChart3,
      accent: '#8b5cf6',
      accentBg: '#f5f3ff',
      title: 'Analítica en vivo',
      desc: 'Visualiza el progreso, detecta cuellos de botella y toma decisiones con datos reales.',
      items: ['Dashboards personalizables', 'Reportes de velocidad', 'Métricas por miembro'],
      span: 1,
    },
    {
      icon: Users,
      accent: '#10b981',
      accentBg: '#f0fdf4',
      title: 'Colaboración total',
      desc: 'Comentarios en contexto, menciones y actividad en tiempo real. Siempre sincronizados.',
      items: ['Comentarios y menciones', 'Gestión de roles y permisos', 'Historial de actividad'],
      span: 2,
    },
  ];

  return (
    <section style={{ minHeight:'100vh', background:'#f8f8f8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'clamp(80px,10vw,120px) clamp(20px,6vw,80px)' }}>

      <div style={{ textAlign:'center', marginBottom:'clamp(40px,6vw,64px)' }}>
        <p style={{ fontSize:'11px', fontWeight:600, letterSpacing:'2.5px', textTransform:'uppercase', color:'#3b82f6', marginBottom:'14px' }}>
          Por qué elegir SEITRA
        </p>
        <h2 style={{ fontSize:'clamp(26px,4.5vw,54px)', fontWeight:700, letterSpacing:'-0.04em', color:'#09090b', lineHeight:1.08, margin:'0 0 14px' }}>
          Todo lo que tu equipo necesita
        </h2>
        <p style={{ fontSize:'clamp(14px,1.5vw,16px)', color:'#71717a', lineHeight:1.75, fontWeight:300, maxWidth:'440px', margin:'0 auto' }}>
          Una sola plataforma. Cero cambios de contexto.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'clamp(10px,1.5vw,14px)', maxWidth:'900px', width:'100%' }}>
        {cards.map((c,i) => (
          <div key={i}
            style={{ gridColumn:`span ${c.span}`, background:'white', borderRadius:'20px', padding:'clamp(24px,3vw,34px)', border:'1px solid #e4e4e7', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', transition:'transform 0.2s ease, box-shadow 0.2s ease', cursor:'default', display: c.span===2 ? 'grid' : 'flex', flexDirection: c.span===2 ? undefined : 'column', gridTemplateColumns: c.span===2 ? 'repeat(auto-fit,minmax(200px,1fr))' : undefined, gap: c.span===2 ? '32px' : 0, alignItems: c.span===2 ? 'start' : undefined }}
            onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 40px rgba(0,0,0,0.08)`; }}
            onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'; }}>
            <div>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:c.accentBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'18px', border:`1px solid ${c.accent}18` }}>
                <c.icon size={18} color={c.accent}/>
              </div>
              <h3 style={{ fontSize:'clamp(15px,1.6vw,18px)', fontWeight:600, color:'#09090b', marginBottom:'8px', letterSpacing:'-0.3px' }}>{c.title}</h3>
              <p style={{ fontSize:'clamp(12px,1.3vw,14px)', color:'#71717a', lineHeight:1.7, fontWeight:300, marginBottom: c.span===2 ? 0 : '20px' }}>{c.desc}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {c.items.map((item,j)=>(
                <div key={j} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:c.accentBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <CheckCircle2 size={10} color={c.accent}/>
                  </div>
                  <span style={{ fontSize:'13px', color:'#52525b', fontWeight:400 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── SLIDE 3: DEMO (DARK) ─────────────────────────────────────────────────────

const SlideDemo = () => {
  const steps = [
    { icon:Zap,        color:'#60a5fa', text:'Crea sprints en segundos con el planning automático' },
    { icon:TrendingUp, color:'#a78bfa', text:'Mide velocidad real del equipo con burndown en vivo' },
    { icon:Target,     color:'#34d399', text:'Cierra sprints y genera reportes con un solo clic' },
  ];
  return (
    <section style={{ minHeight:'100vh', background:'#09090b', display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(80px,10vw,120px) clamp(20px,6vw,80px)', overflow:'hidden', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 50% at 70% 60%, rgba(139,92,246,0.08) 0%, transparent 60%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none', maskImage:'radial-gradient(ellipse 70% 70% at 70% 50%, black 20%, transparent 100%)', WebkitMaskImage:'radial-gradient(ellipse 70% 70% at 70% 50%, black 20%, transparent 100%)' }}/>

      <div style={{ maxWidth:'980px', width:'100%', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap:'clamp(40px,7vw,80px)', alignItems:'center', position:'relative', zIndex:1 }}>
        <div>
          <p style={{ fontSize:'11px', fontWeight:600, letterSpacing:'2.5px', textTransform:'uppercase', color:'#60a5fa', marginBottom:'clamp(12px,1.8vw,18px)' }}>
            Así se ve en acción
          </p>
          <h2 style={{ fontSize:'clamp(26px,4vw,48px)', fontWeight:700, letterSpacing:'-0.04em', color:'white', lineHeight:1.06, marginBottom:'clamp(12px,1.8vw,18px)' }}>
            Del tablero al sprint, sin fricción
          </h2>
          <p style={{ fontSize:'clamp(13px,1.4vw,15px)', color:'rgba(255,255,255,0.35)', lineHeight:1.8, marginBottom:'clamp(28px,4vw,40px)', maxWidth:'360px', fontWeight:300 }}>
            Arrastra, prioriza y asigna. Tu equipo siempre sabe qué hacer y qué viene después.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {steps.map(({ icon:Icon, color, text },i)=>(
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'14px', padding:'14px 16px', borderRadius:'12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', transition:'background 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={14} color={color}/>
                </div>
                <span style={{ fontSize:'14px', color:'rgba(255,255,255,0.5)', lineHeight:1.6, paddingTop:'5px', fontWeight:300 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div><KanbanMockup/></div>
      </div>
    </section>
  );
};

// ─── SLIDE 4: CTA (DARK) ──────────────────────────────────────────────────────

const SlideCTA = ({ onGetStarted, active }) => {
  const stats = [
    { value:10000, suffix:'+', label:'Proyectos gestionados' },
    { value:98,    suffix:'%', label:'Satisfacción'          },
    { value:500,   suffix:'+', label:'Equipos activos'       },
    { value:40,    suffix:'%', label:'Más velocidad'         },
  ];
  const perks = ['Sin tarjeta de crédito','Gratis para siempre','Setup en 5 minutos'];

  return (
    <section style={{ minHeight:'100vh', background:'#09090b', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'clamp(80px,10vw,120px) clamp(20px,6vw,80px)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 60% at 50% 110%, rgba(59,130,246,0.12) 0%, transparent 60%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:'1px', background:'rgba(255,255,255,0.07)' }}/>

      <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:'720px', width:'100%' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'clamp(8px,1.5vw,12px)', marginBottom:'clamp(56px,8vw,80px)' }}>
          {stats.map((s,i)=><StatCard key={i} {...s} active={active}/>)}
        </div>

        <h2 style={{ fontSize:'clamp(30px,5.5vw,70px)', fontWeight:700, letterSpacing:'-0.04em', color:'white', lineHeight:1.04, marginBottom:'clamp(14px,2vw,20px)' }}>
          Empieza a entregar
          <br/>
          <span style={{ background:'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            resultados hoy
          </span>
        </h2>

        <p style={{ fontSize:'clamp(14px,1.5vw,16px)', color:'rgba(255,255,255,0.35)', lineHeight:1.8, maxWidth:'380px', margin:'0 auto clamp(28px,4vw,40px)', fontWeight:300 }}>
          Sin configuración compleja. Tu equipo productivo desde el primer día.
        </p>

        <button onClick={onGetStarted}
          style={{ padding:'clamp(13px,1.6vw,16px) clamp(30px,4vw,50px)', background:'white', border:'none', borderRadius:'10px', color:'#09090b', fontSize:'15px', fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'9px', marginBottom:'clamp(20px,3vw,32px)', transition:'all 0.2s ease' }}
          onMouseEnter={e=>{ e.currentTarget.style.background='#f4f4f5'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 16px 48px rgba(255,255,255,0.15)'; }}
          onMouseLeave={e=>{ e.currentTarget.style.background='white'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
          Crear cuenta gratuita <ArrowRight size={15}/>
        </button>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'clamp(14px,2.5vw,28px)', flexWrap:'wrap' }}>
          {perks.map((t,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'rgba(255,255,255,0.25)', fontWeight:400 }}>
              <CheckCircle2 size={12} color='rgba(255,255,255,0.2)'/>
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
  const typeword = useTypewriter(['más rápido.','sin caos.','con claridad.','en equipo.']);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const idx = Math.round(container.scrollTop / container.clientHeight);
      setActiveSection(Math.max(0, Math.min(TOTAL - 1, idx)));
    };
    container.addEventListener('scroll', handleScroll, { passive:true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const goToSection = useCallback((idx) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: Math.max(0, Math.min(TOTAL-1, idx)) * container.clientHeight, behavior:'smooth' });
  }, []);

  useEffect(() => {
    const h = e => {
      if (e.key==='ArrowDown'||e.key==='PageDown') goToSection(activeSection+1);
      if (e.key==='ArrowUp'  ||e.key==='PageUp')   goToSection(activeSection-1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activeSection, goToSection]);

  const slideLabels = ['Inicio','Funciones','Demo','Empezar'];
  const lightSlide = activeSection === 1; // features slide is light

  return (
    <div style={{ height:'100%', position:'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after {
          font-family: 'Geist', 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes blink  { 0%,100%{ opacity:1; } 50%{ opacity:0; } }

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
          .landing-scroll-container { scroll-snap-type: y proximity; }
          .landing-scroll-container section { min-height: 100svh; }
          .dot-nav   { display: none !important; }
          .arrow-nav { display: none !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .feat-grid > div { grid-column: span 1 !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:500,
        padding:'0 clamp(16px,5vw,48px)', height:'52px',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        background: lightSlide ? 'rgba(248,248,248,0.9)' : 'rgba(9,9,11,0.85)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        borderBottom: lightSlide ? '1px solid #e4e4e7' : '1px solid rgba(255,255,255,0.07)',
        transition:'background 0.4s ease, border-color 0.4s ease',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'15px', fontWeight:600, letterSpacing:'-0.5px', color: lightSlide ? '#09090b' : 'white' }}>
          <div style={{ width:'22px', height:'22px', borderRadius:'6px', background: lightSlide ? '#09090b' : 'white', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Sparkles size={10} color={lightSlide ? 'white' : '#09090b'}/>
          </div>
          SEITRA
        </div>
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <button onClick={onGetStarted}
            style={{ padding:'6px 16px', background:'transparent', border:'none', color: lightSlide ? '#71717a' : 'rgba(255,255,255,0.45)', fontSize:'13px', fontWeight:500, cursor:'pointer', transition:'color 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.color=lightSlide?'#09090b':'white'}
            onMouseLeave={e=>e.currentTarget.style.color=lightSlide?'#71717a':'rgba(255,255,255,0.45)'}>
            Iniciar sesión
          </button>
          <button onClick={onGetStarted}
            style={{ padding:'7px 16px', background: lightSlide ? '#09090b' : 'white', border:'none', borderRadius:'8px', color: lightSlide ? 'white' : '#09090b', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#3b82f6'; e.currentTarget.style.color='white'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=lightSlide?'#09090b':'white'; e.currentTarget.style.color=lightSlide?'white':'#09090b'; }}>
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* ── DOT NAV ── */}
      <div className="dot-nav" style={{ position:'fixed', right:'20px', top:'50%', transform:'translateY(-50%)', zIndex:500, display:'flex', flexDirection:'column', gap:'8px' }}>
        {slideLabels.map((label,i)=>(
          <button key={i} title={label} onClick={()=>goToSection(i)}
            style={{ width:i===activeSection?8:5, height:i===activeSection?8:5, borderRadius:'50%', background: i===activeSection ? (lightSlide?'#09090b':'white') : (lightSlide?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.2)'), border:'none', cursor:'pointer', padding:0, transition:'all 0.3s ease', outline:'none' }}
          />
        ))}
      </div>

      {/* ── ARROW NAV ── */}
      <div className="arrow-nav" style={{ position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', zIndex:500, display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
        <span style={{ fontSize:'10px', color: lightSlide?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.2)', letterSpacing:'1px', fontWeight:500 }}>
          {activeSection+1} / {TOTAL}
        </span>
        <div style={{ display:'flex', gap:'5px' }}>
          {[
            { fn:()=>goToSection(activeSection-1), dis:activeSection===0,       Icon:ChevronUp   },
            { fn:()=>goToSection(activeSection+1), dis:activeSection===TOTAL-1, Icon:ChevronDown },
          ].map(({ fn, dis, Icon },i)=>(
            <button key={i} onClick={fn} disabled={dis}
              style={{ width:'26px', height:'26px', borderRadius:'50%', background: lightSlide?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.06)', border: lightSlide?'1px solid #e4e4e7':'1px solid rgba(255,255,255,0.1)', color: dis ? (lightSlide?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.1)') : (lightSlide?'#71717a':'rgba(255,255,255,0.45)'), cursor:dis?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', outline:'none', transition:'all 0.2s ease' }}>
              <Icon size={11}/>
            </button>
          ))}
        </div>
      </div>

      {/* ── SCROLL CONTAINER ── */}
      <div ref={containerRef} className="landing-scroll-container">
        <SlideHero     onGetStarted={onGetStarted} typeword={typeword}/>
        <SlideFeatures/>
        <SlideDemo/>
        <SlideCTA      onGetStarted={onGetStarted} active={activeSection===3}/>
      </div>
    </div>
  );
}