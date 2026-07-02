import {
  Bell,
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  LogIn,
  LogOut,
  RefreshCcw,
  Send,
  ShieldCheck,
  UserRoundCog,
  XCircle
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiClient,
  AuthResponse,
  Club,
  ExportRequest,
  NotificationItem,
  Report,
  ReportStatus,
  ReportSummary
} from "./api";

type View = "dashboard" | "reports" | "clubs" | "exports" | "notifications";

const statusTone: Record<ReportStatus, string> = {
  Draft: "neutral",
  Submitted: "info",
  "Under Review": "warning",
  Approved: "success",
  Rejected: "danger"
};

export default function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(() => {
    const raw = localStorage.getItem("clubreport.auth");
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  });
  const [view, setView] = useState<View>("dashboard");
  const [username, setUsername] = useState("admin@club.local");
  const [password, setPassword] = useState("Admin@12345");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [exportsList, setExportsList] = useState<ExportRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftFeedback, setDraftFeedback] = useState("Please add clearer evidence and resubmit.");

  const api = useMemo(() => new ApiClient(auth?.accessToken), [auth?.accessToken]);
  const isAdmin = auth?.user.roles.includes("ADMIN") ?? false;

  useEffect(() => {
    if (!auth) return;

    let cancelled = false;
    setBusy(true);
    setError(null);
    loadAll(new ApiClient(auth.accessToken), auth.user)
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Cannot load dashboard data.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [auth?.accessToken]);

  async function loadAll(client: ApiClient, user: AuthResponse["user"]) {
    const [clubRows, reportPage, reportSummary, exportPage, notificationRows] = await Promise.all([
      client.getClubs(),
      client.getReports(),
      client.getSummary(),
      client.getExports(),
      client.getNotifications(user)
    ]);
    setClubs(clubRows);
    setReports(reportPage.items);
    setSummary(reportSummary);
    setExportsList(exportPage.items);
    setNotifications(notificationRows);
  }

  async function refreshAll() {
    if (!auth) return;
    setBusy(true);
    setError(null);
    try {
      await loadAll(api, auth.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load dashboard data.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await new ApiClient().login(username, password);
      localStorage.setItem("clubreport.auth", JSON.stringify(result));
      setAuth(result);
      setView("dashboard");
      await loadAll(new ApiClient(result.accessToken), result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("clubreport.auth");
    setAuth(null);
    setReports([]);
    setClubs([]);
    setExportsList([]);
    setNotifications([]);
  }

  async function createDemoReport() {
    const club = clubs[0];
    if (!club) return;
    const existingPeriods = new Set(reports.filter((report) => report.clubId === club.id).map((report) => report.period));
    const nextPeriod = ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01"]
      .find((period) => !existingPeriods.has(period)) ?? `DEMO-${Date.now()}`;
    const dueDate = /^\d{4}-\d{2}$/.test(nextPeriod) ? `${nextPeriod}-25` : "2027-01-25";
    await runAction(async () => {
      await api.createReport({
        clubId: club.id,
        clubName: club.name,
        period: nextPeriod,
        dueDate,
        details: [
          {
            activityName: "Monthly club activity",
            activityDate: "2026-07-12",
            description: "Submitted through ClubReport Hub demo workflow.",
            participantCount: 32,
            outcome: "Activity evidence and participation data recorded."
          }
        ]
      });
    });
  }

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!auth) {
    return (
      <main className="login-shell">
        <section className="login-panel" aria-label="Login">
          <div className="brand-mark">
            <Building2 size={28} aria-hidden />
          </div>
          <h1>ClubReport Hub</h1>
          <p>Centralized club reporting and approval workspace.</p>
          <form onSubmit={handleLogin} className="login-form">
            <label>
              Username
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </label>
            <label>
              Password
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
            </label>
            {error && <div className="alert">{error}</div>}
            <button className="primary" type="submit" disabled={busy}>
              <LogIn size={18} aria-hidden />
              Sign in
            </button>
          </form>
          <div className="demo-row">
            <button type="button" onClick={() => { setUsername("admin@club.local"); setPassword("Admin@12345"); }}>
              <ShieldCheck size={16} aria-hidden />
              Admin
            </button>
            <button type="button" onClick={() => { setUsername("manager@club.local"); setPassword("Manager@12345"); }}>
              <UserRoundCog size={16} aria-hidden />
              Manager
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <Building2 size={26} aria-hidden />
          <div>
            <strong>ClubReport</strong>
            <span>Hub</span>
          </div>
        </div>
        <nav aria-label="Primary">
          <NavButton icon={<Gauge />} label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
          <NavButton icon={<FileText />} label="Reports" active={view === "reports"} onClick={() => setView("reports")} />
          <NavButton icon={<Building2 />} label="Clubs" active={view === "clubs"} onClick={() => setView("clubs")} />
          <NavButton icon={<FileSpreadsheet />} label="Exports" active={view === "exports"} onClick={() => setView("exports")} />
          <NavButton icon={<Bell />} label="Notifications" active={view === "notifications"} onClick={() => setView("notifications")} />
        </nav>
        <button className="ghost logout" type="button" onClick={logout}>
          <LogOut size={18} aria-hidden />
          Sign out
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>{viewLabel(view)}</h1>
            <p>{auth.user.fullName} · {auth.user.roles.join(", ")}</p>
          </div>
          <button className="secondary" type="button" onClick={refreshAll} disabled={busy} title="Refresh dashboard data">
            <RefreshCcw size={18} aria-hidden />
            Refresh
          </button>
        </header>

        {error && <div className="alert">{error}</div>}
        {view === "dashboard" && <Dashboard summary={summary} reports={reports} notifications={notifications} />}
        {view === "reports" && (
          <ReportsView
            reports={reports}
            isAdmin={isAdmin}
            busy={busy}
            feedback={draftFeedback}
            setFeedback={setDraftFeedback}
            createDemoReport={createDemoReport}
            submit={(id) => runAction(() => api.submitReport(id).then(() => undefined))}
            review={(id) => runAction(() => api.reviewReport(id).then(() => undefined))}
            approve={(id) => runAction(() => api.approveReport(id).then(() => undefined))}
            reject={(id) => runAction(() => api.rejectReport(id, draftFeedback).then(() => undefined))}
          />
        )}
        {view === "clubs" && <ClubsView clubs={clubs} />}
        {view === "exports" && (
          <ExportsView
            exportsList={exportsList}
            busy={busy}
            createExport={(type) => runAction(() => api.createExport(type, "Consolidated", "2026-07").then(() => undefined))}
          />
        )}
        {view === "notifications" && (
          <NotificationsView
            notifications={notifications}
            markRead={(id) => runAction(() => api.markNotificationRead(id))}
          />
        )}
      </main>
    </div>
  );
}

function Dashboard({ summary, reports, notifications }: { summary: ReportSummary | null; reports: Report[]; notifications: NotificationItem[] }) {
  const stats = [
    ["Total", summary?.total ?? 0],
    ["Submitted", summary?.submitted ?? 0],
    ["Approved", summary?.approved ?? 0],
    ["Overdue", summary?.overdue ?? 0]
  ];
  return (
    <section className="grid">
      <div className="stat-band">
        {stats.map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <section className="panel">
        <h2>Recent Reports</h2>
        <ReportList reports={reports.slice(0, 6)} />
      </section>
      <section className="panel">
        <h2>Unread Signals</h2>
        <NotificationList notifications={notifications.filter((item) => !item.isRead).slice(0, 6)} />
      </section>
    </section>
  );
}

function ReportsView(props: {
  reports: Report[];
  isAdmin: boolean;
  busy: boolean;
  feedback: string;
  setFeedback: (value: string) => void;
  createDemoReport: () => void;
  submit: (id: number) => void;
  review: (id: number) => void;
  approve: (id: number) => void;
  reject: (id: number) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Report Workflow</h2>
        <button className="primary" type="button" onClick={props.createDemoReport} disabled={props.busy} title="Create a demo draft report">
          <FileText size={18} aria-hidden />
          New report
        </button>
      </div>
      <div className="feedback-row">
        <label>
          Rejection feedback
          <input value={props.feedback} onChange={(event) => props.setFeedback(event.target.value)} />
        </label>
      </div>
      <div className="report-table" role="table" aria-label="Reports">
        <div className="table-row table-head" role="row">
          <span>Club</span>
          <span>Period</span>
          <span>Status</span>
          <span>Activities</span>
          <span>Actions</span>
        </div>
        {props.reports.map((report) => (
          <div className="table-row" role="row" key={report.id}>
            <span>{report.clubName}</span>
            <span>{report.period}</span>
            <span><StatusBadge status={report.status} /></span>
            <span>{report.details.length}</span>
            <span className="actions">
              {(report.status === "Draft" || report.status === "Rejected") && (
                <button type="button" onClick={() => props.submit(report.id)} title="Submit report">
                  <Send size={16} aria-hidden />
                </button>
              )}
              {props.isAdmin && report.status === "Submitted" && (
                <button type="button" onClick={() => props.review(report.id)} title="Mark under review">
                  <RefreshCcw size={16} aria-hidden />
                </button>
              )}
              {props.isAdmin && (report.status === "Submitted" || report.status === "Under Review") && (
                <>
                  <button type="button" onClick={() => props.approve(report.id)} title="Approve report">
                    <CheckCircle2 size={16} aria-hidden />
                  </button>
                  <button type="button" onClick={() => props.reject(report.id)} title="Reject report">
                    <XCircle size={16} aria-hidden />
                  </button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClubsView({ clubs }: { clubs: Club[] }) {
  return (
    <section className="list-grid">
      {clubs.map((club) => (
        <article className="item-card" key={club.id}>
          <div className="item-title">
            <strong>{club.name}</strong>
            <span>{club.code}</span>
          </div>
          <p>{club.description}</p>
          <dl>
            <div><dt>Email</dt><dd>{club.contactEmail}</dd></div>
            <div><dt>Phone</dt><dd>{club.contactPhone}</dd></div>
            <div><dt>Manager</dt><dd>{club.managers.find((manager) => manager.isActive)?.managerName ?? "Unassigned"}</dd></div>
          </dl>
        </article>
      ))}
    </section>
  );
}

function ExportsView({ exportsList, busy, createExport }: { exportsList: ExportRequest[]; busy: boolean; createExport: (type: "PDF" | "EXCEL") => void }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Export History</h2>
        <div className="split-actions">
          <button type="button" onClick={() => createExport("PDF")} disabled={busy} title="Create PDF export">
            <Download size={16} aria-hidden />
            PDF
          </button>
          <button type="button" onClick={() => createExport("EXCEL")} disabled={busy} title="Create Excel export">
            <FileSpreadsheet size={16} aria-hidden />
            Excel
          </button>
        </div>
      </div>
      <div className="report-table" role="table" aria-label="Exports">
        <div className="table-row table-head" role="row">
          <span>ID</span>
          <span>Type</span>
          <span>Scope</span>
          <span>Status</span>
          <span>File</span>
        </div>
        {exportsList.map((item) => (
          <div className="table-row" role="row" key={item.id}>
            <span>#{item.id}</span>
            <span>{item.exportType}</span>
            <span>{item.scope}</span>
            <span><span className={`badge ${item.status === "Completed" ? "success" : "info"}`}>{item.status}</span></span>
            <span>{item.file?.fileName ?? "Pending"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function NotificationsView({ notifications, markRead }: { notifications: NotificationItem[]; markRead: (id: number) => void }) {
  return (
    <section className="panel">
      <h2>Notifications</h2>
      <NotificationList notifications={notifications} markRead={markRead} />
    </section>
  );
}

function ReportList({ reports }: { reports: Report[] }) {
  if (reports.length === 0) return <p className="empty">No reports loaded.</p>;
  return (
    <div className="compact-list">
      {reports.map((report) => (
        <div key={report.id} className="compact-row">
          <div>
            <strong>{report.clubName}</strong>
            <span>{report.period} · v{report.version}</span>
          </div>
          <StatusBadge status={report.status} />
        </div>
      ))}
    </div>
  );
}

function NotificationList({ notifications, markRead }: { notifications: NotificationItem[]; markRead?: (id: number) => void }) {
  if (notifications.length === 0) return <p className="empty">No notifications.</p>;
  return (
    <div className="compact-list">
      {notifications.map((item) => (
        <div key={item.id} className={`compact-row ${item.isRead ? "muted" : ""}`}>
          <div>
            <strong>{item.title}</strong>
            <span>{item.message}</span>
          </div>
          {markRead && !item.isRead && (
            <button type="button" onClick={() => markRead(item.id)} title="Mark notification as read">
              <CheckCircle2 size={16} aria-hidden />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`badge ${statusTone[status]}`}>{status}</span>;
}

function NavButton({ icon, label, active, onClick }: { icon: JSX.Element; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? "nav active" : "nav"} type="button" onClick={onClick} title={label}>
      {icon}
      {label}
    </button>
  );
}

function viewLabel(view: View) {
  return {
    dashboard: "Dashboard",
    reports: "Reports",
    clubs: "Clubs",
    exports: "Exports",
    notifications: "Notifications"
  }[view];
}
