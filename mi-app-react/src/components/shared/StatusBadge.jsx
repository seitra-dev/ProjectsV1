import React from 'react';
import { getTaskStatus, getProjectStatus } from '../../constants/statuses';

/**
 * Reusable status badge.
 * Props:
 *   status  — the status key (e.g. 'in_progress', 'completed')
 *   type    — 'task' | 'project'  (default: 'task')
 *   size    — 'sm' | 'md' | 'lg' (default: 'md')
 *   dot     — show colored dot (default: true)
 */
export default function StatusBadge({ status, type = 'task', size = 'md', dot = true }) {
  const cfg = type === 'project' ? getProjectStatus(status) : getTaskStatus(status);

  const sizes = {
    sm: { padding: '2px 7px',  fontSize: '11px', dotSize: 6  },
    md: { padding: '3px 10px', fontSize: '12px', dotSize: 7  },
    lg: { padding: '4px 12px', fontSize: '13px', dotSize: 8  },
  };
  const s = sizes[size] || sizes.md;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: dot ? '5px' : 0,
      padding: s.padding,
      fontSize: s.fontSize,
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '99px',
      whiteSpace: 'nowrap',
      lineHeight: 1.4,
    }}>
      {dot && (
        <span style={{
          width: s.dotSize,
          height: s.dotSize,
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
        }} />
      )}
      {cfg.label}
    </span>
  );
}
