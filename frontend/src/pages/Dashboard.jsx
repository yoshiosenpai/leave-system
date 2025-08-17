// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  allLeaves,
  approve,
  createLeave,
  metrics,
  myLeaves,
  reject,
  // NEW:
  updateLeave,
  deleteLeave,
  registerEmployee,
  updateProfile,
  changePassword,
} from "../api";
import { useAuth } from "../auth";
import {
  CalendarIcon,
  Check,
  Loader2,
  X,
  LogOut as LogoutIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  UserRound,
  ShieldCheck,
  PencilLine,
  Trash2,
  Bell,
  UserPlus2,
  UserCircle2,
} from "lucide-react";

/* --------------------------------- Helpers -------------------------------- */
// tiny classnames
const cls = (...p) => p.filter(Boolean).join(" ");

function formatISO(d) {
  return new Date(d).toISOString().slice(0, 10);
}
function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}
function within(date, s, e) {
  const t = new Date(date).getTime();
  return t >= s.getTime() && t <= e.getTime();
}

/* -------------------------- Reusable/Atomic pieces ------------------------- */

function AButton({
  variant = "primary",
  className = "",
  loading = false,
  children,
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60";
  const theme =
    variant === "primary"
      ? "bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:from-sky-500 hover:to-blue-600 hover:shadow-md"
      : variant === "danger"
      ? "bg-rose-500 text-white hover:shadow-md"
      : "bg-white border border-gray-200 hover:shadow-sm";
  return (
    <button className={cls(base, theme, className)} disabled={loading} {...rest}>
      {loading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      <div className="text-xs text-gray-400 mt-1">updated just now</div>
    </div>
  );
}

function Section({ title, right, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-slate-400" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ----------------------------- Calendar (mini) ----------------------------- */

function CalendarMini({ items = [], onDateClick }) {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const today = d.getDate();
  const first = new Date(y, m, 1).getDay(); // 0 = Sun
  const days = new Date(y, m + 1, 0).getDate();

  const cells = Array.from({ length: first }, () => null).concat(
    Array.from({ length: days }, (_, i) => i + 1)
  );

  const marked = new Set();
  items.forEach((l) => {
    const s = new Date(l.start_date);
    const e = new Date(l.end_date);
    for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
      if (dt.getMonth() === m && dt.getFullYear() === y)
        marked.add(dt.getDate());
    }
  });

  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Calendar</h3>
        <span className="text-xs text-gray-500">
          {new Date(y, m, 1).toLocaleString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500">
        {dows.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((v, i) => {
          const clickable = v !== null;
          const date = clickable ? new Date(y, m, v) : null;
        return (
          <button
            key={i}
            disabled={!clickable}
            onClick={() => clickable && onDateClick?.(date)}
            className={cls(
              "h-10 rounded-lg flex items-center justify-center border text-sm",
              !clickable
                ? "border-transparent cursor-default"
                : "bg-white hover:bg-sky-50 border-gray-200",
              v === today && "ring-2 ring-sky-300",
              v && marked.has(v) && "bg-sky-50 border-sky-200"
            )}
          >
            {v ?? ""}
          </button>
        )})}
      </div>
    </div>
  );
}

/* --------------------------- Calendar Overview UI -------------------------- */

function CalendarOverviewModal({
  open,
  onClose,
  monthDate,
  setMonthDate,
  rows,
  onDayClick,
}) {
  if (!open) return null;

  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: first }, () => null).concat(
    Array.from({ length: days }, (_, i) => i + 1)
  );
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <CalendarIcon size={18} />
              Team Leave Overview
            </div>
            <div className="flex items-center gap-2">
              <AButton
                variant="ghost"
                className="!px-2"
                onClick={() =>
                  setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
              >
                <ChevronLeft size={18} />
              </AButton>
              <div className="text-sm text-gray-600 min-w-[120px] text-center">
                {monthDate.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <AButton
                variant="ghost"
                className="!px-2"
                onClick={() =>
                  setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
              >
                <ChevronRight size={18} />
              </AButton>
              <AButton variant="ghost" className="!px-2" onClick={onClose}>
                <X size={18} />
              </AButton>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500">
              {dows.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {cells.map((v, i) => {
                const date = v ? new Date(y, m, v) : null;
                const count = v
                  ? rows.filter((r) =>
                      within(
                        date,
                        new Date(r.start_date),
                        new Date(r.end_date)
                      )
                    ).length
                  : 0;
                return (
                  <button
                    key={i}
                    disabled={!v}
                    onClick={() => v && onDayClick?.(date)}
                    className={cls(
                      "h-16 rounded-lg flex flex-col items-center justify-center border text-sm relative",
                      v ? "bg-white hover:bg-sky-50 border-gray-200" : "border-transparent cursor-default"
                    )}
                  >
                    {v ?? ""}
                    {count > 0 && (
                      <span className="absolute bottom-1 text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-sky-100 border border-sky-200" />
                Day(s) with leave
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Small popups ----------------------------- */

function ModalShell({ open, title, icon, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              {icon}
              {title}
            </div>
            <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer && <div className="px-5 py-4 border-t">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export default function Dashboard() {
  const { token, user, logout } = useAuth();

  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState([]);
  const [stat, setStat] = useState({});
  const [loading, setLoading] = useState(false);

  const todayStr = formatISO(new Date());
  const [mode, setMode] = useState("single");
  const [form, setForm] = useState({
    startDate: todayStr,
    endDate: todayStr,
    type: "ANNUAL",
    reason: "",
  });

  // Calendar overview modal state
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewMonth, setOverviewMonth] = useState(startOfMonth(new Date()));
  const [overviewRows, setOverviewRows] = useState([]);
  const [overviewForDay, setOverviewForDay] = useState(null); // selected date

  // Popups: Notifications, Register Employee, Profile
  const [notifOpen, setNotifOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Edit/Delete state
  const [editOpen, setEditOpen] = useState(false);
  const [editLeave, setEditLeave] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const kpis = useMemo(
    () => [
      { title: "My Leaves", value: mine.length },
      ...(user?.role === "ADMIN"
        ? [
            { title: "Pending", value: Number(stat.pending || 0) },
            { title: "Approved", value: Number(stat.approved || 0) },
          ]
        : []),
    ],
    [mine, stat, user]
  );

  async function refresh() {
    try {
      setLoading(true);
      const [my, pend, met] = await Promise.all([
        myLeaves(token),
        user?.role === "ADMIN"
          ? allLeaves(token, { status: "PENDING" })
          : Promise.resolve([]),
        user?.role === "ADMIN" ? metrics(token) : Promise.resolve({}),
      ]);
      setMine(my || []);
      setPending(pend || []);
      setStat(met || {});
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    if (token) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load overview data for a month (with fallback filter)
  async function loadOverviewForMonth(d) {
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const s = startOfMonth(d);
    const e = endOfMonth(d);

    try {
      setLoading(true);
      let rows = await allLeaves(token, { month: ym });
      if (!Array.isArray(rows) || rows.length === 0) {
        const any = await allLeaves(token, { status: "ANY" }).catch(() => []);
        rows = (any || []).filter(
          (r) => !(new Date(r.end_date) < s || new Date(r.start_date) > e)
        );
      }
      setOverviewRows(rows || []);
    } catch (e) {
      console.error(e);
      setOverviewRows([]);
    } finally {
      setLoading(false);
    }
  }

  // When month changes in modal
  useEffect(() => {
    if (overviewOpen) loadOverviewForMonth(overviewMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewOpen, overviewMonth]);

  async function submitLeave(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...form };
      if (mode === "single") payload.endDate = payload.startDate;
      const r = await createLeave(token, payload);
      if (r?.id) {
        setForm((f) => ({ ...f, reason: "" }));
        await refresh();
      } else {
        alert("Failed to create leave.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function act(id, type) {
    try {
      setLoading(true);
      if (type === "approve") await approve(token, id, "Approved");
      else await reject(token, id, "Rejected");
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  // Save edit
  async function saveEdit() {
    if (!editLeave) return;
    try {
      setLoading(true);
      await updateLeave(token, editLeave.id, {
        startDate: editLeave.start_date.slice(0,10),
        endDate: editLeave.end_date.slice(0,10),
        type: editLeave.type,
        reason: editLeave.reason || "",
      });
      setEditOpen(false);
      setEditLeave(null);
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  // Delete leave
  async function doDeleteLeave() {
    if (!confirmDelete) return;
    try {
      setLoading(true);
      await deleteLeave(token, confirmDelete.id);
      setConfirmDelete(null);
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  /* --------------------------------- Render -------------------------------- */

  return (
    <div className="relative min-h-screen flex bg-[#f7f9fc]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-200 bg-gradient-to-b from-sky-50 to-white">
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 grid place-items-center">
            <ShieldCheck className="text-sky-500" size={18} />
          </div>
          <div>
            <div className="text-sm text-gray-500">Welcome</div>
            <div className="font-semibold leading-tight">
              {user?.name || "Employee"}
            </div>
            <div className="text-xs text-gray-400">
              ID: {user?.id ?? "-"} • {user?.role ?? "-"}
            </div>
          </div>
        </div>

        <nav className="mt-3 px-2 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sky-50 text-slate-700"
          >
            📊 <span>Dashboard</span>
          </Link>

          <button
            onClick={() => setNotifOpen(true)}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sky-50 text-slate-700"
          >
            <Bell size={16} /> <span>Notifications</span>
          </button>

          <button
            onClick={() => setRegisterOpen(true)}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sky-50 text-slate-700"
          >
            <UserPlus2 size={16} /> <span>Register Employee</span>
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 relative">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                <Search size={16} className="text-gray-400" />
                <input
                  className="w-full outline-none text-sm bg-transparent"
                  placeholder="Search…"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AButton
                variant="ghost"
                className="bg-white border border-gray-200"
                onClick={() => setProfileOpen(true)}
              >
                <UserCircle2 size={16} />
                My Profile
              </AButton>
              <AButton
                variant="ghost"
                className="bg-white border border-gray-200"
                onClick={logout}
              >
                <LogoutIcon size={16} />
                Logout
              </AButton>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Plan Timeline (TOP) */}
          <Section
            title="Plan Timeline"
            right={
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                  Company Plan
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                  My Leaves
                </div>
              </div>
            }
          >
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-blue-100" />
              <div className="h-2 rounded-full bg-emerald-200" style={{ width: "85%" }} />
            </div>
          </Section>

          {/* KPIs */}
          <div className="grid md:grid-cols-3 gap-4">
            {kpis.map((k) => (
              <StatCard key={k.title} title={k.title} value={k.value} />
            ))}
          </div>

          {/* Apply Leave + Calendar */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Apply Leave form (span 2) */}
            <div className="lg:col-span-2 space-y-6">
              <Section
                title="Apply Leave"
                right={
                  <div className="flex gap-2">
                    <AButton
                      variant={mode === "single" ? "primary" : "ghost"}
                      onClick={() => setMode("single")}
                    >
                      Single Day
                    </AButton>
                    <AButton
                      variant={mode === "range" ? "primary" : "ghost"}
                      onClick={() => setMode("range")}
                    >
                      Range
                    </AButton>
                  </div>
                }
              >
                <form onSubmit={submitLeave} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Start date</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, startDate: e.target.value }))
                        }
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        End date {mode === "single" && "(auto = start)"}
                      </label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, endDate: e.target.value }))
                        }
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 disabled:opacity-70"
                        required
                        disabled={mode === "single"}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Type</label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, type: e.target.value }))
                        }
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                      >
                        <option>ANNUAL</option>
                        <option>SICK</option>
                        <option>UNPAID</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Reason</label>
                      <input
                        value={form.reason}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, reason: e.target.value }))
                        }
                        placeholder="Optional"
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AButton type="submit" loading={loading}>
                      <Check size={16} />
                      Submit
                    </AButton>
                    <AButton variant="ghost" onClick={refresh} loading={loading}>
                      Refresh
                    </AButton>
                  </div>
                </form>
              </Section>

              {/* My Leaves */}
              <Section title="My Leaves">
                <div className="space-y-3">
                  {mine.length === 0 && (
                    <div className="text-sm text-gray-500">No leaves yet.</div>
                  )}
                  {mine.map((l) => (
                    <div
                      key={l.id}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between"
                    >
                      <div className="text-sm">
                        <b>{l.type}</b> · {l.start_date} → {l.end_date}
                        <div className="text-xs text-gray-500">
                          Status: {l.status}
                          {l.manager_comment ? ` · ${l.manager_comment}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AButton
                          variant="ghost"
                          onClick={() => {
                            setEditLeave({
                              ...l,
                              reason: l.reason || "",
                            });
                            setEditOpen(true);
                          }}
                        >
                          <PencilLine size={16} /> Edit
                        </AButton>
                        <AButton
                          variant="danger"
                          onClick={() => setConfirmDelete(l)}
                        >
                          <Trash2 size={16} /> Delete
                        </AButton>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Right column: Calendar + Pending approvals */}
            <div className="space-y-6">
              <Section
                title="Calendar"
                right={
                  <AButton variant="ghost" onClick={() => setOverviewOpen(true)}>
                    Team Overview
                  </AButton>
                }
              >
                <CalendarMini
                  items={mine}
                  onDateClick={(date) => {
                    // open popover for that day using overview state
                    setOverviewForDay(date);
                    setOverviewOpen(true);
                    // ensure month data is loaded if month changed
                    const m0 = new Date(date.getFullYear(), date.getMonth(), 1);
                    setOverviewMonth(m0);
                  }}
                />
              </Section>

              {user?.role === "ADMIN" && (
                <Section
                  title="Pending Approvals"
                  right={
                    <span className="text-xs text-gray-500">
                      {pending.length} pending
                    </span>
                  }
                >
                  <div className="space-y-3">
                    {pending.length === 0 && (
                      <div className="text-sm text-gray-500">Nothing pending.</div>
                    )}
                    {pending.map((l) => (
                      <div
                        key={l.id}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between"
                      >
                        <div className="text-sm">
                          <b>#{l.id}</b> {l.employee_name} · {l.type} ·{" "}
                          {l.start_date} → {l.end_date}
                        </div>
                        <div className="flex items-center gap-2">
                          <AButton onClick={() => act(l.id, "approve")}>
                            <Check size={16} /> Approve
                          </AButton>
                          <AButton
                            variant="danger"
                            onClick={() => act(l.id, "reject")}
                          >
                            <X size={16} /> Reject
                          </AButton>
                          <AButton
                            variant="ghost"
                            onClick={() => {
                              setEditLeave({
                                ...l,
                                reason: l.reason || "",
                              });
                              setEditOpen(true);
                            }}
                          >
                            <PencilLine size={16} /> Edit
                          </AButton>
                          <AButton
                            variant="danger"
                            onClick={() => setConfirmDelete(l)}
                          >
                            <Trash2 size={16} /> Delete
                          </AButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Full-page loading overlay (covers topbar/side) */}
      {loading && (
        <>
          <div className="fixed inset-0 z-40 bg-white/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 grid place-items-center pointer-events-none">
            <div className="flex items-center gap-3 text-slate-700">
              <Loader2 className="animate-spin" size={28} />
              <span className="font-medium">Working…</span>
            </div>
          </div>
        </>
      )}

      {/* Calendar Overview Modal */}
      <CalendarOverviewModal
        open={overviewOpen}
        onClose={() => {
          setOverviewOpen(false);
          setOverviewForDay(null);
        }}
        monthDate={overviewMonth}
        setMonthDate={setOverviewMonth}
        rows={overviewRows}
        onDayClick={(date) => {
          setOverviewForDay(date);
        }}
      />

      {/* Day popover (bottom-right) */}
      {overviewOpen && overviewForDay && (
        <div className="fixed bottom-5 right-5 z-50 w-[380px] bg-white rounded-xl shadow-xl border border-gray-200">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">
              {overviewForDay.toLocaleDateString()}
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setOverviewForDay(null)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-3 space-y-2 max-h-[300px] overflow-auto">
            {overviewRows
              .filter((r) =>
                within(
                  overviewForDay,
                  new Date(r.start_date),
                  new Date(r.end_date)
                )
              )
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 text-sm bg-sky-50 border border-sky-200 rounded-lg px-2 py-1"
                >
                  <UserRound className="text-sky-600" size={16} />
                  <div className="truncate">
                    <b>{r.employee_name ?? `#${r.employee_id ?? r.id}`}</b> —{" "}
                    <span className="uppercase">{r.type}</span>{" "}
                    <span className="text-gray-500">
                      ({r.start_date} → {r.end_date})
                    </span>
                  </div>
                </div>
              ))}
            {overviewRows.filter((r) =>
              within(
                overviewForDay,
                new Date(r.start_date),
                new Date(r.end_date)
              )
            ).length === 0 && (
              <div className="text-xs text-gray-500">No one on leave.</div>
            )}
          </div>
        </div>
      )}

      {/* Notifications modal */}
      <ModalShell
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Notifications"
        icon={<Bell size={18} />}
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-600">No new notifications.</div>
          {/* Example static items — wire up to your API */}
          {/* <div className="text-sm">Siti requested leave…</div> */}
        </div>
      </ModalShell>

      {/* Register Employee modal */}
      <RegisterEmployeeModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSubmit={async (payload) => {
          try {
            setLoading(true);
            await registerEmployee(token, payload);
            setRegisterOpen(false);
          } finally {
            setLoading(false);
          }
        }}
      />

      {/* Profile modal */}
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        onSaveProfile={async (payload) => {
          try {
            setLoading(true);
            await updateProfile(token, payload);
            setProfileOpen(false);
          } finally {
            setLoading(false);
          }
        }}
        onChangePassword={async (payload) => {
          try {
            setLoading(true);
            await changePassword(token, payload);
            setProfileOpen(false);
          } finally {
            setLoading(false);
          }
        }}
      />

      {/* Edit Leave modal */}
      <ModalShell
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Leave"
        icon={<PencilLine size={18} />}
        footer={
          <div className="flex justify-end gap-2">
            <AButton variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </AButton>
            <AButton onClick={saveEdit} loading={loading}>
              Save
            </AButton>
          </div>
        }
      >
        {editLeave && (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Start</label>
                <input
                  type="date"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={editLeave.start_date.slice(0,10)}
                  onChange={(e) =>
                    setEditLeave((v) => ({ ...v, start_date: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">End</label>
                <input
                  type="date"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={editLeave.end_date.slice(0,10)}
                  onChange={(e) =>
                    setEditLeave((v) => ({ ...v, end_date: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Type</label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={editLeave.type}
                  onChange={(e) =>
                    setEditLeave((v) => ({ ...v, type: e.target.value }))
                  }
                >
                  <option>ANNUAL</option>
                  <option>SICK</option>
                  <option>UNPAID</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Reason</label>
                <input
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  value={editLeave.reason || ""}
                  onChange={(e) =>
                    setEditLeave((v) => ({ ...v, reason: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        )}
      </ModalShell>

      {/* Delete confirm */}
      <ModalShell
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Leave?"
        icon={<Trash2 size={18} />}
        footer={
          <div className="flex justify-end gap-2">
            <AButton variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </AButton>
            <AButton variant="danger" onClick={doDeleteLeave} loading={loading}>
              Delete
            </AButton>
          </div>
        }
      >
        <div className="text-sm text-gray-600">
          Are you sure you want to delete leave{" "}
          <b>#{confirmDelete?.id}</b> ({confirmDelete?.start_date} →{" "}
          {confirmDelete?.end_date})?
        </div>
      </ModalShell>
    </div>
  );
}

/* ------------ Register / Profile modals (simple examples) --------------- */

function RegisterEmployeeModal({ open, onClose, onSubmit }) {
  const [p, setP] = useState({
    name: "",
    email: "",
    role: "EMPLOYEE",
    password: "",
  });
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Register Employee"
      icon={<UserPlus2 size={18} />}
      footer={
        <div className="flex justify-end gap-2">
          <AButton variant="ghost" onClick={onClose}>Cancel</AButton>
          <AButton onClick={() => onSubmit(p)}>Create</AButton>
        </div>
      }
    >
      <div className="grid gap-3">
        <div>
          <label className="text-xs text-gray-500">Name</label>
          <input
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
            value={p.name}
            onChange={(e) => setP((v) => ({ ...v, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Email</label>
          <input
            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
            value={p.email}
            onChange={(e) => setP((v) => ({ ...v, email: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Role</label>
            <select
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
              value={p.role}
              onChange={(e) => setP((v) => ({ ...v, role: e.target.value }))}
            >
              <option>EMPLOYEE</option>
              <option>ADMIN</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Temp Password</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
              value={p.password}
              onChange={(e) => setP((v) => ({ ...v, password: e.target.value }))}
              type="password"
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function ProfileModal({ open, onClose, user, onSaveProfile, onChangePassword }) {
  const [photo, setPhoto] = useState(null); // base64 preview
  const [info, setInfo] = useState({ name: user?.name || "", email: user?.email || "" });
  const [pass, setPass] = useState({ current: "", new: "" });

  useEffect(() => {
    setInfo({ name: user?.name || "", email: user?.email || "" });
  }, [user]);

  function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(f);
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="My Profile"
      icon={<UserCircle2 size={18} />}
    >
      <div className="grid gap-6">
        <div className="flex items-center gap-4">
          <img
            src={photo || "https://i.pravatar.cc/80"}
            alt="avatar"
            className="w-16 h-16 rounded-full border"
          />
          <div>
            <input type="file" accept="image/*" onChange={onPick} />
            <div className="text-xs text-gray-500">Change profile photo</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Name</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
              value={info.name}
              onChange={(e) => setInfo((v) => ({ ...v, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <input
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
              value={info.email}
              onChange={(e) => setInfo((v) => ({ ...v, email: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <AButton onClick={() => onSaveProfile({ ...info, photo })}>Save Profile</AButton>
        </div>

        <hr className="border-gray-200" />

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Current Password</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
              value={pass.current}
              onChange={(e) => setPass((v) => ({ ...v, current: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">New Password</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-white"
              value={pass.new}
              onChange={(e) => setPass((v) => ({ ...v, new: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <AButton onClick={() => onChangePassword(pass)}>Change Password</AButton>
        </div>
      </div>
    </ModalShell>
  );
}
