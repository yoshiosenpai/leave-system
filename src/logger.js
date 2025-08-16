const { pool } = require('./db');

async function logAction({ entity, entityId, action, oldValue = null, newValue = null, actorUserId = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (entity, entity_id, action, old_value, new_value, actor_user_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [entity, entityId, action, oldValue, newValue, actorUserId]
    );
  } catch (e) {
    console.error('Audit log failed:', e.message);
  }
}

module.exports = { logAction };
