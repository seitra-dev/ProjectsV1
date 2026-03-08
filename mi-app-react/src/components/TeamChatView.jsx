import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, MoreVertical, Image as ImageIcon, Palette, X } from 'lucide-react';
import { DESIGN_TOKENS } from '../styles/tokens';

// ============================================================================
// BACKGROUNDS DISPONIBLES
// ============================================================================
const CHAT_BACKGROUNDS = [
  { id: 'default', name: 'Por defecto', value: '#f8fafc' },
  { id: 'ocean', name: 'Océano', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'sunset', name: 'Atardecer', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'forest', name: 'Bosque', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'lavender', name: 'Lavanda', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 'minimal', name: 'Minimal', value: '#ffffff' },
  { id: 'dark', name: 'Oscuro', value: '#1e293b' },
];

// ============================================================================
// MICROSOFT FLUENT EMOJIS (Unicode)
// ============================================================================
const EMOJI_CATEGORIES = {
  'Frecuentes': ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💯'],
  'Caras': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝'],
  'Gestos': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏'],
  'Corazones': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Objetos': ['💼', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️'],
  'Símbolos': ['✅', '❌', '⭐', '🌟', '💫', '✨', '💥', '💢', '💬', '💭', '🗨️', '🗯️', '💤', '🔥', '💯', '🎯', '🎪', '🎨', '🎭', '🎬'],
};

// ============================================================================
// TEAM CHAT VIEW - MEJORADO
// ============================================================================
function TeamChatView({ user }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      userId: 1,
      text: '¡Bienvenido al chat del equipo! 🎉',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userName: 'Sistema',
      userAvatar: '🤖'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(CHAT_BACKGROUNDS[0]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      userId: user.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
      userName: user.name,
      userAvatar: user.avatar
    };

    setMessages([...messages, message]);
    setNewMessage('');
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  };

  const showDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    return !isSameDay(currentMsg.timestamp, prevMsg.timestamp);
  };

  return (
    <div style={{
      height: 'calc(100vh - 70px)',
      display: 'flex',
      flexDirection: 'column',
      background: selectedBackground.value,
      backgroundAttachment: 'fixed',
      position: 'relative'
    }}>
      {/* HEADER */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 800,
            margin: 0,
            color: DESIGN_TOKENS.neutral[900]
          }}>
            💬 Chat del Equipo
          </h2>
          <p style={{
            fontSize: '13px',
            color: DESIGN_TOKENS.neutral[500],
            margin: '2px 0 0'
          }}>
            {messages.length} mensajes
          </p>
        </div>
        
        <button
          onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
          style={{
            padding: '8px 16px',
            background: 'white',
            border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            color: DESIGN_TOKENS.neutral[700],
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
            e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.normal;
          }}
        >
          <Palette size={16} />
          Fondo
        </button>
      </div>

      {/* BACKGROUND SELECTOR */}
      {showBackgroundSelector && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '24px',
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: DESIGN_TOKENS.shadows.xl,
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          zIndex: 100,
          minWidth: '280px',
          animation: 'slideDown 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 700,
              margin: 0,
              color: DESIGN_TOKENS.neutral[800]
            }}>
              Seleccionar fondo
            </h3>
            <button
              onClick={() => setShowBackgroundSelector(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                color: DESIGN_TOKENS.neutral[500]
              }}
            >
              <X size={16} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CHAT_BACKGROUNDS.map(bg => (
              <button
                key={bg.id}
                onClick={() => {
                  setSelectedBackground(bg);
                  setShowBackgroundSelector(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  background: selectedBackground.id === bg.id ? DESIGN_TOKENS.primary.lightest : 'transparent',
                  border: selectedBackground.id === bg.id 
                    ? `2px solid ${DESIGN_TOKENS.primary.base}`
                    : `1px solid ${DESIGN_TOKENS.neutral[200]}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (selectedBackground.id !== bg.id) {
                    e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedBackground.id !== bg.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: bg.value,
                  border: `1px solid ${DESIGN_TOKENS.neutral[300]}`,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: DESIGN_TOKENS.neutral[800]
                }}>
                  {bg.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((msg, index) => {
          const isOwnMessage = msg.userId === user.id;
          const prevMsg = messages[index - 1];
          const showDate = showDateSeparator(msg, prevMsg);

          return (
            <React.Fragment key={msg.id}>
              {/* DATE SEPARATOR */}
              {showDate && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  margin: '8px 0'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 16px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: DESIGN_TOKENS.neutral[600],
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    {new Date(msg.timestamp).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              )}

              {/* MESSAGE BUBBLE */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  animation: 'messageSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animationFillMode: 'backwards',
                  animationDelay: '0.05s'
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  maxWidth: '70%',
                  flexDirection: isOwnMessage ? 'row-reverse' : 'row'
                }}>
                  {/* AVATAR */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isOwnMessage 
                      ? `linear-gradient(135deg, ${DESIGN_TOKENS.primary.base}, ${DESIGN_TOKENS.primary.dark})`
                      : `linear-gradient(135deg, ${DESIGN_TOKENS.info.base}, ${DESIGN_TOKENS.info.dark})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                  }}>
                    {msg.userAvatar}
                  </div>

                  {/* MESSAGE CONTENT */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(0,0,0,0.6)'
                    }}>
                      {msg.userName}
                    </div>
                    
                    <div style={{
                      background: isOwnMessage 
                        ? `linear-gradient(135deg, ${DESIGN_TOKENS.primary.base}, ${DESIGN_TOKENS.primary.dark})`
                        : 'rgba(255, 255, 255, 0.95)',
                      color: isOwnMessage ? 'white' : DESIGN_TOKENS.neutral[800],
                      padding: '12px 16px',
                      borderRadius: isOwnMessage 
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      wordWrap: 'break-word',
                      backdropFilter: 'blur(8px)',
                      boxShadow: isOwnMessage
                        ? `0 4px 12px ${DESIGN_TOKENS.primary.base}40`
                        : '0 2px 8px rgba(0,0,0,0.08)',
                      border: !isOwnMessage ? `1px solid ${DESIGN_TOKENS.neutral[200]}` : 'none'
                    }}>
                      {msg.text}
                    </div>

                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(0,0,0,0.5)',
                      fontWeight: 500
                    }}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* EMOJI PICKER */}
      {showEmojiPicker && (
        <div style={{
          position: 'absolute',
          bottom: '90px',
          left: '24px',
          background: 'white',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: DESIGN_TOKENS.shadows.xl,
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          maxWidth: '400px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 100,
          animation: 'slideUp 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            position: 'sticky',
            top: 0,
            background: 'white',
            paddingBottom: '8px',
            borderBottom: `1px solid ${DESIGN_TOKENS.neutral[200]}`
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 700,
              margin: 0,
              color: DESIGN_TOKENS.neutral[800]
            }}>
              Seleccionar emoji
            </h3>
            <button
              onClick={() => setShowEmojiPicker(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                color: DESIGN_TOKENS.neutral[500]
              }}
            >
              <X size={16} />
            </button>
          </div>

          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} style={{ marginBottom: '16px' }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: 700,
                color: DESIGN_TOKENS.neutral[600],
                margin: '0 0 8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {category}
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '4px'
              }}>
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    style={{
                      padding: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '24px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = DESIGN_TOKENS.neutral[100];
                      e.currentTarget.style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INPUT AREA */}
      <form onSubmit={handleSendMessage} style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
        padding: '16px 24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            padding: '10px',
            background: showEmojiPicker ? DESIGN_TOKENS.primary.lightest : 'white',
            border: `1px solid ${showEmojiPicker ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.neutral[200]}`,
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            color: showEmojiPicker ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.neutral[600]
          }}
          onMouseEnter={(e) => {
            if (!showEmojiPicker) {
              e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
            }
          }}
          onMouseLeave={(e) => {
            if (!showEmojiPicker) {
              e.currentTarget.style.background = 'white';
            }
          }}
        >
          <Smile size={20} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            padding: '12px 16px',
            border: `1px solid ${DESIGN_TOKENS.neutral[200]}`,
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            background: 'white',
            transition: 'all 0.2s',
            fontFamily: DESIGN_TOKENS.typography.fontFamily
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${DESIGN_TOKENS.primary.base}15`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = DESIGN_TOKENS.neutral[200];
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            padding: '12px 24px',
            background: newMessage.trim() 
              ? `linear-gradient(135deg, ${DESIGN_TOKENS.primary.base}, ${DESIGN_TOKENS.primary.dark})`
              : DESIGN_TOKENS.neutral[200],
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: newMessage.trim() ? `0 4px 12px ${DESIGN_TOKENS.primary.base}40` : 'none'
          }}
          onMouseEnter={(e) => {
            if (newMessage.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 16px ${DESIGN_TOKENS.primary.base}50`;
            }
          }}
          onMouseLeave={(e) => {
            if (newMessage.trim()) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${DESIGN_TOKENS.primary.base}40`;
            }
          }}
        >
          <Send size={18} />
          Enviar
        </button>
      </form>

      <style>{`
        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default TeamChatView;