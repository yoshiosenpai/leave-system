import { useEffect, useMemo, useState } from "react";
import { allLeaves, approve, createLeave, metrics, myLeaves, reject } from "./api";
import { useAuth } from "./auth";
import { CalendarIcon, Check, LogOut, RefreshCcw, UserPlus, X } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";

<Routes>
  <Route path="/" element={<Login />} />
  <Route path="/dashboard" element={<Dashboard />} />
</Routes>

function Navbar(){
  const { user, logout } = useAuth();
  return (
    <div className="nav">
      <div className="brand"><CalendarIcon size={20}/> Leave System</div>
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <span className="badge">{user?.name} · {user?.role}</span>
        <button className="btn ghost" onClick={logout}><LogOut size={16}/> Logout</button>
      </div>
    </div>
  );
}

function useToday(){
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
}

function CalendarMini({ items=[] }){
  const { y, m, d } = useToday();
  const first = new Date(y, m, 1).getDay(); // 0 Sun
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const cells = [];
  for (let i=0;i<first;i++) cells.push(null);
  for (let i=1;i<=daysInMonth;i++) cells.push(i);

  // Optional: mark days with leaves
  const hasLeave = new Set();
  items.forEach(l=>{
    const s = new Date(l.start_date), e = new Date(l.end_date);
    for(let dt = new Date(s); dt <= e; dt.setDate(dt.getDate()+1)){
      if (dt.getMonth()===m && dt.getFullYear()===y) hasLeave.add(dt.getDate());
    }
  });

  const dows = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return (
    <div className="calendar card">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <h3>Calendar</h3>
        <span className="badge"><CalendarIcon size={14}/> {new Date(y,m,1).toLocaleString(undefined,{month:'long', year:'numeric'})}</span>
      </div>
      <div className="grid">
        {dows.map(x => <div key={x} className="dow">{x}</div>)}
      </div>
      <div className="grid">
        {cells.map((v,i)=>
          <div key={i} className={`day ${v===d?'today':''} ${v && hasLeave.has(v)?'has':''}`}>
            {v ?? ''}
            {v && hasLeave.has(v) ? <div className="muted" style={{fontSize:10}}>• leave</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App(){
  const { token, user } = useAuth();
  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [stat, setStat] = useState({});
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState("single"); // single | range
  const todayStr = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({ startDate: todayStr, endDate: todayStr, type: 'ANNUAL', reason:'' });

  async function refresh(){
    setLoading(true);
    try{
      const [a,b] = await Promise.all([
        myLeaves(token),
        user?.role==='ADMIN' ? allLeaves(token, { status:'PENDING' }) : Promise.resolve([])
      ]);
      setMine(a);
      if (user?.role==='ADMIN'){
        setPending(b);
        setStat(await metrics(token));
      }
    } finally { setLoading(false); }
  }

  useEffect(()=>{ refresh(); /* eslint-disable-next-line */ }, [token]);

  async function submitLeave(e){
    e.preventDefault();
    const payload = { ...form };
    if (mode === 'single') payload.endDate = payload.startDate;
    const r = await createLeave(token, payload);
    if (r.id){ setForm({ ...form, reason:'' }); refresh(); }
    else alert(JSON.stringify(r));
  }

  async function act(id, type){
    if (type==='approve') await approve(token, id, 'Approved');
    else await reject(token, id, 'Rejected');
    refresh();
  }

  const kpis = useMemo(()=>[
    { label:'My Leaves', value: mine.length },
    ...(user?.role==='ADMIN' ? [
      { label:'Pending', value: Number(stat.pending||0) },
      { label:'Approved', value: Number(stat.approved||0) },
    ] : []),
  ], [mine, stat, user]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

            <div className="card" key={i}>
              <h3>{k.label}</h3>
              <div className="kpi">{k.value}</div>
              <div className="muted">updated just now</div>
            </div>
          ))}
        </div>

        <div className="row" style={{gridTemplateColumns:'2fr 1fr', marginTop:16}}>
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3>Apply Leave</h3>
              <div style={{display:'flex', gap:8}}>
                <button className={`btn ghost ${mode==='single'?'active':''}`} onClick={()=>setMode('single')}>Single Day</button>
                <button className={`btn ghost ${mode==='range'?'active':''}`} onClick={()=>setMode('range')}>Range</button>
              </div>
            </div>

            <form className="form" onSubmit={submitLeave}>
              <div className="form-row">
                <div>
                  <label className="muted">Start date</label>
                  <input className="input" type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} required />
                </div>
                <div>
                  <label className="muted">End date {mode==='single' && <span className="muted">(auto = start)</span>}</label>
                  <input className="input" type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} required disabled={mode==='single'} />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="muted">Type</label>
                  <select className="select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    <option>ANNUAL</option><option>SICK</option><option>UNPAID</option>
                  </select>
                </div>
                <div>
                  <label className="muted">Reason</label>
                  <input className="input" placeholder="Optional" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button className="btn" type="submit"><Check size={16}/> Submit</button>
                <button className="btn ghost" type="button" onClick={refresh}><RefreshCcw size={16}/> Refresh</button>
              </div>
            </form>

            <hr/>
            <h3>My Leaves</h3>
            <div style={{display:'grid', gap:8}}>
              {mine.length===0 && <div className="muted">No leaves yet.</div>}
              {mine.map(l=>(
                <div key={l.id} className="card" style={{padding:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div><b>{l.type}</b> · {l.start_date} → {l.end_date}</div>
                      <div className="muted">Status: {l.status} {l.manager_comment? ` · ${l.manager_comment}`:''}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'grid', gap:16}}>
            <CalendarMini items={mine}/>
            {user?.role==='ADMIN' &&
              <div className="card">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h3>Pending Approvals</h3>
                  <span className="badge">{pending.length} pending</span>
                </div>
                <div style={{display:'grid', gap:8}}>
                  {pending.length===0 && <div className="muted empty">Nothing pending.</div>}
                  {pending.map(l=>(
                    <div key={l.id} className="card" style={{padding:12}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                          <b>#{l.id}</b> {l.employee_name} · {l.type} · {l.start_date}→{l.end_date}
                        </div>
                        <div style={{display:'flex', gap:8}}>
                          <button className="btn" onClick={()=>act(l.id,'approve')}><Check size={16}/>Approve</button>
                          <button className="btn danger" onClick={()=>act(l.id,'reject')}><X size={16}/>Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>}
          </div>
        </div>

        {loading && <div style={{position:'fixed', inset:0, backdropFilter:'blur(2px)', background:'rgba(0,0,0,.2)'}}/>}
      </div>
    </>
  );
}
