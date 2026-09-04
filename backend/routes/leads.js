const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const VALID_STATUSES = ['Not Contacted', 'Contacted', 'Demo Done', 'Purchased'];
const VALID_MEMBERS  = ['Shaurya', 'Tanish', 'Daksh'];

// All routes require auth
router.use(requireAuth);

// GET /api/leads
// Query params: ?status=Contacted&area=Andheri&sort=area|status|gym_name|last_contacted_date&order=asc|desc
router.get('/', (req, res) => {
  const { status, area, sort, order } = req.query;

  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (status && VALID_STATUSES.includes(status)) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (area && area.trim()) {
    query += ' AND LOWER(area) LIKE ?';
    params.push(`%${area.trim().toLowerCase()}%`);
  }

  const sortableColumns = ['gym_name', 'area', 'status', 'last_contacted_date', 'created_at'];
  const sortCol = sortableColumns.includes(sort) ? sort : 'created_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortCol} ${sortOrder}`;

  const leads = db.prepare(query).all(...params);
  return res.json(leads);
});

// POST /api/leads
router.post('/', (req, res) => {
  const { gym_name, area, owner_contact, status, last_contacted_date, visited_by, notes } = req.body;

  if (!gym_name || !gym_name.trim()) {
    return res.status(400).json({ error: 'Gym name is required' });
  }

  const resolvedStatus = VALID_STATUSES.includes(status) ? status : 'Not Contacted';
  const resolvedVisitedBy = VALID_MEMBERS.includes(visited_by) ? visited_by : null;

  const stmt = db.prepare(`
    INSERT INTO leads (gym_name, area, owner_contact, status, last_contacted_date, visited_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    gym_name.trim(),
    (area || '').trim(),
    (owner_contact || '').trim(),
    resolvedStatus,
    last_contacted_date || null,
    resolvedVisitedBy,
    (notes || '').trim()
  );

  const newLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json(newLead);
});

// PUT /api/leads/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const { gym_name, area, owner_contact, status, last_contacted_date, visited_by, notes } = req.body;

  const resolvedStatus = VALID_STATUSES.includes(status) ? status : existing.status;
  const resolvedVisitedBy = VALID_MEMBERS.includes(visited_by) ? visited_by : (visited_by === '' ? null : existing.visited_by);

  db.prepare(`
    UPDATE leads SET
      gym_name = ?,
      area = ?,
      owner_contact = ?,
      status = ?,
      last_contacted_date = ?,
      visited_by = ?,
      notes = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    (gym_name ?? existing.gym_name).trim(),
    (area ?? existing.area ?? '').trim(),
    (owner_contact ?? existing.owner_contact ?? '').trim(),
    resolvedStatus,
    last_contacted_date !== undefined ? (last_contacted_date || null) : existing.last_contacted_date,
    resolvedVisitedBy,
    (notes ?? existing.notes ?? '').trim(),
    id
  );

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  return res.json(updated);
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  return res.json({ ok: true });
});

module.exports = router;
