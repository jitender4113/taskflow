import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Loading, StatusBadge, PriorityIcon, formatDate, isOverdue } from '../components/UI';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/tasks/dashboard').then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const s = data?.stats || {};
  const percent = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;

  return (
    <div style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg1) 100%)', minHeight: '100%' }}>
      <div className="page-header" style={{ paddingBottom: 0 }}>
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</div>
            <div className="page-subtitle">Here's what's happening across your projects</div>
          </div>
          <Link to="/projects/new" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #0a84ff, #5e5ce6)', boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)' }}>+ New Project</Link>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Tasks" value={s.total || 0} sub="assigned to you" color="#0a84ff" />
        <StatCard label="In Progress" value={s.in_progress || 0} sub={`${percent}% complete`} color="#bf5af2" />
        <StatCard label="Completed" value={s.done || 0} sub="tasks done" color="#30d158" />
        <StatCard label="Overdue" value={s.overdue || 0} sub="need attention" color="#ff453a" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 32px 24px' }}>
        <div className="card">
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div className="section-title">Recent Tasks</div>
            <Link to="/my-tasks" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data?.recentTasks?.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks yet</div>}
          {data?.recentTasks?.map(t => (
            <Link key={t.id} to={`/tasks/${t.id}`} style={{ textDecoration: 'none' }}>
              <div className="task-card" style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <PriorityIcon priority={t.priority} />
                  <span className="task-title" style={{ margin: 0 }}>{t.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <StatusBadge status={t.status} />
                  <span className="chip" style={{ fontSize: 11 }}>{t.project_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="card">
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div className="section-title">Project Progress</div>
            <Link to="/projects" className="btn btn-ghost btn-sm">All projects →</Link>
          </div>
          {data?.projectStats?.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No projects yet</div>}
          {data?.projectStats?.map(p => {
            const pct = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{pct}%</span>
                  </div>
                  <div className="progress-bar" style={{ '--project-color': p.color }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{p.done_tasks || 0}/{p.total_tasks || 0} tasks</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {data?.overdueTasks?.length > 0 && (
        <div className="section" style={{ paddingTop: 0 }}>
          <div className="section-header">
            <div className="section-title" style={{ color: 'var(--red)' }}>⚠ Overdue Tasks</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.overdueTasks.map(t => (
              <Link key={t.id} to={`/tasks/${t.id}`} style={{ textDecoration: 'none' }}>
                <div className="task-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <PriorityIcon priority={t.priority} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.project_name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>
                    Due {formatDate(t.due_date)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ '--accent-color': color }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
