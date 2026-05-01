import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Loading, StatusBadge, PriorityIcon, Avatar, formatDate, isOverdue, ColorPicker, PROJECT_COLORS } from '../components/UI';

const STATUSES = [
  { key: 'todo', label: 'To Do', color: '#9898b0' },
  { key: 'in_progress', label: 'In Progress', color: '#60a5fa' },
  { key: 'done', label: 'Done', color: '#34d399' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const load = async () => {
    try {
      const [p, t] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks/project/${id}`)]);
      setProject(p);
      setTasks(t);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const isAdmin = project?.my_role === 'admin';

  const onTaskCreated = (task) => { setTasks(ts => [task, ...ts]); setShowTaskModal(false); toast('Task created!'); };
  const onTaskUpdated = (task) => { setTasks(ts => ts.map(t => t.id === task.id ? task : t)); setEditTask(null); };
  const onTaskDeleted = (taskId) => { setTasks(ts => ts.filter(t => t.id !== taskId)); toast('Task deleted'); };

  const updateStatus = async (taskId, status) => {
    try {
      const updated = await api.put(`/tasks/${taskId}`, { status });
      setTasks(ts => ts.map(t => t.id === taskId ? { ...t, ...updated } : t));
    } catch (err) { toast(err.message, 'error'); }
  };

  if (loading) return <Loading />;
  if (!project) return null;

  const pct = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, marginTop: 8, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="page-title">{project.name}</div>
              <span className={`role-badge role-${project.my_role}`}>{project.my_role}</span>
            </div>
            <div className="page-subtitle">{project.description || 'No description'}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowMembers(true)}>👥 Members ({project.members?.length || 0})</button>
            {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)}>⚙ Settings</button>}
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
          </div>
        </div>

        <div style={{ padding: '0 0 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, maxWidth: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'var(--text3)' }}>
              <span>{tasks.length} tasks</span><span>{pct}% complete</span>
            </div>
            <div className="progress-bar" style={{ '--project-color': project.color, height: 4 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            <div className="tabs">
              <button className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>Board</button>
              <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>List</button>
            </div>
          </div>
        </div>
      </div>

      {tab === 'board' ? (
        <div className="task-board">
          {STATUSES.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="task-column">
                <div className="column-header">
                  <div className="column-title">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                    {col.label}
                    <span className="column-count">{colTasks.length}</span>
                  </div>
                </div>
                <div className="column-tasks">
                  {colTasks.map(t => (
                    <TaskCard key={t.id} task={t} project={project}
                      onClick={() => setEditTask(t)}
                      onStatusChange={updateStatus}
                      members={project.members || []}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 12 }}>Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-container" style={{ paddingTop: 24 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)' }}>No tasks yet</td></tr>
              )}
              {tasks.map(t => (
                <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setEditTask(t)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{t.description.slice(0, 60)}{t.description.length > 60 ? '...' : ''}</div>}
                  </td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><span className={`priority-${t.priority}`} style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{t.priority}</span></td>
                  <td>
                    {t.assignee_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar name={t.assignee_name} color={t.assignee_color} size="avatar-sm" />
                        <span style={{ fontSize: 12 }}>{t.assignee_name}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>Unassigned</span>}
                  </td>
                  <td>
                    {t.due_date ? (
                      <span style={{ fontSize: 12, color: isOverdue(t.due_date) && t.status !== 'done' ? 'var(--red)' : 'var(--text3)' }}>
                        {formatDate(t.due_date)}
                      </span>
                    ) : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTaskModal && (
        <TaskModal onClose={() => setShowTaskModal(false)} onSave={onTaskCreated}
          projectId={id} members={project.members || []} />
      )}
      {editTask && (
        <TaskDetailModal task={editTask} onClose={() => setEditTask(null)}
          onSave={onTaskUpdated} onDelete={onTaskDeleted}
          members={project.members || []} isAdmin={isAdmin} currentUser={user} />
      )}
      {showMembers && (
        <MembersModal project={project} isAdmin={isAdmin} onClose={() => { setShowMembers(false); load(); }} />
      )}
      {showSettings && (
        <SettingsModal project={project} onClose={() => setShowSettings(false)}
          onSave={(updated) => { setProject(p => ({ ...p, ...updated })); setShowSettings(false); toast('Project updated!'); }}
          onDelete={() => { toast('Project deleted'); navigate('/projects'); }} />
      )}
    </div>
  );
}

function TaskCard({ task: t, onClick, onStatusChange, members }) {
  const overdue = isOverdue(t.due_date) && t.status !== 'done';
  return (
    <div className="task-card" onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <PriorityIcon priority={t.priority} />
        <div className="task-title">{t.title}</div>
      </div>
      {t.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, lineHeight: 1.4 }}>{t.description.slice(0, 80)}{t.description.length > 80 ? '...' : ''}</div>}
      <div className="task-footer">
        {t.assignee_name ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Avatar name={t.assignee_name} color={t.assignee_color} size="avatar-sm" />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.assignee_name}</span>
          </div>
        ) : <span style={{ fontSize: 11, color: 'var(--text3)' }}>Unassigned</span>}
        {t.due_date && (
          <span className={`due-date ${overdue ? 'overdue' : ''}`}>{formatDate(t.due_date)}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }} onClick={e => e.stopPropagation()}>
        {['todo', 'in_progress', 'done'].filter(s => s !== t.status).map(s => (
          <button key={s} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '3px 6px' }}
            onClick={() => onStatusChange(t.id, s)}>
            → {s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done'}
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskModal({ onClose, onSave, projectId, members, initial = {} }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', assignee_id: '', due_date: '', ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title required');
    setLoading(true);
    try {
      const task = await api.post('/tasks', { ...form, project_id: projectId, assignee_id: form.assignee_id || null });
      onSave(task);
    } catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => set('title', e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" placeholder="Add details..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="label">Assignee</label>
                <select className="select" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onClose, onSave, onDelete, members, isAdmin, currentUser }) {
  const [form, setForm] = useState({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, assignee_id: task.assignee_id || '', due_date: task.due_date || '' });
  const [comments, setComments] = useState(task.comments || []);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('details');
  const toast = useToast();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadComments = async () => {
    const t = await api.get(`/tasks/${task.id}`);
    setComments(t.comments || []);
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.put(`/tasks/${task.id}`, { ...form, assignee_id: form.assignee_id || null });
      onSave(updated);
      toast('Task updated!');
    } catch (err) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${task.id}`);
    onDelete(task.id);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    try {
      const c = await api.post(`/tasks/${task.id}/comments`, { content: comment });
      setComments(cs => [...cs, c]);
      setComment('');
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title" style={{ fontSize: 16 }}>{task.title}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(isAdmin || task.creator_id === currentUser?.id) && (
              <button className="btn btn-danger btn-sm" onClick={del}>Delete</button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="tabs" style={{ border: 'none', background: 'transparent', padding: 0, display: 'flex', gap: 0 }}>
            <button className={`tab ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}>Details</button>
            <button className={`tab ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}>Comments ({comments.length})</button>
          </div>
        </div>
        {tab === 'details' ? (
          <div className="modal-body">
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" style={{ minHeight: 80 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Add description..." />
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="label">Status</label>
                <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="label">Assignee</label>
                <select className="select" value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              Created by {task.creator_name} · {formatDate(task.created_at)}
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="comment-list" style={{ marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
              {comments.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No comments yet</div>}
              {comments.map(c => (
                <div key={c.id} className="comment">
                  <Avatar name={c.user_name} color={c.avatar_color} size="avatar-sm" />
                  <div className="comment-body">
                    <div className="comment-author">{c.user_name}<span className="comment-time">{formatDate(c.created_at)}</span></div>
                    <div className="comment-text">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={addComment} style={{ display: 'flex', gap: 8 }}>
              <input className="input" style={{ flex: 1 }} placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={loading || !comment.trim()}>Send</button>
            </form>
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function MembersModal({ project, isAdmin, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState(project.members || []);
  const toast = useToast();

  const addMember = async (e) => {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      const m = await api.post(`/projects/${project.id}/members`, { email, role });
      setMembers(ms => [...ms, m]);
      setEmail('');
      toast('Member added!');
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${project.id}/members/${userId}`);
      setMembers(ms => ms.filter(m => m.id !== userId));
      toast('Member removed');
    } catch (err) { toast(err.message, 'error'); }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await api.put(`/projects/${project.id}/members/${userId}`, { role: newRole });
      setMembers(ms => ms.map(m => m.id === userId ? { ...m, role: newRole } : m));
      toast('Role updated');
    } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Team Members</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {isAdmin && (
            <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Invite Member</div>
              {error && <div className="error-msg">{error}</div>}
              <form onSubmit={addMember}>
                <div className="input-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <select className="select" value={role} onChange={e => setRole(e.target.value)}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={adding}>{adding ? 'Adding...' : 'Add Member'}</button>
              </form>
            </div>
          )}
          <div className="member-list">
            {members.map(m => (
              <div key={m.id} className="member-item">
                <Avatar name={m.name} color={m.avatar_color} />
                <div className="member-info">
                  <div className="member-name">{m.name}</div>
                  <div className="member-email">{m.email}</div>
                </div>
                {isAdmin && m.id !== project.owner_id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select className="select" style={{ height: 30, fontSize: 12, padding: '2px 8px', width: 'auto' }}
                      value={m.role} onChange={e => changeRole(m.id, e.target.value)}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>
                  </div>
                ) : (
                  <span className={`role-badge role-${m.role}`}>{m.role}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ project, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ name: project.name, description: project.description || '', color: project.color });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/projects/${project.id}`, form);
      onSave(form);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const del = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${project.id}`);
      onDelete();
    } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Project Settings</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={save}>
          <div className="modal-body">
            <div className="form-group">
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Color</label>
              <ColorPicker value={form.color} onChange={v => set('color', v)} />
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 8, fontSize: 13 }}>Danger Zone</div>
              <button type="button" className="btn btn-danger" onClick={del}>Delete Project</button>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
