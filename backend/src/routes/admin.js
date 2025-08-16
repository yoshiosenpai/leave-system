const express = require('express');
const { param, body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAction } = require('../logger');

const router = express.Router();

// Approve / Reject
router.post('/:id/approve', requireAuth, requireRole('ADMIN'), [param('id').isInt(), body('managerComment').optional().isString()], async (req, res) => {
  const id = Number(req.params.id);
  const cur = (await pool.query('SELECT * FROM leaves WHERE id=$1', [id])).rows[0];
  if (!cur) return res.status(404).json({ error: 'Not found' });
  if (cur.status !== 'PENDING') return res.status(400).json({ error: 'Only PENDING can be approved' });

  const upd = await pool.query(
    `UPDATE leaves SET status='APPROVED', approver_id=$1, manager_comment=$2, decided_at=NOW(), updated_at=NOW() WHERE id=$3 RETURNING *`,
    [req.user.id, req.body.managerComment || null, id]
  );
  await logAction({ entity: 'leave', entityId: id, action: 'STATUS_CHANGE', oldValue: cur, newValue: upd.rows[0], actorUserId: req.user.id });
  res.json(upd.rows[0]);
});

router.post('/:id/reject', requireAuth, requireRole('ADMIN'), [param('id').isInt(), body('managerComment').optional().isString()], async (req, res) => {
  const id = Number(req.params.id);
  const cur = (await pool.query('SELECT * FROM leaves WHERE id=$1', [id])).rows[0];
  if (!cur) return res.status(404).json({ error: 'Not found' });
  if (cur.status !== 'PENDING') return res.status(400).json({ error: 'Only PENDING can be rejected' });

  const upd = await pool.query(
    `UPDATE leaves SET status='REJECTED', approver_id=$1, manager_comment=$2, decided_at=NOW(), updated_at=NOW() WHERE id=$3 RETURNING *`,
    [req.user.id, req.body.managerComment || null, id]
  );
  await logAction({ entity: 'leave', entityId: id, action: 'STATUS_CHANGE', oldValue: cur, newValue: upd.rows[0], actorUserId: req.user.id });
  res.json(upd.rows[0]);
});

// Simple dashboard metrics
router.get('/dashboard/metrics', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status='REJECTED' THEN 1 ELSE 0 END) AS rejected
    FROM leaves
  `);
  res.json(rows[0]);
});

module.exports = router;
