import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { dbUsers, dbProjects, dbTasks, dbComments } from './lib/database';
import { supabase } from './lib/supabase';
import { auth } from './lib/auth'; 

import { 
  Plus, Search, Filter, Calendar, Users, ChevronDown, ChevronUp, ChevronRight,
  MoreVertical, Edit, Trash2, Check, X, Eye, EyeOff, LogOut, 
  FolderPlus, ListPlus, Grid, List, BarChart2, Save, Download,
  Upload, Settings, Clock, Tag, AlertCircle, CheckCircle2,
  ArrowRight, Menu, Home, Briefcase, ClipboardList, PieChart, Bell, Zap, Layers,
  MessageSquare, History, Copy, FileText, Star, StarOff, Archive, 
  ChevronLeft, Paperclip, Send, MoreHorizontal, TrendingUp, Target,
  Maximize2, Minimize2, Share2, Link as LinkIcon, ExternalLink, RefreshCw,
  AlertTriangle, Info, CheckCircle, XCircle, Loader, Moon, Sun,
  Command, HelpCircle, Keyboard, BookOpen, Gift, Sparkles, Zap as ZapIcon,
  ShieldCheck, Globe, Layout, BarChart, Rocket
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import { DESIGN_TOKENS, STORAGE_KEYS, storageGet, storageSet } from './styles/tokens';
import ProjectRoadmap from './components/ProjectRoadmap';
import EnvironmentSelector from "./components/Enviroments/EnvironmentSelector";
import CreateEnvironmentModal from "./components/Enviroments/CreateEnvironmentModal";
import EnvironmentSettings from "./components/Enviroments/EnvironmentSettings";
import { AppProvider, useApp } from './context/AppContext';
import TeamChatView from './components/TeamChatView';
import ListView from './components/ListView';
import BacklogView from './components/BacklogView';
import LandingPage from './components/LandingPage';
import SeitraAssistant from './components/SeitraAssistant';
import CreateListModal from './components/Enviroments/CreateListModal';


// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================
const ToastContext = React.createContext();

let _toastCounter = 0;
const TOAST_DURATION = 3500;

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++_toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9998,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(110%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(110%); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

function Toast({ toast, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), TOAST_DURATION - 250);
    const removeTimer = setTimeout(onClose, TOAST_DURATION);
    return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 250);
  };

  const dotColor = {
    success: '#22c55e',
    error:   '#ef4444',
    info:    '#3b82f6',
    warning: '#f59e0b',
  }[toast.type] || '#3b82f6';

  return (
    <div style={{
      minWidth: '300px',
      maxWidth: '380px',
      borderRadius: '14px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'white',
      border: '1px solid #e5e7eb',
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      animation: exiting
        ? 'toastSlideOut 0.25s ease-in forwards'
        : 'toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Punto de color con glow */}
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: dotColor,
        boxShadow: `0 0 8px ${dotColor}`,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#111111' }}>
        {toast.message}
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0', display: 'flex', flexShrink: 0,
          color: '#9ca3af',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#374151'}
        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
      >
        <X size={15} />
      </button>
      {/* Barra de progreso */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: '3px',
        borderRadius: '0 0 14px 14px',
        background: dotColor,
        animation: `toastProgress ${TOAST_DURATION}ms linear forwards`,
        opacity: 0.7,
      }} />
    </div>
  );
}

const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================
function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      shortcuts.forEach(shortcut => {
        const matches = 
          shortcut.key === key &&
          shortcut.ctrl === ctrl &&
          (shortcut.shift === undefined || shortcut.shift === shift) &&
          (shortcut.alt === undefined || shortcut.alt === alt);

        if (matches) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// ============================================================================
// DEMO DATA
// ============================================================================

// const DEMO_PROJECTS = [
//   { 
//     id: 1, 
//     name: 'Rediseño Web Corporativo', 
//     description: 'Renovación completa del sitio web',
//     color: '#3B82F6',
//     startDate: '2026-02-01',
//     endDate: '2026-03-31',
//     ownerId: 1,
//     members: [1, 2, 3],
//     status: 'active',
//     favorite: false,
//     tags: ['web', 'diseño'],
//     createdAt: new Date().toISOString()
//   }
// ];

// const DEMO_TASKS = [
//   {
//     id: 1,
//     projectId: 1,
//     title: 'Diseño UI/UX',
//     description: 'Crear mockups de todas las páginas',
//     startDate: '2026-02-08',
//     endDate: '2026-02-20',
//     priority: 'high',
//     status: 'in_progress',
//     assigneeId: 3,
//     progress: 60,
//     parentId: null,
//     tags: ['diseño', 'ui'],
//     attachments: [],
//     estimatedHours: 40,
//     actualHours: 24,
//     dependencies: [],
//     createdAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString()
//   }
// ];

const STATUS_OPTIONS = {
  todo: { label: 'Por Hacer', color: DESIGN_TOKENS.neutral[600], bg: DESIGN_TOKENS.neutral[100] },
  in_progress: { label: 'En Progreso', color: DESIGN_TOKENS.info.dark, bg: DESIGN_TOKENS.info.light },
  in_review: { label: 'En Revisión', color: DESIGN_TOKENS.warning.dark, bg: DESIGN_TOKENS.warning.light },
  completed: { label: 'Completado', color: DESIGN_TOKENS.success.dark, bg: DESIGN_TOKENS.success.light },
  blocked: { label: 'Bloqueado', color: DESIGN_TOKENS.danger.dark, bg: DESIGN_TOKENS.danger.light }
};

const PRIORITY_OPTIONS = {
  low: { label: 'Baja', color: DESIGN_TOKENS.neutral[500] },
  medium: { label: 'Media', color: DESIGN_TOKENS.warning.base },
  high: { label: 'Alta', color: DESIGN_TOKENS.danger.base },
  urgent: { label: 'Urgente', color: DESIGN_TOKENS.danger.dark }
};

// ============================================================================
// DATE UTILS — evita "31 dic 1969" cuando la fecha es null/epoch
// ============================================================================
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) || d.getFullYear() < 2000 ? null : d;
};

const formatDate = (dateStr, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  const d = parseDate(dateStr);
  return d ? d.toLocaleDateString('es-ES', options) : '—';
};

// ============================================================================
// MAIN APP
// ============================================================================
function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}

function AppContent() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { addToast } = useToast();

  // Leer sesión de localStorage de forma sincrónica — sin loading screen, sin async
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const ref = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
      const raw = localStorage.getItem(`sb-${ref}-auth-token`);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session?.access_token || !session?.user) return null;
      const u = session.user;
      return { id: u.id, email: u.email, name: u.user_metadata?.name || u.email, role: u.user_metadata?.role || 'user', avatar: '👤' };
    } catch { return null; }
  });

  // Mostrar landing solo si no hay sesión guardada
  const [showLanding, setShowLanding] = useState(() => {
    try {
      const ref = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
      const raw = localStorage.getItem(`sb-${ref}-auth-token`);
      if (!raw) return true;
      const session = JSON.parse(raw);
      return !(session?.access_token && session?.user);
    } catch { return true; }
  });

  useEffect(() => {
    const prefs = storageGet(STORAGE_KEYS.PREFERENCES);
    if (prefs?.darkMode) setDarkMode(prefs.darkMode);
  }, []);

  // Escuchar cierre de sesión
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setShowLanding(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowLanding(false);
      setIsTransitioning(false);
    }, 1000); // Duración de la transición
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleLogin = (user, isNew = false) => {
    setCurrentUser({ ...user, isNew });
    setShowLanding(false);
    const nombre = (user.name || user.email).split(' ')[0];
    addToast(
      isNew ? `¡Bienvenido, ${nombre}! Tu cuenta ha sido creada.` : `¡Bienvenido de vuelta, ${nombre}!`,
      'success'
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowLanding(false);
    addToast('Sesión cerrada correctamente', 'info');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const prefs = storageGet(STORAGE_KEYS.PREFERENCES) || {};
    storageSet(STORAGE_KEYS.PREFERENCES, { ...prefs, darkMode: newMode });
    addToast(`Modo ${newMode ? 'oscuro' : 'claro'} activado`, 'info');
  };

// Pantalla de transición optimizada
if (isTransitioning) {
  return (
    <div style={{
      minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0a0f1e', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative'
    }}>
      <style>{`
        @keyframes orbit-sync {
          0% { transform: rotate(0deg) scale(1); filter: blur(60px); }
          50% { transform: rotate(180deg) scale(1.2); filter: blur(40px); }
          100% { transform: rotate(360deg) scale(1); filter: blur(60px); }
        }
        @keyframes reveal-brand {
          0% { opacity: 0; transform: scale(0.9); letter-spacing: 0.2em; }
          100% { opacity: 1; transform: scale(1); letter-spacing: -0.02em; }
        }
        @keyframes progress-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .loading-shape {
          position: absolute; width: 600px; height: 600px;
          border-radius: 50%; background: radial-gradient(circle, rgba(79, 70, 229, 0.2) 0%, transparent 70%);
          animation: orbit-sync 8s infinite linear;
        }
      `}</style>

      {/* FONDO AMBIENTAL (Consistente con el Login) */}
      <div className="loading-shape" style={{ top: '-10%', right: '-5%' }} />
      <div className="loading-shape" style={{ bottom: '-10%', left: '-5%', animationDelay: '-4s', background: 'radial-gradient(circle, rgba(124, 205, 243, 0.15) 0%, transparent 70%)' }} />

      <div style={{ textAlign: 'center', zIndex: 10, width: '100%', maxWidth: '400px', padding: '0 2rem' }}>
        
        {/* LOGO ANIMADO */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', 
          marginBottom: '2.5rem', animation: 'reveal-brand 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)' 
        }}>
          <div style={{ 
            background: 'white', padding: '12px', borderRadius: '16px',
            boxShadow: '0 0 30px rgba(79, 70, 229, 0.3)'
          }}>
            <Layout size={38} color="#0a0f1e" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: 0 }}>SEITRA</h1>
        </div>

        {/* MENSAJE DE ESTADO */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            fontSize: '1rem', color: 'white', fontWeight: 600, 
            letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 
          }}>
            Sincronizando Equipo
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>
            Configurando tus proyectos y metas...
          </div>
        </div>

        {/* BARRA DE PROGRESO MINIMALISTA */}
        <div style={{ 
          width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', 
          borderRadius: '10px', overflow: 'hidden', position: 'relative' 
        }}>
          <div style={{ 
            height: '100%', background: 'linear-gradient(90deg, #4f46e5, #7ccdf3)',
            borderRadius: '10px', animation: 'progress-bar 2.5s ease-in-out forwards'
          }} />
        </div>

        {/* INDICADOR DE RED (Toque Pro) */}
        <div style={{ 
          marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          gap: '8px', color: '#475569', fontSize: '0.75rem', fontWeight: 600 
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '10%', background: '#0c0c0c' }} />
          CONEXIÓN CIFRADA ESTABLECIDA
        </div>
      </div>
    </div>
  );
}

  if (showLanding) return <LandingPage onGetStarted={handleGetStarted} />;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  return <MainApp user={currentUser} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
}

// ============================================================================
// SEITRA LOGIN 
// ============================================================================

function LoginScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setSuccess('');
    setName('');
    setEmail('');
    setPassword('');
  };

  // ============================================================================
  // NUEVO: GOOGLE SIGN-IN
  // ============================================================================
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      await auth.signInWithGoogle();
      // Supabase redirigirá a Google automáticamente
      // Cuando vuelva, tu App.jsx detectará el usuario
    } catch (err) {
      console.error('[Google Login] Error:', err);
      setError('Error al iniciar sesión con Google');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // 0. Pre-check de conectividad (5s) — detecta red bloqueada o proyecto pausado
        console.log('[Login] Verificando conectividad con Supabase...');
        try {
          const ctrl = new AbortController();
          const connTimer = setTimeout(() => ctrl.abort(), 5000);
          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`,
            { signal: ctrl.signal }
          );
          clearTimeout(connTimer);
          console.log('[Login] Servidor alcanzable, status:', resp.status);
        } catch (connErr) {
          console.error('[Login] Sin conectividad:', connErr.message);
          throw new Error(
            'No se puede conectar a Supabase. Posibles causas: la red corporativa bloquea supabase.co, o el proyecto está pausado en el dashboard.'
          );
        }

        // 1. Autenticar con fetch directo (bypasea el SDK que se cuelga en esta red)
        console.log('[Login] Iniciando autenticación directa...');
        const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const tokenResp = await Promise.race([
          fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPA_KEY,
            },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password })
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Sin respuesta del servidor (10s). Verifica tu conexión.')), 10000)
          )
        ]);

        console.log('[Login] Respuesta status:', tokenResp.status);
        const tokenData = await tokenResp.json();
        console.log('[Login] Respuesta keys:', Object.keys(tokenData));

        if (!tokenResp.ok) {
          const errMsg = tokenData.error_description || tokenData.message || tokenData.error || 'Credenciales incorrectas';
          throw new Error(errMsg);
        }

        // Guardar sesión en localStorage directamente (sin await setSession que cuelga)
        // El cliente Supabase lee de localStorage para autenticar las queries REST
        const authUser = tokenData.user;
        try {
          const ref = SUPA_URL.split('//')[1]?.split('.')[0];
          localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: tokenData.expires_at,
            expires_in: tokenData.expires_in,
            token_type: 'bearer',
            user: authUser
          }));
        } catch (e) {
          console.warn('[Login] No se pudo guardar sesión en localStorage:', e);
        }
        // Sync background (fire & forget — no bloqueamos el login)
        supabase.auth.setSession({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token
        }).catch(() => {});

        // 2. Cargar perfil desde la tabla users
        console.log('[Login] Buscando perfil en tabla users...');
        let userProfile = null;
        try {
          userProfile = await Promise.race([
            dbUsers.getByEmail(email.trim().toLowerCase()),
            new Promise(resolve => setTimeout(() => resolve(null), 6000))
          ]);
          console.log('[Login] Perfil:', userProfile ? `encontrado → ${userProfile.name}` : 'no encontrado, usando datos del token');
        } catch (profileErr) {
          console.warn('[Login] Error cargando perfil:', profileErr.message);
        }

        onLogin(userProfile || {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email,
          role: 'user',
          avatar: '👤'
        }, false);

      } else {
        // — REGISTRO con Supabase Auth —
        if (!name.trim()) {
          setError('El nombre completo es requerido.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { name: name.trim() } }
        });
        if (error) throw error;

        // Crear perfil en tabla users
        let newUser = null;
        try {
          newUser = await dbUsers.create({
            id: data.user.id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: 'user',
            avatar: '👤',
          });
        } catch {
          // Si falla la inserción en users, igualmente dejamos entrar con datos del token
          newUser = null;
        }

        setSuccess('¡Cuenta creada! Ya puedes iniciar sesión.');
        setIsLogin(true);
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      const msg = err.message || 'Error de autenticación';
      if (msg.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Debes confirmar tu correo antes de iniciar sesión.');
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Ya existe una cuenta con ese correo. Inicia sesión.');
      } else if (msg.includes('Password should be at least')) {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>

      <style>{`
        .login-input {
          width: 100%; padding: 0.8rem 1rem; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          font-size: 0.9rem; box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s; outline: none;
          font-family: inherit; color: #1e293b;
        }
        .login-input:focus {
          border-color: #667eea; background: white;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.12);
        }
        .login-input::placeholder { color: #cbd5e1; }
        .social-btn {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 0.7rem 1rem; border-radius: 10px;
          border: 1.5px solid #e8ecf0; background: #f8fafc;
          color: #374151; font-weight: 600; font-size: 0.85rem;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .social-btn:hover { background: white; border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .left-panel-blob {
          position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none;
        }
        @media (max-width: 768px) { .login-left-panel { display: none !important; } }
      `}</style>

      {/* ── PANEL IZQUIERDO ── */}
      <div className="login-left-panel" style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: '3rem',
      }}>
        {/* Blobs decorativos */}
        <div className="left-panel-blob" style={{ width: 320, height: 320, background: 'rgba(255,255,255,0.08)', top: '-80px', left: '-80px' }} />
        <div className="left-panel-blob" style={{ width: 240, height: 240, background: 'rgba(255,255,255,0.06)', bottom: '40px', right: '-60px' }} />
        <div className="left-panel-blob" style={{ width: 160, height: 160, background: 'rgba(255,255,255,0.1)', bottom: '200px', left: '30px' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '400px' }}>
          {/* Ícono central */}
          <div style={{
            width: 72, height: 72, borderRadius: '20px',
            background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <Sparkles size={36} color="white" strokeWidth={1.5} />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700,
            color: 'white', lineHeight: 1.3, margin: '0 0 1.5rem',
            letterSpacing: '-0.02em',
          }}>
            Accede fácilmente a tu hub personal de claridad y productividad
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            Organiza tus proyectos, tareas y equipos en un solo lugar. Sin caos, con resultados.
          </p>

          {/* Píldoras de features */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2.5rem' }}>
            {['Proyectos', 'Tareas', 'Equipos', 'Roadmap'].map(tag => (
              <span key={tag} style={{
                padding: '6px 14px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                color: 'white', fontSize: '0.78rem', fontWeight: 500,
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div style={{
        flex: 1, background: 'white', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '2.5rem', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Logo SEITRA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>SEITRA</span>
          </div>

          {/* Título y subtítulo */}
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
            Accede a tus tareas, notas y proyectos en cualquier momento y mantén todo fluyendo en un solo lugar.
          </p>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Nombre (solo registro) */}
            {!isLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Nombre completo</label>
                <input
                  type="text" required={!isLogin} value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="login-input"
                />
              </div>
            )}

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Tu email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="login-input"
              />
            </div>

            {/* Contraseña */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Mensajes */}
            {success && (
              <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ {success}
              </div>
            )}
            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit" disabled={isLoading}
              style={{
                width: '100%', padding: '0.85rem', border: 'none', borderRadius: '10px',
                background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', fontSize: '0.95rem', fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(102,126,234,0.4)',
                transition: 'all 0.2s', marginTop: '0.25rem',
                fontFamily: 'inherit',
              }}
            >
              {isLoading ? 'Verificando...' : isLogin ? 'Iniciar sesión' : 'Comenzar'}
            </button>
          </form>

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e8ecf0' }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>o continuar con</span>
            <div style={{ flex: 1, height: '1px', background: '#e8ecf0' }} />
          </div>

          {/* Botones sociales */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button" onClick={handleGoogleSignIn} disabled={isLoading}
              className="social-btn"
              style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48" fill="none">
                <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
              </svg>
              Google
            </button>
            <button
              type="button" className="social-btn"
              style={{ background: '#1877F2', border: '1.5px solid #1877F2', color: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1565d8'; e.currentTarget.style.borderColor = '#1565d8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1877F2'; e.currentTarget.style.borderColor = '#1877F2'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          {/* Switch mode link */}
          <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#64748b' }}>
            {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button" onClick={() => switchMode(!isLogin)}
              style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', padding: 0, fontFamily: 'inherit' }}
            >
              {isLogin ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP DASHBOARD
// ============================================================================
function MainApp({ user, onLogout, darkMode, toggleDarkMode }) {
  const { addToast } = useToast();
  const { currentWorkspace, currentEnvironment, lists } = useApp();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Dashboard', view: 'dashboard' }]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showProjectManagement, setShowProjectManagement] = useState(false);
  const [selectedProjectForManagement, setSelectedProjectForManagement] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
    setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  window.addEventListener('resize', handleResize);
  handleResize();
  
  return () => window.removeEventListener('resize', handleResize);
}, []);

  useEffect(() => {
    loadData();
  }, [currentEnvironment?.id, currentWorkspace?.id]);
  const loadData = async () => {
    console.log('[loadData] iniciando... currentEnvironment:', currentEnvironment?.id, '| currentWorkspace:', currentWorkspace?.id);
    // allSettled: cada recurso carga de forma independiente — si uno falla, los demás siguen
    const projectsPromise = currentWorkspace?.id
      ? dbProjects.getByWorkspace(currentWorkspace.id)
      : currentEnvironment?.id
        ? dbProjects.getByEnvironment(currentEnvironment.id)
        : dbProjects.getAll();
    const [projectsResult, tasksResult, usersResult] = await Promise.allSettled([
      projectsPromise,
      dbTasks.getAll(),
      dbUsers.getAll(),
    ]);

    if (projectsResult.status === 'fulfilled') {
      console.log('[loadData] projects:', projectsResult.value?.length);
      setProjects(projectsResult.value);
    } else console.error('[loadData] Error cargando proyectos:', projectsResult.reason);

    if (tasksResult.status === 'fulfilled') setTasks(tasksResult.value);
    else console.error('Error cargando tareas:', tasksResult.reason);

    if (usersResult.status === 'fulfilled') {
      const usersData = usersResult.value;
      console.log('[loadData] users resultado:', usersData);
      if (!usersData || usersData.length === 0) {
        setUsers(user ? [user] : []);
      } else {
        setUsers(usersData);
      }
    } else {
      console.error('[loadData] Error cargando usuarios:', usersResult.reason);
      setUsers(user ? [user] : []);
    }

    setTags(['web', 'diseño', 'ui', 'backend', 'frontend', 'urgente']);
  };

  // Proyectos - CRUD individual
  const createProject = async (projectData) => {
    console.log('[handleCreateProject] INICIO', projectData?.name);
    // Validar que leaderId existe en public.users (evita FK violation con auth UUID)
    const validLeader = users.find(u => u.id === projectData.leaderId);
    const safeLeaderId = validLeader ? projectData.leaderId : (users[0]?.id || null);
    const members = projectData.members?.length > 0
      ? projectData.members.filter(id => users.some(u => u.id === id))
      : (safeLeaderId ? [safeLeaderId] : []);
    const payload = {
      ...projectData,
      workspaceId: projectData.workspaceId || currentWorkspace?.id || null,
      environmentId: projectData.environmentId || currentEnvironment?.id || null,
      leaderId: safeLeaderId,
      members,
    };

    console.log('[handleCreateProject] payload listo, llamando dbProjects.create:', JSON.stringify(payload));
    try {
      const createPromise = dbProjects.create(payload);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: insert tardó más de 10s')), 10000)
      );
      const created = await Promise.race([createPromise, timeoutPromise]);
      console.log('[handleCreateProject] proyecto creado OK:', created?.id);
      setProjects(prev => prev.some(p => p.id === created.id) ? prev : [created, ...prev]);
      logActivity('project_created', `Proyecto creado: ${created.name}`);
      return created;
    } catch (error) {
      console.error('[handleCreateProject] ERROR →', error?.message, error?.code, error?.details, error?.hint);
      addToast(`Error al crear el proyecto: ${error?.message || 'desconocido'}`, 'error');
      throw error;
    }
  };

  const updateProject = async (id, updates) => {
    try {
      const updated = await dbProjects.update(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      if (selectedProject?.id === id) setSelectedProject(updated);
      logActivity('project_updated', `Proyecto actualizado: ${updated.name}`);
      return updated;
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      addToast('Error al actualizar el proyecto', 'error');
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      await dbProjects.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      logActivity('project_deleted', `Proyecto eliminado`);
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      addToast('Error al eliminar el proyecto', 'error');
      throw error;
    }
  };

  // Tareas - CRUD individual
  const createTask = async (taskData) => {
    try {
      const created = await dbTasks.create(taskData);
      setTasks(prev => [created, ...prev]);
      logActivity('task_created', `Tarea creada: ${created.title}`);
      return created;
    } catch (error) {
      console.error('Error creando tarea:', error);
      addToast('Error al crear la tarea', 'error');
      throw error;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const updated = await dbTasks.update(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      if (selectedTask?.id === id) setSelectedTask(updated);
      logActivity('task_updated', `Tarea actualizada: ${updated.title}`);
      return updated;
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      addToast('Error al actualizar la tarea', 'error');
      throw error;
    }
  };

  const deleteTask = async (id) => {
    try {
      // Eliminar subtareas primero
      const subtasks = tasks.filter(t => t.parentId === id);
      for (const sub of subtasks) {
        await deleteTask(sub.id);
      }
      await dbTasks.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      logActivity('task_deleted', `Tarea eliminada`);
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      addToast('Error al eliminar la tarea', 'error');
      throw error;
    }
  };

  // Comentarios
  const createComment = async (commentData) => {
    try {
      const created = await dbComments.create(commentData);
      setComments(prev => [...prev, created]);
      return created;
    } catch (error) {
      console.error('Error creando comentario:', error);
      addToast('Error al agregar el comentario', 'error');
      throw error;
    }
  };

  const saveComments = (newComments) => {
    setComments(newComments);
  };

  const logActivity = (type, description) => {
    const log = storageGet(STORAGE_KEYS.ACTIVITY_LOG) || [];
    log.unshift({
      id: Date.now(),
      type,
      description,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    storageSet(STORAGE_KEYS.ACTIVITY_LOG, log.slice(0, 100));
  };

  const handleViewChange = (view, label) => {
    setActiveView(view);
    setBreadcrumbs([{ label: label || view, view }]);
    setSelectedProject(null);
    setSelectedTask(null);
    if (view !== 'list') setSelectedList(null);
  };

  const handleSelectList = (list) => {
    setSelectedList(list);
    setActiveView('list');
    setBreadcrumbs([{ label: list.name, view: 'list' }]);
    setSelectedProject(null);
    setSelectedTask(null);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setActiveView('project-detail');
    setBreadcrumbs([
      { label: 'Proyectos', view: 'projects' },
      { label: project.name, view: 'project-detail' }
    ]);
  };

  const handleOpenProjectManagement = (project) => {
    setSelectedProjectForManagement(project);
    setShowProjectManagement(true);
  };

  const handleProjectUpdate = async (updatedProject) => {
    await updateProject(updatedProject.id, updatedProject);
  };
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleBreadcrumbClick = (index) => {
    const crumb = breadcrumbs[index];
    setActiveView(crumb.view);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    if (index === 0) {
      setSelectedProject(null);
      setSelectedTask(null);
    }
  };

  const toggleFavorite = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    await updateProject(projectId, { favorite: !project.favorite });
    addToast('Favorito actualizado', 'success');
  };

  const duplicateProject = async (project) => {
    const { id, createdAt, updatedAt, environmentId, ...rest } = project;
    await createProject({ ...rest, name: `${project.name} (Copia)` });
    addToast('Proyecto duplicado', 'success');
  };

  const exportFullReport = () => {
  // Preparar datos consolidados
    const reportData = [];
  
  projects.forEach(project => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    
    if (projectTasks.length === 0) {
      // Si no tiene tareas, agregar solo el proyecto
      reportData.push({
        tipo: 'Proyecto',
        proyecto: project.name,
        tarea: '',
        descripcion: project.description,
        responsable: users.find(u => u.id === project.leaderId)?.name || '',
        asignado_a: '',
        estado: project.status,
        prioridad: '',
        progreso: project.progress || 0,
        fecha_inicio: project.startDate || '',
        fecha_fin: project.endDate || '',
        fecha_creacion: new Date(project.createdAt).toLocaleDateString('es-CO'),
        fecha_actualizacion: project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('es-CO') : '',
        tags: project.tags?.join(', ') || '',
        favorito: project.favorite ? 'Sí' : 'No',
        color: project.color
      });
    }
    
    projectTasks.forEach(task => {
      const assignee = users.find(u => u.id === task.assigneeId);
      const taskComments = comments.filter(c => c.taskId === task.id);
      
      reportData.push({
        tipo: 'Tarea',
        proyecto: project.name,
        tarea: task.title,
        descripcion: task.description || '',
        responsable: users.find(u => u.id === project.leaderId)?.name || '',
        asignado_a: assignee?.name || '',
        estado: task.status,
        prioridad: task.priority || 'media',
        progreso: task.progress || 0,
        fecha_inicio: task.startDate || '',
        fecha_fin: task.dueDate || '',
        fecha_creacion: new Date(task.createdAt).toLocaleDateString('es-CO'),
        fecha_actualizacion: task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('es-CO') : '',
        tags: task.tags?.join(', ') || '',
        favorito: '',
        color: project.color,
        comentarios: taskComments.length,
        tiempo_estimado: task.estimatedHours || '',
        dependencias: task.dependencies?.length || 0
      });
    });
  });

  // Convertir a CSV
  const headers = [
    'Tipo',
    'Proyecto',
    'Tarea',
    'Descripción',
    'Líder Proyecto',
    'Asignado A',
    'Estado',
    'Prioridad',
    'Progreso (%)',
    'Fecha Inicio',
    'Fecha Fin',
    'Fecha Creación',
    'Fecha Actualización',
    'Tags',
    'Favorito',
    'Color',
    'Comentarios',
    'Tiempo Estimado (hrs)',
    'Dependencias'
  ];

  const csvRows = [
    headers.join(','),
    ...reportData.map(row => [
      row.tipo,
      `"${row.proyecto}"`,
      `"${row.tarea}"`,
      `"${row.descripcion.replace(/"/g, '""')}"`,
      `"${row.responsable}"`,
      `"${row.asignado_a}"`,
      row.estado,
      row.prioridad,
      row.progreso,
      row.fecha_inicio,
      row.fecha_fin,
      row.fecha_creacion,
      row.fecha_actualizacion,
      `"${row.tags}"`,
      row.favorito,
      row.color,
      row.comentarios || 0,
      row.tiempo_estimado || 0,
      row.dependencias || 0
    ].join(','))
  ];

  // Descargar
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-seitra-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  addToast('Reporte exportado exitosamente', 'success');
};

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', ctrl: true, action: () => { setActiveView('new-task'); addToast('Nueva tarea', 'info'); } },
    { key: 'p', ctrl: true, action: () => { setActiveView('projects'); addToast('Proyectos', 'info'); } },
    { key: 'k', ctrl: true, action: () => { document.querySelector('input[type="text"]')?.focus(); } },
    { key: '?', ctrl: false, shift: true, action: () => setShowShortcuts(true) }
  ]);

  return (
    <div style={dashboardContainerStyle}>
      <Sidebar
        isOpen={sidebarOpen}
        activeView={activeView}
        onViewChange={handleViewChange}
        projects={projects}
        onProjectSelect={handleProjectSelect}
        user={user}
        toggleFavorite={toggleFavorite}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
        onSelectList={handleSelectList}
      />

      <div style={mainContentWrapperStyle}>
        <TopBar
          user={user}
          onLogout={onLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          breadcrumbs={breadcrumbs}
          onBreadcrumbClick={handleBreadcrumbClick}
          onExportReport={exportFullReport}
          isMobile={isMobile}
        />

        <div style={contentAreaStyle}>
          {activeView === 'dashboard' && (
            <DashboardView
              user={user}
              users={users}
              tasks={tasks}
              projects={projects}
              onTaskClick={handleTaskClick}
              onProjectSelect={handleProjectSelect}
            />
          )}

          {activeView === 'list' && selectedList && (
            <ListView
              listId={selectedList.id}
              listName={selectedList.name}
              tasks={tasks.filter(t => t.listId === selectedList.id)}
              projects={projects}
              users={users}
              onTasksChange={(newTasks) => {
                setTasks(prev => [
                  ...prev.filter(t => t.listId !== selectedList.id),
                  ...newTasks
                ]);
              }}
              onListNameChange={(id, name) => {
                setSelectedList(prev => ({ ...prev, name }));
                setBreadcrumbs(breadcrumbs.map((b, i) =>
                  i === breadcrumbs.length - 1 ? { ...b, label: name } : b
                ));
              }}
              onListDelete={() => {
                handleViewChange('dashboard', 'Dashboard');
              }}
              onError={(msg) => addToast(msg, 'error')}
            />
          )}

          {activeView === 'projects' && (
            <ProjectsView
              projects={projects}
              createProject={createProject}
              deleteProject={deleteProject}
              users={users}
              currentUser={user}
              onSelectProject={handleProjectSelect}
              toggleFavorite={toggleFavorite}
              duplicateProject={duplicateProject}
              exportData={exportFullReport}
              onOpenProjectManagement={handleOpenProjectManagement}
            />
          )}

          {activeView === 'workspace' && (
            <WorkspaceView
              workspace={currentWorkspace}
              lists={(lists || []).filter(l => l.workspace_id === currentWorkspace?.id)}
              onSelectList={handleSelectList}
            />
          )}

          {activeView === 'project-detail' && selectedProject && (
            <ProjectDetailView
              project={selectedProject}
              tasks={tasks}
              projects={projects}
              onTaskCreate={createTask}
              onTaskUpdate={updateTask}
              onTaskDelete={deleteTask}
              users={users}
              comments={comments}
              onCommentsChange={saveComments}
              tags={tags}
              onTaskClick={handleTaskClick}
              onProjectUpdate={handleProjectUpdate}
            />
            
          )}
          {activeView === 'chat' && (
            <TeamChatView
              user={user}
              isMobile={isMobile}
            />
          )}

          {activeView === 'backlog' && (
            <BacklogView />
          )}

          {activeView === 'tasks' && (
            <AllTasksView
              tasks={tasks}
              projects={projects}
              users={users}
              currentUser={user}
              onTaskClick={handleTaskClick}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView projects={projects} tasks={tasks} />
          )}

          {activeView === 'analytics' && (
            <AnalyticsView tasks={tasks} projects={projects} users={users} />
          )}
        </div>
      </div>

      {showTaskDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          project={projects.find(p => p.id === selectedTask.projectId)}
          users={users}
          comments={comments.filter(c => c.taskId === selectedTask.id)}
          onClose={() => setShowTaskDetail(false)}
          onUpdate={async (updated) => {
            await updateTask(updated.id, updated);
            addToast('Tarea actualizada', 'success');
          }}
          onAddComment={async (comment) => {
            await createComment({
              taskId: selectedTask.id,
              userId: user.id,
              content: comment.content || comment,
            });
            addToast('Comentario agregado', 'success');
          }}
        />
      )}

      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}

// ============================================================================
// TOP BAR
// ============================================================================
function TopBar({ user, onLogout, onMenuClick, searchQuery, onSearchChange, darkMode, toggleDarkMode, breadcrumbs, onBreadcrumbClick, onExportReport, isMobile }) {
  const [showCreateEnv, setShowCreateEnv] = useState(false);
  const [showEnvSettings, setShowEnvSettings] = useState(false);

  return (
    <>
        <div style={{
          ...topBarStyle,
          padding: isMobile ? '0.6rem 0.9rem' : topBarStyle.padding,
          height: isMobile ? 'auto' : topBarStyle.height,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          alignItems: isMobile ? 'stretch' : topBarStyle.alignItems,
          gap: isMobile ? '0.6rem' : topBarStyle.gap
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <button onClick={onMenuClick} style={iconButtonStyle}>
            <Menu size={18} />
          </button>

          {breadcrumbs.length > 1 && !isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflowX: 'auto' }}>
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={14} color={DESIGN_TOKENS.neutral[400]} />}
                  <button
                    onClick={() => onBreadcrumbClick(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: i === breadcrumbs.length - 1 ? DESIGN_TOKENS.neutral[800] : DESIGN_TOKENS.neutral[500],
                      fontWeight: i === breadcrumbs.length - 1 ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div style={{ ...searchBarStyle, maxWidth: isMobile ? 'none' : searchBarStyle.maxWidth }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Buscar... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <EnvironmentSelector 
            onCreateEnvironment={() => setShowCreateEnv(true)}
            onOpenSettings={() => setShowEnvSettings(true)}
          />

          <button onClick={onExportReport} style={iconButtonStyle} title="Exportar reporte completo"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.05)'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}>
            <Download size={17} />
          </button>

          {/* ── DARK MODE SWITCH ── */}
          <div
            onClick={toggleDarkMode}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '4px 2px',
            }}
          >
            <Sun size={13} style={{ color: darkMode ? '#4a5068' : '#f59e0b', transition: 'color 0.3s', flexShrink: 0 }} />
            <div style={{
              width: '40px',
              height: '22px',
              borderRadius: '11px',
              background: darkMode
                ? 'linear-gradient(135deg, #4f7cff 0%, #3b63e0 100%)'
                : 'rgba(15,23,42,0.12)',
              position: 'relative',
              transition: 'background 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: darkMode ? '0 0 12px rgba(79,124,255,0.35)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: '3px',
                left: darkMode ? '21px' : '3px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#f0f2f8',
                transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </div>
            <Moon size={13} style={{ color: darkMode ? '#4f7cff' : '#64748b', transition: 'color 0.3s', flexShrink: 0 }} />
          </div>

          <button onClick={onLogout} style={iconButtonStyle} title="Cerrar sesión"
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.color = '#dc2626'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}>
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {/* MODALES */}
      <CreateEnvironmentModal 
        isOpen={showCreateEnv}
        onClose={() => setShowCreateEnv(false)}
      />

      <EnvironmentSettings 
          isOpen={showEnvSettings}
          onClose={() => setShowEnvSettings(false)}
        />
    </>
  );
}

// ============================================================================
// DASHBOARD VIEW - CORREGIDA
// ============================================================================
function DashboardView({ user, users = [], tasks = [], projects = [], onTaskClick, onProjectSelect }) {
  // Resolver el ID del usuario actual: puede ser UUID (auth) o ID de tabla users
  const currentUserRecord = users.find(u => u.id === user?.id || u.email === user?.email);
  const currentUserId = currentUserRecord?.id ?? user?.id;

  // Blindaje de seguridad: Si tasks o projects llegan undefined, usamos array vacío
  const myTasks = (tasks || []).filter(t =>
    t.assigneeId !== null && t.assigneeId !== undefined &&
    (String(t.assigneeId) === String(currentUserId) || String(t.assigneeId) === String(user?.id))
  );
  
  const overdueTasks = myTasks.filter(t => 
    new Date(t.endDate) < new Date() && t.status !== 'completed'
  );
  
  const todayTasks = myTasks.filter(t => {
    const today = new Date().toDateString();
    return t.endDate && new Date(t.endDate).toDateString() === today && t.status !== 'completed';
  });
  
  const upcomingTasks = myTasks.filter(t => {
    const days = Math.ceil((new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 7 && t.status !== 'completed';
  });
  
  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const activeProjects = (projects || []).filter(p => p.status === 'active');

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem', letterSpacing: '-0.5px' }}>
          {/* CORRECCIÓN: Todo dentro de llaves para que se ejecute el código */}
          {user?.isNew ? 'Bienvenido' : 'Bienvenido de vuelta'}, {(user?.name || user?.email || 'Usuario').split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9375rem', fontWeight: 500 }}>
          Aquí está tu resumen del día
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard 
          label="Vencidas HOY" 
          value={todayTasks.length} 
          color={DESIGN_TOKENS.warning.base}
          icon={<Clock size={20} />}
          trend="+2 desde ayer"
        />
        <StatCard 
          label="Esta Semana" 
          value={upcomingTasks.length} 
          color={DESIGN_TOKENS.info.base}
          icon={<Calendar size={20} />}
        />
        <StatCard 
          label="Completadas" 
          value={completedTasks.length} 
          color={DESIGN_TOKENS.success.base}
          icon={<CheckCircle2 size={20} />}
          trend={myTasks.length > 0 ? `${Math.round((completedTasks.length / myTasks.length) * 100)}% del total` : "0% del total"}
        />
        <StatCard 
          label="Proyectos Activos" 
          value={activeProjects.length} 
          color={DESIGN_TOKENS.primary.base}
          icon={<Briefcase size={20} />}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <TaskSection
          title="Tareas Vencidas"
          count={overdueTasks.length}
          tasks={overdueTasks.slice(0, 5)}
          onTaskClick={onTaskClick}
          emptyMessage="¡Genial! No hay tareas vencidas"
        />
        <TaskSection
          title="Para Hoy"
          count={todayTasks.length}
          tasks={todayTasks.slice(0, 5)}
          onTaskClick={onTaskClick}
          emptyMessage="No hay tareas pendientes para hoy"
        />
        <TaskSection
          title="Próxima Semana"
          count={upcomingTasks.length}
          tasks={upcomingTasks.slice(0, 5)}
          onTaskClick={onTaskClick}
          emptyMessage="No hay tareas próximas"
        />
      </div>

      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Proyectos Recientes
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {activeProjects.slice(0, 4).map(project => (
            <ProjectCard key={project.id} project={project} onClick={() => onProjectSelect(project)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon, trend }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid var(--border)',
      borderRadius: '18px',
      padding: '1.5rem',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      cursor: 'pointer',
      boxShadow: 'var(--shadow-card)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color, marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[600], fontWeight: 600, marginBottom: '0.5rem' }}>
        {label}
      </div>
      {trend && (
        <div style={{ fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[500] }}>
          {trend}
        </div>
      )}
    </div>
  );
}

function TaskSection({ title, count, tasks, onTaskClick, emptyMessage }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          background: DESIGN_TOKENS.neutral[100],
          padding: '0.25rem 0.75rem',
          borderRadius: '12px'
        }}>
          {count}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tasks.length === 0 ? (
          <div style={{
            padding: '2rem',
            background: DESIGN_TOKENS.success.light,
            borderRadius: '12px',
            textAlign: 'center',
            color: DESIGN_TOKENS.success.dark
          }}>
            {emptyMessage}
          </div>
        ) : (
          tasks.map(task => (
            <TaskCardCompact key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCardCompact({ task, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1rem',
      cursor: 'pointer',
      transition: 'all 0.22s ease',
      boxShadow: 'var(--shadow-card)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
          {task.title}
        </h4>
        <span style={{
          padding: '0.25rem 0.5rem',
          background: PRIORITY_OPTIONS[task.priority]?.color ? `${PRIORITY_OPTIONS[task.priority].color}15` : DESIGN_TOKENS.neutral[100],
          color: PRIORITY_OPTIONS[task.priority]?.color || DESIGN_TOKENS.neutral[600],
          borderRadius: '6px',
          fontSize: '0.7rem',
          fontWeight: 700
        }}>
          {PRIORITY_OPTIONS[task.priority]?.label || 'Normal'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[500] }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={12} />
          {formatDate(task.endDate, { month: 'short', day: 'numeric' })}
        </span>
        <span style={{
          padding: '0.25rem 0.5rem',
          background: (STATUS_OPTIONS[task.status] || STATUS_OPTIONS.todo).bg,
          color: (STATUS_OPTIONS[task.status] || STATUS_OPTIONS.todo).color,
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: 600
        }}>
          {(STATUS_OPTIONS[task.status] || STATUS_OPTIONS.todo).label}
        </span>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick, index = 0 }) {
  const progress = 75; // Placeholder

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: 'var(--shadow-card)',
        animation: `cardFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s backwards`,
        transformOrigin: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{
        width: '100%',
        height: '6px',
        background: project.color,
        borderRadius: '3px',
        marginBottom: '1rem',
        boxShadow: `0 2px 8px ${project.color}40`
      }} />

      <h4 style={{
        fontSize: DESIGN_TOKENS.typography.size.xl,
        fontWeight: DESIGN_TOKENS.typography.weight.bold,
        margin: '0 0 0.5rem',
        color: 'var(--text-primary)',
        letterSpacing: DESIGN_TOKENS.typography.letterSpacing.tight
      }}>
        {project.name}
      </h4>
      
      <p style={{
        fontSize: DESIGN_TOKENS.typography.size.sm,
        color: 'var(--text-muted)',
        margin: '0 0 1rem',
        lineHeight: DESIGN_TOKENS.typography.lineHeight.normal
      }}>
        {project.description}
      </p>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: DESIGN_TOKENS.typography.size.xs,
          color: 'var(--text-muted)',
          marginBottom: '0.5rem',
          fontWeight: DESIGN_TOKENS.typography.weight.medium
        }}>
          <span>Progreso</span>
          <span style={{ fontWeight: DESIGN_TOKENS.typography.weight.bold, color: 'var(--text-primary)' }}>
            {progress}%
          </span>
        </div>
        <div style={{ 
          height: '8px', 
          background: DESIGN_TOKENS.neutral[100], 
          borderRadius: DESIGN_TOKENS.border.radius.sm, 
          overflow: 'hidden',
          boxShadow: DESIGN_TOKENS.shadows.inner
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${project.color}, ${DESIGN_TOKENS.primary.base})`,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 8px ${project.color}60`
          }} />
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: DESIGN_TOKENS.typography.size.xs,
        color: 'var(--text-subtle)',
        fontWeight: DESIGN_TOKENS.typography.weight.medium
      }}>
        <span>
          {formatDate(project.startDate)} - {formatDate(project.endDate)}
        </span>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.25rem',
          background: DESIGN_TOKENS.neutral[100],
          padding: '4px 8px',
          borderRadius: DESIGN_TOKENS.border.radius.sm
        }}>
          <Users size={12} />
          {project.members?.length ?? 0}
        </div>
      </div>

      <style>{`
        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}


// ============================================================================
// WORKSPACE VIEW
// ============================================================================
function WorkspaceView({ workspace, lists = [], onSelectList }) {
  const [showCreateList, setShowCreateList] = useState(false);

  if (!workspace) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📂</div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>Ningún espacio seleccionado</div>
      </div>
    );
  }

  const wsColor = workspace.settings?.color || '#0066ff';

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            background: wsColor, boxShadow: `0 0 0 4px ${wsColor}25`, flexShrink: 0,
          }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              {workspace.name}
            </h1>
            {workspace.description && (
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>{workspace.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreateList(true)}
          style={{
            padding: '8px 18px', background: wsColor, color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}
        >
          + Nueva lista
        </button>
      </div>

      {/* LISTS */}
      {lists.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 32px',
          border: '2px dashed #e2e8f0', borderRadius: '16px', background: '#f8fafc',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>📋</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
            Este espacio está vacío
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
            Crea una lista para empezar a organizar tareas en este espacio
          </div>
          <button
            onClick={() => setShowCreateList(true)}
            style={{
              padding: '10px 24px', background: wsColor, color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '14px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Crear lista
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {lists.map(list => (
            <div
              key={list.id}
              onClick={() => onSelectList && onSelectList(list)}
              style={{
                padding: '20px', borderRadius: '12px',
                border: '1px solid #e2e8f0', background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: wsColor }} />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{list.name}</span>
              </div>
              {list.description && (
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{list.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateListModal
        isOpen={showCreateList}
        onClose={() => setShowCreateList(false)}
        preselectedWorkspaceId={workspace.id}
        onSave={(newList) => {
          setShowCreateList(false);
          onSelectList && onSelectList(newList);
        }}
      />
    </div>
  );
}

// ============================================================================
// PROJECTS VIEW
// ============================================================================
function ProjectsView({ projects, createProject, deleteProject, users, currentUser, onSelectProject, toggleFavorite, duplicateProject, exportData, onOpenProjectManagement }) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [pendingDeleteProject, setPendingDeleteProject] = useState(null); // { id, name }
  const [deletingProject, setDeletingProject] = useState(false);
  const { addToast } = useToast();
  const { currentEnvironment, currentWorkspace } = useApp();

  // Filtrar por entorno activo
  const environmentProjects = currentEnvironment
    ? projects.filter(p =>
        p.environmentId === currentEnvironment.id || p.environmentId == null
      )
    : projects;

  console.log(
    '[ProjectsView] projects total:', projects.length,
    '| environmentId actual:', currentEnvironment?.id,
    '| projects en vista:', environmentProjects.length,
    '| sample environmentId:', projects[0]?.environmentId
  );

  const filteredProjects = environmentProjects
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'deadline') return new Date(a.endDate) - new Date(b.endDate);
      return 0;
    });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#0f172a', letterSpacing: '-0.5px' }}>
            Proyectos
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9375rem', fontWeight: 500 }}>
            {environmentProjects.length} proyecto{environmentProjects.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => exportData('projects')} style={secondaryButtonStyle}>
            <Download size={18} />
            Exportar
          </button>
          <button onClick={() => setShowNewProject(true)} style={primaryButtonStyle}>
            <FolderPlus size={18} />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="completed">Completados</option>
          <option value="archived">Archivados</option>
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={selectStyle}
        >
          <option value="recent">Más recientes</option>
          <option value="name">Nombre A-Z</option>
          <option value="deadline">Próximos a vencer</option>
        </select>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {filteredProjects.map((project, index) => (
          <ProjectCardExtended
            key={project.id}
            project={project}
            index={index}
            onClick={() => onSelectProject(project)}
            onToggleFavorite={() => toggleFavorite(project.id)}
            onDuplicate={() => duplicateProject(project)}
            onOpenManagement={() => onOpenProjectManagement(project)}
            onDelete={() => setPendingDeleteProject({ id: project.id, name: project.name })}
          />
        ))}
      </div>

      {showNewProject && (
        <ProjectFormModal
          users={users}
          currentUser={currentUser}
          onSave={async (project) => {
            console.log('[ProjectsView] onSave recibido, environmentId:', currentEnvironment?.id, '| workspaceId:', currentWorkspace?.id, '| project.name:', project.name);
            try {
              await createProject({
                ...project,
                workspaceId: currentWorkspace?.id || null,
                environmentId: currentEnvironment?.id || null,
                status: project.status || 'active',
                favorite: false,
                roadmap: project.roadmap || { phases: [], userStories: [], risks: [], meetings: [] }
              });
              setShowNewProject(false);
              addToast('Proyecto creado exitosamente', 'success');
            } catch (err) {
              console.error('[ProjectsView] onSave error:', err);
              addToast('Error al crear el proyecto', 'error');
            }
          }}
          onClose={() => setShowNewProject(false)}
        />
      )}

      {pendingDeleteProject && (
        <ConfirmDeleteModal
          title="Eliminar proyecto"
          message={`¿Estás seguro de que quieres eliminar "${pendingDeleteProject.name}"? Se eliminarán todas sus tareas asociadas y esta acción no se puede deshacer.`}
          confirmLabel="Eliminar proyecto"
          loading={deletingProject}
          onConfirm={async () => {
            setDeletingProject(true);
            try {
              await deleteProject(pendingDeleteProject.id);
              addToast('Proyecto eliminado correctamente', 'success');
              setPendingDeleteProject(null);
            } catch {
              addToast('Error al eliminar el proyecto', 'error');
            } finally {
              setDeletingProject(false);
            }
          }}
          onCancel={() => setPendingDeleteProject(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// PROJECT CARD EXTENDED
// ============================================================================
function ProjectCardExtended({ project, onClick, onToggleFavorite, onDuplicate, onDelete, onOpenManagement, index = 0 }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(15, 23, 42, 0.06)',
      borderRadius: '18px',
      padding: '1.5rem',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      boxShadow: '0 1px 8px rgba(15, 23, 42, 0.06)',
      position: 'relative',
      animation: `cardFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s backwards`
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 16px 48px rgba(15, 23, 42, 0.12)';
      e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 8px rgba(15, 23, 42, 0.06)';
      e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.06)';
    }}>
      <div onClick={onClick}>
        <div style={{
          width: '100%',
          height: '6px',
          background: project.color,
          borderRadius: '3px',
          marginBottom: '1rem',
          boxShadow: `0 2px 8px ${project.color}40`
        }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: DESIGN_TOKENS.neutral[800], flex: 1 }}>
            {project.name}
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {project.favorite ? (
                <Star size={18} fill={DESIGN_TOKENS.warning.base} color={DESIGN_TOKENS.warning.base} />
              ) : (
                <StarOff size={18} color={DESIGN_TOKENS.neutral[400]} />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <MoreVertical size={18} color={DESIGN_TOKENS.neutral[400]} />
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[500], margin: '0 0 1rem', lineHeight: 1.5 }}>
          {project.description}
        </p>

        {project.tags && project.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {project.tags.map(tag => (
              <span key={tag} style={{
                padding: '0.25rem 0.75rem',
                background: DESIGN_TOKENS.primary.lightest,
                color: DESIGN_TOKENS.primary.base,
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[400], fontWeight: 500 }}>
          <span>{formatDate(project.endDate)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Users size={12} />
            {project.members?.length ?? 0} miembros
          </span>
        </div>
      </div>

      {showMenu && (
        <div style={{
          position: 'absolute',
          top: '3.5rem',
          right: '1rem',
          background: 'white',
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          borderRadius: DESIGN_TOKENS.border.radius.sm,
          boxShadow: DESIGN_TOKENS.shadows.xl,
          zIndex: 10,
          minWidth: '180px',
          overflow: 'hidden',
          animation: 'menuFadeIn 0.15s ease'
        }}>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setShowMenu(false);
              onOpenManagement(); 
            }}
            style={menuItemStyle}
          >
            <Copy size={16} />
            Duplicar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
            style={{ ...menuItemStyle, color: DESIGN_TOKENS.danger.base }}
          >
            <Trash2 size={16} />
            Eliminar
          </button>
        </div>
      )}

      <style>{`
        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// PROJECT DETAIL VIEW
// ============================================================================
function ProjectDetailView({ project, tasks, projects = [], onTaskCreate, onTaskUpdate, onTaskDelete, users, comments, onCommentsChange, tags, onTaskClick, onProjectUpdate }) {
  const [viewMode, setViewMode] = useState('list');
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [pendingDeleteTask, setPendingDeleteTask] = useState(null); // { id, title }
  const [deletingTask, setDeletingTask] = useState(false);
  const [liveTasks, setLiveTasks] = useState(null);
  const { addToast } = useToast();

  const handleViewMode = (mode) => {
    setViewMode(mode);
    if (mode === 'roadmap') setHeaderCollapsed(true);
  };

  const projectTasks = tasks.filter(t => t.projectId === project.id);

  // When project changes or external tasks update, reset live tasks
  const effectiveTasks = liveTasks !== null ? liveTasks : projectTasks;
  const rootTasks = effectiveTasks.filter(t => !t.parentId);

  const filteredTasks = rootTasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterAssignee !== 'all' && t.assigneeId !== Number(filterAssignee)) return false;
    return true;
  });

  const handleAddTask = async (task) => {
    try {
      await onTaskCreate({ ...task, projectId: task.projectId || project.id });
      setShowNewTask(false);
      addToast('Tarea creada exitosamente', 'success');
    } catch {
      addToast('Error al crear la tarea', 'error');
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    try {
      await onTaskUpdate(updatedTask.id, updatedTask);
      setSelectedTask(null);
      addToast('Tarea actualizada', 'success');
    } catch {
      addToast('Error al actualizar la tarea', 'error');
    }
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setPendingDeleteTask({ id: taskId, title: task?.title || 'esta tarea' });
  };

  const projectProgress = projectTasks.length > 0
    ? Math.round(projectTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / projectTasks.length)
    : 0;

  return (
    <div style={{ padding: '2rem' }}>
      {/* CARD DE INFORMACIÓN SUPERIOR */}
      <div style={{
        background: 'var(--bg-card, rgba(255,255,255,0.88))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '20px',
        border: '1px solid var(--border, rgba(15,23,42,0.06))',
        marginBottom: '1.25rem',
        boxShadow: '0 2px 12px rgba(15, 23, 42, 0.07)',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Franja de color superior (siempre visible) */}
        <div style={{ height: '4px', background: project.color, borderRadius: '20px 20px 0 0' }} />

        {/* Header minimizado — visible solo cuando está colapsado */}
        {headerCollapsed && (
          <div
            onClick={() => setHeaderCollapsed(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.5rem',
              cursor: 'pointer',
              gap: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: project.color, flexShrink: 0
              }} />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {project.name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>{projectTasks.length}</span> tareas
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                {formatDate(project.startDate)} → {formatDate(project.endDate)}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-subtle, #94a3b8)' }}>
                <ChevronDown size={14} /> Ver más
              </div>
            </div>
          </div>
        )}

        {/* Botón minimizar — visible solo cuando está expandido */}
        {!headerCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem 0' }}>
            <button
              onClick={() => setHeaderCollapsed(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600,
                color: 'var(--text-subtle, #94a3b8)',
                padding: '2px 6px', borderRadius: '6px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted, #64748b)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subtle, #94a3b8)'}
            >
              <ChevronUp size={13} /> Minimizar
            </button>
          </div>
        )}

        {/* Contenido colapsable */}
        <div style={{
          maxHeight: headerCollapsed ? '0' : '300px',
          opacity: headerCollapsed ? 0 : 1,
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          padding: headerCollapsed ? '0 2rem' : '1rem 2rem 2rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary, #1e293b)' }}>
                {project.name}
              </h2>
              <p style={{ color: 'var(--text-muted, #64748b)', margin: 0 }}>
                {project.description}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: project.color }}>
                {projectProgress}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle, #94a3b8)' }}>
                Progreso total
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            <InfoItem label="Fecha inicio" value={formatDate(project.startDate)} />
            <InfoItem label="Fecha fin" value={formatDate(project.endDate)} />
            <InfoItem label="Tareas totales" value={projectTasks.length} />
            <InfoItem label="Completadas" value={projectTasks.filter(t => t.status === 'completed').length} />
          </div>
        </div>
      </div>

      {/* SELECTOR DE VISTAS Y BOTONES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <ViewButton label="Lista" icon={<List size={16} />} active={viewMode === 'list'} onClick={() => handleViewMode('list')} />
          <ViewButton label="Tabla" icon={<Grid size={16} />} active={viewMode === 'table'} onClick={() => handleViewMode('table')} />
          <ViewButton label="Gantt" icon={<BarChart2 size={16} />} active={viewMode === 'gantt'} onClick={() => handleViewMode('gantt')} />
          <ViewButton label="Roadmap" icon={<Layers size={16} />} active={viewMode === 'roadmap'} onClick={() => handleViewMode('roadmap')} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={selectStyle}>
            <option value="all">Todos los asignados</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <button onClick={() => setShowNewTask(true)} style={primaryButtonStyle}>
            <ListPlus size={18} />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* RENDERIZADO DINÁMICO DE VISTAS */}
      {viewMode === 'list' && (
        <ListView
          listId={null}
          listName={project.name}
          tasks={effectiveTasks}
          projects={projects}
          users={users}
          onTasksChange={setLiveTasks}
          onListNameChange={() => {}}
          onListDelete={() => {}}
          onError={(msg) => addToast(msg, 'error')}
          hideTitle
        />
      )}

      {viewMode === 'table' && (
        <TableView
          tasks={filteredTasks}
          users={users}
          onEdit={setSelectedTask}
          onTaskClick={onTaskClick}
        />
      )}

      {viewMode === 'gantt' && (
        <GanttView tasks={projectTasks} project={project} users={users} onTaskClick={onTaskClick} />
      )}
      
      {viewMode === 'roadmap' && (
        <ProjectRoadmap
          project={project}
          tasks={projectTasks}
          onProjectUpdate={onProjectUpdate}
        />
      )}

      {/* MODALES */}
      {showNewTask && (
        <TaskFormModal users={users} tasks={projectTasks} projects={projects} currentProject={project} onSave={handleAddTask} onClose={() => setShowNewTask(false)} tags={tags} />
      )}

      {selectedTask && (
        <TaskFormModal initialTask={selectedTask} users={users} tasks={projectTasks} projects={projects} currentProject={project} onSave={handleUpdateTask} onClose={() => setSelectedTask(null)} tags={tags} />
      )}

      {pendingDeleteTask && (
        <ConfirmDeleteModal
          title="Eliminar tarea"
          message={`¿Estás seguro de que quieres eliminar "${pendingDeleteTask.title}"? También se eliminarán sus subtareas. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar tarea"
          loading={deletingTask}
          onConfirm={async () => {
            setDeletingTask(true);
            try {
              await onTaskDelete(pendingDeleteTask.id);
              addToast('Tarea eliminada correctamente', 'success');
              setPendingDeleteTask(null);
            } catch {
              addToast('Error al eliminar la tarea', 'error');
            } finally {
              setDeletingTask(false);
            }
          }}
          onCancel={() => setPendingDeleteTask(null)}
        />
      )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES (Indispensables para que no falle) ---

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[500], marginBottom: '0.25rem', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.125rem', fontWeight: 700, color: DESIGN_TOKENS.neutral[800] }}>
        {value}
      </div>
    </div>
  );
}

function ViewButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.625rem 1rem',
        background: active ? DESIGN_TOKENS.primary.base : 'white',
        color: active ? 'white' : DESIGN_TOKENS.neutral[600],
        border: `1px solid ${active ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.neutral[200]}`,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        transition: 'all 0.2s'
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/// ============================================================================
// LIST VIEW
// ============================================================================

function ProjectTaskList({ tasks, allTasks, users, expanded, onToggle, onEdit, onDelete, onTaskClick }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
      overflow: 'hidden',
      boxShadow: DESIGN_TOKENS.shadows.sm
    }}>
      {tasks.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: DESIGN_TOKENS.neutral[400] }}>
          No hay tareas que coincidan con los filtros
        </div>
      ) : (
        tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            allTasks={allTasks}
            users={users}
            expanded={expanded[task.id]}
            onToggle={() => onToggle(task.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onTaskClick={onTaskClick}
            level={0}
            allExpanded={expanded}
            onToggleTask={onToggle}
          />
        ))
      )}
    </div>
  );
}

function TaskRow({ task, allTasks, users, expanded, onToggle, onEdit, onDelete, onTaskClick, level, allExpanded, onToggleTask }) {
  const subtasks = allTasks.filter(t => t.parentId === task.id);
  const assignee = users.find(u => u.id === task.assigneeId);

  // VALIDACIÓN DE SEGURIDAD PARA STATUS Y PRIORITY
  // Si el status no existe en STATUS_OPTIONS, usamos un fallback gris
  const statusConfig = STATUS_OPTIONS[task.status] || { 
    label: task.status || 'Sin estado', 
    bg: '#f1f5f9', 
    color: '#64748b' 
  };
  
  const priorityConfig = PRIORITY_OPTIONS[task.priority] || { 
    label: task.priority || 'Normal', 
    color: '#94a3b8' 
  };

  return (
    <>
      <div style={{
        padding: '1rem 1.5rem',
        paddingLeft: `${1.5 + level * 2}rem`,
        borderBottom: `1px solid ${DESIGN_TOKENS.neutral[100]}`,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
        gap: '1rem',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.2s',
        background: 'white'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[50]}
      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
      onClick={() => onTaskClick(task)}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {subtasks.length > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: DESIGN_TOKENS.neutral[600],
                display: 'flex'
              }}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div style={{ width: 16 }} /> // Espacio para mantener alineación
          )}
          
          <div>
            <div style={{ fontWeight: 600, color: DESIGN_TOKENS.neutral[800], fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              {task.title}
            </div>
            {task.tags && task.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {task.tags.slice(0, 2).map(tag => (
                  <span key={tag} style={{
                    padding: '0.125rem 0.5rem',
                    background: DESIGN_TOKENS.primary.lighter,
                    color: DESIGN_TOKENS.primary.dark,
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STATUS CON PROTECCIÓN */}
        <div style={{
          padding: '0.375rem 0.75rem',
          background: statusConfig.bg,
          color: statusConfig.color,
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textAlign: 'center',
          width: 'fit-content'
        }}>
          {statusConfig.label}
        </div>

        {/* PRIORIDAD CON PROTECCIÓN */}
        <div style={{
          padding: '0.375rem 0.75rem',
          background: `${priorityConfig.color}15`,
          color: priorityConfig.color,
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          width: 'fit-content'
        }}>
          {priorityConfig.label}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {assignee && (
            <>
              <span style={{ fontSize: '1.1rem' }}>{assignee.avatar}</span>
              <span style={{ fontSize: '0.8rem', color: DESIGN_TOKENS.neutral[600] }}>
                {assignee.name.split(' ')[0]}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: DESIGN_TOKENS.neutral[600], display: 'flex' }}
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', color: DESIGN_TOKENS.danger.base, display: 'flex' }}
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* RENDERIZADO RECURSIVO DE SUBTAREAS */}
      {expanded && subtasks.map(subtask => (
        <TaskRow
          key={subtask.id}
          task={subtask}
          allTasks={allTasks}
          users={users}
          expanded={allExpanded[subtask.id]} // Usamos el estado real de la subtarea
          onToggle={() => onToggleTask(subtask.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onTaskClick={onTaskClick}
          level={level + 1}
          allExpanded={allExpanded}
          onToggleTask={onToggleTask}
        />
      ))}
    </>
  );
}

// ============================================================================
// TABLE VIEW
// ============================================================================
function TableView({ tasks = [], users = [], onEdit, onTaskClick }) {
  // 1. Helpers de estilo para evitar errores de "undefined"
  const getStatusStyle = (status) => {
    const options = {
      'Completado': { bg: DESIGN_TOKENS.success.light, color: DESIGN_TOKENS.success.dark, label: 'Completado' },
      'Pendiente': { bg: DESIGN_TOKENS.warning.light, color: DESIGN_TOKENS.warning.dark, label: 'Pendiente' },
      'Vencido': { bg: DESIGN_TOKENS.danger.light, color: DESIGN_TOKENS.danger.dark, label: 'Vencido' },
      'En Proceso': { bg: DESIGN_TOKENS.info.light, color: DESIGN_TOKENS.info.dark, label: 'En Proceso' }
    };
    return options[status] || { bg: DESIGN_TOKENS.neutral[100], color: DESIGN_TOKENS.neutral[600], label: status || 'Sin estado' };
  };

  const getPriorityStyle = (priority) => {
    const options = {
      'Alta': { color: DESIGN_TOKENS.danger.base, label: 'Alta' },
      'Media': { color: DESIGN_TOKENS.warning.base, label: 'Media' },
      'Baja': { color: DESIGN_TOKENS.success.base, label: 'Baja' }
    };
    return options[priority] || { color: DESIGN_TOKENS.neutral[400], label: priority || 'Normal' };
  };

  // Estilos base reutilizables
  const thStyle = {
    padding: `${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.lg}`,
    textAlign: 'left',
    fontSize: DESIGN_TOKENS.typography.size.xs,
    fontWeight: DESIGN_TOKENS.typography.weight.semibold,
    color: DESIGN_TOKENS.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
  };

  const tdStyle = {
    padding: `${DESIGN_TOKENS.spacing.md} ${DESIGN_TOKENS.spacing.lg}`,
    fontSize: DESIGN_TOKENS.typography.size.sm,
    color: DESIGN_TOKENS.neutral[800],
    verticalAlign: 'middle'
  };

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: DESIGN_TOKENS.border.radius.lg,
      border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
      overflow: 'hidden', // Cambiado a hidden para que el radio del borde funcione bien
      boxShadow: DESIGN_TOKENS.shadows.sm,
      width: '100%'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: DESIGN_TOKENS.typography.fontFamily }}>
          <thead>
            <tr style={{ background: DESIGN_TOKENS.neutral[50] }}>
              <th style={thStyle}>Tarea</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Prioridad</th>
              <th style={thStyle}>Asignado</th>
              <th style={thStyle}>Cronograma</th>
              <th style={thStyle}>Progreso</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const assignee = users.find(u => u.id === task.assigneeId);
              const status = getStatusStyle(task.status);
              const priority = getPriorityStyle(task.priority);

              return (
                <tr 
                  key={task.id} 
                  style={{ 
                    borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                    transition: DESIGN_TOKENS.transition.fast,
                    cursor: 'pointer'
                  }}
                  onClick={() => onTaskClick(task)}
                  onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[50]}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Título de Tarea */}
                  <td style={tdStyle}>
                    <div style={{ fontWeight: DESIGN_TOKENS.typography.weight.semibold, color: DESIGN_TOKENS.neutral[900] }}>
                      {task.title}
                    </div>
                  </td>

                  {/* Estado (Badge) */}
                  <td style={tdStyle}>
                    <div style={{
                      padding: '4px 10px',
                      background: status.bg,
                      color: status.color,
                      borderRadius: DESIGN_TOKENS.border.radius.sm,
                      fontSize: '11px',
                      fontWeight: 700,
                      width: 'fit-content',
                      textTransform: 'uppercase'
                    }}>
                      {status.label}
                    </div>
                  </td>

                  {/* Prioridad */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: priority.color }} />
                      <span style={{ fontWeight: 500 }}>{priority.label}</span>
                    </div>
                  </td>

                  {/* Asignado */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{assignee?.avatar || '👤'}</span>
                      <span style={{ fontWeight: 500 }}>{assignee?.name.split(' ')[0] || 'Sin asignar'}</span>
                    </div>
                  </td>

                  {/* Fechas combinadas */}
                  <td style={tdStyle}>
                    <div style={{ fontSize: '12px', color: DESIGN_TOKENS.neutral[500] }}>
                      {formatDate(task.startDate)} - {formatDate(task.endDate)}
                    </div>
                  </td>

                  {/* Progreso */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
                      <div style={{ flex: 1, height: '6px', background: DESIGN_TOKENS.neutral[100], borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${task.progress || 0}%`, 
                          height: '100%', 
                          background: DESIGN_TOKENS.primary.base,
                          borderRadius: '10px'
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: DESIGN_TOKENS.neutral[600] }}>{task.progress || 0}%</span>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        color: DESIGN_TOKENS.neutral[400],
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = DESIGN_TOKENS.primary.base}
                      onMouseLeave={(e) => e.currentTarget.style.color = DESIGN_TOKENS.neutral[400]}
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// GANTT VIEW
// ============================================================================
function GanttView({ tasks, project, users = [], onTaskClick }) {
  const [scale, setScale] = useState(null); // null = auto
  const [tooltip, setTooltip] = useState(null); // { task, x, y }
  const containerRef = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const NAME_COL_W = 220;

  // Split tasks with/without dates
  const tasksWithDates = tasks.filter(t => t.startDate || t.dueDate || t.endDate);
  const tasksWithout = tasks.filter(t => !t.startDate && !t.dueDate && !t.endDate);

  // Empty state
  if (tasks.length === 0 || tasksWithDates.length === 0) {
    return (
      <div style={{
        background: 'white', borderRadius: '16px',
        border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
        padding: '80px 40px', textAlign: 'center',
        boxShadow: DESIGN_TOKENS.shadows.sm
      }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📅</div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: DESIGN_TOKENS.neutral[700], marginBottom: '8px' }}>
          Sin fechas configuradas
        </div>
        <div style={{ fontSize: '14px', color: DESIGN_TOKENS.neutral[400] }}>
          Agrega fechas a tus tareas para ver el Gantt
        </div>
      </div>
    );
  }

  // Calculate range from tasks
  const allDates = [];
  tasksWithDates.forEach(t => {
    const s = parseDate(t.startDate);
    const e = parseDate(t.dueDate) || parseDate(t.endDate);
    if (s) allDates.push(s);
    if (e) allDates.push(e);
  });
  const rangeStart = new Date(Math.min(...allDates));
  const rangeEnd = new Date(Math.max(...allDates));
  rangeStart.setDate(rangeStart.getDate() - 7);
  rangeEnd.setDate(rangeEnd.getDate() + 14);
  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(0, 0, 0, 0);

  const totalDays = Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)) || 1;
  const totalMonths = totalDays / 30;

  const effectiveScale = scale || (totalMonths <= 3 ? 'weeks' : totalMonths <= 14 ? 'months' : 'quarters');

  // Generate header columns
  const generateColumns = () => {
    const cols = [];
    if (effectiveScale === 'weeks') {
      const d = new Date(rangeStart);
      // go to previous Monday
      while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
      while (d <= rangeEnd) {
        cols.push({
          label: `${d.getDate()} ${d.toLocaleDateString('es-ES', { month: 'short' })}`,
          start: new Date(d),
        });
        d.setDate(d.getDate() + 7);
      }
    } else if (effectiveScale === 'months') {
      const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      while (d <= rangeEnd) {
        cols.push({
          label: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
          start: new Date(d),
        });
        d.setMonth(d.getMonth() + 1);
      }
    } else {
      const d = new Date(rangeStart.getFullYear(), Math.floor(rangeStart.getMonth() / 3) * 3, 1);
      while (d <= rangeEnd) {
        const q = Math.floor(d.getMonth() / 3) + 1;
        cols.push({ label: `Q${q} ${d.getFullYear()}`, start: new Date(d) });
        d.setMonth(d.getMonth() + 3);
      }
    }
    return cols;
  };
  const columns = generateColumns();

  // Add end to each column
  const columnsWithEnd = columns.map((col, i) => ({
    ...col,
    end: columns[i + 1] ? columns[i + 1].start : rangeEnd,
  }));

  const DAY_MS = 1000 * 60 * 60 * 24;

  const dayToFrac = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.max(0, Math.min(1, (d - rangeStart) / DAY_MS / totalDays));
  };

  const todayFrac = dayToFrac(today);
  const isTodayInRange = today >= rangeStart && today <= rangeEnd;

  const projectColor = project?.color || '#6366f1';

  const getBar = (task) => {
    const start = parseDate(task.startDate);
    const end = parseDate(task.dueDate) || parseDate(task.endDate);
    if (!start && !end) return null;

    if (start && end) {
      // Both dates: calculate real duration
      const startDay = (start - rangeStart) / DAY_MS;
      const durationDays = (end - start) / DAY_MS;
      const leftPct = (startDay / totalDays) * 100;
      const widthPct = Math.max((durationDays / totalDays) * 100, 2);
      return { leftPct: Math.max(0, leftPct), widthPct, dashed: false };
    } else {
      // Only one date: dashed bar of 3 days
      const s = start || end;
      const startDay = (s - rangeStart) / DAY_MS;
      const leftPct = (startDay / totalDays) * 100;
      const widthPct = Math.max((3 / totalDays) * 100, 2);
      return { leftPct: Math.max(0, leftPct), widthPct, dashed: true };
    }
  };

  const getUser = (id) => users.find(u => String(u.id) === String(id));

  const ROW_H = 48;
  const HEADER_H = 44;

  const scaleButtons = [
    { key: 'weeks', label: 'Semanas' },
    { key: 'months', label: 'Meses' },
    { key: 'quarters', label: 'Trimestres' },
  ];

  const renderRow = (task, idx, noDates = false) => {
    const bar = noDates ? null : getBar(task);
    const assignee = getUser(task.assigneeId);
    const rowBg = idx % 2 === 0 ? 'white' : '#f8faff';

    return (
      <div key={task.id} style={{ display: 'flex', minHeight: `${ROW_H}px`, background: rowBg, borderBottom: '1px solid #f0f2f7' }}>
        {/* Name col — sticky */}
        <div style={{
          minWidth: `${NAME_COL_W}px`, width: `${NAME_COL_W}px`,
          position: 'sticky', left: 0, zIndex: 2,
          background: rowBg,
          borderRight: '2px solid #e5e7eb',
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '0 12px',
          boxShadow: '2px 0 6px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: noDates ? '#d1d5db' : (projectColor),
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px', fontWeight: 600, color: '#111',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{task.title}</div>
            {!noDates && (task.startDate || task.dueDate) && (
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                {formatDate(task.startDate, { day: '2-digit', month: 'short' })}
                {' → '}
                {formatDate(task.dueDate || task.endDate, { day: '2-digit', month: 'short' })}
              </div>
            )}
          </div>
          {assignee && (
            <div title={assignee.name} style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: '#e0e7ff', color: '#4f46e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, flexShrink: 0,
            }}>
              {assignee.avatar && assignee.avatar.length <= 2 ? assignee.avatar : assignee.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Timeline col */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          {/* Column grid lines */}
          {columnsWithEnd.map((col, ci) => (
            <div key={ci} style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${dayToFrac(col.start) * 100}%`,
              width: `${(dayToFrac(col.end) - dayToFrac(col.start)) * 100}%`,
              borderRight: '1px solid #f0f2f7',
            }} />
          ))}

          {/* Today line */}
          {isTodayInRange && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${todayFrac * 100}%`,
              width: '2px', background: '#ef4444',
              zIndex: 3, pointerEvents: 'none',
            }} />
          )}

          {/* Bar */}
          {noDates ? (
            <div style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              left: '4%', right: '4%', height: '24px',
              border: '2px dashed #d1d5db', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: '#9ca3af',
            }}>sin fechas</div>
          ) : bar ? (
            <div
              onClick={() => onTaskClick && onTaskClick(task)}
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setTooltip({ task, x: r.left + r.width / 2, y: r.top - 8 });
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                left: `${bar.leftPct}%`,
                width: `${bar.widthPct}%`,
                height: '28px',
                background: bar.dashed ? 'transparent' : `${projectColor}30`,
                borderRadius: '6px',
                border: bar.dashed ? `2px dashed ${projectColor}90` : `1.5px solid ${projectColor}60`,
                cursor: onTaskClick ? 'pointer' : 'default',
                overflow: 'hidden',
                zIndex: 1,
              }}
            >
              {/* Progress fill */}
              {!bar.dashed && (
                <div style={{
                  position: 'absolute', inset: 0,
                  width: `${task.progress || 0}%`,
                  background: projectColor,
                  borderRadius: '5px',
                  transition: 'width 0.3s',
                }} />
              )}
              {/* Label: task name + progress */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center',
                paddingLeft: '8px', paddingRight: '4px',
                gap: '4px',
                fontSize: '11px', fontWeight: 700,
                color: (task.progress || 0) > 45 ? 'white' : projectColor,
                whiteSpace: 'nowrap', overflow: 'hidden',
                zIndex: 1,
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                  {bar.widthPct > 4 ? task.title : ''}
                </span>
                {!bar.dashed && task.progress > 0 && bar.widthPct > 8 && (
                  <span style={{ flexShrink: 0, opacity: 0.85 }}>{task.progress}%</span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Escala:</span>
        {scaleButtons.map(btn => (
          <button key={btn.key} onClick={() => setScale(btn.key === effectiveScale && !scale ? null : btn.key)} style={{
            padding: '5px 14px', borderRadius: '8px', border: '1.5px solid',
            borderColor: effectiveScale === btn.key ? projectColor : '#e5e7eb',
            background: effectiveScale === btn.key ? `${projectColor}15` : 'white',
            color: effectiveScale === btn.key ? projectColor : '#374151',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>{btn.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        {isTodayInRange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
            <div style={{ width: '12px', height: '3px', background: '#ef4444', borderRadius: '2px' }} />
            Hoy
          </div>
        )}
      </div>

      {/* Gantt table */}
      <div ref={containerRef} style={{
        border: '1px solid #e5e7eb', borderRadius: '14px', overflow: 'auto',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: 'white',
      }}>
        <div style={{ minWidth: `${NAME_COL_W + Math.max(800, totalDays * 12)}px` }}>

          {/* Header */}
          <div style={{ display: 'flex', height: `${HEADER_H}px`, position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '2px solid #e5e7eb' }}>
            {/* Name header */}
            <div style={{
              minWidth: `${NAME_COL_W}px`, width: `${NAME_COL_W}px`,
              position: 'sticky', left: 0, zIndex: 11,
              background: '#f8faff', borderRight: '2px solid #e5e7eb',
              display: 'flex', alignItems: 'center', paddingLeft: '16px',
              fontSize: '11px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>TAREA</div>

            {/* Timeline header */}
            <div style={{ flex: 1, position: 'relative' }}>
              {columnsWithEnd.map((col, ci) => (
                <div key={ci} style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${dayToFrac(col.start) * 100}%`,
                  width: `${(dayToFrac(col.end) - dayToFrac(col.start)) * 100}%`,
                  borderRight: '1px solid #e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#374151',
                  overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 4px',
                  background: '#f8faff',
                }}>
                  {col.label}
                </div>
              ))}
              {/* Today marker in header */}
              {isTodayInRange && (
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${todayFrac * 100}%`,
                  width: '2px', background: '#ef4444', zIndex: 4,
                }} />
              )}
            </div>
          </div>

          {/* Task rows */}
          {tasksWithDates.map((task, idx) => renderRow(task, idx, false))}
          {tasksWithout.map((task, idx) => renderRow(task, tasksWithDates.length + idx, true))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (() => {
        const t = tooltip.task;
        const assignee = getUser(t.assigneeId);
        return (
          <div style={{
            position: 'fixed', zIndex: 9999,
            left: tooltip.x, top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '10px', padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            pointerEvents: 'none', minWidth: '180px',
          }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#111', marginBottom: '6px' }}>{t.title}</div>
            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span>📅 {formatDate(t.startDate)} → {formatDate(t.dueDate || t.endDate)}</span>
              <span>⏳ Progreso: <b style={{ color: projectColor }}>{t.progress || 0}%</b></span>
              {assignee && <span>👤 {assignee.name}</span>}
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes ganttFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
// ============================================================================
// ROADMAP VIEW (Gestión de Riesgos, HUs y Seguimiento)
// ============================================================================
function RoadmapView({ project }) {
  // Aquí usamos el componente que construimos antes, 
  // pero asegurándonos de que use tus DESIGN_TOKENS
  return (
    <div style={{
      background: DESIGN_TOKENS.neutral[50],
      borderRadius: '12px',
      border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
      padding: '1.5rem',
      minHeight: '500px'
    }}>
      {/* Reutilizamos la lógica de pestañas internas que vimos antes */}
      <ProjectRoadmapContent project={project} />
    </div>
  );
}
// ============================================================================
// ALL TASKS VIEW
// ============================================================================
function ProjectPillDropdown({ projects, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = value === 'all' ? null : projects.find(p => String(p.id) === String(value));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* TRIGGER */}
      <button
        onClick={() => { setOpen(v => !v); setSearch(''); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: selected ? '6px 12px 6px 8px' : '8px 14px',
          borderRadius: '10px',
          border: `1px solid ${open ? DESIGN_TOKENS.primary.base : 'rgba(15,23,42,0.08)'}`,
          background: open ? 'rgba(0,102,255,0.04)' : 'var(--bg-surface, white)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: selected ? 'var(--text-primary)' : 'var(--text-muted, #64748b)',
          transition: 'all 150ms',
          whiteSpace: 'nowrap',
        }}
      >
        {selected ? (
          <>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: selected.color || DESIGN_TOKENS.primary.base,
              flexShrink: 0,
            }} />
            <span style={{ fontWeight: 600, color: selected.color || DESIGN_TOKENS.primary.base }}>
              {selected.name}
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); onChange('all'); }}
              style={{
                marginLeft: '2px', cursor: 'pointer', color: 'var(--text-subtle, #94a3b8)',
                lineHeight: 1, fontSize: '14px', fontWeight: 400,
              }}
            >×</span>
          </>
        ) : (
          <>
            <Filter size={14} />
            Proyecto
            <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
          </>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          background: 'var(--bg-surface, white)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid var(--border, rgba(15,23,42,0.06))',
          minWidth: '240px',
          maxHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 500,
          overflow: 'hidden',
        }}>
          {/* SEARCH INPUT */}
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border, rgba(15,23,42,0.05))' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-subtle, #94a3b8)', pointerEvents: 'none',
              }} />
              <input
                autoFocus
                type="text"
                placeholder="Buscar o añadir opciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  background: 'var(--bg-input, #f5f5f7)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* OPTIONS */}
          <div style={{ overflowY: 'auto', padding: '6px', scrollbarWidth: 'thin' }}>
            {/* ALL option */}
            <button
              onClick={() => { onChange('all'); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: value === 'all' ? 'rgba(0,102,255,0.06)' : 'transparent',
                fontSize: '13px', fontWeight: value === 'all' ? 600 : 400,
                color: value === 'all' ? DESIGN_TOKENS.primary.base : 'var(--text-muted, #64748b)',
                textAlign: 'left', transition: 'background 120ms',
              }}
              onMouseEnter={(e) => { if (value !== 'all') e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
              onMouseLeave={(e) => { if (value !== 'all') e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-subtle, #94a3b8)', flexShrink: 0 }} />
              Todos los proyectos
            </button>

            {filtered.length > 0 && (
              <div style={{ height: '1px', background: 'var(--border, rgba(15,23,42,0.05))', margin: '4px 0' }} />
            )}

            {filtered.map(p => {
              const isSelected = String(value) === String(p.id);
              const color = p.color || DESIGN_TOKENS.primary.base;
              return (
                <button
                  key={p.id}
                  onClick={() => { onChange(p.id); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '7px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: isSelected ? `${color}12` : 'transparent',
                    borderLeft: `3px solid ${isSelected ? color : 'transparent'}`,
                    fontSize: '13px', fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? color : 'var(--text-primary)',
                    textAlign: 'left', transition: 'background 120ms',
                    paddingLeft: isSelected ? '7px' : '10px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = `${color}0a`;
                      e.currentTarget.style.borderLeftColor = `${color}50`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                    }
                  }}
                >
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: color, flexShrink: 0,
                    boxShadow: isSelected ? `0 0 0 2px ${color}30` : 'none',
                  }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  {isSelected && (
                    <span style={{ color, fontSize: '14px', fontWeight: 700, lineHeight: 1 }}>✓</span>
                  )}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-subtle, #94a3b8)', fontSize: '12px' }}>
                Sin resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function AllTasksView({ tasks, projects, users, currentUser, onTaskClick }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const { currentEnvironment } = useApp();

  // Resolver el ID del usuario actual: puede ser UUID (auth) o ID de tabla users
  const currentUserRecord = (users || []).find(u =>
    u.id === currentUser?.id || u.email === currentUser?.email
  );
  const currentUserId = currentUserRecord?.id ?? currentUser?.id;

  // Filtrar solo las tareas del usuario actual (comparación flexible de tipos)
  const myTasks = (tasks || []).filter(t =>
    t.assigneeId !== null && t.assigneeId !== undefined &&
    (String(t.assigneeId) === String(currentUserId) || String(t.assigneeId) === String(currentUser?.id))
  );
  console.log('[MyTasks] user.id:', currentUser?.id, 'resolvedId:', currentUserId, 'tasks asignadas:', myTasks.length);

  // Filtrar proyectos por entorno
  const environmentProjects = currentEnvironment
    ? projects.filter(p => p.environmentId === currentEnvironment.id || p.environmentId == null)
    : projects;

  // Filtrar tareas del usuario que pertenecen a proyectos del entorno actual
  const environmentTasks = currentEnvironment
    ? myTasks.filter(t => {
        const project = projects.find(p => p.id === t.projectId);
        return project && (project.environmentId === currentEnvironment.id || project.environmentId == null);
      })
    : myTasks;

  const filteredTasks = environmentTasks
    .filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterProject !== 'all' && String(t.projectId) !== String(filterProject)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'deadline') return new Date(a.endDate) - new Date(b.endDate);
      if (sortBy === 'priority') {
        const pOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      return 0;
    });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem', color: DESIGN_TOKENS.neutral[800] }}>
          Mis Tareas
        </h2>
        <p style={{ color: DESIGN_TOKENS.neutral[600], margin: 0 }}>
          {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''} encontrada{filteredTasks.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={selectStyle}>
          <option value="all">Todas las prioridades</option>
          {Object.entries(PRIORITY_OPTIONS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <ProjectPillDropdown
          projects={environmentProjects}
          value={filterProject}
          onChange={setFilterProject}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
          <option value="recent">Más recientes</option>
          <option value="deadline">Próximos a vencer</option>
          <option value="priority">Mayor prioridad</option>
        </select>
      </div>

      <TableView
        tasks={filteredTasks}
        users={users}
        onEdit={() => {}}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
// ============================================================================
// CALENDAR VIEW
// ============================================================================
function CalendarView({ projects, tasks }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const getMonthMatrix = (y, m) => {
    const first = new Date(y, m, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const matrix = [];
    let week = new Array(7).fill(null);
    let dayCounter = 1;

    for (let i = startDay; i < 7; i++) {
      week[i] = new Date(y, m, dayCounter++);
    }
    matrix.push(week);

    while (dayCounter <= daysInMonth) {
      const wk = new Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        wk[i] = new Date(y, m, dayCounter++);
      }
      matrix.push(wk);
    }

    return matrix;
  };

  const monthMatrix = getMonthMatrix(year, month);

  const projectsByDate = {};
  projects.forEach(p => {
    if (!p.endDate) return;
    const key = p.endDate;
    projectsByDate[key] = projectsByDate[key] || [];
    projectsByDate[key].push(p);
  });

  const tasksByDate = {};
  tasks.forEach(t => {
    if (!t.endDate) return;
    const key = t.endDate;
    tasksByDate[key] = tasksByDate[key] || [];
    tasksByDate[key].push(t);
  });

  const isSameDay = (d1, d2) => d1 && d2 && d1.toDateString() === d2.toDateString();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: DESIGN_TOKENS.neutral[800] }}>
            {monthNames[month]} {year}
          </h2>
          <p style={{ color: DESIGN_TOKENS.neutral[600], margin: '0.5rem 0 0' }}>
            Calendario de proyectos y tareas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={prevMonth} style={iconButtonStyle}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentDate(today)} style={secondaryButtonStyle}>
            Hoy
          </button>
          <button onClick={nextMonth} style={iconButtonStyle}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
        padding: '1.5rem',
        boxShadow: DESIGN_TOKENS.shadows.sm
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[500], fontWeight: 700, textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
          {monthMatrix.map((week, wi) => (
            week.map((day, di) => {
              if (!day) {
                return <div key={`${wi}-${di}`} style={{ minHeight: 100, background: 'transparent' }} />;
              }

              const iso = day.toISOString().slice(0,10);
              const dueProjects = projectsByDate[iso] || [];
              const dueTasks = tasksByDate[iso] || [];
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={iso}
                  style={{
                    minHeight: 100,
                    borderRadius: 8,
                    border: `2px solid ${isToday ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.neutral[200]}`,
                    padding: '0.75rem',
                    background: isToday ? DESIGN_TOKENS.primary.lighter : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isToday) e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
                  }}
                  onMouseLeave={(e) => {
                    if (!isToday) e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: isToday ? DESIGN_TOKENS.primary.dark : DESIGN_TOKENS.neutral[800] }}>
                    {day.getDate()}
                  </div>

                  {dueProjects.slice(0, 2).map(p => (
                    <div key={p.id} style={{
                      fontSize: '0.7rem',
                      color: 'white',
                      background: p.color,
                      padding: '0.25rem 0.5rem',
                      borderRadius: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 600
                    }}
                    title={p.name}>
                      📁 {p.name}
                    </div>
                  ))}

                  {dueTasks.slice(0, 2).map(t => (
                    <div key={t.id} style={{
                      fontSize: '0.7rem',
                      color: DESIGN_TOKENS.neutral[700],
                      background: (STATUS_OPTIONS[t.status] || STATUS_OPTIONS.todo).bg,
                      padding: '0.25rem 0.5rem',
                      borderRadius: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500
                    }}
                    title={t.title}>
                      ✓ {t.title}
                    </div>
                  ))}

                  {(dueProjects.length + dueTasks.length > 4) && (
                    <div style={{ fontSize: '0.7rem', color: DESIGN_TOKENS.neutral[500], fontWeight: 600 }}>
                      +{dueProjects.length + dueTasks.length - 4} más
                    </div>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ANALYTICS VIEW
// ============================================================================
function AnalyticsView({ tasks, projects, users }) {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => new Date(t.endDate) < new Date() && t.status !== 'completed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  const tasksByStatus = Object.keys(STATUS_OPTIONS).map(status => ({
    label: STATUS_OPTIONS[status].label,
    value: tasks.filter(t => t.status === status).length,
    color: STATUS_OPTIONS[status].color
  }));

  const tasksByPriority = Object.keys(PRIORITY_OPTIONS).map(priority => ({
    label: PRIORITY_OPTIONS[priority].label,
    value: tasks.filter(t => t.priority === priority).length,
    color: PRIORITY_OPTIONS[priority].color
  }));

  const userWorkload = users.map(u => ({
    user: u,
    count: tasks.filter(t => t.assigneeId === u.id).length
  })).filter(u => u.count > 0);

  const avgProgress = tasks.length > 0
    ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
    : 0;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem', color: DESIGN_TOKENS.neutral[800] }}>
          Analítica y Reportes
        </h2>
        <p style={{ color: DESIGN_TOKENS.neutral[600], margin: 0 }}>
          Resumen general del rendimiento
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <AnalyticsCard
          label="Total de Tareas"
          value={tasks.length}
          icon={<ClipboardList size={24} />}
          color={DESIGN_TOKENS.primary.base}
        />
        <AnalyticsCard
          label="Completadas"
          value={completedTasks.length}
          subtitle={`${Math.round((completedTasks.length / tasks.length) * 100)}% del total`}
          icon={<CheckCircle2 size={24} />}
          color={DESIGN_TOKENS.success.base}
        />
        <AnalyticsCard
          label="En Progreso"
          value={inProgressTasks.length}
          icon={<Clock size={24} />}
          color={DESIGN_TOKENS.info.base}
        />
        <AnalyticsCard
          label="Vencidas"
          value={overdueTasks.length}
          icon={<AlertTriangle size={24} />}
          color={DESIGN_TOKENS.danger.base}
        />
        <AnalyticsCard
          label="Proyectos Activos"
          value={projects.filter(p => p.status === 'active').length}
          icon={<Briefcase size={24} />}
          color={DESIGN_TOKENS.primary.base}
        />
        <AnalyticsCard
          label="Progreso Promedio"
          value={`${avgProgress}%`}
          icon={<TrendingUp size={24} />}
          color={DESIGN_TOKENS.warning.base}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <ChartCard title="Tareas por Estado" data={tasksByStatus} />
        <ChartCard title="Tareas por Prioridad" data={tasksByPriority} />
        <WorkloadCard title="Carga de Trabajo" data={userWorkload} />
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, subtitle, icon, color }) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: DESIGN_TOKENS.shadows.sm
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color, marginBottom: '0.5rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[600], fontWeight: 600, marginBottom: '0.25rem' }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[500] }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, data }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: DESIGN_TOKENS.shadows.sm
    }}>
      <h4 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: DESIGN_TOKENS.neutral[800] }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map(item => (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ color: DESIGN_TOKENS.neutral[700], fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
            </div>
            <div style={{ height: '8px', background: DESIGN_TOKENS.neutral[100], borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${(item.value / maxValue) * 100}%`,
                height: '100%',
                background: item.color,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkloadCard({ title, data }) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: DESIGN_TOKENS.shadows.sm
    }}>
      <h4 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 700, color: DESIGN_TOKENS.neutral[800] }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.map(item => (
          <div key={item.user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{item.user.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: DESIGN_TOKENS.neutral[800], marginBottom: '0.25rem' }}>
                {item.user.name}
              </div>
              <div style={{ height: '6px', background: DESIGN_TOKENS.neutral[100], borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, item.count * 10)}%`,
                  height: '100%',
                  background: DESIGN_TOKENS.primary.base
                }} />
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: DESIGN_TOKENS.neutral[700] }}>
              {item.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TASK DETAIL MODAL
// ============================================================================
// 1. Definimos DetailItem PRIMERO para que esté disponible en el scope
function DetailItem({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ 
        fontSize: '0.75rem', 
        color: DESIGN_TOKENS.neutral[500], 
        marginBottom: '0.5rem', 
        fontWeight: 600, 
        textTransform: 'uppercase' 
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// 2. Ahora definimos el Modal que consume a DetailItem
function TaskDetailModal({ task, project, users, comments, onClose, onUpdate, onAddComment }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [newComment, setNewComment] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { addToast } = useToast();

  const assignee = users.find(u => u.id === task.assigneeId);

  const handleSave = () => {
    onUpdate(editedTask);
    setIsEditing(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    onAddComment({ text: newComment });
    setNewComment('');
  };

  if (!task) return null;

  return (
    <Modal onClose={onClose} title="Detalle de Tarea" size="large">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Main Content */}
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            {isEditing ? (
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                style={{ ...inputStyle, fontSize: '1.5rem', fontWeight: 700 }}
              />
            ) : (
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: DESIGN_TOKENS.neutral[800] }}>
                {task.title}
              </h3>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: DESIGN_TOKENS.neutral[600], marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Descripción
            </h4>
            {isEditing ? (
              <textarea
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            ) : (
              <p style={{ fontSize: '0.95rem', color: DESIGN_TOKENS.neutral[700], lineHeight: 1.6, margin: 0 }}>
                {task.description || 'Sin descripción'}
              </p>
            )}
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
              <button onClick={handleSave} style={primaryButtonStyle}>
                <Save size={18} />
                Guardar Cambios
              </button>
              <button onClick={() => setIsEditing(false)} style={secondaryButtonStyle}>
                Cancelar
              </button>
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: DESIGN_TOKENS.neutral[800], marginBottom: '1rem' }}>
              Comentarios ({comments.length})
            </h4>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                style={{ ...primaryButtonStyle, marginTop: '0.75rem' }}
              >
                <Send size={18} />
                Agregar Comentario
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.map(comment => {
                const author = users.find(u => u.id === comment.userId);
                return (
                  <div key={comment.id} style={{
                    background: DESIGN_TOKENS.neutral[50],
                    borderRadius: '8px',
                    padding: '1rem',
                    border: `1px solid ${DESIGN_TOKENS.neutral[200]}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{author?.avatar}</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: DESIGN_TOKENS.neutral[800] }}>
                          {author?.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[500] }}>
                          {new Date(comment.createdAt).toLocaleString('es-ES')}
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[700], margin: 0, lineHeight: 1.5 }}>
                      {comment.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{
            background: DESIGN_TOKENS.neutral[50],
            borderRadius: '12px',
            padding: '1.5rem',
            border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
            marginBottom: '1rem'
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: DESIGN_TOKENS.neutral[600], marginBottom: '1rem', textTransform: 'uppercase' }}>
              Información
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <DetailItem label="Estado">
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: STATUS_OPTIONS[task.status]?.bg || DESIGN_TOKENS.neutral[100],
                  color: STATUS_OPTIONS[task.status]?.color || DESIGN_TOKENS.neutral[600],
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  {STATUS_OPTIONS[task.status]?.label || task.status}
                </div>
              </DetailItem>

              <DetailItem label="Prioridad">
                <div style={{
                  padding: '0.5rem 0.75rem',
                  background: `${PRIORITY_OPTIONS[task.priority]?.color}15`,
                  color: PRIORITY_OPTIONS[task.priority]?.color,
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  {PRIORITY_OPTIONS[task.priority]?.label || task.priority}
                </div>
              </DetailItem>

              <DetailItem label="Asignado a">
                {assignee && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{assignee.avatar}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: DESIGN_TOKENS.neutral[800] }}>
                      {assignee.name}
                    </span>
                  </div>
                )}
              </DetailItem>

              <DetailItem label="Proyecto">
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: DESIGN_TOKENS.neutral[800] }}>
                  {project?.name || 'Sin proyecto'}
                </div>
              </DetailItem>

              <DetailItem label="Fecha inicio">
                <div style={{ fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[700] }}>
                  {formatDate(task.startDate, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </DetailItem>

              <DetailItem label="Fecha fin">
                <div style={{ fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[700] }}>
                  {formatDate(task.endDate, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </DetailItem>

              <DetailItem label="Progreso">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[600] }}>Completado</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: DESIGN_TOKENS.primary.base }}>{task.progress}%</span>
                  </div>
                  <div style={{ height: '8px', background: DESIGN_TOKENS.neutral[200], borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${task.progress}%`,
                      height: '100%',
                      background: DESIGN_TOKENS.primary.base,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              </DetailItem>

              {task.tags && task.tags.length > 0 && (
                <DetailItem label="Etiquetas">
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {task.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '0.375rem 0.75rem',
                        background: DESIGN_TOKENS.primary.lighter,
                        color: DESIGN_TOKENS.primary.dark,
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </DetailItem>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} style={secondaryButtonStyle}>
                <Edit size={18} />
                Editar Tarea
              </button>
            )}
            <button onClick={() => setShowHistory(!showHistory)} style={secondaryButtonStyle}>
              <History size={18} />
              {showHistory ? 'Ocultar' : 'Ver'} Historial
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// KEYBOARD SHORTCUTS MODAL
// ============================================================================
function KeyboardShortcutsModal({ onClose }) {
  const shortcuts = [
    { keys: ['Ctrl', 'N'], description: 'Nueva tarea' },
    { keys: ['Ctrl', 'P'], description: 'Ver proyectos' },
    { keys: ['Ctrl', 'K'], description: 'Enfocar búsqueda' },
    { keys: ['?'], description: 'Mostrar atajos' },
    { keys: ['Esc'], description: 'Cerrar modal' }
  ];

  return (
    <Modal onClose={onClose} title="Atajos de Teclado">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {shortcuts.map((shortcut, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < shortcuts.length - 1 ? `1px solid ${DESIGN_TOKENS.neutral[200]}` : 'none' }}>
            <span style={{ fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[700] }}>
              {shortcut.description}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {shortcut.keys.map(key => (
                <kbd key={key} style={{
                  padding: '0.375rem 0.75rem',
                  background: DESIGN_TOKENS.neutral[100],
                  border: `1px solid ${DESIGN_TOKENS.neutral[300]}`,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: DESIGN_TOKENS.neutral[800],
                  fontFamily: DESIGN_TOKENS.typography.fontFamilyMono
                }}>
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ============================================================================
// FORMS AND MODALS
// ============================================================================
function ProjectFormModal({ users = [], onSave, onClose, currentUser }) {
  const safeUsers = Array.isArray(users) ? users : [];
  const displayUsers = safeUsers.length > 0 ? safeUsers : (currentUser ? [currentUser] : []);
  const defaultEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DESIGN_TOKENS.primary.base,
    startDate: new Date().toISOString().split('T')[0],
    endDate: defaultEndDate,
    leaderId: safeUsers[0]?.id || null,
    members: safeUsers[0]?.id ? [safeUsers[0].id] : [],
    tags: [],
    roadmap: {
      phases: [],
      userStories: [],
      risks: [],
      meetings: []
    }
});

  const { addToast } = useToast();

  const validateForm = () => {
    console.log('[ProjectFormModal] validateForm → name:', formData.name, '| endDate:', formData.endDate);
    if (!formData.name.trim()) {
      addToast('El nombre es requerido', 'error');
      return false;
    }
    if (!formData.endDate) {
      addToast('La fecha de fin es requerida', 'error');
      return false;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      addToast('La fecha de fin debe ser posterior a la de inicio', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    console.log('[ProjectForm] handleSubmit ejecutado, formData:', formData);
    if (validateForm()) {
      console.log('[ProjectForm] onSave llamado con:', formData);
      onSave(formData);
    }
  };

  console.log('[ProjectForm] render, users:', users?.length, 'formData.endDate:', formData.endDate);
  return (
    <Modal onClose={onClose} title="Nuevo Proyecto">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <FormField label="Nombre del proyecto" required>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="ej. Rediseño Web 2026"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Descripción">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            placeholder="Describe los objetivos del proyecto..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Fecha inicio">
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
              style={inputStyle}
            />
          </FormField>

          <FormField label="Fecha fin">
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
              style={inputStyle}
            />
          </FormField>
        </div>

        <FormField label="Color del proyecto">
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              DESIGN_TOKENS.primary.base,
              DESIGN_TOKENS.success.base,
              DESIGN_TOKENS.warning.base,
              DESIGN_TOKENS.danger.base,
              DESIGN_TOKENS.info.base,
              '#8B5CF6'
            ].map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(p => ({ ...p, color }))}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: color,
                  border: formData.color === color ? `3px solid ${DESIGN_TOKENS.neutral[800]}` : 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            ))}
          </div>
        </FormField>

        <FormField label="Miembros del equipo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {displayUsers.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: DESIGN_TOKENS.neutral[400], fontStyle: 'italic' }}>
                No hay usuarios disponibles
              </p>
            ) : (
              displayUsers.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[50]}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <input
                    type="checkbox"
                    checked={formData.members.includes(u.id)}
                    onChange={() => setFormData(p => ({
                      ...p,
                      members: p.members.includes(u.id)
                        ? p.members.filter(id => id !== u.id)
                        : [...p.members, u.id]
                    }))}
                    style={checkboxStyle}
                  />
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #15066c 0%, #0455c7 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '12px', flexShrink: 0
                  }}>
                    {(u.name || u.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: DESIGN_TOKENS.neutral[800] }}>
                    {u.name || u.email}
                  </span>
                </label>
              ))
            )}
          </div>
        </FormField>

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: `1px solid ${DESIGN_TOKENS.neutral[200]}` }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} style={primaryButtonStyle}>
            Crear Proyecto
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TaskFormModal({ initialTask, users, tasks, projects = [], currentProject, onSave, onClose, tags }) {
  const [formData, setFormData] = useState(() => {
    if (initialTask) {
      return {
        ...initialTask,
        projectId: initialTask.projectId || currentProject?.id || null,
        roadmapPhaseId: initialTask.roadmapPhaseId || null,
      };
    }
    return {
      title: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      priority: 'medium',
      status: 'todo',
      assigneeId: users[0]?.id,
      progress: 0,
      parentId: null,
      tags: [],
      estimatedHours: 0,
      projectId: currentProject?.id || null,
      roadmapPhaseId: null,
    };
  });

  const selectedProject = projects.find(p => String(p.id) === String(formData.projectId)) || null;
  const roadmapPhases = selectedProject?.roadmap?.phases?.filter(ph => ph.name) || [];

  const { addToast } = useToast();

  const validateForm = () => {
    if (!formData.title.trim()) {
      addToast('El título es requerido', 'error');
      return false;
    }
    if (!formData.endDate) {
      addToast('La fecha de fin es requerida', 'error');
      return false;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      addToast('La fecha de fin debe ser posterior a la de inicio', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Si la fase seleccionada no pertenece al proyecto actual, limpiarla
      const phaseStillValid = roadmapPhases.some(ph => String(ph.id) === String(formData.roadmapPhaseId));
      const dataToSave = {
        ...formData,
        roadmapPhaseId: phaseStillValid ? formData.roadmapPhaseId : null,
      };
      onSave(dataToSave);
    }
  };

  return (
    <Modal onClose={onClose} title={initialTask ? 'Editar Tarea' : 'Nueva Tarea'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <FormField label="Título" required>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="ej. Diseñar mockups de homepage"
            style={inputStyle}
            required
          />
        </FormField>

        <FormField label="Descripción">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
            placeholder="Describe la tarea en detalle..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </FormField>

        {projects.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Proyecto">
              <select
                value={formData.projectId || ''}
                onChange={(e) => setFormData(p => ({ ...p, projectId: e.target.value || null, roadmapPhaseId: null }))}
                style={selectStyle}
              >
                <option value="">Sin proyecto</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Fase del roadmap">
              {!formData.projectId ? (
                <div style={{ padding: '8px 12px', color: DESIGN_TOKENS.neutral[400], fontSize: '13px', background: DESIGN_TOKENS.neutral[50], borderRadius: '8px', border: `1px solid ${DESIGN_TOKENS.neutral[200]}` }}>
                  Selecciona un proyecto primero
                </div>
              ) : roadmapPhases.length === 0 ? (
                <div style={{ padding: '8px 12px', color: DESIGN_TOKENS.neutral[400], fontSize: '13px', background: DESIGN_TOKENS.neutral[50], borderRadius: '8px', border: `1px solid ${DESIGN_TOKENS.neutral[200]}` }}>
                  Este proyecto no tiene fases en el roadmap
                </div>
              ) : (
                <select
                  value={formData.roadmapPhaseId || ''}
                  onChange={(e) => setFormData(p => ({ ...p, roadmapPhaseId: e.target.value || null }))}
                  style={selectStyle}
                >
                  <option value="">Sin fase específica</option>
                  {roadmapPhases.map(phase => (
                    <option key={phase.id} value={phase.id}>{phase.name}</option>
                  ))}
                </select>
              )}
            </FormField>
          </div>
        )}

        {tasks && tasks.length > 0 && (
          <FormField label="Tarea padre (para crear subtarea)">
            <select
              value={formData.parentId || ''}
              onChange={(e) => setFormData(p => ({ ...p, parentId: e.target.value ? Number(e.target.value) : null }))}
              style={selectStyle}
            >
              <option value="">Sin tarea padre</option>
              {tasks.filter(t => !t.parentId && t.id !== initialTask?.id).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </FormField>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Fecha inicio" required>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="Fecha fin" required>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
              style={inputStyle}
              required
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Prioridad">
            <select
              value={formData.priority}
              onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}
              style={selectStyle}
            >
              {Object.entries(PRIORITY_OPTIONS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Estado">
            <select
              value={formData.status}
              onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
              style={selectStyle}
            >
              {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Asignado a" required>
          <select
            value={formData.assigneeId}
            onChange={(e) => { const v = e.target.value; setFormData(p => ({ ...p, assigneeId: isNaN(Number(v)) ? v : Number(v) })); }}
            style={selectStyle}
            required
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.avatar} {u.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label={`Progreso: ${formData.progress}%`}>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData(p => ({ ...p, progress: Number(e.target.value) }))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[500], marginTop: '0.5rem' }}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </FormField>

        <FormField label="Horas estimadas">
          <input
            type="number"
            value={formData.estimatedHours || 0}
            onChange={(e) => setFormData(p => ({ ...p, estimatedHours: Number(e.target.value) }))}
            min="0"
            step="0.5"
            style={inputStyle}
            placeholder="ej. 8"
          />
        </FormField>

        {tags && tags.length > 0 && (
          <FormField label="Etiquetas">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFormData(p => ({
                    ...p,
                    tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...(p.tags || []), tag]
                  }))}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: formData.tags?.includes(tag) ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.neutral[100],
                    color: formData.tags?.includes(tag) ? 'white' : DESIGN_TOKENS.neutral[700],
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </FormField>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: `1px solid ${DESIGN_TOKENS.neutral[200]}` }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancelar
          </button>
          <button type="submit" style={primaryButtonStyle}>
            {initialTask ? 'Guardar Cambios' : 'Crear Tarea'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// CONFIRM DELETE MODAL
// ============================================================================
function ConfirmDeleteModal({ title, message, confirmLabel = 'Eliminar', onConfirm, onCancel, loading = false }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10, 15, 30, 0.55)', backdropFilter: 'blur(4px)',
      padding: '1rem'
    }} onClick={onCancel}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '20px', padding: '2rem',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
          animation: 'modalFadeIn 0.2s ease'
        }}
      >
        {/* Icono */}
        <div style={{
          width: 52, height: 52, borderRadius: '14px',
          background: DESIGN_TOKENS.danger.light,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <Trash2 size={24} color={DESIGN_TOKENS.danger.base} />
        </div>

        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 1.75rem', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1.5px solid #e2e8f0',
              background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.6rem 1.4rem', borderRadius: '10px', border: 'none',
              background: loading ? '#fca5a5' : DESIGN_TOKENS.danger.base,
              color: 'white', fontWeight: 700, fontSize: '0.875rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}
          >
            {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Eliminando...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title, size = 'medium' }) {
  const widths = {
    small: '400px',
    medium: '600px',
    large: '900px'
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        animation: 'modalOverlayFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: DESIGN_TOKENS.border.radius.lg,
          maxWidth: widths[size],
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)`,
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          animation: 'modalContentSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10
        }}>
          <h3 style={{ 
            fontSize: DESIGN_TOKENS.typography.size['2xl'], 
            fontWeight: DESIGN_TOKENS.typography.weight.bold, 
            margin: 0, 
            color: DESIGN_TOKENS.neutral[800],
            letterSpacing: DESIGN_TOKENS.typography.letterSpacing.tight
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: DESIGN_TOKENS.neutral[600],
              display: 'flex',
              padding: '0.5rem',
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              transition: `all ${DESIGN_TOKENS.transition.fast}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DESIGN_TOKENS.neutral[100];
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes modalOverlayFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalContentSlideIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function FormField({ label, required, children, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.625rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: error ? DESIGN_TOKENS.danger.base : DESIGN_TOKENS.neutral[800]
      }}>
        {label}
        {required && <span style={{ color: DESIGN_TOKENS.danger.base, marginLeft: '0.25rem' }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: '0.75rem', color: DESIGN_TOKENS.danger.base, marginTop: '0.375rem', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}
// ============================================================================
// STYLES
// ============================================================================
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const loginContainerStyle = {
  minHeight: '100vh',
  display: 'flex',
  background: '#FFFFFF',
  fontFamily: DESIGN_TOKENS.typography.fontFamily
};

const brandingSectionStyle = {
  flex: 1,
  background: DESIGN_TOKENS.gradients.primary,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '4rem 3rem',
  color: 'white'
};

const brandingContentStyle = {
  maxWidth: '500px',
  animation: 'fadeInUp 0.8s ease forwards'
};

const logoStyle = {
  marginBottom: '1.5rem'
};

const brandingTitleStyle = {
  fontSize: '3.5rem',
  fontWeight: 800,
  margin: '0 0 1rem',
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
  color: 'white'
};

const brandingDescStyle = {
  fontSize: '1.125rem',
  opacity: 0.9,
  lineHeight: 1.8,
  marginBottom: '2.5rem',
  color: 'rgba(255,255,255,0.9)'
};

const featureListStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const formSectionStyle = {
  width: '100%',
  maxWidth: '480px',
  background: DESIGN_TOKENS.neutral[50],
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '3rem',
  boxShadow: DESIGN_TOKENS.shadows.xl
};

const formContentStyle = {
  width: '100%',
  maxWidth: '400px'
};

const tabsContainerStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  borderBottom: `1px solid ${DESIGN_TOKENS.neutral[200]}`
};

const tabStyle = {
  background: 'none',
  border: 'none',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  padding: '0.75rem 0',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const formTitleStyle = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: DESIGN_TOKENS.neutral[800],
  margin: '0 0 0.5rem',
  letterSpacing: '-0.01em'
};

const formSubtitleStyle = {
  fontSize: '0.875rem',
  color: DESIGN_TOKENS.neutral[500],
  margin: '0 0 1.5rem'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0'
};

const errorAlertStyle = {
  padding: '0.875rem 1rem',
  background: DESIGN_TOKENS.danger.light,
  border: `1px solid ${DESIGN_TOKENS.danger.base}30`,
  borderLeft: `4px solid ${DESIGN_TOKENS.danger.base}`,
  borderRadius: '8px',
  color: DESIGN_TOKENS.danger.dark,
  fontSize: '0.875rem',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem'
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  accentColor: DESIGN_TOKENS.primary.base
};

const submitButtonStyle = {
  width: '100%',
  padding: '0.875rem 1rem',
  background: DESIGN_TOKENS.gradients.primary,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: '1.5rem',
  transition: 'all 0.3s ease',
  boxShadow: `0 4px 12px ${DESIGN_TOKENS.primary.base}40`
};

const demoBoxStyle = {
  marginTop: '2rem',
  padding: '1rem',
  background: DESIGN_TOKENS.primary.lightest,
  border: `1px solid ${DESIGN_TOKENS.primary.lighter}`,
  borderRadius: '8px'
};

const passwordToggleStyle = {
  position: 'absolute',
  right: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  color: DESIGN_TOKENS.neutral[400],
  cursor: 'pointer',
  display: 'flex',
  padding: '0.5rem'
};

const dashboardContainerStyle = {
  height: '100vh',
  width: '100vw',
  display: 'flex',
  overflow: 'hidden',
  background: 'var(--bg-base)',
  fontFamily: DESIGN_TOKENS.typography.fontFamily,
  transition: 'background 0.4s ease'
};

const mainContentWrapperStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const topBarStyle = {
  background: 'var(--bg-topbar)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid var(--border)',
  padding: '0 2rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '62px',
  boxShadow: 'var(--shadow-topbar)',
  gap: '1.5rem',
  position: 'relative',
  zIndex: 10,
  transition: 'background 0.4s ease, border-color 0.4s ease'
};

const searchBarStyle = {
  flex: 1,
  maxWidth: '460px',
  display: 'flex',
  alignItems: 'center',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  borderRadius: '12px',
  padding: '0.5rem 1rem',
  gap: '0.75rem',
  transition: 'all 0.2s'
};

const searchInputStyle = {
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  width: '100%',
  fontFamily: DESIGN_TOKENS.typography.fontFamily
};

const iconButtonStyle = {
  background: 'none',
  border: '1px solid transparent',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#64748b',
  cursor: 'pointer',
  padding: '7px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.2s'
};

const contentAreaStyle = {
  flex: 1,
  overflow: 'auto',
  background: 'var(--bg-base)',
  transition: 'background 0.4s ease'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: `2px solid ${DESIGN_TOKENS.neutral[200]}`,
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: DESIGN_TOKENS.typography.fontFamily,
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
  backgroundColor: 'white',
  color: DESIGN_TOKENS.neutral[800]
};

const selectStyle = {
  padding: '0.625rem 1rem',
  border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: DESIGN_TOKENS.neutral[700],
  background: 'white',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: DESIGN_TOKENS.typography.fontFamily
};

const primaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #15066c 0%, #0455c7 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: '0.875rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
  letterSpacing: '-0.1px'
};

const secondaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '10px 20px',
  background: 'white',
  color: '#0f172a',
  border: '1px solid rgba(15, 23, 42, 0.1)',
  borderRadius: '12px',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  letterSpacing: '-0.1px'
};

const menuItemStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: 'none',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  fontSize: '0.875rem',
  color: '#475569',
  cursor: 'pointer',
  transition: 'background 0.2s',
  textAlign: 'left'
};

export default App;