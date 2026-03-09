import React, { useState, useEffect, useRef, useCallback } from 'react';

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
import { DESIGN_TOKENS, STORAGE_KEYS, storageGet, storageSet, storageDelete } from './styles/tokens';
import ProjectRoadmap from './components/ProjectRoadmap';
import EnvironmentSelector from "./components/Enviroments/EnvironmentSelector";
import CreateEnvironmentModal from "./components/Enviroments/CreateEnvironmentModal";
import EnvironmentSettings from "./components/Enviroments/EnvironmentSettings";
import { useApp } from './context/AppContext';
import TeamChatView from './components/TeamChatView';
import ListView from './components/ListView';
import LandingPage from './components/LandingPage';


// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================
const ToastContext = React.createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
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
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: 'min(400px, 90vw)'
    }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />
  };

  const colors = {
    success: { bg: DESIGN_TOKENS.success.light, border: DESIGN_TOKENS.success.base, text: DESIGN_TOKENS.success.dark },
    error: { bg: DESIGN_TOKENS.danger.light, border: DESIGN_TOKENS.danger.base, text: DESIGN_TOKENS.danger.dark },
    warning: { bg: DESIGN_TOKENS.warning.light, border: DESIGN_TOKENS.warning.base, text: DESIGN_TOKENS.warning.dark },
    info: { bg: DESIGN_TOKENS.info.light, border: DESIGN_TOKENS.info.base, text: DESIGN_TOKENS.info.dark }
  };

  const style = colors[toast.type] || colors.info;

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderLeft: `4px solid ${style.border}`,
      borderRadius: '8px',
      padding: '1rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      boxShadow: DESIGN_TOKENS.shadows.lg,
      animation: 'slideInRight 0.3s ease',
      minWidth: 'min(300px, 90vw)'
    }}>
      <div style={{ color: style.text, display: 'flex', flexShrink: 0 }}>
        {icons[toast.type]}
      </div>
      <div style={{ flex: 1, fontSize: '0.875rem', color: style.text, fontWeight: 500 }}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: style.text,
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          flexShrink: 0
        }}
      >
        <X size={16} />
      </button>
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
// MAIN APP
// ============================================================================
function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const [showLanding, setShowLanding] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const initApp = () => {
      if (!storageGet(STORAGE_KEYS.USERS)) storageSet(STORAGE_KEYS.USERS, []);
      if (!storageGet(STORAGE_KEYS.PROJECTS)) storageSet(STORAGE_KEYS.PROJECTS, []);
      if (!storageGet(STORAGE_KEYS.TASKS)) storageSet(STORAGE_KEYS.TASKS, []);
      const comments = storageGet(STORAGE_KEYS.COMMENTS);
      if (!comments) storageSet(STORAGE_KEYS.COMMENTS, []);

      const tags = storageGet(STORAGE_KEYS.TAGS);
      if (!tags) storageSet(STORAGE_KEYS.TAGS, ['web', 'diseño', 'ui', 'backend', 'frontend', 'urgente']);

      const savedUser = storageGet(STORAGE_KEYS.CURRENT_USER);
      if (savedUser) setCurrentUser(savedUser);

      const prefs = storageGet(STORAGE_KEYS.PREFERENCES);
      if (prefs?.darkMode) setDarkMode(prefs.darkMode);

      setIsLoading(false);
    };
    initApp();
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
    storageSet(STORAGE_KEYS.CURRENT_USER, user);
    const nombre = (user.name || user.email).split(' ')[0];
    addToast(
      isNew ? `¡Bienvenido, ${nombre}! Tu cuenta ha sido creada.` : `¡Bienvenido de vuelta, ${nombre}!`,
      'success'
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    storageDelete(STORAGE_KEYS.CURRENT_USER);
    addToast('Sesión cerrada correctamente', 'info');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const prefs = storageGet(STORAGE_KEYS.PREFERENCES) || {};
    storageSet(STORAGE_KEYS.PREFERENCES, { ...prefs, darkMode: newMode });
    addToast(`Modo ${newMode ? 'oscuro' : 'claro'} activado`, 'info');
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: DESIGN_TOKENS.typography.fontFamily
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{
            width: 50, height: 50,
            border: '4px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Cargando SEITRA...</div>
        </div>
      </div>
    );
  }

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
          position: absolute; width: clamp(220px, 40vw, 600px); height: clamp(220px, 40vw, 600px);
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
            Sincronizando Entorno
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
// SEITRA PREMIUM LOGIN - REDISEÑO DE PROPORCIONES Y COLOR ANIMADO
// ============================================================================

function LoginScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const users = storageGet(STORAGE_KEYS.USERS) || [];

    if (isLogin) {
      // — INICIO DE SESIÓN —
      const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found) {
        setError('No existe ninguna cuenta con ese correo. ¿Deseas registrarte?');
        setIsLoading(false);
        return;
      }
      onLogin(found, false);
    } else {
      // — REGISTRO —
      if (!name.trim()) {
        setError('El nombre completo es requerido.');
        setIsLoading(false);
        return;
      }
      if (users.find(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        setError('Ya existe una cuenta con ese correo. Inicia sesión.');
        setIsLoading(false);
        return;
      }
      const newUser = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: users.length === 0 ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      };
      storageSet(STORAGE_KEYS.USERS, [...users, newUser]);
      onLogin(newUser, true);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0a0f1e', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative',
      padding: '2rem'
    }}>
      {/* --- FONDO CINEMÁTICO --- */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop)',
        backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0, opacity: 0.6
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(15, 23, 42, 0.4) 0%, rgba(10, 15, 30, 0.95) 100%)' }} />
      </div>

      {/* --- FIGURAS ANIMADAS INTERACTIVAS --- */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <div className="shape-1" />
        <div className="shape-2" />
      </div>

      <style>{`
        @keyframes float-complex { 
          0%, 100% { transform: translate(0, 0) rotate(0deg); } 
          33% { transform: translate(30px, -50px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }
        .shape-1 { 
          position: absolute; top: 15%; right: 25%;
          width: clamp(250px, 25vw, 350px); height: clamp(250px, 25vw, 350px);
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, transparent 80%);
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; filter: blur(60px); animation: float-complex 20s infinite linear;
        }
        .shape-2 { 
          position: absolute; bottom: 10%; left: 20%;
          width: clamp(280px, 30vw, 450px); height: clamp(280px, 30vw, 450px);
          background: linear-gradient(135deg, rgba(124, 205, 243, 0.3) 0%, transparent 80%);
          border-radius: 50%; filter: blur(80px); animation: float-complex 25s infinite linear reverse;
        }
        .main-container {
          display: flex;
          width: min(95vw, 1080px);
          max-width: 1080px;
          max-height: calc(100vh - 3.5rem);
          min-height: 420px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border-radius: 40px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          z-index: 2;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
        }
        .main-container > * {
          min-width: 0;
        }
        .input-pro { 
          width: 100%; padding: 1.1rem 1.4rem; border-radius: 16px; border: 1px solid #e2e8f0; 
          background: #f8fafc; font-size: 1rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }
        .input-pro:focus { 
          border-color: #0f172a; background: white; 
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); outline: none;
        }
        @media (max-width: 1024px) {
          .main-container {
            width: min(92vw, 680px);
            max-height: calc(100vh - 3rem);
          }
        }
        @media (max-width: 900px) {
          .main-container {
            flex-direction: column;
            width: min(94vw, 520px);
            max-height: calc(100vh - 2.5rem);
          }
          .branding-section {
            display: none;
          }
        }
      `}</style>

      {/* --- CONTENEDOR MAESTRO --- */}
      <div className="main-container">
        
        {/* SECCIÓN BRANDING (Izquierda) */}
        <div className="branding-section" style={{
          flex: '1.2', padding: 'clamp(2rem, 5vw, 4rem)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', minWidth: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '4rem' }}>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '14px' }}>
                <Layout size={32} color="#0a0f1e" strokeWidth={2.5} />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>SEITRA</h1>
            </div>

            <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 600, color: 'white', lineHeight: 1.1, margin: 0, letterSpacing: '-0.04em' }}>
               ¡Bienvenido al Centro de Mando!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(0.95rem, 1.7vw, 1.2rem)', marginTop: '1.5rem', maxWidth: 'min(500px, 90vw)', lineHeight: 1.6 }}>
              Menos caos, más resultados. Accede para sincronizar tus objetivos y llevar tus proyectos al siguiente nivel.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'clamp(1rem, 3vw, 2rem)' }}>
             <div style={{ color: 'white' }}>
               <h4 style={{ margin: 0, fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)' }}>+500</h4>
               <p style={{ margin: 0, opacity: 0.5, fontSize: 'clamp(0.75rem, 1.4vw, 0.8rem)' }}>Proyectos Activos</p>
             </div>
             <div style={{ color: 'white' }}>
               <h4 style={{ margin: 0, fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)' }}>99.9%</h4>
               <p style={{ margin: 0, opacity: 0.5, fontSize: 'clamp(0.75rem, 1.4vw, 0.8rem)' }}>Productividad</p>
             </div>
          </div>
        </div>

        {/* SECCIÓN LOGIN (Derecha - Más ancha y limpia) */}
        <div style={{
          flex: '1', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(1.5rem, 4vw, 3.5rem)'
        }}>
          <div style={{ width: '100%', maxWidth: '460px' }}>

            {/* ── BIENVENIDA CON GATITO ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <svg width="52" height="62" viewBox="0 0 52 62" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                {/* orejas */}
                <polygon points="6,18 2,4 14,12" fill="#1e1e1e"/>
                <polygon points="30,18 38,4 26,12" fill="#1e1e1e"/>
                <polygon points="7,17 4,8 13,13" fill="#f87171"/>
                <polygon points="29,17 35,8 27,13" fill="#f87171"/>
                {/* cabeza */}
                <ellipse cx="18" cy="26" rx="16" ry="14" fill="#1e1e1e"/>
                {/* ojos */}
                <ellipse cx="12" cy="24" rx="3" ry="3.5" fill="white"/>
                <ellipse cx="24" cy="24" rx="3" ry="3.5" fill="white"/>
                <circle cx="12.5" cy="24.5" r="1.8" fill="#111"/>
                <circle cx="24.5" cy="24.5" r="1.8" fill="#111"/>
                <circle cx="13.2" cy="23.8" r="0.6" fill="white"/>
                <circle cx="25.2" cy="23.8" r="0.6" fill="white"/>
                {/* nariz */}
                <polygon points="18,29 16.5,27.5 19.5,27.5" fill="#f87171"/>
                {/* boca */}
                <path d="M16.5 29.5 Q18 31.5 19.5 29.5" stroke="#f87171" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
                {/* bigotes */}
                <line x1="2" y1="27" x2="11" y2="28.5" stroke="#555" strokeWidth="0.8" strokeLinecap="round"/>
                <line x1="2" y1="30" x2="11" y2="29.5" stroke="#555" strokeWidth="0.8" strokeLinecap="round"/>
                <line x1="34" y1="27" x2="25" y2="28.5" stroke="#555" strokeWidth="0.8" strokeLinecap="round"/>
                <line x1="34" y1="30" x2="25" y2="29.5" stroke="#555" strokeWidth="0.8" strokeLinecap="round"/>
                {/* cuerpo */}
                <ellipse cx="18" cy="49" rx="13" ry="10" fill="#1e1e1e"/>
                {/* brazo izquierdo (descansando) */}
                <ellipse cx="6" cy="46" rx="4" ry="3" fill="#1e1e1e" transform="rotate(20 6 46)"/>
                {/* brazo derecho levantado */}
                <path d="M28 38 Q34 28 40 22" stroke="#1e1e1e" strokeWidth="5" fill="none" strokeLinecap="round"/>
                {/* manita levantada */}
                <circle cx="41" cy="20" r="4.5" fill="#1e1e1e"/>
                <circle cx="38" cy="16" r="2.2" fill="#1e1e1e"/>
                <circle cx="41" cy="15" r="2.2" fill="#1e1e1e"/>
                <circle cx="44" cy="16" r="2.2" fill="#1e1e1e"/>
                {/* patitas */}
                <ellipse cx="11" cy="58" rx="5" ry="3" fill="#1e1e1e"/>
                <ellipse cx="24" cy="58" rx="5" ry="3" fill="#1e1e1e"/>
                {/* cola */}
                <path d="M31 54 Q44 50 42 39" stroke="#1e1e1e" strokeWidth="4" fill="none" strokeLinecap="round"/>
              </svg>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  {isLogin ? 'Bienvenido de vuelta' : 'Bienvenido'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#94a3b8', fontWeight: 500 }}>
                  {isLogin ? 'Nos alegra verte de nuevo por aquí.' : 'Crea tu cuenta y empieza hoy.'}
                </p>
              </div>
            </div>
            {/* ── TAB SWITCHER ── */}
            <div style={{
              display: 'flex', background: '#f1f5f9', borderRadius: '18px',
              padding: '5px', marginBottom: '2.5rem',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
            }}>
              {[
                { label: 'Iniciar sesión', mode: true },
                { label: 'Registrarse', mode: false }
              ].map(({ label, mode }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => switchMode(mode)}
                  style={{
                    flex: 1, padding: '0.8rem 1rem', borderRadius: '14px', border: 'none',
                    background: isLogin === mode ? 'white' : 'transparent',
                    color: isLogin === mode ? '#0f172a' : '#94a3b8',
                    fontWeight: isLogin === mode ? 700 : 500,
                    fontSize: '0.95rem', cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isLogin === mode ? '0 2px 12px rgba(15,23,42,0.1)' : 'none',
                    letterSpacing: isLogin === mode ? '-0.2px' : '0'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── FORMULARIO ── */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              {!isLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre completo</label>
                  <input type="text" required={!isLogin} value={name} onChange={(e) => setName(e.target.value)} className="input-pro" placeholder="Ej. María González" />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correo corporativo</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-pro" placeholder="admin@seitra.com" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-pro" style={{ paddingRight: '4rem' }} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding: '0.8rem 1rem', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.875rem', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button disabled={isLoading} style={{
                width: '100%', padding: '1.05rem', border: 'none', borderRadius: '16px',
                background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #15066c 0%, #0455c7 100%)',
                color: 'white', fontSize: '1rem', fontWeight: 700,
                cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                boxShadow: isLoading ? 'none' : '0 8px 24px rgba(15,23,42,0.25)', marginTop: '0.2rem'
              }}>
                {isLoading ? 'Verificando...' : isLogin ? 'Iniciar sesión' : 'Crear mi cuenta'}
              </button>
            </form>

            {/* ── DIVISOR ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.75rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                o continuar con
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* ── SOCIAL LOGIN ── */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>

              {/* Google */}
              <button
                type="button"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '0.85rem 1rem', borderRadius: '14px',
                  border: '1.5px solid #e2e8f0', background: 'white',
                  color: '#1e293b', fontWeight: 600, fontSize: '0.9rem',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                  <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                  <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                  <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                </svg>
                Google
              </button>

              {/* Facebook */}
              <button
                type="button"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '0.85rem 1rem', borderRadius: '14px',
                  border: 'none', background: '#1877F2',
                  color: 'white', fontWeight: 600, fontSize: '0.9rem',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1565d8'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(24,119,242,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#1877F2'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP DASHBOARD
// ============================================================================
function MainApp({ user, onLogout, darkMode, toggleDarkMode }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Dashboard', view: 'dashboard' }]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { addToast } = useToast();
  const listIdRef = useRef(Date.now());
  const [showProjectManagement, setShowProjectManagement] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;
    setIsMobile(width < 768);

    // Ajuste automático del sidebar según el ancho
    if (width < 768) {
      setSidebarOpen(false); // móvil: cerrado por defecto
    } else if (width < 1024) {
      setSidebarOpen(false); // tablet: colapsado por defecto (solo iconos)
    } else {
      setSidebarOpen(true); // desktop: abierto
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  return () => window.removeEventListener('resize', handleResize);
}, []);

  function loadData() {
    setProjects(storageGet(STORAGE_KEYS.PROJECTS) || []);
    setTasks(storageGet(STORAGE_KEYS.TASKS) || []);
    setUsers(storageGet(STORAGE_KEYS.USERS) || []);
    setComments(storageGet(STORAGE_KEYS.COMMENTS) || []);
    setTags(storageGet(STORAGE_KEYS.TAGS) || []);
  }

  function logActivity(type, description) {
    const log = storageGet(STORAGE_KEYS.ACTIVITY_LOG) || [];
    log.unshift({
      id: Date.now(),
      type,
      description,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
    storageSet(STORAGE_KEYS.ACTIVITY_LOG, log.slice(0, 100));
  }

  function saveProjects(newProjects) {
    setProjects(newProjects);
    storageSet(STORAGE_KEYS.PROJECTS, newProjects);
    logActivity('projects_updated', `Proyectos actualizados`);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Migrar proyectos existentes para agregar roadmap
  useEffect(() => {
    const migrateProjects = () => {
      const needsMigration = projects.some(p => !p.roadmap);
      if (needsMigration) {
        const migrated = projects.map(p => ({
          ...p,
          roadmap: p.roadmap || {
            phases: [],
            userStories: [],
            risks: [],
            meetings: []
          }
        }));
        saveProjects(migrated);
        addToast('Proyectos actualizados con nueva estructura', 'info');
      }
    };

    if (projects.length > 0) {
      migrateProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]); // Solo ejecutar cuando cambie la cantidad de proyectos

  const saveTasks = (newTasks) => {
    setTasks(newTasks);
    storageSet(STORAGE_KEYS.TASKS, newTasks);
    logActivity('tasks_updated', `Tareas actualizadas`);
  };

  const saveComments = (newComments) => {
    setComments(newComments);
    storageSet(STORAGE_KEYS.COMMENTS, newComments);
  };

  const handleViewChange = (view, label) => {
    setActiveView(view);
    setBreadcrumbs([{ label: label || view, view }]);
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
    setShowProjectManagement(true);
    addToast(`Gestión de proyecto "${project.name}" próximamente`, 'info');
  };

  const handleProjectUpdate = (updatedProject) => {
  saveProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  setSelectedProject(updatedProject);
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

  const toggleFavorite = (projectId) => {
    const updated = projects.map(p => 
      p.id === projectId ? { ...p, favorite: !p.favorite } : p
    );
    saveProjects(updated);
    addToast('Favorito actualizado', 'success');
  };

  const duplicateProject = (project) => {
    const copy = {
      ...project,
      id: Date.now(),
      name: `${project.name} (Copia)`,
      createdAt: new Date().toISOString()
    };
    saveProjects([...projects, copy]);
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
        />

        <div style={contentAreaStyle}>
          {activeView === 'dashboard' && (
            <DashboardView 
              user={user}
              tasks={tasks}
              projects={projects}
              onTaskClick={handleTaskClick}
              onProjectSelect={handleProjectSelect}

            />
          )}

          {activeView === 'list' && (
            <ListView 
              listId={listIdRef.current}
              listName={breadcrumbs[breadcrumbs.length - 1]?.label || 'Lista'}
              tasks={tasks}
              projects={projects}
              users={users}
              onTasksChange={saveTasks}
              onListNameChange={(id, name) => {
                setBreadcrumbs(breadcrumbs.map((b, i) => 
                  i === breadcrumbs.length - 1 ? { ...b, label: name } : b
                ));
              }}
              onListDelete={() => {
                handleViewChange('dashboard', 'Dashboard');
              }}
            />
          )}

          {activeView === 'projects' && (
            <ProjectsView 
              projects={projects}
              onProjectsChange={saveProjects}
              users={users}
              onSelectProject={handleProjectSelect}
              toggleFavorite={toggleFavorite}
              duplicateProject={duplicateProject}
              exportData={exportFullReport}
              onOpenProjectManagement={handleOpenProjectManagement}
            />
          )}

          {activeView === 'project-detail' && selectedProject && (
            <ProjectDetailView 
              project={selectedProject}
              tasks={tasks}
              onTasksChange={saveTasks}
              users={users}
              tags={tags}
              onTaskClick={handleTaskClick}
              onProjectUpdate={handleProjectUpdate} 
            />
            
          )}
          {activeView === 'chat' && (
            <TeamChatView 
              user={user}
            />
          )}

          {activeView === 'tasks' && (
            <AllTasksView 
              tasks={tasks}
              projects={projects}
              users={users}
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
          onUpdate={(updated) => {
            saveTasks(tasks.map(t => t.id === updated.id ? updated : t));
            setSelectedTask(updated);
            addToast('Tarea actualizada', 'success');
          }}
          onAddComment={(comment) => {
            const newComment = {
              ...comment,
              id: Date.now(),
              taskId: selectedTask.id,
              userId: user.id,
              createdAt: new Date().toISOString()
            };
            saveComments([...comments, newComment]);
            addToast('Comentario agregado', 'success');
          }}
        />
      )}

      {showProjectManagement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ width: 'min(460px, 90vw)', padding: '1.75rem', borderRadius: '18px', background: 'white', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Gestión de proyecto</h3>
            <p style={{ margin: '0.75rem 0 0', color: '#475569', lineHeight: 1.5 }}>
              Esta vista aún no está disponible. Pronto podrás manejar la configuración y detalles avanzados del proyecto desde aquí.
            </p>
            <button
              onClick={() => setShowProjectManagement(false)}
              style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer' }}
            >
              Cerrar
            </button>
          </div>
        </div>
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
function TopBar({ user, onLogout, onMenuClick, searchQuery, onSearchChange, darkMode, toggleDarkMode, breadcrumbs, onBreadcrumbClick, onExportReport }) {
  const [showCreateEnv, setShowCreateEnv] = useState(false);
  const [showEnvSettings, setShowEnvSettings] = useState(false);

  return (
    <>
      <div style={topBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <button onClick={onMenuClick} style={iconButtonStyle}>
            <Menu size={18} />
          </button>

          {breadcrumbs.length > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            <div style={searchBarStyle}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* SELECTOR DE ENTORNO - MOVIDO AQUÍ */}
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
            <Sun size={13} style={{ color: darkMode ? '#64748b' : '#f59e0b', transition: 'color 0.3s', flexShrink: 0 }} />
            <div style={{
              width: '40px',
              height: '22px',
              borderRadius: '11px',
              background: darkMode
                ? 'linear-gradient(135deg, #15066c 0%, #0455c7 100%)'
                : 'rgba(15,23,42,0.12)',
              position: 'relative',
              transition: 'background 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: darkMode ? '0 0 10px rgba(4,85,199,0.4)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: '3px',
                left: darkMode ? '21px' : '3px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            <Moon size={13} style={{ color: darkMode ? '#818cf8' : '#64748b', transition: 'color 0.3s', flexShrink: 0 }} />
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '0.5rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '12px', background: 'rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0f172a' }}>
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name || user.email}
              </span>
            </div>
          )}

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
// DASHBOARD VIEW
// ============================================================================
function DashboardView({ user, tasks, projects, onTaskClick, onProjectSelect }) {
  const myTasks = tasks.filter(t => t.assigneeId === user.id);
  const overdueTasks = myTasks.filter(t => 
    new Date(t.endDate) < new Date() && t.status !== 'completed'
  );
  const todayTasks = myTasks.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.endDate).toDateString() === today && t.status !== 'completed';
  });
  const upcomingTasks = myTasks.filter(t => {
    const days = Math.ceil((new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 7 && t.status !== 'completed';
  });
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <div style={{ padding: 'clamp(1rem, 2.5vw, 2rem)' }}>
      <div style={{ marginBottom: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
        <h1 style={{ fontSize: 'clamp(1.4rem, 2.6vw, 1.75rem)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem', letterSpacing: '-0.5px' }}>
          {user.isNew ? 'Bienvenido' : 'Bienvenido de vuelta'}, {(user.name || user.email || 'Usuario').split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 'clamp(0.85rem, 1.6vw, 0.9375rem)', fontWeight: 500 }}>
          Aquí está tu resumen del día
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'clamp(1rem, 2vw, 1.5rem)', marginBottom: '3rem' }}>
        <StatCard 
          label="  Vencidas HOY" 
          value={todayTasks.length} 
          color={DESIGN_TOKENS.warning.base}
          icon={<Clock size={20} />}
          trend="+2 desde ayer"
        />
        <StatCard 
          label=" Esta Semana" 
          value={upcomingTasks.length} 
          color={DESIGN_TOKENS.info.base}
          icon={<Calendar size={20} />}
        />
        <StatCard 
          label=" Completadas" 
          value={completedTasks.length} 
          color={DESIGN_TOKENS.success.base}
          icon={<CheckCircle2 size={20} />}
          trend={`${Math.round((completedTasks.length / myTasks.length) * 100)}% del total`}
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
          title=" Tareas Vencidas"
          count={overdueTasks.length}
          tasks={overdueTasks.slice(0, 5)}
          onTaskClick={onTaskClick}
          emptyMessage="¡Genial! No hay tareas vencidas"
        />
        <TaskSection
          title=" Para Hoy"
          count={todayTasks.length}
          tasks={todayTasks.slice(0, 5)}
          onTaskClick={onTaskClick}
          emptyMessage="No hay tareas pendientes para hoy"
        />
        <TaskSection
          title=" Próxima Semana"
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
          {new Date(task.endDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
        </span>
        <span style={{
          padding: '0.25rem 0.5rem',
          background: STATUS_OPTIONS[task.status].bg,
          color: STATUS_OPTIONS[task.status].color,
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: 600
        }}>
          {STATUS_OPTIONS[task.status].label}
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
          {new Date(project.startDate).toLocaleDateString('es-ES')} - {new Date(project.endDate).toLocaleDateString('es-ES')}
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
          {project.members.length}
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
// PROJECTS VIEW
// ============================================================================
function ProjectsView({ projects, onProjectsChange, users, onSelectProject, toggleFavorite, duplicateProject, exportData, onOpenProjectManagement }) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const { addToast } = useToast();
  const { currentEnvironment } = useApp();

  // Filtrar por entorno activo
  const environmentProjects = currentEnvironment 
    ? projects.filter(p => p.environmentId === currentEnvironment.id)
    : projects;

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
            onDelete={() => {
              if (confirm(`¿Eliminar proyecto "${project.name}"?`)) {
                onProjectsChange(projects.filter(p => p.id !== project.id));
                addToast('Proyecto eliminado', 'success');
              }
            }}
          />
        ))}
      </div>

      {showNewProject && (
      <ProjectFormModal
        users={users}
        onSave={(project) => {
          onProjectsChange([...projects, { 
            ...project, 
            id: Date.now(), 
            environmentId: currentEnvironment?.id || null,
            status: 'active',
            favorite: false,
            createdAt: new Date().toISOString(),
            // Asegurar que roadmap existe
            roadmap: project.roadmap || {
              phases: [],
              userStories: [],
              risks: [],
              meetings: []
            }
          }]);
          setShowNewProject(false);
          addToast('Proyecto creado exitosamente', 'success');
        }}
        onClose={() => setShowNewProject(false)}
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
          <span>{new Date(project.endDate).toLocaleDateString('es-ES')}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Users size={12} />
            {project.members.length} miembros
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
          minWidth: 'min(220px, 80vw)',
          overflow: 'hidden',
          animation: 'menuFadeIn 0.15s ease'
        }}>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setShowMenu(false);
              onDuplicate();
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
function ProjectDetailView({ project, tasks, onTasksChange, users, tags, onTaskClick, onProjectUpdate }) {
  const [viewMode, setViewMode] = useState('list');
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const { addToast } = useToast();

  const handleViewMode = (mode) => {
    setViewMode(mode);
    if (mode === 'roadmap') setHeaderCollapsed(true);
  };

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const rootTasks = projectTasks.filter(t => !t.parentId);

  const filteredTasks = rootTasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterAssignee !== 'all' && t.assigneeId !== Number(filterAssignee)) return false;
    return true;
  });

  const handleAddTask = (task) => {
    const newTask = {
      ...task,
      id: Date.now(),
      projectId: project.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onTasksChange([...tasks, newTask]);
    setShowNewTask(false);
    addToast('Tarea creada exitosamente', 'success');
  };

  const handleUpdateTask = (updatedTask) => {
    onTasksChange(tasks.map(t => t.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date().toISOString() } : t));
    setSelectedTask(null);
    addToast('Tarea actualizada', 'success');
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('¿Eliminar esta tarea y todas sus subtareas?')) {
      const deleteRecursive = (id) => {
        const children = projectTasks.filter(t => t.parentId === id);
        children.forEach(child => deleteRecursive(child.id));
        return tasks.filter(t => t.id !== id);
      };
      onTasksChange(deleteRecursive(taskId));
      addToast('Tarea eliminada', 'success');
    }
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
                {new Date(project.startDate).toLocaleDateString('es-ES')} → {new Date(project.endDate).toLocaleDateString('es-ES')}
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
            <InfoItem label="Fecha inicio" value={new Date(project.startDate).toLocaleDateString('es-ES')} />
            <InfoItem label="Fecha fin" value={new Date(project.endDate).toLocaleDateString('es-ES')} />
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
          tasks={filteredTasks}
          allTasks={projectTasks}
          users={users}
          expanded={expandedTasks}
          onToggle={(id) => setExpandedTasks(p => ({ ...p, [id]: !p[id] }))}
          onEdit={setSelectedTask}
          onDelete={handleDeleteTask}
          onTaskClick={onTaskClick}
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
        <GanttView tasks={projectTasks} project={project} />
      )}
      
      {viewMode === 'roadmap' && (
        <ProjectRoadmap 
          project={project} 
          onProjectUpdate={onProjectUpdate} 
        />
      )}

      {/* MODALES */}
      {showNewTask && (
        <TaskFormModal users={users} tasks={projectTasks} onSave={handleAddTask} onClose={() => setShowNewTask(false)} tags={tags} />
      )}

      {selectedTask && (
        <TaskFormModal initialTask={selectedTask} users={users} tasks={projectTasks} onSave={handleUpdateTask} onClose={() => setSelectedTask(null)} tags={tags} />
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

/* COMENTADO - AHORA SE USA EL COMPONENTE IMPORTADO
function ListView({ tasks, allTasks, users, expanded, onToggle, onEdit, onDelete, onTaskClick }) {
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
*/

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
                      {new Date(task.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {new Date(task.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
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
function GanttView({ tasks, project }) {
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  const getTaskPosition = (task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const left = Math.max(0, (taskStart - startDate) / (1000 * 60 * 60 * 24));
    const width = Math.max(1, (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1);
    return { left: (left / totalDays) * 100, width: (width / totalDays) * 100 };
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
      overflow: 'auto',
      boxShadow: DESIGN_TOKENS.shadows.sm
    }}>
      <div style={{ minWidth: '100%' }}>
        {tasks.filter(t => !t.parentId).map(task => {
          const pos = getTaskPosition(task);
          return (
            <div
              key={task.id}
              style={{
                display: 'flex',
                borderBottom: `1px solid ${DESIGN_TOKENS.neutral[100]}`,
                minHeight: '60px',
                alignItems: 'center'
              }}
            >
              <div style={{
                minWidth: 'clamp(180px, 20vw, 250px)',
                padding: 'clamp(0.75rem, 1.5vw, 1rem)',
                borderRight: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
                background: DESIGN_TOKENS.neutral[50]
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[800], marginBottom: '0.25rem' }}>
                  {task.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: DESIGN_TOKENS.neutral[500] }}>
                  {new Date(task.startDate).toLocaleDateString('es-ES')} - {new Date(task.endDate).toLocaleDateString('es-ES')}
                </div>
              </div>
              <div style={{ flex: 1, position: 'relative', padding: '0.75rem 1rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(1rem + ${pos.left}%)`,
                    width: `${pos.width}%`,
                    height: '32px',
                    background: `linear-gradient(135deg, ${PRIORITY_OPTIONS[task.priority].color}, ${PRIORITY_OPTIONS[task.priority].color}CC)`,
                    borderRadius: '6px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: DESIGN_TOKENS.shadows.sm
                  }}
                  title={`${task.progress}% completado`}
                >
                  {task.progress}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
function AllTasksView({ tasks, projects, users, onTaskClick }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const { currentEnvironment } = useApp();

  // Filtrar proyectos por entorno
  const environmentProjects = currentEnvironment 
    ? projects.filter(p => p.environmentId === currentEnvironment.id)
    : projects;

  // Filtrar tareas que pertenecen a proyectos del entorno actual
  const environmentTasks = currentEnvironment
    ? tasks.filter(t => {
        const project = projects.find(p => p.id === t.projectId);
        return project && project.environmentId === currentEnvironment.id;
      })
    : tasks;

  const filteredTasks = environmentTasks
    .filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterProject !== 'all' && t.projectId !== Number(filterProject)) return false;
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
          Todas las Tareas
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

        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} style={selectStyle}>
          <option value="all">Todos los proyectos</option>
          {environmentProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

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
                      background: STATUS_OPTIONS[t.status].bg,
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
    <div style={{ padding: 'clamp(1rem, 2.5vw, 2rem)' }}>
      <div style={{ marginBottom: 'clamp(1.25rem, 2.5vw, 2rem)' }}>
        <h2 style={{ fontSize: 'clamp(1.4rem, 2.6vw, 1.75rem)', fontWeight: 800, margin: '0 0 0.5rem', color: DESIGN_TOKENS.neutral[800] }}>
          Analítica y Reportes
        </h2>
        <p style={{ color: DESIGN_TOKENS.neutral[600], margin: 0, fontSize: 'clamp(0.85rem, 1.6vw, 0.9375rem)' }}>
          Resumen general del rendimiento
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(1rem, 2vw, 1.5rem)', marginBottom: '3rem' }}>
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
      <div style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color, marginBottom: '0.5rem' }}>
        {value}
      </div>
      <div style={{ fontSize: 'clamp(0.8rem, 1.6vw, 0.875rem)', color: DESIGN_TOKENS.neutral[600], fontWeight: 600, marginBottom: '0.25rem' }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.75rem)', color: DESIGN_TOKENS.neutral[500] }}>
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
                  {new Date(task.startDate).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </DetailItem>

              <DetailItem label="Fecha fin">
                <div style={{ fontSize: '0.875rem', color: DESIGN_TOKENS.neutral[700] }}>
                  {new Date(task.endDate).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
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
function ProjectFormModal({ users, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DESIGN_TOKENS.primary.base,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    ownerId: users[0]?.id,
    members: [],
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Modal onClose={onClose} title="Nuevo Proyecto">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <FormField label="Nombre del proyecto" required>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="ej. Rediseño Web 2026"
            style={inputStyle}
            required
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
            {users.map(u => (
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
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: DESIGN_TOKENS.primary.base }}
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
            ))}
          </div>
        </FormField>

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: `1px solid ${DESIGN_TOKENS.neutral[200]}` }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancelar
          </button>
          <button type="submit" style={primaryButtonStyle}>
            Crear Proyecto
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TaskFormModal({ initialTask, users, tasks, onSave, onClose, tags }) {
  const [formData, setFormData] = useState(initialTask || {
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
    estimatedHours: 0
  });

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
      onSave(formData);
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
            onChange={(e) => setFormData(p => ({ ...p, assigneeId: Number(e.target.value) }))}
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
const dashboardContainerStyle = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: 'min(1200px, 100vw)',
  margin: '0 auto',
  padding: '0 1rem',
  display: 'flex',
  overflow: 'hidden',
  background: 'var(--bg-base)',
  fontFamily: DESIGN_TOKENS.typography.fontFamily,
  transition: 'background 0.4s ease'
};

const mainContentWrapperStyle = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const topBarStyle = {
  background: 'var(--bg-topbar)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid var(--border)',
  padding: '0 clamp(1rem, 2.5vw, 2rem)',
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
  maxWidth: 'min(460px, 100%)',
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
  minWidth: 0,
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