const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { auth } = require('../middleware');

const router = express.Router();

const checkAccess = (projectId, userId) => getDb().prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);

router.get('/project/:projectId', auth, (req, res) => {
  if (!checkAccess(req.params.projectId, req.user.id)) return res.status(403).json({ error: 'Access denied' });
  const db = getDb();
  const tasks = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assignee_id
    LEFT JOIN users u2 ON u2.id = t.creator_id
    WHERE t.project_id = ? ORDER BY t.created_at DESC
  `).all(req.params.projectId);
  res.json(tasks);
});

router.get('/my', auth, (req, res) => {
  const db = getDb();
  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color,
      u.name as assignee_name, u.avatar_color as assignee_color
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.assignee_id = ? OR t.creator_id = ?
    ORDER BY t.due_date ASC, t.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id);
  res.json(tasks);
});

router.get('/dashboard', auth, (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN t.due_date < ? AND t.status != 'done' THEN 1 ELSE 0 END) as overdue
    FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE t.assignee_id = ?
  `).get(today, req.user.id, req.user.id);

  const recentTasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE t.assignee_id = ?
    ORDER BY t.updated_at DESC LIMIT 5
  `).all(req.user.id, req.user.id);

  const overdueTasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t JOIN projects p ON p.id = t.project_id
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE t.assignee_id = ? AND t.due_date < ? AND t.status != 'done'
    ORDER BY t.due_date ASC LIMIT 5
  `).all(req.user.id, req.user.id, today);

  const projectStats = db.prepare(`
    SELECT p.id, p.name, p.color,
      COUNT(t.id) as total_tasks,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_tasks
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id ORDER BY p.created_at DESC LIMIT 6
  `).all(req.user.id);

  res.json({ stats, recentTasks, overdueTasks, projectStats });
});

router.post('/', auth, (req, res) => {
  const { title, description, status, priority, project_id, assignee_id, due_date } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project required' });

  const member = checkAccess(project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Access denied' });

  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, creator_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', status || 'todo', priority || 'medium', project_id, assignee_id || null, req.user.id, due_date || null);

  const task = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assignee_id LEFT JOIN users u2 ON u2.id = t.creator_id
    WHERE t.id = ?
  `).get(id);
  res.status(201).json(task);
});

router.put('/:id', auth, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!checkAccess(task.project_id, req.user.id)) return res.status(403).json({ error: 'Access denied' });

  const { title, description, status, priority, assignee_id, due_date } = req.body;
  if (title !== undefined) db.prepare('UPDATE tasks SET title = ?, updated_at = datetime(\'now\') WHERE id = ?').run(title, req.params.id);
  if (description !== undefined) db.prepare('UPDATE tasks SET description = ?, updated_at = datetime(\'now\') WHERE id = ?').run(description, req.params.id);
  if (status !== undefined) db.prepare('UPDATE tasks SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, req.params.id);
  if (priority !== undefined) db.prepare('UPDATE tasks SET priority = ?, updated_at = datetime(\'now\') WHERE id = ?').run(priority, req.params.id);
  if (assignee_id !== undefined) db.prepare('UPDATE tasks SET assignee_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(assignee_id || null, req.params.id);
  if (due_date !== undefined) db.prepare('UPDATE tasks SET due_date = ?, updated_at = datetime(\'now\') WHERE id = ?').run(due_date || null, req.params.id);

  const updated = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assignee_id LEFT JOIN users u2 ON u2.id = t.creator_id
    WHERE t.id = ?
  `).get(req.params.id);
  res.json(updated);
});

router.delete('/:id', auth, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = checkAccess(task.project_id, req.user.id);
  if (!member || (member.role === 'member' && task.creator_id !== req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.prepare('DELETE FROM comments WHERE task_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/:id', auth, (req, res) => {
  const db = getDb();
  const task = db.prepare(`
    SELECT t.*, u1.name as assignee_name, u1.avatar_color as assignee_color, u2.name as creator_name,
      p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN users u1 ON u1.id = t.assignee_id LEFT JOIN users u2 ON u2.id = t.creator_id
    JOIN projects p ON p.id = t.project_id WHERE t.id = ?
  `).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });

  if (!checkAccess(task.project_id, req.user.id)) return res.status(403).json({ error: 'Access denied' });

  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar_color FROM comments c
    JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json({ ...task, comments });
});

router.post('/:id/comments', auth, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT project_id FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!checkAccess(task.project_id, req.user.id)) return res.status(403).json({ error: 'Access denied' });
  if (!req.body.content?.trim()) return res.status(400).json({ error: 'Comment required' });

  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.user.id, req.body.content.trim());

  const comment = db.prepare('SELECT c.*, u.name as user_name, u.avatar_color FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?').get(id);
  res.status(201).json(comment);
});

module.exports = router;
