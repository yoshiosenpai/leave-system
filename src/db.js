const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const isProd = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('railway') || isProd ? { rejectUnauthorized: false } : false
});

module.exports = { pool };
