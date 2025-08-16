import { useState } from "react";
import { registerUser } from "../api";
import { useAuth } from "../auth";
import { UserPlus } from "lucide-react";

export default function Register(){
  const { token } = useAuth();
  const [form, setForm] = useState({ name:'Alice', email:'alice@demo.com', password:'Alice123!', role:'EMPLOYEE' });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true);
    try{
      const r = await registerUser(token, form);
      alert("User created: " + r.email);
      setForm({ name:'', email:'', password:'', role:'EMPLOYEE' });
    } catch(err){
      alert("Register failed: " + err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="container" style={{maxWidth:560, paddingTop:24}}>
      <div className="card" style={{padding:24}}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
          <UserPlus size={18}/><h2 style={{margin:0}}>Create User</h2>
        </div>
        <form className="form" onSubmit={onSubmit}>
          <div className="form-row">
            <div>
              <label className="muted">Name</label>
              <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label className="muted">Role</label>
              <select className="select" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                <option>EMPLOYEE</option>
                <option>ADMIN</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div>
              <label className="muted">Email</label>
              <input className="input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            </div>
            <div>
              <label className="muted">Password</label>
              <input className="input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
            </div>
          </div>
          <button className="btn" disabled={loading}><UserPlus size={16}/> {loading?'Creating…':'Create user'}</button>
        </form>
      </div>
    </div>
  );
}
