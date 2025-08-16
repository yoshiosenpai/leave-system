// src/pages/Login.jsx
import { useEffect, useRef, useState } from "react";
import { login } from "../api";
import { useAuth } from "../auth";
import { LogIn, Lock, Loader2 } from "lucide-react";
import * as THREE from "three";
import CLOUDS from "vanta/dist/vanta.clouds.min.js";

export default function Login() {
  const { doLogin } = useAuth();
  const [form, setForm] = useState({
    email: "admin@demo.com",
    password: "Admin123!",
  });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  // Vanta background
  const vantaRef = useRef(null);
  const vantaInstance = useRef(null);

  useEffect(() => {
    if (!vantaInstance.current) {
      vantaInstance.current = CLOUDS({
        el: vantaRef.current,
        THREE,
        // brighten a touch so clouds are visible
        backgroundColor: 0x0b1220,
        skyColor: 0x7cc6ea,
        cloudColor: 0xbdd8e6,
        cloudShadowColor: 0x1a3a5d,
        sunColor: 0xff9919,
        sunGlareColor: 0xff6633,
        sunlightColor: 0xff9933,
        speed: 0.8,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        zoom: 1.05,
      });
    }
    return () => {
      vantaInstance.current?.destroy();
      vantaInstance.current = null;
    };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await login(form.email, form.password);
      doLogin(r.token, r.user);
      // navigate after token is stored
      window.location.href = "/";
    } catch (err) {
      alert("Login failed: " + (err?.message || "Unknown error"));
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Vanta canvas */}
      <div ref={vantaRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />

      {/* Lighter overlay so clouds stay visible */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(1200px 600px at 50% 20%, rgba(10,15,28,.20), rgba(10,15,28,.45))",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        className="container"
        style={{ maxWidth: 460, paddingTop: 80, position: "relative", zIndex: 2 }}
      >
        {/* Add `pulse` class when focused or submitting */}
        <div className={`login-card ${loading || focused ? "pulse" : ""}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Lock size={18} />
            <h2 style={{ margin: 0 }}>Sign in</h2>
          </div>

          <form className="form" onSubmit={onSubmit}>
            <div>
              <label className="muted">Email</label>
              <input
                className="login-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </div>

            <div>
              <label className="muted">Password</label>
              <input
                className="login-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </div>

            <button className="login-btn" disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
              {loading ? " Signing in…" : " Sign in"}
            </button>
          </form>

          <div style={{ marginTop: 12, fontSize: 14 }} className="muted">
            First time? Ask an admin to create your account, then sign in.
          </div>
        </div>
      </div>

      {/* Fullscreen loading while authenticating */}
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,.35)",
            zIndex: 9999,
          }}
        >
          <Loader2 size={42} className="spin" />
        </div>
      )}
    </div>
  );
}
