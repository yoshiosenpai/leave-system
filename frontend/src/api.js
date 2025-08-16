const API = import.meta.env.VITE_API_BASE;

export async function login(email, password) {
  const res = await fetch(`${API}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function me(token) {
  const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }});
  if (!res.ok) throw new Error('Auth check failed');
  return res.json();
}

export async function myLeaves(token) {
  const res = await fetch(`${API}/api/leaves`, { headers: { Authorization: `Bearer ${token}` }});
  return res.json();
}

export async function createLeave(token, payload) {
  const res = await fetch(`${API}/api/leaves`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(payload) });
  return res.json();
}

export async function allLeaves(token, { status } = {}) {
  const url = new URL(`${API}/api/leaves`);
  if (status) url.searchParams.set('status', status);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
  return res.json();
}

export async function approve(token, id, comment='') {
  const res = await fetch(`${API}/api/admin/leaves/${id}/approve`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ managerComment: comment }) });
  return res.json();
}

export async function reject(token, id, comment='') {
  const res = await fetch(`${API}/api/admin/leaves/${id}/reject`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ managerComment: comment }) });
  return res.json();
}

export async function metrics(token) {
  const res = await fetch(`${API}/api/admin/leaves/dashboard/metrics`, { headers:{ Authorization:`Bearer ${token}` }});
  return res.json();
}
