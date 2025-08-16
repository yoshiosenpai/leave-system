const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false });
    const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql')).toString();
    await pool.query(sql);
    await pool.end();
    console.log('✅ Database initialized');
  } catch (e) {
    console.error('❌ DB init failed:', e.message);
    process.exit(1);
  }
})();
