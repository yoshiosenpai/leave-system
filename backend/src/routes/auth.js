const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { logAction } = require('../logger');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [ body('email').isEmail(), body('password').isString().isLength({ min: 6 }) ],
  async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;

    const userRes = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email=$1', [email]);
    if (userRes.rowCount === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = userRes.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    logAction({ entity: 'user', entityId: user.id, action: 'LOGIN', newValue: { email }, actorUserId: user.id }).catch(()=>{});
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }
);

// Admin creates employee
router.post(
  '/register',
  requireAuth, requireRole('ADMIN'),
  [
    body('name').isString().isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 8 }),
    body('role').optional().isIn(['EMPLOYEE','ADMIN'])
  ],
  async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password, role = 'EMPLOYEE' } = req.body;

    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rowCount) return res.status(400).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const ins = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role',
      [name, email, hash, role]
    );
    const u = ins.rows[0];
    await logAction({ entity: 'user', entityId: u.id, action: 'CREATE', newValue: u, actorUserId: req.user.id });
    res.status(201).json(u);
  }
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = router;
