// src/auth.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { me } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) { setReady(true); return; }
    me(token)
      .then(r => { setUser(r.user); setReady(true); })
      .catch(() => {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        setReady(true);
      });
  }, [token]);

  function doLogin(t, u){ localStorage.setItem("token", t); setToken(t); setUser(u); }
  function logout(){ localStorage.removeItem("token"); setToken(""); setUser(null); }

  return <AuthCtx.Provider value={{ token, user, ready, doLogin, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(){ return useContext(AuthCtx); }

export function Protected({ children }){
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <div style={{display:'grid', placeItems:'center', minHeight:'100vh'}}>
        <div className="card" style={{padding:16}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <svg viewBox="0 0 24 24" width="20" height="20" className="spin">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
            <div>Loading…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) { window.location.href = "/login"; return null; }

  return children;
}
