import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Minimize2, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const buildContext = ({ projects, tasks, users, currentUser, currentEnvironment }) => {
  const myTasks = tasks.filter(t => t.assigneeId === currentUser?.id);
  const pendingTasks = myTasks.filter(t => t.status === 'pending');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

  const projectSummaries = projects.map(p => {
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return `- ${p.name} (${p.status}): ${completed}/${projectTasks.length} tareas completadas, progreso ${p.progress || 0}%`;
  }).join('\n');

  return `
Eres el asistente de SEITRA, una app de gestión de proyectos.
Responde siempre en español, de forma concisa y amigable.
Tienes acceso a los siguientes datos del usuario:

USUARIO ACTUAL: ${currentUser?.name} (${currentUser?.role})
ENTORNO ACTIVO: ${currentEnvironment?.name || 'Sin entorno'}

MIS TAREAS:
- Pendientes: ${pendingTasks.length}
- En progreso: ${inProgressTasks.length}  
- Completadas: ${completedTasks.length}
- Total asignadas: ${myTasks.length}

PROYECTOS (${projects.length} total):
${projectSummaries || 'Sin proyectos'}

EQUIPO: ${users.length} miembro(s) — ${users.map(u => u.name).join(', ')}

Responde preguntas sobre este contexto. Si preguntan algo que no está en los datos, dilo claramente.
Si preguntan algo general de gestión de proyectos, responde con tu conocimiento.
Sé breve — máximo 3-4 oraciones por respuesta.
  `.trim();
};

// ─── MENSAJE ──────────────────────────────────────────────────────────────────

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
      animation: 'msgIn 0.2s ease',
    }}>
      {!isUser && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #1e3a5f, #2c5282)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: '8px', flexShrink: 0, marginTop: '2px',
          boxShadow: '0 2px 8px rgba(30,58,95,0.3)'
        }}>
          <Sparkles size={13} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser
          ? 'linear-gradient(135deg, #1e3a5f, #2c5282)'
          : 'rgba(255,255,255,0.08)',
        color: isUser ? 'white' : 'rgba(255,255,255,0.9)',
        fontSize: '13px',
        lineHeight: 1.55,
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: isUser ? 'none' : 'blur(8px)',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  );
};

// ─── TYPING INDICATOR ─────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
    <div style={{
      width: '28px', height: '28px', borderRadius: '8px',
      background: 'linear-gradient(135deg, #1e3a5f, #2c5282)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(30,58,95,0.3)'
    }}>
      <Sparkles size={13} color="white" />
    </div>
    <div style={{
      padding: '10px 14px',
      borderRadius: '16px 16px 16px 4px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', gap: '4px', alignItems: 'center'
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)',
          animation: `bounce 1.2s ease infinite`,
          animationDelay: `${i * 0.2}s`
        }} />
      ))}
    </div>
  </div>
);

// ─── QUICK SUGGESTIONS ────────────────────────────────────────────────────────

const suggestions = [
  '¿Cuántas tareas tengo pendientes?',
  'Resume el estado de mis proyectos',
  '¿Quiénes están en mi equipo?',
  '¿Qué proyectos están activos?',
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const SeitraAssistant = ({ projects = [], tasks = [], users = [] }) => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de SEITRA 👋 Puedo responderte preguntas sobre tus proyectos, tareas y equipo. ¿En qué te ayudo?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { currentUser, currentEnvironment } = useApp();

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, open, minimized]);

  useEffect(() => {
    if (!open && messages.length > 1) setHasNew(true);
  }, [messages]);

  useEffect(() => {
    if (open) setHasNew(false);
  }, [open]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const systemPrompt = buildContext({ projects, tasks, users, currentUser, currentEnvironment });

      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [...history, { role: 'user', content: userText }],
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
        })
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Lo siento, no pude procesar tu pregunta.';

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un error al conectar con el asistente. Verifica tu conexión e intenta de nuevo.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fabIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        .seitra-input::placeholder { color: rgba(255,255,255,0.3); }
        .seitra-input:focus { outline: none; }
        .suggestion-btn:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(255,255,255,0.2) !important;
        }
        .send-btn:hover { opacity: 0.85; transform: scale(1.05); }
        .send-btn:active { transform: scale(0.95); }
      `}</style>

      {/* ── FAB BUTTON ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
            width: '52px', height: '52px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(30,58,95,0.4)',
            animation: 'fabIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,58,95,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,58,95,0.4)'; }}
        >
          <Sparkles size={20} color="white" />
          {hasNew && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '12px', height: '12px', borderRadius: '50%',
              background: '#ef4444', border: '2px solid white'
            }} />
          )}
        </button>
      )}

      {/* ── CHAT WINDOW ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          width: '360px',
          height: minimized ? 'auto' : '520px',
          borderRadius: '20px',
          background: 'linear-gradient(160deg, #0f1824 0%, #0d1f33 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column',
          animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}>

          {/* HEADER */}
          <div style={{
            padding: '14px 16px',
            borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.03)',
            cursor: minimized ? 'pointer' : 'default',
          }}
            onClick={minimized ? () => setMinimized(false) : undefined}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #1e3a5f, #4f7cff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79,124,255,0.3)'
              }}>
                <Sparkles size={15} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', letterSpacing: '-0.2px' }}>
                  Asistente SEITRA
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399' }} />
                  En línea
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', display: 'flex', borderRadius: '6px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                {minimized ? <ChevronDown size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', display: 'flex', borderRadius: '6px', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* MESSAGES */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent',
              }}>
                {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* SUGGESTIONS — solo si hay pocos mensajes */}
              {messages.length <= 1 && (
                <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="suggestion-btn"
                      onClick={() => sendMessage(s)}
                      style={{
                        padding: '5px 10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* INPUT */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', gap: '8px', alignItems: 'flex-end',
                background: 'rgba(0,0,0,0.2)',
              }}>
                <textarea
                  ref={inputRef}
                  className="seitra-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pregunta algo sobre tus proyectos..."
                  rows={1}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: 'white',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    resize: 'none',
                    fontFamily: 'inherit',
                    maxHeight: '100px',
                    overflowY: 'auto',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(79,124,255,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  style={{
                    width: '38px', height: '38px', borderRadius: '12px',
                    background: input.trim() && !loading
                      ? 'linear-gradient(135deg, #1e3a5f, #4f7cff)'
                      : 'rgba(255,255,255,0.08)',
                    border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    boxShadow: input.trim() && !loading ? '0 4px 12px rgba(79,124,255,0.3)' : 'none',
                  }}
                >
                  <Send size={15} color={input.trim() && !loading ? 'white' : 'rgba(255,255,255,0.3)'} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SeitraAssistant;