import { useState } from 'react';

export function Avatar({ name = '?', color = '#6366f1', size = '' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`avatar ${size}`} style={{ background: color }}>
      {initials}
    </div>
  );
}

export function StatusBadge({ status }) {
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', review: 'Review' };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

export function PriorityIcon({ priority }) {
  const colors = { high: '#f87171', medium: '#fbbf24', low: '#34d399' };
  return <span className="priority-dot" style={{ background: colors[priority] || '#888' }} title={priority} />;
}

export function Modal({ isOpen, onClose, title, children, size = '' }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Loading() {
  return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;
}

export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{desc}</div>
      {action}
    </div>
  );
}

export const PROJECT_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6','#f97316','#06b6d4'];

export function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      {PROJECT_COLORS.map(c => (
        <div key={c} className={`color-dot ${value === c ? 'selected' : ''}`}
          style={{ background: c }} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

export function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function useDropdown() {
  const [open, setOpen] = useState(false);
  const toggle = (e) => { e.stopPropagation(); setOpen(v => !v); };
  const close = () => setOpen(false);
  return { open, toggle, close, setOpen };
}
