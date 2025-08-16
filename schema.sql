-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('EMPLOYEE','ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leaves
CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL,               -- e.g. 'ANNUAL','SICK'
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')) DEFAULT 'PENDING',
  approver_id INTEGER REFERENCES users(id),
  manager_comment TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaves_user ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  entity TEXT NOT NULL,           -- 'leave' | 'user'
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL,           -- 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN'
  old_value JSONB,
  new_value JSONB,
  actor_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
