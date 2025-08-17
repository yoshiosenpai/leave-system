// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import { myLeaves, allLeaves, createLeave, approve, reject, metrics } from "../api";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  UserPlus,
  RefreshCcw,
  Check,
  X,
  Search,
  LogOut
} from "lucide-react";

/* -------- helpers -------- */
function cls(...xs) { return xs.filter(Boolean).join(" "); }

function useToday() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth(), dnum: d.getDate() };
}

/* -------- Animated button (shared) -------- */
function AButton({ variant = "primary", className = "", children, ...rest }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-400 " +
    "hover:scale-[1.02] active:scale-[0.98]";
  const theme =
    variant === "primary"
      ? "bg-blue-600 text-white hover:shadow-md"
      : variant === "danger"
      ? "bg-rose-500 text-white hover:shadow-md"
      : "bg-white border border-gray-200 hover:shadow-sm";
  return (
    <button className={cls(base, theme, className)} {...rest}>
      {children}
    </button>
  );
}

/* -------- Sidebar (with profile) -------- */
function Sidebar() {
  const { user } = useAuth();
  const avatar = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(
    user?.email || user?.name || "user"
  )}`;

  return (
    <aside className="w-68 shrink-0 h-screen sticky top-0 overflow-y-auto soft-panel p-5">
      {/* Profile header */}
      <div className="flex items-center gap-3 mb-6">
        <img src={avatar} alt="" className="h-10 w-10 rounded-xl border border-white/60 shadow" />
        <div>
          <div className="text-xs text-slate-500">Welcome</div>
          <div className="font-semibold text-slate-800">{user?.name || user?.email}</div>
          <div className="text-[11px] text-slate-500">ID: {user?.id ?? "-"}</div>
        </div>
      </div>

      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Pages</div>
      <nav className="flex flex-col gap-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" active />
        <NavItem icon={ClipboardList} label="My Leaves" />
        {user?.role === "ADMIN" && <NavItem icon={UserPlus} label="Register" />}
      </nav>

      <div className="mt-8 text-[12px] text-slate-500">
        v1 • {user?.role}
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, active }) {
  return (
    <div
      className={cls(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] cursor-default select-none",
        active ? "bg-white text-slate-900 shadow-sm" : "hover:bg-white/70 text-slate-700"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
    </div>
  );
}

/* -------- Topbar (search + logout on right) -------- */
function Topbar() {
  const { logout, user } = useAuth();
  const avatar = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(
    user?.email || user?.name || "user"
  )}`;

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="h-14 px-6 flex items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            className="pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-sm w-72 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Search…"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-slate-500">📊 Strategic Dashboard</span>
          <img src={avatar} alt="" className="h-8 w-8 rounded-xl border border-gray-200" />
          <AButton variant="ghost" className="!px-3" onClick={logout}>
            <LogOut size={18} /> Logout
          </AButton>
        </div>
      </div>
    </div>
  );
}

/* -------- Company Calendar Overview (who is on leave) -------- */
function CompanyCalendar({ token, monthLeaves }) {
  // monthLeaves is a map day->[{name, avatar}]
  const { y, m, dnum } = useToday();
  const first = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-slate-800">Calendar</div>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <CalendarDays size={14} />
          {new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" })}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[12px] text-slate-500 mb-1">
        {dows.map((x) => (
          <div key={x} className="text-center py-1">{x}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((v, idx) => {
          const list = v ? (monthLeaves[v] || []) : [];
          return (
            <div
              key={idx}
              className={cls(
                "min-h-[46px] rounded-lg border border-gray-200 bg-white px-1 pt-1",
                v === dnum && "ring-2 ring-blue-400"
              )}
              title={
                list.length
                  ? `${list.length} on leave: ${list.map((p) => p.name).join(", ")}`
                  : ""
              }
            >
              <div className="text-center text-sm">{v ?? ""}</div>
              {/* little avatars / +count */}
              {v && list.length > 0 && (
                <div className="flex -space-x-2 mt-1 pl-1">
                  {list.slice(0, 3).map((p, i) => (
                    <img
                      key={i}
                      src={p.avatar}
                      className="h-5 w-5 rounded-full border border-white"
                      alt=""
                    />
                  ))}
                  {list.length > 3 && (
                    <div className="h-5 px-2 rounded-full bg-blue-100 text-blue-700 text-[10px] grid place-items-center border border-white">
                      +{list.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------- Main Dashboard -------- */
export default function Dashboard() {
  const { token, user } = useAuth();

  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [stat, setStat] = useState({});
  const [loading, setLoading] = useState(false);

  // For overview calendar
  const [approvedMonthMap, setApprovedMonthMap] = useState({}); // {day: [{name, avatar}]}

  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState("single");
  const [form, setForm] = useState({
    startDate: today,
    endDate: today,
    type: "ANNUAL",
    reason: "",
  });

  const avatarFrom = (seed) =>
    `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(seed || "user")}`;

  async function refresh() {
    setLoading(true);
    try {
      // my leaves always
      const mineRes = await myLeaves(token);
      setMine(mineRes);

      // admin-specific data
      if (user?.role === "ADMIN") {
        const [pend, stats, approved] = await Promise.all([
          allLeaves(token, { status: "PENDING" }),
          metrics(token),
          allLeaves(token, { status: "APPROVED" }),
        ]);
        setPending(pend);
        setStat(stats);

        // build per-day map for current month
        const { y, m } = useToday();
        const map = {}; // day -> array
        approved.forEach((l) => {
          const s = new Date(l.start_date);
          const e = new Date(l.end_date);
          for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
            if (dt.getMonth() === m && dt.getFullYear() === y) {
              const day = dt.getDate();
              map[day] ||= [];
              map[day].push({
                name: l.employee_name || l.employee || "Employee",
                avatar: avatarFrom(l.employee_name || l.employee || l.email),
              });
            }
          }
        });
        setApprovedMonthMap(map);
      } else {
        // non-admin can still see overview of approved leaves (anonymized or not)
        const approved = await allLeaves(token, { status: "APPROVED" });
        const { y, m } = useToday();
        const map = {};
        approved.forEach((l) => {
          const s = new Date(l.start_date);
          const e = new Date(l.end_date);
          for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
            if (dt.getMonth() === m && dt.getFullYear() === y) {
              const day = dt.getDate();
              map[day] ||= [];
              map[day].push({
                name: l.employee_name || l.employee || "Employee",
                avatar: avatarFrom(l.employee_name || l.employee || l.email),
              });
            }
          }
        });
        setApprovedMonthMap(map);
        setPending([]);
        setStat({});
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) refresh(); /* eslint-disable-line */ }, [token]);

  async function submitLeave(e) {
    e.preventDefault();
    const payload = { ...form };
    if (mode === "single") payload.endDate = payload.startDate;
    const r = await createLeave(token, payload);
    if (r?.id) { setForm((f) => ({ ...f, reason: "" })); refresh(); }
    else alert("Submit failed: " + JSON.stringify(r));
  }

  async function act(id, action) {
    if (action === "approve") await approve(token, id, "Approved");
    else await reject(token, id, "Rejected");
    refresh();
  }

  const kpis = useMemo(() => ([
    { label: "My Leaves", value: mine.length, hint: "updated just now" },
    ...(user?.role === "ADMIN"
      ? [
          { label: "Pending", value: Number(stat.pending || 0) },
          { label: "Approved", value: Number(stat.approved || 0) },
        ]
      : []),
  ]), [mine, stat, user]);

  return (
    <div className="flex bg-[#f7f9fc] min-h-screen text-slate-800">
      {/* Left: Sidebar */}
      <Sidebar />

      {/* Right: Content */}
      <main className="flex-1">
        <Topbar />

        <div className="px-6 py-6 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="text-slate-500 text-sm">{k.label}</div>
                <div className="text-3xl font-semibold mt-1 text-slate-900">{k.value}</div>
                {k.hint && <div className="text-xs text-slate-400 mt-1">{k.hint}</div>}
              </div>
            ))}
          </div>

          {/* Apply + Calendar Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            {/* Apply Form */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="font-medium">📝 Apply Leave</div>
                <div className="flex gap-2">
                  <AButton
                    variant={mode === "single" ? "primary" : "ghost"}
                    onClick={() => setMode("single")}
                    className={mode === "single" ? "!px-3 !py-1.5" : "border"}
                  >
                    Single Day
                  </AButton>
                  <AButton
                    variant={mode === "range" ? "primary" : "ghost"}
                    onClick={() => setMode("range")}
                    className={mode === "range" ? "!px-3 !py-1.5" : "border"}
                  >
                    Range
                  </AButton>
                </div>
              </div>

              <form onSubmit={submitLeave} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-500">Start date</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500">
                    End date {mode === "single" && <span className="text-slate-400">(auto = start)</span>}
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 disabled:opacity-60"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    required
                    disabled={mode === "single"}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Type</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option>ANNUAL</option>
                    <option>SICK</option>
                    <option>UNPAID</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Reason</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
                    placeholder="Optional"
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  />
                </div>

                <div className="col-span-full flex flex-wrap gap-2">
                  <AButton type="submit"><Check size={16}/> Submit</AButton>
                  <AButton variant="ghost" className="border" type="button" onClick={refresh}>
                    <RefreshCcw size={16}/> Refresh
                  </AButton>
                </div>
              </form>

              {/* My Leaves */}
              <div className="mt-6">
                <div className="font-medium mb-3">📋 My Leaves</div>
                <div className="space-y-2">
                  {mine.length === 0 && <div className="text-sm text-slate-500">No leaves yet.</div>}
                  {mine.map((l) => (
                    <div key={l.id} className="border border-gray-200 rounded-xl bg-white px-3 py-2">
                      <div className="text-sm">
                        <b>{l.type}</b> · {l.start_date} → {l.end_date}
                      </div>
                      <div className="text-xs text-slate-500">
                        Status: {l.status}{l.manager_comment ? ` · ${l.manager_comment}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Right: Overview + Pending */}
            <section className="space-y-6">
              <CompanyCalendar token={token} monthLeaves={approvedMonthMap} />

              {user?.role === "ADMIN" && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">✅ Pending Approvals</div>
                    <span className="text-xs text-slate-500">{pending.length} pending</span>
                  </div>
                  <div className="space-y-2">
                    {pending.length === 0 && <div className="text-sm text-slate-500">Nothing pending.</div>}
                    {pending.map((l) => (
                      <div key={l.id} className="border border-gray-200 rounded-xl bg-white px-3 py-2">
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <b>#{l.id}</b> {l.employee_name} · {l.type} · {l.start_date}→{l.end_date}
                          </div>
                          <div className="flex gap-2">
                            <AButton variant="primary" onClick={() => act(l.id, "approve")}><Check size={14}/>Approve</AButton>
                            <AButton variant="danger" onClick={() => act(l.id, "reject")}><X size={14}/>Reject</AButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Timeline */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="font-medium mb-3">🗓️ Plan Timeline</div>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="text-center text-xs text-slate-400">
                  {new Date(0, i).toLocaleString(undefined, { month: "short" })}
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 rounded-full bg-blue-100 relative">
                <div className="absolute left-[8%] right-[40%] top-0 bottom-0 bg-blue-500 rounded-full"></div>
              </div>
              <div className="h-3 rounded-full bg-emerald-100 relative">
                <div className="absolute left-[45%] right-[6%] top-0 bottom-0 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </section>
        </div>

        {loading && <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />}
      </main>
    </div>
  );
}
