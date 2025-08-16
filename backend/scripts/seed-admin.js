const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false });
  try {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@demo.com';
    const name = process.env.SEED_ADMIN_NAME || 'Admin';
    const pw = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
    const hash = await bcrypt.hash(pw, 10);

    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rowCount > 0) {
      console.log('ℹ️ Admin already exists:', email);
    } else {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4)',
        [name, email, hash, 'ADMIN']
      );
      console.log('✅ Admin created:', email, '(password:', pw, ')');
    }
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
  } finally {
    await pool.end();
  }
})();
