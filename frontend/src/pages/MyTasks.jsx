import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Loading, StatusBadge, PriorityIcon, formatDate, isOverdue, EmptyState } from '../components/UI';

const FILTERS = ['all', 'todo', 'in_progress', 'done'];

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('due_date');

  useEffect(() => {
    api.get('/tasks/my').then(setTasks).finally(() => setLoading(false));
  }, []);

  const filtered = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .sort((a, b) => {
      if (sort === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sort === 'priority') {
        const p = { high: 0, medium: 1, low: 2 };
        return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My Tasks</div>
        <div className="page-subtitle">{tasks.length} tasks assigned to you across all projects</div>
      </div>

      <div className="section" style={{ paddingTop: 16, paddingBottom: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="tabs">
            {FILTERS.map(f => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : f === 'in_progress' ? 'In Progress' : 'Done'}
                <span style={{ marginLeft: 4, opacity: 0.6, fontSize: 11 }}>
                  {f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length}
                </span>
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Sort:</span>
            <select className="select" style={{ width: 'auto', height: 34, fontSize: 13 }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Created</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="◉" title="No tasks found" desc={filter === 'all' ? "You have no tasks assigned yet" : `No ${filter.replace('_', ' ')} tasks`} />
      ) : (
        <div className="table-container" style={{ paddingTop: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const overdue = isOverdue(t.due_date) && t.status !== 'done';
                return (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/projects/${t.project_id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <PriorityIcon priority={t.priority} />
                          {t.title}
                        </div>
                        {t.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{t.description.slice(0, 60)}{t.description.length > 60 ? '…' : ''}</div>}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/projects/${t.project_id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.project_color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{t.project_name}</span>
                        </div>
                      </Link>
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }} className={`priority-${t.priority}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      {t.due_date ? (
                        <span style={{ fontSize: 13, color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 600 : 400 }}>
                          {overdue && '⚠ '}{formatDate(t.due_date)}
                        </span>
                      ) : <span style={{ color: 'var(--text3)', fontSize: 13 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
