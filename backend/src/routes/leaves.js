const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { logAction } = require('../logger');

const router = express.Router();

const createOrUpdateValidators = [
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('type').isString().isLength({ min: 2 }),
  body('reason').optional().isString()
];

router.post('/', requireAuth, createOrUpdateValidators, async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { startDate, endDate, type, reason } = req.body;
  if (new Date(startDate) > new Date(endDate)) return res.status(400).json({ error: 'startDate must be <= endDate' });

  const q = `INSERT INTO leaves (user_id, start_date, end_date, type, reason)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING *`;
  const ins = await pool.query(q, [req.user.id, startDate, endDate, type, reason || null]);
  const item = ins.rows[0];
  await logAction({ entity: 'leave', entityId: item.id, action: 'CREATE', newValue: item, actorUserId: req.user.id });
  res.status(201).json(item);
});

// Get leaves (employee = own; admin = all)
router.get('/', requireAuth, async (req, res) => {
  const { status, userId } = req.query;
  let q, params;
  if (req.user.role === 'ADMIN') {
    q = `SELECT l.*, u.name AS employee_name FROM leaves l
         JOIN users u ON u.id=l.user_id
         WHERE ($1::text IS NULL OR l.status=$1)
           AND ($2::int IS NULL OR l.user_id=$2)
         ORDER BY l.created_at DESC`;
    params = [status || null, userId ? Number(userId) : null];
  } else {
    q = `SELECT * FROM leaves WHERE user_id=$1 ORDER BY created_at DESC`;
    params = [req.user.id];
  }
  const rows = (await pool.query(q, params)).rows;
  res.json(rows);
});

router.get('/:id', requireAuth, [param('id').isInt()], async (req, res) => {
  const id = Number(req.params.id);
  const row = (await pool.query('SELECT * FROM leaves WHERE id=$1', [id])).rows[0];
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'ADMIN' && row.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  res.json(row);
});

// Owner can update PENDING requests only
router.put('/:id', requireAuth, [param('id').isInt(), ...createOrUpdateValidators], async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const id = Number(req.params.id);
  const cur = (await pool.query('SELECT * FROM leaves WHERE id=$1', [id])).rows[0];
  if (!cur) return res.status(404).json({ error: 'Not found' });
  if (cur.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (cur.status !== 'PENDING') return res.status(400).json({ error: 'Only PENDING can be edited' });

  const { startDate, endDate, type, reason } = req.body;
  if (new Date(startDate) > new Date(endDate)) return res.status(400).json({ error: 'startDate must be <= endDate' });

  const upd = await pool.query(
    `UPDATE leaves SET start_date=$1, end_date=$2, type=$3, reason=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
    [startDate, endDate, type, reason || null, id]
  );
  await logAction({ entity: 'leave', entityId: id, action: 'UPDATE', oldValue: cur, newValue: upd.rows[0], actorUserId: req.user.id });
  res.json(upd.rows[0]);
});

// Owner can delete PENDING requests only
router.delete('/:id', requireAuth, [param('id').isInt()], async (req, res) => {
  const id = Number(req.params.id);
  const cur = (await pool.query('SELECT * FROM leaves WHERE id=$1', [id])).rows[0];
  if (!cur) return res.status(404).json({ error: 'Not found' });
  if (cur.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  if (cur.status !== 'PENDING') return res.status(400).json({ error: 'Only PENDING can be deleted' });

  await pool.query('DELETE FROM leaves WHERE id=$1', [id]);
  await logAction({ entity: 'leave', entityId: id, action: 'DELETE', oldValue: cur, actorUserId: req.user.id });
  res.json({ ok: true });
});

module.exports = router;
