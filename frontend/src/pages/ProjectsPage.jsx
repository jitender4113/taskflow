import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Loading, EmptyState, ColorPicker, PROJECT_COLORS } from '../components/UI';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(setProjects).finally(() => setLoading(false));
  }, []);

  // Check if opened via /projects/new route
  useEffect(() => {
    if (window.location.pathname === '/projects/new') setShowCreate(true);
  }, []);

  const onCreate = (project) => {
    setProjects(p => [project, ...p]);
    setShowCreate(false);
    toast('Project created!');
    navigate(`/projects/${project.id}`);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">Projects</div>
            <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon="⬡" title="No projects yet" desc="Create your first project to get started"
          action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Project</button>} />
      ) : (
        <div className="projects-grid">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={onCreate} />}
    </div>
  );
}

function ProjectCard({ project: p }) {
  const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
  return (
    <Link to={`/projects/${p.id}`} className="project-card" style={{ '--project-color': p.color }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
        <div className="project-name">{p.name}</div>
        <span className={`role-badge ${p.my_role}`} style={{ marginLeft: 'auto' }}>{p.my_role}</span>
      </div>
      <div className="project-desc">{p.description || 'No description'}</div>
      <div className="project-meta">
        <div className="project-stats">
          <span className="project-stat">◉ {p.task_count || 0} tasks</span>
          <span className="project-stat">◈ {p.member_count || 0} members</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{pct}%</span>
      </div>
      <div className="progress-bar" style={{ '--project-color': p.color }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: PROJECT_COLORS[0] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    setLoading(true);
    try {
      const p = await api.post('/projects', form);
      onCreate(p);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label className="label">Project Name</label>
              <input className="input" placeholder="e.g. Marketing Campaign" value={form.name} onChange={e => set('name', e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" placeholder="What is this project about?" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Color</label>
              <ColorPicker value={form.color} onChange={v => set('color', v)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
