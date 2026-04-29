import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Camera, Trash2, ChevronRight, ArrowLeft, Shield, Sun, Moon,
} from 'lucide-react';
import { DESIGN_TOKENS } from '../styles/tokens';
import { supabase } from '../lib/supabase';
import { dbUsers, dbTasks } from '../lib/database';
import { auth } from '../lib/auth';

const AVATAR_BUCKET = 'avatars';

function isAvatarUrl(s) {
  return typeof s === 'string' && (s.startsWith('http') || s.startsWith('data:'));
}

function isHttpAvatar(s) {
  return typeof s === 'string' && (s.startsWith('http://') || s.startsWith('https://'));
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = src;
  });
}

/** Redimensiona y comprime a JPEG para Storage o guardado en BD como data URL. */
async function compressImageToJpeg(file, maxEdge = 512, quality = 0.86) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    let { width, height } = img;
    const ratio = Math.min(maxEdge / width, maxEdge / height, 1);
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))),
        'image/jpeg',
        quality
      );
    });
    return { dataUrl, blob };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function splitFullName(full) {
  const t = (full || '').trim();
  if (!t) return { firstName: '', lastName: '' };
  const parts = t.split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

function joinFullName(first, last) {
  return `${(first || '').trim()} ${(last || '').trim()}`.trim();
}

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: DESIGN_TOKENS.border.radius.xs,
  border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
  fontSize: DESIGN_TOKENS.typography.size.sm,
  fontFamily: DESIGN_TOKENS.typography.fontFamily,
  color: DESIGN_TOKENS.neutral[800],
  background: '#fff',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: DESIGN_TOKENS.typography.weight.bold,
  color: DESIGN_TOKENS.neutral[500],
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 6,
  fontFamily: DESIGN_TOKENS.typography.fontFamily,
};

function ToggleRow({ label, description, checked, disabled, onChange, busy }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 0',
        borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: DESIGN_TOKENS.neutral[800], fontFamily: DESIGN_TOKENS.typography.fontFamily }}>
          {label}
        </div>
        {description ? (
          <div style={{ fontSize: 12, color: DESIGN_TOKENS.neutral[500], marginTop: 4, lineHeight: 1.4, fontFamily: DESIGN_TOKENS.typography.fontFamily }}>
            {description}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled || busy}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && !busy && onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          cursor: disabled || busy ? 'not-allowed' : 'pointer',
          background: checked ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.neutral[200],
          position: 'relative',
          flexShrink: 0,
          opacity: disabled ? 0.45 : 1,
          transition: 'background 0.2s ease',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 22 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: DESIGN_TOKENS.shadows.xs,
            transition: 'left 0.2s ease',
          }}
        />
      </button>
    </div>
  );
}

/**
 * Panel lateral de autogestión: perfil (tabla public.users + auth), seguridad, tema, papelera.
 */
export default function UserSettingsDrawer({
  isOpen,
  onClose,
  user,
  onProfileSaved,
  darkMode,
  toggleDarkMode,
  projects = [],
  onTaskRestored,
  addToast,
}) {
  const fileRef = useRef(null);
  const [view, setView] = useState('main');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarDisplay, setAvatarDisplay] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [mfaFactors, setMfaFactors] = useState([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpEnroll, setTotpEnroll] = useState(null);
  const [totpCode, setTotpCode] = useState('');

  const [trashTasks, setTrashTasks] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const verifiedTotp = (mfaFactors || []).filter(
    (f) => f.factor_type === 'totp' && f.status === 'verified'
  );
  const hasTotp = verifiedTotp.length > 0;

  const loadMfa = useCallback(async () => {
    if (!supabase.auth.mfa) return;
    setMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setMfaFactors(data?.all || []);
    } catch (e) {
      console.warn('[UserSettings] MFA listFactors:', e?.message);
      setMfaFactors([]);
    } finally {
      setMfaLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoadingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setEmail(session?.user?.email || user.email || '');

      let row = null;
      try {
        row = await dbUsers.getById(user.id);
      } catch {
        row = null;
      }
      const meta = session?.user?.user_metadata || {};
      const nameSource = row?.name || user.name || meta.name || user.email || '';
      const { firstName: f, lastName: l } = splitFullName(nameSource);
      setFirstName(f);
      setLastName(l);
      setAvatarDisplay(row?.avatar || user.avatar || meta.avatar_url || '👤');
    } catch (e) {
      console.error(e);
      addToast?.('No se pudo cargar el perfil', 'error');
    } finally {
      setLoadingProfile(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    if (!isOpen) {
      setView('main');
      setTotpEnroll(null);
      setTotpCode('');
      setNewPassword('');
      setConfirmPassword('');
      return;
    }
    refreshProfile();
    loadMfa();
  }, [isOpen, refreshProfile, loadMfa]);

  const loadTrash = useCallback(async () => {
    setTrashLoading(true);
    try {
      const list = await dbTasks.getDeleted();
      setTrashTasks(list);
    } catch (e) {
      console.error(e);
      addToast?.(e.message || 'No se pudo cargar la papelera', 'error');
      setTrashTasks([]);
    } finally {
      setTrashLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isOpen && view === 'trash') loadTrash();
  }, [isOpen, view, loadTrash]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    const full = joinFullName(firstName, lastName);
    if (!full) {
      addToast?.('Indica al menos un nombre', 'warning');
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await dbUsers.update(user.id, {
        name: full,
        avatar: avatarDisplay,
      });
      const metaAvatar = isHttpAvatar(avatarDisplay) ? avatarDisplay.split('?')[0] : null;
      await auth.updateUserMetadata({
        name: full,
        ...(metaAvatar ? { avatar_url: metaAvatar } : { avatar_url: null }),
      });
      onProfileSaved?.(updated);
      addToast?.('Perfil actualizado', 'success');
    } catch (e) {
      console.error(e);
      addToast?.(e.message || 'Error al guardar perfil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const persistAvatarAfterPick = useCallback(
    async (avatarVal) => {
      if (!user?.id) return;
      const updated = await dbUsers.update(user.id, { avatar: avatarVal });
      const baseHttp = isHttpAvatar(avatarVal) ? avatarVal.split('?')[0] : null;
      await auth.updateUserMetadata({
        ...(baseHttp ? { avatar_url: baseHttp } : { avatar_url: null }),
      });
      setAvatarDisplay(avatarVal);
      onProfileSaved?.(updated);
      addToast?.('Foto de perfil actualizada', 'success');
    },
    [user?.id, onProfileSaved, addToast]
  );

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      addToast?.('Selecciona una imagen', 'warning');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      addToast?.('La imagen es demasiado grande (máx. 12 MB)', 'warning');
      return;
    }
    setAvatarBusy(true);
    try {
      const { dataUrl, blob } = await compressImageToJpeg(file);
      const bucket = import.meta.env.VITE_SUPABASE_AVATAR_BUCKET || AVATAR_BUCKET;
      const path = `${user.id}/avatar.jpg`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, blob, {
        upsert: true,
        contentType: 'image/jpeg',
      });
      // Subimos a Storage como respaldo/CDN, pero guardamos la dataUrl en la BD
      // para que todos los usuarios puedan verla sin depender de permisos del bucket.
      if (!upErr) {
        supabase.storage.from(bucket).getPublicUrl(path); // fire-and-forget, solo para caché CDN
      }
      await persistAvatarAfterPick(dataUrl);
    } catch (err) {
      console.error(err);
      addToast?.(err.message || 'No se pudo actualizar la foto', 'error');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast?.('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast?.('Las contraseñas no coinciden', 'warning');
      return;
    }
    setPasswordBusy(true);
    try {
      await auth.updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      addToast?.('Contraseña actualizada', 'success');
    } catch (err) {
      addToast?.(err.message || 'Error al actualizar contraseña', 'error');
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleTotpToggle = async (on) => {
    if (!supabase.auth.mfa) {
      addToast?.('MFA no disponible en este cliente', 'error');
      return;
    }
    if (on) {
      if (hasTotp) return;
      setTotpBusy(true);
      try {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'SEITRA',
        });
        if (error) throw error;
        setTotpEnroll({
          factorId: data.id,
          qr: data.totp?.qr_code,
          secret: data.totp?.secret,
        });
        setTotpCode('');
      } catch (err) {
        addToast?.(
          err.message || 'No se pudo iniciar el registro TOTP. Activa MFA en Supabase Auth.',
          'error'
        );
      } finally {
        setTotpBusy(false);
      }
      return;
    }

    if (!hasTotp) return;
    setTotpBusy(true);
    try {
      for (const f of verifiedTotp) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id });
        if (error) throw error;
      }
      await supabase.auth.refreshSession();
      await loadMfa();
      addToast?.('Autenticador desvinculado', 'success');
    } catch (err) {
      addToast?.(err.message || 'Error al desactivar TOTP', 'error');
    } finally {
      setTotpBusy(false);
    }
  };

  const handleTotpVerify = async () => {
    if (!totpEnroll?.factorId || totpCode.replace(/\s/g, '').length < 6) {
      addToast?.('Introduce el código de 6 dígitos', 'warning');
      return;
    }
    setTotpBusy(true);
    try {
      const { data: chall, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: totpEnroll.factorId,
      });
      if (cErr) throw cErr;
      const challengeId = chall?.id ?? chall?.current_challenge?.id;
      if (!challengeId) throw new Error('No se obtuvo el desafío MFA');
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: totpEnroll.factorId,
        challengeId,
        code: totpCode.replace(/\s/g, ''),
      });
      if (vErr) throw vErr;
      setTotpEnroll(null);
      setTotpCode('');
      await supabase.auth.refreshSession();
      await loadMfa();
      addToast?.('Autenticación por app activada', 'success');
    } catch (err) {
      addToast?.(err.message || 'Código incorrecto', 'error');
    } finally {
      setTotpBusy(false);
    }
  };

  const handleRestore = async (taskId) => {
    setRestoringId(taskId);
    try {
      const restored = await dbTasks.restore(taskId);
      onTaskRestored?.(restored);
      setTrashTasks((prev) => prev.filter((t) => t.id !== taskId));
      addToast?.('Tarea restaurada', 'success');
    } catch (err) {
      addToast?.(err.message || 'No se pudo restaurar', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  const panel = (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.35)',
          zIndex: 10020,
          animation: 'fadeIn 0.2s ease',
        }}
      />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(440px, 100vw)',
          background: '#ffffff',
          boxShadow: DESIGN_TOKENS.shadows.xl,
          zIndex: 10021,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
          animation: 'slideIn 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          borderLeft: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
        }}
      >
        <header
          style={{
            padding: '20px 22px',
            borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {view === 'trash' && (
              <button
                type="button"
                onClick={() => setView('main')}
                style={{
                  border: 'none',
                  background: DESIGN_TOKENS.neutral[100],
                  borderRadius: 8,
                  padding: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  color: DESIGN_TOKENS.neutral[700],
                }}
                aria-label="Volver"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: DESIGN_TOKENS.neutral[900] }}>
              {view === 'trash' ? 'Papelera / Archivo' : 'Ajustes de usuario'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: DESIGN_TOKENS.neutral[100],
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              color: DESIGN_TOKENS.neutral[600],
            }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 32px' }}>
          {view === 'main' && (
            <>
              <section style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Shield size={16} color={DESIGN_TOKENS.primary.base} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: DESIGN_TOKENS.neutral[500], letterSpacing: '0.08em' }}>
                    MI PERFIL
                  </span>
                </div>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: DESIGN_TOKENS.neutral[600], lineHeight: 1.5 }}>
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: DESIGN_TOKENS.neutral[100],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      flexShrink: 0,
                      border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                    }}
                  >
                    {isAvatarUrl(avatarDisplay) ? (
                      <img src={avatarDisplay} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{avatarDisplay || '👤'}</span>
                    )}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
                    <button
                      type="button"
                      disabled={loadingProfile || avatarBusy}
                      onClick={() => fileRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                        background: '#fff',
                        cursor: loadingProfile || avatarBusy ? 'wait' : 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        color: DESIGN_TOKENS.neutral[700],
                        fontFamily: DESIGN_TOKENS.typography.fontFamily,
                        opacity: avatarBusy ? 0.75 : 1,
                      }}
                    >
                      <Camera size={16} />
                      {avatarBusy ? 'Subiendo…' : 'Cambiar foto'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Nombre</label>
                    <input
                      style={inputBase}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Nombre"
                      disabled={loadingProfile}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Apellido</label>
                    <input
                      style={inputBase}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Apellido"
                      disabled={loadingProfile}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Correo electrónico</label>
                  <input style={{ ...inputBase, background: DESIGN_TOKENS.neutral[50], color: DESIGN_TOKENS.neutral[600] }} value={email} readOnly />
                </div>

                <button
                  type="button"
                  disabled={savingProfile || loadingProfile}
                  onClick={handleSaveProfile}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: 8,
                    background: savingProfile ? DESIGN_TOKENS.neutral[300] : DESIGN_TOKENS.primary.base,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: savingProfile ? 'wait' : 'pointer',
                    fontFamily: DESIGN_TOKENS.typography.fontFamily,
                  }}
                >
                  {savingProfile ? 'Guardando…' : 'Guardar perfil'}
                </button>
              </section>

              <section style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: DESIGN_TOKENS.neutral[500], letterSpacing: '0.08em' }}>
                    CONTRASEÑA
                  </span>
                </div>
                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Nueva contraseña</label>
                    <input
                      type="password"
                      style={inputBase}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirmar</label>
                    <input
                      type="password"
                      style={inputBase}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordBusy}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                      background: '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                      color: DESIGN_TOKENS.neutral[800],
                      cursor: passwordBusy ? 'wait' : 'pointer',
                      fontFamily: DESIGN_TOKENS.typography.fontFamily,
                    }}
                  >
                    {passwordBusy ? 'Actualizando…' : 'Actualizar contraseña'}
                  </button>
                </form>
              </section>

              <section style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: DESIGN_TOKENS.neutral[500], letterSpacing: '0.08em' }}>
                    SEGURIDAD
                  </span>
                </div>
                <p style={{ fontSize: 12, color: DESIGN_TOKENS.neutral[500], margin: '0 0 8px', lineHeight: 1.45 }}>
                  Añade una capa extra de seguridad a tu cuenta.
                </p>
                <ToggleRow
                  label="Aplicación Authenticator"
                  description="Código de un solo uso (Google Authenticator, Authy, etc.)."
                  checked={hasTotp}
                  onChange={handleTotpToggle}
                  busy={totpBusy || mfaLoading}
                />
                {totpEnroll ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 10,
                      border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                      background: DESIGN_TOKENS.neutral[50],
                    }}
                  >
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: DESIGN_TOKENS.neutral[600] }}>
                      Escanea el código y introduce los 6 dígitos para confirmar.
                    </p>
                    {totpEnroll.qr ? (
                      <img src={totpEnroll.qr} alt="QR TOTP" style={{ width: 160, height: 160, display: 'block', marginBottom: 10 }} />
                    ) : null}
                    <input
                      style={{ ...inputBase, marginBottom: 8 }}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      inputMode="numeric"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        disabled={totpBusy}
                        onClick={handleTotpVerify}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: 'none',
                          borderRadius: 8,
                          background: DESIGN_TOKENS.primary.base,
                          color: '#fff',
                          fontWeight: 600,
                          cursor: totpBusy ? 'wait' : 'pointer',
                          fontFamily: DESIGN_TOKENS.typography.fontFamily,
                        }}
                      >
                        Verificar y activar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (totpEnroll?.factorId && supabase.auth.mfa) {
                            await supabase.auth.mfa.unenroll({ factorId: totpEnroll.factorId }).catch(() => {});
                            await loadMfa();
                          }
                          setTotpEnroll(null);
                          setTotpCode('');
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                          background: '#fff',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: DESIGN_TOKENS.typography.fontFamily,
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              <section style={{ marginBottom: 28 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: DESIGN_TOKENS.neutral[500], letterSpacing: '0.08em' }}>
                  APARIENCIA
                </span>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => darkMode && toggleDarkMode()}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px',
                      borderRadius: 10,
                      border: `1px solid ${!darkMode ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.border.color.normal}`,
                      background: !darkMode ? DESIGN_TOKENS.primary.lightest : '#fff',
                      color: DESIGN_TOKENS.neutral[800],
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: DESIGN_TOKENS.typography.fontFamily,
                    }}
                  >
                    <Sun size={16} />
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => !darkMode && toggleDarkMode()}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '12px',
                      borderRadius: 10,
                      border: `1px solid ${darkMode ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.border.color.normal}`,
                      background: darkMode ? DESIGN_TOKENS.primary.lightest : '#fff',
                      color: DESIGN_TOKENS.neutral[800],
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: DESIGN_TOKENS.typography.fontFamily,
                    }}
                  >
                    <Moon size={16} />
                    Oscuro
                  </button>
                </div>
              </section>

              <button
                type="button"
                onClick={() => setView('trash')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                  background: '#fff',
                  cursor: 'pointer',
                  fontFamily: DESIGN_TOKENS.typography.fontFamily,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: DESIGN_TOKENS.neutral[800] }}>
                  <Trash2 size={18} color={DESIGN_TOKENS.neutral[500]} />
                  Papelera / Archivo
                </span>
                <ChevronRight size={18} color={DESIGN_TOKENS.neutral[400]} />
              </button>
            </>
          )}

          {view === 'trash' && (
            <div>
              <p style={{ fontSize: 13, color: DESIGN_TOKENS.neutral[600], margin: '0 0 16px', lineHeight: 1.5 }}>
                Tareas eliminadas (soft delete). Restaurarlas las devuelve a la vista principal.
              </p>
              {trashLoading ? (
                <div style={{ textAlign: 'center', padding: 32, color: DESIGN_TOKENS.neutral[500] }}>Cargando…</div>
              ) : trashTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: DESIGN_TOKENS.neutral[400], fontSize: 14 }}>
                  La papelera está vacía
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {trashTasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <li
                        key={t.id}
                        style={{
                          padding: '14px 0',
                          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: DESIGN_TOKENS.neutral[800], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: 12, color: DESIGN_TOKENS.neutral[500], marginTop: 4 }}>
                            {proj?.name || 'Sin proyecto'}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={restoringId === t.id}
                          onClick={() => handleRestore(t.id)}
                          style={{
                            flexShrink: 0,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: DESIGN_TOKENS.neutral[100],
                            color: DESIGN_TOKENS.primary.base,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: restoringId === t.id ? 'wait' : 'pointer',
                            fontFamily: DESIGN_TOKENS.typography.fontFamily,
                          }}
                        >
                          {restoringId === t.id ? '…' : 'Restaurar'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );

  return createPortal(panel, document.body);
}