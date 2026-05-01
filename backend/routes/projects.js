const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { auth } = require('../middleware');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const db = getDb();
  const projects = db.prepare(`
    SELECT p.id, p.name, p.description, p.color, p.owner_id, p.created_at,
      u.name as owner_name, pm.role as my_role,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    JOIN users u ON u.id = p.owner_id
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

router.post('/', auth, (req, res) => {
  const db = getDb();
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });

  const id = uuidv4();
  const memberId = uuidv4();
  db.prepare('INSERT INTO projects (id, name, description, color, owner_id) VALUES (?, ?, ?, ?, ?)').run(id, name, description || '', color || '#6366f1', req.user.id);
  db.prepare('INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)').run(memberId, id, req.user.id, 'admin');

  const project = db.prepare(`
    SELECT p.id, p.name, p.description, p.color, p.owner_id, p.created_at,
      u.name as owner_name, 'admin' as my_role,
      0 as task_count, 0 as done_count, 1 as member_count
    FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?
  `).get(id);
  res.status(201).json(project);
});

router.get('/:id', auth, (req, res) => {
  const db = getDb();
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Access denied' });

  const project = db.prepare(`
    SELECT p.id, p.name, p.description, p.color, p.owner_id, p.created_at,
      u.name as owner_name,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
      (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
    FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id = ?
  `).get(req.params.id);
  
  if (!project) return res.status(404).json({ error: 'Not found' });
  project.my_role = member.role;

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar_color, pm.role, pm.joined_at
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  res.json({ ...project, members });
});

router.put('/:id', auth, (req, res) => {
  const db = getDb();
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member || member.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { name, description, color } = req.body;
  if (name) db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name, req.params.id);
  if (description !== undefined) db.prepare('UPDATE projects SET description = ? WHERE id = ?').run(description, req.params.id);
  if (color) db.prepare('UPDATE projects SET color = ? WHERE id = ?').run(color, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  if (project.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can delete project' });

  db.prepare('DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)').run(req.params.id);
  db.prepare('DELETE FROM tasks WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM project_members WHERE project_id = ?').run(req.params.id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/members', auth, (req, res) => {
  const db = getDb();
  const myRole = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!myRole || myRole.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const { email, role } = req.body;
  const user = db.prepare('SELECT id, name, email, avatar_color FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found with that email' });

  const existing = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, user.id);
  if (existing) return res.status(400).json({ error: 'User already a member' });

  const id = uuidv4();
  db.prepare('INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)').run(id, req.params.id, user.id, role || 'member');
  res.json({ ...user, role: role || 'member' });
});

router.put('/:id/members/:userId', auth, (req, res) => {
  const db = getDb();
  const myRole = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!myRole || myRole.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(req.params.id);
  if (project.owner_id === req.params.userId) return res.status(400).json({ error: "Can't change owner's role" });

  db.prepare('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?').run(req.body.role, req.params.id, req.params.userId);
  res.json({ success: true });
});

router.delete('/:id/members/:userId', auth, (req, res) => {
  const db = getDb();
  const myRole = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!myRole || myRole.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(req.params.id);
  if (project.owner_id === req.params.userId) return res.status(400).json({ error: "Can't remove project owner" });

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ success: true });
});

module.exports = router;
