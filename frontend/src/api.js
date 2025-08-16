const API = import.meta.env.VITE_API_BASE;
console.log("VITE_API_BASE =", API); // uncomment for debugging

async function j(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = res.statusText;
    try { const body = await res.json(); msg = body.error || JSON.stringify(body); } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function login(email, password) {
  return j(`${API}/api/auth/login`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
}

export function registerUser(token, payload) {
  return j(`${API}/api/auth/register`, {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify(payload)
  });
}

export function me(token) {
  return j(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } });
}

export function myLeaves(token) {
  return j(`${API}/api/leaves`, { headers:{ Authorization:`Bearer ${token}` } });
}

export function createLeave(token, payload) {
  return j(`${API}/api/leaves`, {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify(payload)
  });
}

export function allLeaves(token, { status } = {}) {
  const url = new URL(`${API}/api/leaves`);
  if (status) url.searchParams.set('status', status);
  return j(url, { headers:{ Authorization:`Bearer ${token}` } });
}

export function approve(token, id, comment='') {
  return j(`${API}/api/admin/leaves/${id}/approve`, {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify({ managerComment: comment })
  });
}

export function reject(token, id, comment='') {
  return j(`${API}/api/admin/leaves/${id}/reject`, {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify({ managerComment: comment })
  });
}

export function metrics(token) {
  return j(`${API}/api/admin/leaves/dashboard/metrics`, { headers:{ Authorization:`Bearer ${token}` } });
}
