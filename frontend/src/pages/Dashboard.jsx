// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import { myLeaves, allLeaves, createLeave, approve, reject, metrics } from "../api";
import {
  CalendarDays,
  LayoutDashboard,
  ClipboardList,
  Check,
  X,
  LogOut,
  RefreshCcw,
  UserPlus,
  Search
} from "lucide-react";

/** ---------- Small helpers ---------- */
function useToday() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
}

function cls(...xs) {
  return xs.filter(Boolean).join(" ");
}

/** ---------- Sidebar ---------- */
function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="w-64 shrink-0 soft-panel p-4 h-screen sticky top-0 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-xl bg-white shadow-inset grid place-items-center">📄</div>
        <div className="font-semibold">Leave System</div>
      </div>

      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Pages</div>
      <nav className="flex flex-col gap-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" active />
        <NavItem icon={ClipboardList} label="My Leaves" />
        {user?.role === "ADMIN" && <NavItem icon={UserPlus} label="Register" />}
      </nav>

      <div className="mt-6 text-xs uppercase tracking-wide text-slate-500 mb-2">Account</div>
      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/60 text-slate-700 transition-colors"
      >
        <LogOut size={18} /> <span className="text-[14px]">Logout</span>
      </button>

      <div className="mt-8 text-xs text-slate-500">
        v1 • {user?.name} · {user?.role}
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, active }) {
  return (
    <div
      className={cls(
        "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors",
        active ? "bg-white text-slate-900" : "hover:bg-white/60 text-slate-700"
      )}
    >
      <Icon size={18} />
      <span className="text-[14px]">{label}</span>
    </div>
  );
}

/** ---------- Topbar ---------- */
function Topbar() {
  return (
    <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur border-b border-border">
      <div className="h-14 flex items-center justify-between px-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 text-slate-400" size={16} />
          <input
            className="pl-8 pr-3 py-2 rounded-lg bg-white border border-border text-sm"
            placeholder="Search…"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 hidden md:block">📊 Strategic Dashboard</div>
          <img
            src={`https://api.dicebear.com/8.x/thumbs/svg?seed=user`}
            alt=""
            className="h-8 w-8 rounded-xl border border-border"
          />
        </div>
      </div>
    </div>
  );
}

/** ---------- Calendar (mini) ---------- */
function CalendarMini({ items = [] }) {
  const { y, m, d } = useToday();
  const first = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const hasLeave = new Set();
  items.forEach((l) => {
    const s = new Date(l.start_date), e = new Date(l.end_date);
    for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
      if (dt.getMonth() === m && dt.getFullYear() === y) hasLeave.add(dt.getDate());
    }
  });

  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Calendar</div>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <CalendarDays size={14} />
          {new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-slate-500 mb-1">
        {dows.map((x) => (
          <div key={x} className="text-center py-1">{x}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((v, i) => (
          <div
            key={i}
            className={cls(
              "h-10 rounded-lg border border-border bg-white grid place-items-center",
              v === d ? "ring-2 ring-accent/70" : "",
              v && hasLeave.has(v) ? "bg-blue-50 border-blue-200 text-blue-700" : ""
            )}
          >
            {v ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/** ---------- Metric Card ---------- */
function MetricCard({ label, value, hint }) {
  return (
    <div className="card p-4">
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </div>
  );
}

/** ---------- Main Dashboard ---------- */
export default function Dashboard() {
  const { token, user } = useAuth();

  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [stat, setStat] = useState({});
  const [loading, setLoading] = useState(false);

  // form state
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState("single"); // 'single' | 'range'
  const [form, setForm] = useState({
    startDate: today,
    endDate: today,
    type: "ANNUAL",
    reason: "",
  });

  async function refresh() {
    setLoading(true);
    try {
      const mineRes = await myLeaves(token);
      setMine(mineRes);

      if (user?.role === "ADMIN") {
        setPending(await allLeaves(token, { status: "PENDING" }));
        setStat(await metrics(token));
      } else {
        setPending([]);
        setStat({});
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submitLeave(e) {
    e.preventDefault();
    const payload = { ...form };
    if (mode === "single") payload.endDate = payload.startDate;

    const r = await createLeave(token, payload);
    if (r?.id) {
      setForm((f) => ({ ...f, reason: "" }));
      refresh();
    } else {
      alert("Submit failed: " + JSON.stringify(r));
    }
  }

  async function act(id, action) {
    if (action === "approve") await approve(token, id, "Approved");
    else await reject(token, id, "Rejected");
    refresh();
  }

  const kpis = useMemo(
    () => [
      { label: "My Leaves", value: mine.length, hint: "updated just now" },
      ...(user?.role === "ADMIN"
        ? [
            { label: "Pending", value: Number(stat.pending || 0) },
            { label: "Approved", value: Number(stat.approved || 0) },
          ]
        : []),
    ],
    [mine, stat, user]
  );

  return (
    <div className="flex">
      {/* Left */}
      <Sidebar />

      {/* Right */}
      <main className="flex-1 min-h-screen bg-bg">
        <Topbar />

        <div className="px-6 py-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {kpis.map((k) => (
              <MetricCard key={k.label} {...k} />
            ))}
          </div>

          {/* Apply + Calendar */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            {/* Apply */}
            <section className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Apply Leave</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("single")}
                    className={cls(
                      "px-3 py-1.5 rounded-lg border",
                      mode === "single"
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white border-border"
                    )}
                  >
                    Single Day
                  </button>
                  <button
                    onClick={() => setMode("range")}
                    className={cls(
                      "px-3 py-1.5 rounded-lg border",
                      mode === "range"
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white border-border"
                    )}
                  >
                    Range
                  </button>
                </div>
              </div>

              <form onSubmit={submitLeave} className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-500">Start date</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500">
                    End date {mode === "single" && <span className="text-slate-400">(auto = start)</span>}
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 disabled:opacity-60"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    required
                    disabled={mode === "single"}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Type</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    <option>ANNUAL</option>
                    <option>SICK</option>
                    <option>UNPAID</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Reason</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2"
                    placeholder="Optional"
                    value={form.reason}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reason: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-full flex gap-2">
                  <button className="px-4 py-2 rounded-lg bg-accent text-white flex items-center gap-2">
                    <Check size={16} /> Submit
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-border bg-white flex items-center gap-2"
                    onClick={refresh}
                  >
                    <RefreshCcw size={16} /> Refresh
                  </button>
                </div>
              </form>

              {/* My Leaves */}
              <div className="mt-6">
                <div className="font-medium mb-2">My Leaves</div>
                <div className="space-y-2">
                  {mine.length === 0 && (
                    <div className="text-sm text-slate-500">No leaves yet.</div>
                  )}
                  {mine.map((l) => (
                    <div key={l.id} className="border border-border rounded-xl bg-white px-3 py-2">
                      <div className="text-sm">
                        <b>{l.type}</b> · {l.start_date} → {l.end_date}
                      </div>
                      <div className="text-xs text-slate-500">
                        Status: {l.status}
                        {l.manager_comment ? ` · ${l.manager_comment}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Calendar + Pending */}
            <section className="space-y-6">
              <CalendarMini items={mine} />
              {user?.role === "ADMIN" && (
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">Pending Approvals</div>
                    <span className="text-xs text-slate-500">{pending.length} pending</span>
                  </div>
                  <div className="space-y-2">
                    {pending.length === 0 && (
                      <div className="text-sm text-slate-500">Nothing pending.</div>
                    )}
                    {pending.map((l) => (
                      <div key={l.id} className="border border-border rounded-xl bg-white px-3 py-2">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <b>#{l.id}</b> {l.employee_name} · {l.type} · {l.start_date}→{l.end_date}
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white flex items-center gap-1"
                              onClick={() => act(l.id, "approve")}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg bg-rose-500 text-white flex items-center gap-1"
                              onClick={() => act(l.id, "reject")}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Simple timeline strip (optional) */}
          <section className="card p-4 mt-6">
            <div className="font-medium mb-3">Plan Timeline</div>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="text-center text-xs text-slate-400">
                  {new Date(0, i).toLocaleString(undefined, { month: "short" })}
                </div>
              ))}
            </div>
            <div className="mt-2 space-y-2">
              <div className="h-3 rounded-full bg-blue-100 relative">
                <div className="absolute left-[10%] right-[40%] top-0 bottom-0 bg-accent rounded-full"></div>
              </div>
              <div className="h-3 rounded-full bg-emerald-100 relative">
                <div className="absolute left-[45%] right-[5%] top-0 bottom-0 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </section>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />
        )}
      </main>
    </div>
  );
}
