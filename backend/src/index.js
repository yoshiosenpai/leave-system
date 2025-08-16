require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const leavesRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: false
}));
app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ ok: true, service: 'leave-application-system' }));

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/admin/leaves', adminRoutes);

// Global error fallback
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
