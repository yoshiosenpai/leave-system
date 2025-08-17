// src/pages/Login.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import { useAuth } from "../auth";
import { LogIn, Lock, Loader2 } from "lucide-react";
import * as THREE from "three";
import CLOUDS from "vanta/dist/vanta.clouds.min.js";

export default function Login() {
  const { doLogin } = useAuth();
  const navigate = useNavigate();

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
      navigate("/"); // or "/dashboard" if that’s your home route
    } catch (err) {
      alert("Login failed: " + (err?.message || "Unknown error"));
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Vanta canvas */}
      <div ref={vantaRef} className="fixed inset-0 -z-10" />

      {/* Lighter overlay so clouds stay visible */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% 20%, rgba(10,15,28,.20), rgba(10,15,28,.45))",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-center pt-20">
        <div
          className={`login-glass w-[440px] rounded-2xl p-6 text-slate-100 shadow-2xl transition-transform ${
            loading || focused ? "pulse" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock size={18} />
            <h2 className="m-0 text-xl font-semibold">Sign in</h2>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Email</label>
              <input
                className="w-full rounded-lg bg-white/10 border border-white/30 text-white placeholder:text-white/60 outline-none px-3 py-2 focus:ring-4 focus:ring-violet-500/30"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Password</label>
              <input
                className="w-full rounded-lg bg-white/10 border border-white/30 text-white placeholder:text-white/60 outline-none px-3 py-2 focus:ring-4 focus:ring-violet-500/30"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </div>

            <button
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-400 text-white font-semibold px-4 py-2 shadow-lg disabled:opacity-70"
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-3 text-sm text-slate-300">
            First time? Ask an admin to create your account, then sign in.
          </p>
        </div>
      </div>

      {/* Fullscreen loading while authenticating */}
      {loading && (
        <div className="fixed inset-0 grid place-items-center bg-black/35 z-[9999]">
          <Loader2 size={42} className="spin text-white" />
        </div>
      )}
    </div>
  );
}
