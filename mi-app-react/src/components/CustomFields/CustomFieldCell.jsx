import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DESIGN_TOKENS } from '../../styles/tokens';

function userInitials(user) {
  if (!user) return '?';
  if (user.name) {
    return user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
  return user.email?.[0]?.toUpperCase() || '?';
}

/** Miembros vinculados al proyecto (JSON `members` + líder). Equivale al uso típico de project_members. */
function getProjectMemberUsers(project, allUsers = []) {
  if (!project) return allUsers;
  const ids = new Set();
  (project.members || []).forEach((id) => ids.add(id));
  if (project.leaderId) ids.add(project.leaderId);
  const list = allUsers.filter((u) => ids.has(u.id));
  return list.length ? list : allUsers;
}

function resolvePhase(phases, raw) {
  if (raw == null || raw === '') return null;
  return (phases || []).find((p) => String(p.id) === String(raw)) || null;
}

function MemberSelectFieldCell({ value, onChange, disabled, project, users = [] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);
  const memberUsers = useMemo(() => getProjectMemberUsers(project, users), [project, users]);
  const selected = memberUsers.find((u) => u.id === value || String(u.id) === String(value));

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) });
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px',
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
          fontSize: DESIGN_TOKENS.typography.size.xs,
          fontWeight: DESIGN_TOKENS.typography.weight.medium,
          color: DESIGN_TOKENS.neutral[800],
          background: DESIGN_TOKENS.neutral[50],
          border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: DESIGN_TOKENS.border.radius.xs,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          textAlign: 'left',
        }}
      >
        {selected ? (
          <>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: DESIGN_TOKENS.primary.base,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {userInitials(selected)}
            </div>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.name || selected.email}
            </span>
          </>
        ) : (
          <span style={{ flex: 1, color: DESIGN_TOKENS.neutral[500] }}>—</span>
        )}
        <span style={{ fontSize: 9, opacity: 0.45, flexShrink: 0 }}>▾</span>
      </button>
      {open && !disabled && (
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 10001,
            minWidth: pos.width,
            maxHeight: 240,
            overflowY: 'auto',
            background: 'white',
            border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
            borderRadius: DESIGN_TOKENS.border.radius.sm,
            boxShadow: DESIGN_TOKENS.shadows.lg,
            padding: 4,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '8px 10px',
              border: 'none',
              borderRadius: 4,
              background: !value ? DESIGN_TOKENS.primary.lightest : 'transparent',
              cursor: 'pointer',
              fontSize: DESIGN_TOKENS.typography.size.xs,
              color: DESIGN_TOKENS.neutral[500],
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          >
            —
          </button>
          {memberUsers.map((u) => {
            const active = value === u.id || String(value) === String(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(u.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: 4,
                  background: active ? DESIGN_TOKENS.primary.lightest : 'transparent',
                  cursor: 'pointer',
                  fontFamily: DESIGN_TOKENS.typography.fontFamily,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: DESIGN_TOKENS.primary.base,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {userInitials(u)}
                </div>
                <span
                  style={{
                    fontSize: DESIGN_TOKENS.typography.size.xs,
                    color: DESIGN_TOKENS.neutral[800],
                    fontWeight: active ? DESIGN_TOKENS.typography.weight.semibold : DESIGN_TOKENS.typography.weight.normal,
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {u.name || u.email}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Mismos estilos de chip que PhaseCard en ProjectRoadmap (color + icono). */
function RoadmapSyncFieldCell({ value, onChange, disabled, taskProject }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);
  const phases = taskProject?.roadmap?.phases || [];
  const selected = resolvePhase(phases, value);
  const color = selected?.color || DESIGN_TOKENS.primary.base;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) });
    }
    setOpen((o) => !o);
  };

  const chipIcon = (phase, size = 22) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size > 22 ? 14 : 12,
        flexShrink: 0,
        background: `${(phase?.color || color)}18`,
        border: `1.5px solid ${(phase?.color || color)}44`,
      }}
    >
      {phase?.icon || '📋'}
    </div>
  );

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px',
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
          fontSize: DESIGN_TOKENS.typography.size.xs,
          fontWeight: DESIGN_TOKENS.typography.weight.medium,
          color: DESIGN_TOKENS.neutral[800],
          background: selected ? `${color}14` : DESIGN_TOKENS.neutral[50],
          border: `1px solid ${selected ? `${color}55` : DESIGN_TOKENS.border.color.normal}`,
          borderRadius: DESIGN_TOKENS.border.radius.xs,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          textAlign: 'left',
        }}
      >
        {selected ? (
          <>
            {chipIcon(selected, 22)}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.name || 'Sin nombre'}
            </span>
          </>
        ) : (
          <span style={{ flex: 1, color: DESIGN_TOKENS.neutral[500] }}>—</span>
        )}
        <span style={{ fontSize: 9, opacity: 0.45, flexShrink: 0 }}>▾</span>
      </button>
      {open && !disabled && (
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 10001,
            minWidth: pos.width,
            maxHeight: 260,
            overflowY: 'auto',
            background: 'white',
            border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
            borderRadius: DESIGN_TOKENS.border.radius.sm,
            boxShadow: DESIGN_TOKENS.shadows.lg,
            padding: 4,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '8px 10px',
              border: 'none',
              borderRadius: 4,
              background: value == null || value === '' ? DESIGN_TOKENS.primary.lightest : 'transparent',
              cursor: 'pointer',
              fontSize: DESIGN_TOKENS.typography.size.xs,
              color: DESIGN_TOKENS.neutral[500],
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          >
            —
          </button>
          {phases.map((phase) => {
            const active = String(value) === String(phase.id);
            const c = phase.color || DESIGN_TOKENS.primary.base;
            return (
              <button
                key={phase.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(phase.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: 4,
                  background: active ? `${c}18` : 'transparent',
                  cursor: 'pointer',
                  fontFamily: DESIGN_TOKENS.typography.fontFamily,
                }}
              >
                {chipIcon(phase, 26)}
                <span
                  style={{
                    fontSize: DESIGN_TOKENS.typography.size.xs,
                    color: DESIGN_TOKENS.neutral[800],
                    fontWeight: active ? DESIGN_TOKENS.typography.weight.semibold : DESIGN_TOKENS.typography.weight.normal,
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {phase.name || 'Sin nombre'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function resolveSelectOption(definition, raw) {
  const opts = definition.options || [];
  if (raw == null || raw === '') return null;
  let o = opts.find((x) => x.id === raw);
  if (!o) o = opts.find((x) => x.label === raw);
  return o || null;
}

function SelectFieldCell({ definition, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);
  const options = definition.options || [];
  const selected = resolveSelectOption(definition, value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 160) });
    }
    setOpen((o) => !o);
  };

  const bg = selected?.color ? `${selected.color}22` : DESIGN_TOKENS.neutral[50];
  const borderCol = selected?.color ? `${selected.color}66` : DESIGN_TOKENS.border.color.normal;
  const textCol = selected?.color ? DESIGN_TOKENS.neutral[800] : DESIGN_TOKENS.neutral[600];

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px',
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
          fontSize: DESIGN_TOKENS.typography.size.xs,
          fontWeight: DESIGN_TOKENS.typography.weight.medium,
          color: textCol,
          background: bg,
          border: `1px solid ${borderCol}`,
          borderRadius: DESIGN_TOKENS.border.radius.xs,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          textAlign: 'left',
        }}
      >
        {selected?.color && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: selected.color,
              flexShrink: 0,
              boxShadow: `0 0 0 1px ${DESIGN_TOKENS.border.color.subtle}`,
            }}
          />
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label || '—'}
        </span>
        <span style={{ fontSize: 9, opacity: 0.45, flexShrink: 0 }}>▾</span>
      </button>
      {open && !disabled && (
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 10001,
            minWidth: pos.width,
            maxHeight: 220,
            overflowY: 'auto',
            background: 'white',
            border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
            borderRadius: DESIGN_TOKENS.border.radius.sm,
            boxShadow: DESIGN_TOKENS.shadows.lg,
            padding: 4,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 10px',
              border: 'none',
              borderRadius: 4,
              background: value == null || value === '' ? DESIGN_TOKENS.primary.lightest : 'transparent',
              cursor: 'pointer',
              fontSize: DESIGN_TOKENS.typography.size.xs,
              color: DESIGN_TOKENS.neutral[500],
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          >
            —
          </button>
          {options.map((opt) => {
            const active = value === opt.id || value === opt.label;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  borderRadius: 4,
                  background: active ? `${opt.color || DESIGN_TOKENS.primary.base}18` : 'transparent',
                  cursor: 'pointer',
                  fontSize: DESIGN_TOKENS.typography.size.xs,
                  color: DESIGN_TOKENS.neutral[800],
                  fontFamily: DESIGN_TOKENS.typography.fontFamily,
                  fontWeight: active ? DESIGN_TOKENS.typography.weight.semibold : DESIGN_TOKENS.typography.weight.normal,
                }}
              >
                {opt.color && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: opt.color,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Celda editable para custom_fields (JSONB por tarea).
 * `definition`: { id, name, type | field_type, options?, is_preset?, preset_type? }
 * `taskProject`: proyecto de la tarea (miembros + roadmap.phases para presets).
 */
export default function CustomFieldCell({
  definition,
  value,
  onChange,
  disabled = false,
  users = [],
  taskProject = null,
}) {
  const type = definition?.type || definition?.field_type || 'text';

  const baseStyle = {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: DESIGN_TOKENS.typography.fontFamily,
    fontSize: DESIGN_TOKENS.typography.size.xs,
    color: DESIGN_TOKENS.neutral[800],
    border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
    borderRadius: DESIGN_TOKENS.border.radius.xs,
    padding: '5px 8px',
    background: disabled ? DESIGN_TOKENS.neutral[50] : 'white',
    outline: 'none',
  };

  if (type === 'member_select') {
    return (
      <MemberSelectFieldCell
        value={value}
        onChange={onChange}
        disabled={disabled}
        project={taskProject}
        users={users}
      />
    );
  }

  if (type === 'roadmap_sync') {
    return (
      <RoadmapSyncFieldCell
        value={value}
        onChange={onChange}
        disabled={disabled}
        taskProject={taskProject}
      />
    );
  }

  if (type === 'select') {
    return (
      <SelectFieldCell
        definition={definition}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (type === 'checkbox') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <input
          type="checkbox"
          disabled={disabled}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            width: 18,
            height: 18,
            cursor: disabled ? 'not-allowed' : 'pointer',
            accentColor: DESIGN_TOKENS.primary.base,
          }}
        />
      </div>
    );
  }

  if (type === 'url') {
    return (
      <input
        type="url"
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        style={baseStyle}
        placeholder="https://"
      />
    );
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        disabled={disabled}
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : Number(v));
        }}
        style={baseStyle}
      />
    );
  }

  if (type === 'date') {
    return (
      <input
        type="date"
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        style={baseStyle}
      />
    );
  }

  return (
    <input
      type="text"
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={baseStyle}
      placeholder="—"
    />
  );
}
