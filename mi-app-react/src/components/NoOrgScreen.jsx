import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Lógica intacta ──────────────────────────────────────────────────────────
const PALETTE = [
  '#6357dc', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Tokens de diseño ────────────────────────────────────────────────────────
const ACCENT       = '#6357dc';
const GREEN        = '#0d9488';
const TEXT_PRIMARY = '#1e293b';
const TEXT_MUTED   = '#64748b';
const BORDER       = '#e2e8f0';

const pageStyle = {
  position: 'fixed', inset: 0,
  background: '#f0f0f5',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: '1.5rem',
  overflowY: 'auto',
};

const cardStyle = {
  background: '#ffffff',
  borderRadius: 20,
  border: `0.5px solid ${BORDER}`,
  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  padding: '2.5rem 2.75rem',
  width: '100%',
};

// Logo Seitra — idéntico al login
function SeitraLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9,
        background: ACCENT,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, padding: 8,
      }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
        ))}
      </div>
      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: TEXT_PRIMARY, letterSpacing: '-0.02em' }}>
        Seitra
      </span>
    </div>
  );
}

// Botón volver
function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', color: TEXT_MUTED,
        cursor: 'pointer', fontSize: '0.83rem', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 5,
        marginBottom: '1.5rem', padding: 0,
      }}
    >
      ← Volver
    </button>
  );
}

// Input con estilo login
const inputBase = {
  width: '100%', padding: '0.75rem 1rem',
  borderRadius: 10, border: `1.5px solid ${BORDER}`,
  background: '#f8fafc', color: TEXT_PRIMARY,
  fontSize: '0.9rem', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelBase = {
  display: 'block', marginBottom: 6,
  fontSize: '0.8rem', fontWeight: 600, color: TEXT_MUTED,
};

const btnPrimary = (disabled) => ({
  width: '100%', padding: '0.82rem',
  borderRadius: 12, border: 'none',
  background: disabled
    ? '#c4bff5'
    : `linear-gradient(135deg, ${ACCENT} 0%, #8b5cf6 100%)`,
  color: '#fff', fontSize: '0.88rem', fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit', transition: 'opacity 0.18s',
});

const btnSecondary = {
  background: 'transparent', border: `0.5px solid ${BORDER}`,
  borderRadius: 12, color: TEXT_MUTED,
  fontSize: '0.88rem', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
  padding: '0.82rem 1.5rem',
  transition: 'border-color 0.2s, color 0.2s',
};

const btnGreen = (disabled) => ({
  width: '100%', padding: '0.82rem',
  borderRadius: 12, border: `1.5px solid ${GREEN}`,
  background: 'transparent',
  color: disabled ? '#94a3b8' : GREEN,
  borderColor: disabled ? BORDER : GREEN,
  fontSize: '0.88rem', fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit', transition: 'all 0.18s',
});

// ============================================================================
// SUB-VISTA: Crear organización — lógica sin cambios, solo JSX rediseñado
// ============================================================================
function CreateOrgPanel({ currentUser, onCreated }) {
  const [name, setName]        = useState('');
  const [description, setDesc] = useState('');
  const [color, setColor]      = useState(PALETTE[0]);
  const [icon, setIcon]        = useState('🏢');
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');

  const icons = ['🏢', '🚀', '💡', '🎯', '⚡', '🌐', '🔬', '📊'];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const slug = slugify(name) || `org-${Date.now()}`;
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: name.trim(), slug, description: description.trim(), color, icon })
        .select()
        .single();
      if (orgErr) throw orgErr;
      const { error: memberErr } = await supabase
        .from('organization_members')
        .insert({ organization_id: org.id, user_id: currentUser.id, role: 'org_admin' });
      if (memberErr) throw memberErr;
      onCreated(org);
    } catch (err) {
      setError(err.message || 'Error al crear la organización.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div>
        <label style={labelBase}>Nombre de la organización *</label>
        <input
          style={inputBase}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Corbeta S.A."
          required
          autoFocus
          onFocus={(e) => {
            e.target.style.borderColor = ACCENT;
            e.target.style.boxShadow = `0 0 0 3px ${ACCENT}22`;
            e.target.style.background = '#fff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = BORDER;
            e.target.style.boxShadow = 'none';
            e.target.style.background = '#f8fafc';
          }}
        />
      </div>

      <div>
        <label style={labelBase}>Descripción (opcional)</label>
        <input
          style={inputBase}
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="¿A qué se dedica tu organización?"
          onFocus={(e) => {
            e.target.style.borderColor = ACCENT;
            e.target.style.boxShadow = `0 0 0 3px ${ACCENT}22`;
            e.target.style.background = '#fff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = BORDER;
            e.target.style.boxShadow = 'none';
            e.target.style.background = '#f8fafc';
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div>
          <label style={labelBase}>Ícono</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {icons.map((ic) => (
              <button
                key={ic} type="button"
                onClick={() => setIcon(ic)}
                style={{
                  width: 36, height: 36, borderRadius: 9, fontSize: 17,
                  border: icon === ic ? `1.5px solid ${ACCENT}` : `0.5px solid ${BORDER}`,
                  background: icon === ic ? `${ACCENT}12` : '#f8fafc',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >{ic}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelBase}>Color</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PALETTE.map((c) => (
              <button
                key={c} type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: c, cursor: 'pointer',
                  border: color === c ? `2px solid #fff` : `2px solid transparent`,
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: `0.5px solid #fecaca`,
          borderRadius: 10, padding: '0.7rem 1rem',
          color: '#dc2626', fontSize: '0.83rem',
        }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={loading || !name.trim()} style={btnPrimary(loading || !name.trim())}>
        {loading ? 'Creando…' : `Crear "${name || 'organización'}"`}
      </button>
    </form>
  );
}

// ============================================================================
// SUB-VISTA: Unirse a organización — lógica sin cambios, solo JSX rediseñado
// ============================================================================
function JoinOrgPanel({ currentUser, onRequestSent }) {
  const [orgs, setOrgs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    supabase
      .from('organizations')
      .select('id, name, slug, description, color, icon')
      .order('name')
      .then(({ data }) => { setOrgs(data || []); setLoading(false); });
  }, []);

  const handleRequest = async () => {
    if (!selected) return;
    setSending(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('organization_join_requests')
        .insert({ organization_id: selected.id, user_id: currentUser.id, status: 'pending' });
      if (err) throw err;
      setSent(true);
      setTimeout(() => onRequestSent(selected), 2000);
    } catch (err) {
      setError(err.message || 'Error al enviar la solicitud.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '2rem 0', textAlign: 'center', color: TEXT_MUTED, fontSize: '0.9rem' }}>
      Cargando organizaciones…
    </div>
  );

  if (sent) return (
    <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: '#f0fdf4', border: `1px solid #bbf7d0`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1rem', fontSize: '1.5rem',
      }}>✉️</div>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 600, color: TEXT_PRIMARY }}>
        ¡Solicitud enviada!
      </h3>
      <p style={{ margin: 0, color: TEXT_MUTED, fontSize: '0.85rem', lineHeight: 1.5 }}>
        El administrador de{' '}
        <strong style={{ color: TEXT_PRIMARY }}>{selected?.name}</strong>{' '}
        recibirá tu solicitud y podrá aprobarla.
      </p>
    </div>
  );

  if (orgs.length === 0) return (
    <div style={{ padding: '2rem 0', textAlign: 'center', color: TEXT_MUTED, fontSize: '0.9rem' }}>
      No hay organizaciones disponibles todavía.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, color: TEXT_MUTED, fontSize: '0.85rem' }}>
        Selecciona la organización a la que quieres unirte:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
        {orgs.map((org) => {
          const isSelected = selected?.id === org.id;
          const accent = org.color || ACCENT;
          return (
            <button
              key={org.id} type="button"
              onClick={() => setSelected(org)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.75rem 1rem', borderRadius: 12,
                border: isSelected ? `1.5px solid ${accent}` : `0.5px solid ${BORDER}`,
                background: isSelected ? `${accent}0d` : '#f8f9fb',
                textAlign: 'left', fontFamily: 'inherit', width: '100%',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = BORDER;
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                {org.icon || '🏢'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: TEXT_PRIMARY, fontSize: '0.9rem' }}>
                  {org.name}
                </div>
                {org.description && (
                  <div style={{
                    color: TEXT_MUTED, fontSize: '0.78rem', marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {org.description}
                  </div>
                )}
              </div>
              {isSelected && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: accent, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: `0.5px solid #fecaca`,
          borderRadius: 10, padding: '0.7rem 1rem',
          color: '#dc2626', fontSize: '0.83rem',
        }}>
          {error}
        </div>
      )}

      <button
        type="button" disabled={!selected || sending}
        onClick={handleRequest}
        style={btnGreen(!selected || sending)}
      >
        {sending ? 'Enviando…' : selected ? `Solicitar acceso a "${selected.name}"` : 'Selecciona una organización'}
      </button>
    </div>
  );
}

// ============================================================================
// PANTALLA PRINCIPAL — lógica sin cambios, layout rediseñado
// ============================================================================
export default function NoOrgScreen({ currentUser, onOrgReady }) {
  const [view, setView]           = useState(null); // null | 'create' | 'join'
  const [pendingOrg, setPendingOrg] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    supabase
      .from('organization_join_requests')
      .select('id, status, organizations(name, icon, color)')
      .eq('user_id', currentUser.id)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setPendingOrg(data.organizations); });
  }, [currentUser?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ── Solicitud pendiente ──────────────────────────────────────────────────
  if (pendingOrg) return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 480 }}>
        <SeitraLogo />
        <div style={{ textAlign: 'center', padding: '0.5rem 0 1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#fefce8', border: `1px solid #fde68a`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', fontSize: '1.6rem',
          }}>
            {pendingOrg.icon || '⏳'}
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 600, color: TEXT_PRIMARY }}>
            Solicitud enviada
          </h2>
          <p style={{ margin: '0 0 1.5rem', color: TEXT_MUTED, fontSize: '0.875rem', lineHeight: 1.6 }}>
            Tu solicitud para unirte a{' '}
            <strong style={{ color: TEXT_PRIMARY }}>{pendingOrg.name}</strong>{' '}
            está pendiente. Un administrador debe aprobarla.
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#f8f9fb', border: `0.5px solid ${BORDER}`,
            borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ color: TEXT_MUTED, fontSize: '0.82rem', fontWeight: 500 }}>
              Esperando aprobación del administrador
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button onClick={handleLogout} style={btnSecondary}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );

  // ── Vista crear organización ─────────────────────────────────────────────
  if (view === 'create') return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 520 }}>
        <BackBtn onClick={() => setView(null)} />
        <SeitraLogo />
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.3rem', fontWeight: 500, color: TEXT_PRIMARY }}>
          Crear organización
        </h2>
        <p style={{ margin: '0 0 1.75rem', color: TEXT_MUTED, fontSize: '0.85rem', lineHeight: 1.5 }}>
          Serás el administrador y podrás invitar a tu equipo.
        </p>
        <CreateOrgPanel currentUser={currentUser} onCreated={onOrgReady} />
      </div>
    </div>
  );

  // ── Vista unirse a organización ──────────────────────────────────────────
  if (view === 'join') return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 520 }}>
        <BackBtn onClick={() => setView(null)} />
        <SeitraLogo />
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.3rem', fontWeight: 500, color: TEXT_PRIMARY }}>
          Unirse a una organización
        </h2>
        <p style={{ margin: '0 0 1.75rem', color: TEXT_MUTED, fontSize: '0.85rem', lineHeight: 1.5 }}>
          Envía una solicitud y el administrador te dará acceso.
        </p>
        <JoinOrgPanel
          currentUser={currentUser}
          onRequestSent={(org) => setPendingOrg(org)}
        />
      </div>
    </div>
  );

  // ── Vista principal: elegir opción ───────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 720 }}>
        <SeitraLogo />

        <h2 style={{ margin: '0 0 0.35rem', fontSize: '22px', fontWeight: 500, color: TEXT_PRIMARY }}>
          Bienvenido a Seitra
        </h2>
        <p style={{ margin: '0 0 2rem', color: TEXT_MUTED, fontSize: '0.875rem', lineHeight: 1.5 }}>
          Hola,{' '}
          <strong style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>
            {currentUser?.name || currentUser?.email}
          </strong>
          . Para comenzar, elige una opción.
        </p>

        {/* Cards opción */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

          {/* Opción A — Crear organización */}
          <button
            type="button"
            onClick={() => setView('create')}
            style={{
              flex: 1, minWidth: 220,
              background: '#f8f9fb',
              border: `0.5px solid ${BORDER}`,
              borderRadius: 12, padding: '1.5rem',
              textAlign: 'left', fontFamily: 'inherit',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = ACCENT;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}14`;
              e.currentTarget.style.background = `${ACCENT}07`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BORDER;
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#f8f9fb';
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, marginBottom: '1rem',
              background: ACCENT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <div style={{ fontWeight: 600, color: TEXT_PRIMARY, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              Crear organización
            </div>
            <div style={{ color: TEXT_MUTED, fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Crea tu propio espacio de trabajo e invita a tu equipo. Serás el administrador.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `linear-gradient(135deg, ${ACCENT} 0%, #8b5cf6 100%)`,
              color: '#fff', borderRadius: 8,
              padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600,
            }}>
              Comenzar
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4"/>
              </svg>
            </div>
          </button>

          {/* Opción B — Unirse a una existente */}
          <button
            type="button"
            onClick={() => setView('join')}
            style={{
              flex: 1, minWidth: 220,
              background: '#f8f9fb',
              border: `0.5px solid ${BORDER}`,
              borderRadius: 12, padding: '1.5rem',
              textAlign: 'left', fontFamily: 'inherit',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = GREEN;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${GREEN}14`;
              e.currentTarget.style.background = `${GREEN}07`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = BORDER;
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = '#f8f9fb';
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, marginBottom: '1rem',
              background: GREEN,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div style={{ fontWeight: 600, color: TEXT_PRIMARY, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              Unirme a una existente
            </div>
            <div style={{ color: TEXT_MUTED, fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Solicita acceso a una organización ya creada. Un administrador aprobará tu ingreso.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              border: `1.5px solid ${GREEN}`,
              color: GREEN, borderRadius: 8,
              padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600,
            }}>
              Ver organizaciones
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Cerrar sesión */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none',
              color: '#94a3b8', cursor: 'pointer',
              fontSize: '0.8rem', fontFamily: 'inherit',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
