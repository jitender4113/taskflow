import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: '⚡',
    tagline: 'Manage projects & teams',
    accent: '#7c6ff7',
    accentSoft: 'rgba(124,111,247,0.12)',
    accentBorder: 'rgba(124,111,247,0.35)',
    gradient: 'linear-gradient(135deg, #7c6ff7, #a78bfa)',
    demoEmail: 'alex@taskflow.demo',
    demoPassword: 'demo123',
    desc: 'Full access — create projects, invite members, manage tasks and settings.',
  },
  member: {
    label: 'Member',
    icon: '◉',
    tagline: 'Work on assigned tasks',
    accent: '#10b981',
    accentSoft: 'rgba(16,185,129,0.12)',
    accentBorder: 'rgba(16,185,129,0.35)',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    demoEmail: 'sarah@taskflow.demo',
    demoPassword: 'demo123',
    desc: 'Collaborate on projects you\'ve been invited to and manage your tasks.',
  },
};

export default function AuthPage() {
  const [role, setRole] = useState('member');       // 'admin' | 'member'
  const [mode, setMode] = useState('login');     // 'login' | 'signup'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const cfg = role ? ROLE_CONFIG[role] : null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRoleSelect = (r) => {
    setRole(r);
    setError('');
    setForm({ name: '', email: '', password: '' });
    setIsDropdownOpen(false);
  };

  const fillDemo = () => {
    setForm(f => ({ ...f, email: cfg.demoEmail, password: cfg.demoPassword }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast(`Welcome back!`);
      } else {
        await signup(form.name, form.email, form.password);
        toast('Account created!');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${cfg.accentSoft} 0%, transparent 70%)`,
          top: -150, left: -150,
          transition: 'background 0.5s ease',
        }} />
        <div style={{
          position: 'absolute', width: 380, height: 380, borderRadius: '50%',
          background: `radial-gradient(circle, ${cfg.accentSoft} 0%, transparent 70%)`,
          bottom: -100, right: -100,
          transition: 'background 0.5s ease',
        }} />
      </div>

      <div className="auth-card" style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>

        {/* Logo */}
        <div className="auth-logo" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20,
              background: cfg.gradient,
              transition: 'background 0.4s ease',
              boxShadow: `0 4px 16px ${cfg.accentSoft}`,
            }}>⚡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>TaskFlow</span>
          </div>
        </div>

        {/* ── CUSTOM ROLE SELECTOR ── */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ 
                height: 36, padding: '0 32px 0 36px', fontWeight: 600, fontSize: 13,
                color: cfg.accent, border: `1px solid ${cfg.accentBorder}`, 
                background: cfg.accentSoft, borderRadius: 20,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s', outline: 'none'
              }}
            >
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 14 }}>{cfg.icon}</div>
              {cfg.label} Access
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: `translateY(-50%) ${isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`, transition: 'transform 0.2s', pointerEvents: 'none', fontSize: 16 }}>▾</div>
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8,
                  zIndex: 20, minWidth: 160
                }}>
                  <div style={{
                    background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12,
                    boxShadow: 'var(--shadow-lg)', overflow: 'hidden', 
                    animation: 'dropdown-in 0.2s ease'
                  }}>
                    {Object.entries(ROLE_CONFIG).map(([key, c]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleRoleSelect(key)}
                        style={{
                          width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
                          background: role === key ? 'var(--bg2)' : 'transparent', 
                          border: 'none', cursor: 'pointer', textAlign: 'left',
                          color: role === key ? c.accent : 'var(--text2)',
                          fontWeight: role === key ? 600 : 500, fontSize: 13,
                          transition: 'background 0.15s, color 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = role === key ? 'var(--bg2)' : 'transparent'; }}
                      >
                        <span style={{ fontSize: 14 }}>{c.icon}</span>
                        {c.label} Access
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </div>
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>
            {mode === 'login' ? `Sign in as ${cfg.label.toLowerCase()}` : cfg.tagline}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" type="text" placeholder="Your full name"
                value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
            </div>
          )}
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => set('email', e.target.value)} required
              autoFocus={mode === 'login'} />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
              value={form.password} onChange={e => set('password', e.target.value)} required />
          </div>

          <button
            type="submit"
            className="btn w-full mt-3"
            style={{
              justifyContent: 'center', height: 46,
              background: cfg.gradient,
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 14,
              boxShadow: `0 4px 16px ${cfg.accentSoft}`,
              transition: 'opacity 0.15s, transform 0.15s',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? 'Please wait…' : mode === 'login' ? `Sign in as ${cfg.label}` : 'Create Account'}
          </button>
        </form>

        {/* Demo credentials shortcut */}
        {mode === 'login' && (
          <div style={{
            marginTop: 16, padding: '12px 16px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                Demo credentials
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'monospace' }}>
                {cfg.demoEmail}
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              style={{
                fontSize: 12, fontWeight: 600, color: cfg.accent,
                background: cfg.accentSoft, border: `1px solid ${cfg.accentBorder}`,
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              }}
            >
              Use demo
            </button>
          </div>
        )}

        <div className="auth-toggle" style={{ marginTop: 20 }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <a onClick={() => { setMode('signup'); setError(''); }}>Sign up</a>
            </>
          ) : (
            <>Already have an account?{' '}
              <a onClick={() => { setMode('login'); setError(''); }}>Sign in</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
