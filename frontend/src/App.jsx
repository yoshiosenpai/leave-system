import { useEffect, useState } from 'react';
import { login, me, myLeaves, createLeave, allLeaves, approve, reject, metrics } from './api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({ email: 'admin@demo.com', password: 'Admin123!' });
  const [leaveForm, setLeaveForm] = useState({ startDate:'', endDate:'', type:'ANNUAL', reason:'' });
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [stat, setStat] = useState({});

  useEffect(() => {
    if (!token) return;
    me(token).then(r => setUser(r.user)).catch(() => { setToken(''); localStorage.removeItem('token'); });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    myLeaves(token).then(setMine);
    if (user.role === 'ADMIN') {
      allLeaves(token, { status: 'PENDING' }).then(setAll);
      metrics(token).then(setStat);
    }
  }, [token, user]);

  async function handleLogin(e) {
    e.preventDefault();
    const r = await login(authForm.email, authForm.password);
    localStorage.setItem('token', r.token);
    setToken(r.token);
    setUser(r.user);
  }

  async function submitLeave(e) {
    e.preventDefault();
    const r = await createLeave(token, leaveForm);
    if (r.id) {
      setLeaveForm({ startDate:'', endDate:'', type:'ANNUAL', reason:'' });
      myLeaves(token).then(setMine);
    } else alert(JSON.stringify(r));
  }

  async function act(id, type) {
    if (type === 'approve') await approve(token, id, 'OK');
    else await reject(token, id, 'Not this time');
    allLeaves(token, { status: 'PENDING' }).then(setAll);
  }

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', fontFamily: 'system-ui' }}>
      <h1>Leave Application System</h1>

      {!user && (
        <form onSubmit={handleLogin} style={{ marginBottom: 20 }}>
          <h3>Login</h3>
          <input value={authForm.email} onChange={e=>setAuthForm({...authForm, email:e.target.value})} placeholder="email" /><br/>
          <input type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm, password:e.target.value})} placeholder="password" /><br/>
          <button>Login</button>
        </form>
      )}

      {user && (
        <>
          <p>Logged in as <b>{user.name}</b> ({user.role})</p>

          <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8, margin:'12px 0' }}>
            <h3>Apply Leave</h3>
            <form onSubmit={submitLeave}>
              <input type="date" value={leaveForm.startDate} onChange={e=>setLeaveForm({...leaveForm, startDate:e.target.value})} required />
              <input type="date" value={leaveForm.endDate} onChange={e=>setLeaveForm({...leaveForm, endDate:e.target.value})} required />
              <select value={leaveForm.type} onChange={e=>setLeaveForm({...leaveForm, type:e.target.value})}>
                <option>ANNUAL</option><option>SICK</option><option>UNPAID</option>
              </select>
              <input placeholder="Reason" value={leaveForm.reason} onChange={e=>setLeaveForm({...leaveForm, reason:e.target.value})} />
              <button>Submit</button>
            </form>
          </section>

          <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8, margin:'12px 0' }}>
            <h3>My Leaves</h3>
            <ul>
              {mine.map(l => (
                <li key={l.id}>
                  #{l.id} {l.type} {l.start_date} → {l.end_date} — <b>{l.status}</b>
                </li>
              ))}
            </ul>
          </section>

          {user.role === 'ADMIN' && (
            <>
              <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8, margin:'12px 0' }}>
                <h3>Admin Metrics</h3>
                <pre>{JSON.stringify(stat, null, 2)}</pre>
              </section>

              <section style={{ border:'1px solid #ddd', padding:12, borderRadius:8, margin:'12px 0' }}>
                <h3>Pending Approvals</h3>
                <ul>
                  {all.map(l => (
                    <li key={l.id}>
                      #{l.id} {l.employee_name}: {l.type} {l.start_date}→{l.end_date}
                      <button style={{ marginLeft: 8 }} onClick={() => act(l.id, 'approve')}>Approve</button>
                      <button style={{ marginLeft: 8 }} onClick={() => act(l.id, 'reject')}>Reject</button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
