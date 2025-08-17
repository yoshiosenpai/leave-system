import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth";
import { myLeaves, allLeaves, createLeave, approve, reject, metrics } from "../api";
import {
  LayoutDashboard,
  ClipboardList,
  UserPlus,
  RefreshCcw,
  Check,
  X,
  Search,
  LogOut,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

/* ---------------- helpers ---------------- */
function cls(...xs) { return xs.filter(Boolean).join(" "); }
function useToday() { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth(), dnum: d.getDate() }; }
const avatarFrom = (seed) => `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(seed || "user")}`;
function monthLabel(y, m) { return new Date(y, m, 1).toLocaleString(undefined, { month: "long", year: "numeric" }); }
function shiftMonth(y, m, delta) {
  const d = new Date(y, m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

/* ---------------- shared button ---------------- */
function AButton({ variant = "primary", className = "", children, ...rest }) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-[1.02] active:scale-[0.98]";
  const theme =
    variant === "primary"
      ? "bg-lightblue-600 text-white hover:shadow-md"
      : variant === "danger"
      ? "bg-rose-500 text-white hover:shadow-md"
      : "bg-white border border-gray-200 hover:shadow-sm";
  return (
    <button className={cls(base, theme, className)} {...rest}>
      {children}
    </button>
  );
}

/* ---------------- Modal ---------------- */
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="font-medium">{title}</div>
          <button className="text-slate-500 hover:text-slate-700" onClick={onClose}>✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ onGotoTop, onGotoMine, onGotoRegister }) {
  const { user } = useAuth();
  const avatar = avatarFrom(user?.email || user?.name);

  return (
    <aside className="w-68 shrink-0 h-screen sticky top-0 overflow-y-auto soft-panel p-5">
      {/* Profile */}
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
        <NavItem icon={LayoutDashboard} label="Dashboard" onClick={onGotoTop} />
        <NavItem icon={ClipboardList} label="My Leaves" onClick={onGotoMine} />
        {user?.role === "ADMIN" && (
          <NavItem icon={UserPlus} label="Register" onClick={onGotoRegister} />
        )}
      </nav>

      <div className="mt-8 text-[12px] text-slate-500">v1 • {user?.role}</div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, onClick }) {
  return (
    <button
      className={cls(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] text-left",
        "hover:bg-white/70 text-slate-700"
      )}
      onClick={onClick}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

/* ---------------- Topbar ---------------- */
function Topbar() {
  const { logout, user } = useAuth();
  const avatar = avatarFrom(user?.email || user?.name);

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

/* ---------------- Company Calendar with month nav ---------------- */
function CompanyCalendar({ y, m, monthLeaves, onPrev, onNext, onDayClick }) {
  const today = useToday();
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
        <div className="flex items-center gap-1">
          <AButton variant="ghost" className="!px-2 border" onClick={onPrev} aria-label="Previous month">
            <ChevronLeft size={18} />
          </AButton>
          <span className="text-xs text-slate-500 flex items-center gap-1 min-w-[140px] justify-center">
            <CalendarDays size={14} />
            {monthLabel(y, m)}
          </span>
          <AButton variant="ghost" className="!px-2 border" onClick={onNext} aria-label="Next month">
            <ChevronRight size={18} />
          </AButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[12px] text-slate-500 mb-1">
        {dows.map((x) => (
          <div key={x} className="text-center py-1">{x}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((v, idx) => {
          const list = v ? (monthLeaves[v] || []) : [];
          const isToday = v && y === today.y && m === today.m && v === today.dnum;
          return (
            <button
              key={idx}
              className={cls(
                "min-h-[46px] rounded-lg border border-gray-200 bg-white px-1 pt-1 text-left",
                "transition-colors hover:bg-blue-50",
                isToday && "ring-2 ring-blue-400"
              )}
              onClick={() => v && onDayClick(v, list)}
              disabled={!v}
              title={list.length ? `${list.length} on leave` : ""}
            >
              <div className="text-center text-sm">{v ?? ""}</div>
              {v && list.length > 0 && (
                <div className="flex -space-x-2 mt-1 pl-1">
                  {list.slice(0, 3).map((p, i) => (
                    <img key={i} src={p.avatar} className="h-5 w-5 rounded-full border border-white" alt="" />
                  ))}
                  {list.length > 3 && (
                    <div className="h-5 px-2 rounded-full bg-blue-100 text-blue-700 text-[10px] grid place-items-center border border-white">
                      +{list.length - 3}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
export default function Dashboard() {
  const { token, user } = useAuth();

  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [stat, setStat] = useState({});
  const [loading, setLoading] = useState(false);

  // Month navigation state (defaults to current month)
  const { y: ty, m: tm } = useToday();
  const [viewYear, setViewYear] = useState(ty);
  const [viewMonth, setViewMonth] = useState(tm);

  // We cache all approved leaves once; then filter per month quickly on the client
  const [approvedAll, setApprovedAll] = useState([]);
  const [approvedMonthMap, setApprovedMonthMap] = useState({}); // {day: [{name, avatar, type}]}

  // Modal state for day details
  const [dayModal, setDayModal] = useState({ open: false, day: null, list: [] });

  // refs for in-page navigation
  const topRef = useRef(null);
  const myLeavesRef = useRef(null);
  const registerRef = useRef(null);

  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState("single");
  const [form, setForm] = useState({ startDate: today, endDate: today, type: "ANNUAL", reason: "" });

  function onDayClick(day, list) {
    setDayModal({ open: true, day, list });
  }

  // Build map for a given y/m from a list of approved leaves
  function buildMonthMap(list, y, m) {
    const map = {};
    list.forEach((l) => {
      const s = new Date(l.start_date);
      const e = new Date(l.end_date);
      for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
        if (dt.getMonth() === m && dt.getFullYear() === y) {
          const d = dt.getDate();
          map[d] ||= [];
          map[d].push({
            name: l.employee_name || l.employee || l.email || "Employee",
            avatar: avatarFrom(l.employee_name || l.employee || l.email),
            type: l.type
          });
        }
      }
    });
    return map;
  }

  async function refresh() {
    setLoading(true);
    try {
      const mineRes = await myLeaves(token);
      setMine(mineRes);

      // Pull all approved once
      const approved = await allLeaves(token, { status: "APPROVED" });
      setApprovedAll(approved);

      if (user?.role === "ADMIN") {
        const [pend, stats] = await Promise.all([
          allLeaves(token, { status: "PENDING" }),
          metrics(token),
        ]);
        setPending(pend);
        setStat(stats);
      } else {
        setPending([]);
        setStat({});
      }
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => { if (token) refresh(); /* eslint-disable-line */ }, [token]);

  // Recompute the month map whenever approvedAll or (viewYear, viewMonth) changes
  useEffect(() => {
    setApprovedMonthMap(buildMonthMap(approvedAll, viewYear, viewMonth));
  }, [approvedAll, viewYear, viewMonth]);

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

  const gotoPrevMonth = () => {
    const { y, m } = shiftMonth(viewYear, viewMonth, -1);
    setViewYear(y); setViewMonth(m);
  };
  const gotoNextMonth = () => {
    const { y, m } = shiftMonth(viewYear, viewMonth, 1);
    setViewYear(y); setViewMonth(m);
  };

  return (
    <div className="flex bg-[#f7f9fc] min-h-screen text-slate-800">
      {/* Sidebar with working navigation */}
      <Sidebar
        onGotoTop={() => topRef.current?.scrollIntoView({ behavior: "smooth" })}
        onGotoMine={() => myLeavesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        onGotoRegister={() => registerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />

      {/* Right/content */}
      <main className="flex-1">
        <Topbar />

        <div ref={topRef} className="px-6 py-6 space-y-6">
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

          {/* ---- Plan Timeline + legend (top) ---- */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">🗓️ Plan Timeline</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2.5 w-6 rounded-full bg-blue-500"></span> Blue: Product roadmap
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2.5 w-6 rounded-full bg-emerald-500"></span> Green: HR / Ops
                </span>
              </div>
            </div>
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

          {/* Apply + Calendar Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            {/* Apply form + My Leaves */}
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

              {/* Leave Applications */}
              <div ref={myLeavesRef} className="mt-6">
                <div className="font-medium mb-3">📋 Leave Application</div>
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

            {/* Right column: Overview + Pending */}
            <section className="space-y-6">
              <CompanyCalendar
                y={viewYear}
                m={viewMonth}
                monthLeaves={approvedMonthMap}
                onPrev={gotoPrevMonth}
                onNext={gotoNextMonth}
                onDayClick={onDayClick}
              />

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

          {/* Admin: Register panel (anchor for sidebar). Hook it to your real API when ready */}
          {user?.role === "ADMIN" && (
            <section ref={registerRef} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="font-medium mb-3">👤 Register Employee</div>
              <p className="text-sm text-slate-500 mb-3">
                This is a placeholder form to wire up to your admin API.
              </p>
              <form
                className="grid md:grid-cols-2 gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const data = Object.fromEntries(fd.entries());
                  console.log("Register payload:", data);
                  alert("Registration form submitted (demo). Wire this to your admin API.");
                }}
              >
                <input name="name" placeholder="Full name" className="px-3 py-2 border border-gray-200 rounded-lg" />
                <input name="email" placeholder="Email" className="px-3 py-2 border border-gray-200 rounded-lg" />
                <select name="role" className="px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <input name="password" type="password" placeholder="Temp password" className="px-3 py-2 border border-gray-200 rounded-lg" />
                <div className="col-span-full">
                  <AButton type="submit"><UserPlus size={16}/> Create</AButton>
                </div>
              </form>
            </section>
          )}

        </div>

        {loading && <div className="fixed inset-0 bg-black/10 backdrop-blur-sm" />}
      </main>

      {/* Day details modal */}
      <Modal
        open={dayModal.open}
        title={
          `Leave on ${dayModal.day ?? ""} ${monthLabel(viewYear, viewMonth)}`
        }
        onClose={() => setDayModal({ open: false, day: null, list: [] })}
      >
        {dayModal.list.length === 0 ? (
          <div className="text-sm text-slate-600">No one is on leave this day.</div>
        ) : (
          <div className="space-y-3">
            {dayModal.list.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <img src={p.avatar} className="h-8 w-8 rounded-full border border-gray-200" alt="" />
                <div className="text-sm">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
