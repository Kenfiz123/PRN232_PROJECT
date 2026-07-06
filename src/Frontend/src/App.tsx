import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  LogIn,
  LogOut,
  Paperclip,
  RefreshCcw,
  Send,
  ShieldCheck,
  Trophy,
  Upload,
  UserRoundCog,
  WalletCards,
  XCircle
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import clubHubHero from "./assets/club-hub-hero.jpg";
import {
  ApiClient,
  ActivityItem,
  AuthResponse,
  BudgetProposal,
  Club,
  ExportRequest,
  KpiLeaderboard,
  NotificationItem,
  Report,
  ReportStatus,
  ReportSummary
} from "./api";

type View = "dashboard" | "reports" | "clubs" | "activities" | "kpi" | "finance" | "exports" | "notifications";

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
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [kpi, setKpi] = useState<KpiLeaderboard | null>(null);
  const [budgetProposals, setBudgetProposals] = useState<BudgetProposal[]>([]);
  const [exportsList, setExportsList] = useState<ExportRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftFeedback, setDraftFeedback] = useState("Please add clearer evidence and resubmit.");

  const api = useMemo(() => new ApiClient(auth?.accessToken), [auth?.accessToken]);
  const isAdmin = auth?.user.roles.some((role) => role === "ADMIN" || role === "SYSTEM_ADMIN" || role === "STUDENT_AFFAIRS_ADMIN") ?? false;
  const canManageFinance = isAdmin || (auth?.user.roles.some((role) => role === "CLUB_MANAGER" || role === "TREASURER") ?? false);

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
    const canUseReportWorkflow = user.roles.some((role) => role === "ADMIN" || role === "SYSTEM_ADMIN" || role === "STUDENT_AFFAIRS_ADMIN" || role === "CLUB_MANAGER");
    const canUseFinanceWorkflow = canUseReportWorkflow || user.roles.some((role) => role === "TREASURER");
    const [clubRows, reportPage, reportSummary, activityRows, kpiRows, budgetRows, exportPage, notificationRows] = await Promise.all([
      client.getClubs(),
      canUseReportWorkflow ? client.getReports() : Promise.resolve({ total: 0, items: [] }),
      canUseReportWorkflow ? client.getSummary() : Promise.resolve(null),
      client.getActivities(),
      client.getKpiLeaderboard("2026-07"),
      canUseFinanceWorkflow ? client.getBudgetProposals() : Promise.resolve([]),
      canUseReportWorkflow ? client.getExports() : Promise.resolve({ total: 0, items: [] }),
      client.getNotifications(user)
    ]);
    setClubs(clubRows);
    setReports(reportPage.items);
    setSummary(reportSummary);
    setActivities(activityRows);
    setKpi(kpiRows);
    setBudgetProposals(budgetRows);
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
    setActivities([]);
    setKpi(null);
    setBudgetProposals([]);
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
            description: "Submitted through FPTU Club Hub demo workflow.",
            participantCount: 32,
            outcome: "Activity evidence and participation data recorded."
          }
        ]
      });
    });
  }

  async function uploadEvidence(reportId: number, file: File) {
    await runAction(async () => {
      await api.uploadAttachment(reportId, file);
    });
  }

  async function createDemoActivity() {
    const club = clubs[0];
    if (!club) return;
    await runAction(async () => {
      await api.createActivity({
        clubId: club.id,
        clubName: club.name,
        title: `FPTU club activity ${activities.length + 1}`,
        description: "Created from the Activity Service demo workflow.",
        startTimeUtc: new Date(Date.now() + 86400000).toISOString(),
        endTimeUtc: new Date(Date.now() + 93600000).toISOString(),
        location: "FPTU Student Hall"
      });
    });
  }

  async function createDemoBudgetProposal() {
    const club = clubs[0];
    if (!club) return;
    await runAction(async () => {
      await api.createBudgetProposal({
        clubId: club.id,
        clubName: club.name,
        activityId: activities.find((item) => item.clubId === club.id)?.id,
        title: `Event budget ${budgetProposals.length + 1}`,
        description: "Budget proposal created from Finance Service demo workflow.",
        requestedAmount: 3000000
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
        <section className="login-card" aria-label="Login">
          <div className="login-visual">
            <img src={clubHubHero} alt="" />
            <div>
              <span>FPTU Club Hub</span>
              <strong>Reports, KPI, activities, and finance in one place.</strong>
            </div>
          </div>
          <div className="login-panel">
            <div className="brand-mark">
              <Building2 size={28} aria-hidden />
            </div>
            <h1>FPTU Club Hub</h1>
            <p>Club management, reporting, KPI, and finance workspace.</p>
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
            <div className="demo-row" aria-label="Demo accounts">
              <button type="button" onClick={() => { setUsername("admin@club.local"); setPassword("Admin@12345"); }}>
                Admin
              </button>
              <button type="button" onClick={() => { setUsername("manager@club.local"); setPassword("Manager@12345"); }}>
                Manager
              </button>
              <button type="button" onClick={() => { setUsername("treasurer@club.local"); setPassword("Treasurer@12345"); }}>
                Treasurer
              </button>
              <button type="button" onClick={() => { setUsername("student@club.local"); setPassword("Student@12345"); }}>
                Student
              </button>
            </div>
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
            <strong>FPTU Club</strong>
            <span>Management Hub</span>
          </div>
        </div>
        <nav aria-label="Primary">
          <NavButton icon={<Gauge />} label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
          <NavButton icon={<FileText />} label="Reports" active={view === "reports"} onClick={() => setView("reports")} />
          <NavButton icon={<Building2 />} label="Clubs" active={view === "clubs"} onClick={() => setView("clubs")} />
          <NavButton icon={<CalendarDays />} label="Activities" active={view === "activities"} onClick={() => setView("activities")} />
          <NavButton icon={<Trophy />} label="KPI" active={view === "kpi"} onClick={() => setView("kpi")} />
          <NavButton icon={<WalletCards />} label="Finance" active={view === "finance"} onClick={() => setView("finance")} />
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
            <p>
              <span>{auth.user.fullName}</span>
              <span className="role-pill">{auth.user.roles.join(", ")}</span>
            </p>
          </div>
          <button className="secondary" type="button" onClick={refreshAll} disabled={busy} title="Refresh dashboard data">
            <RefreshCcw className={busy ? "spin" : undefined} size={18} aria-hidden />
            Refresh
          </button>
        </header>

        {error && <div className="alert">{error}</div>}
        <div className="view-frame" key={view}>
          {view === "dashboard" && <Dashboard summary={summary} reports={reports} notifications={notifications} kpi={kpi} activities={activities} budgetProposals={budgetProposals} />}
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
              uploadEvidence={uploadEvidence}
            />
          )}
          {view === "clubs" && <ClubsView clubs={clubs} />}
          {view === "activities" && (
            <ActivitiesView activities={activities} busy={busy} createActivity={createDemoActivity} />
          )}
          {view === "kpi" && <KpiView leaderboard={kpi} />}
          {view === "finance" && (
            <FinanceView
              proposals={budgetProposals}
              busy={busy}
              canManageFinance={canManageFinance}
              isAdmin={isAdmin}
              createProposal={createDemoBudgetProposal}
              approveProposal={(id, amount) => runAction(() => api.approveBudgetProposal(id, amount).then(() => undefined))}
            />
          )}
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
        </div>
      </main>
    </div>
  );
}

function Dashboard({
  summary,
  reports,
  notifications,
  kpi,
  activities,
  budgetProposals
}: {
  summary: ReportSummary | null;
  reports: Report[];
  notifications: NotificationItem[];
  kpi: KpiLeaderboard | null;
  activities: ActivityItem[];
  budgetProposals: BudgetProposal[];
}) {
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const topClub = kpi?.clubs[0];
  const stats = [
    { label: "Reports", value: summary?.total ?? 0, hint: `${summary?.approved ?? 0} approved`, tone: "teal" },
    { label: "In Review", value: (summary?.submitted ?? 0) + (summary?.underReview ?? 0), hint: "needs attention", tone: "amber" },
    { label: "Top KPI", value: topClub?.points ?? 0, hint: topClub?.clubName ?? "No ranking yet", tone: "green" },
    { label: "Budgets", value: budgetProposals.length, hint: `${budgetProposals.filter((item) => item.status === "Submitted").length} pending`, tone: "coral" }
  ];
  return (
    <section className="dashboard-grid">
      <section className="hero-panel">
        <img src={clubHubHero} alt="" />
        <div className="hero-copy">
          <span className="eyebrow">FPTU Club Operations</span>
          <h2>Manage reports, activities, KPI, and club budgets without jumping between tools.</h2>
          <div className="hero-pills">
            <span>{activities.length} activities</span>
            <span>{unreadCount} unread signals</span>
            <span>{kpi?.period ?? "All periods"}</span>
          </div>
        </div>
      </section>
      <div className="stat-band">
        {stats.map((stat) => (
          <div className={`stat ${stat.tone}`} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.hint}</small>
          </div>
        ))}
      </div>
      <section className="panel panel-large">
        <h2>Recent Reports</h2>
        <ReportList reports={reports.slice(0, 6)} />
      </section>
      <section className="panel">
        <h2>Unread Signals</h2>
        <NotificationList notifications={notifications.filter((item) => !item.isRead).slice(0, 6)} />
      </section>
      <section className="panel">
        <h2>Upcoming Activities</h2>
        <ActivityList activities={activities.slice(0, 5)} />
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
  uploadEvidence: (id: number, file: File) => void;
}) {
  function handleEvidenceChange(reportId: number, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    props.uploadEvidence(reportId, file);
  }

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
      <div className="report-table workflow-table" role="table" aria-label="Reports">
        <div className="table-row table-head" role="row">
          <span>Club</span>
          <span>Period</span>
          <span>Status</span>
          <span>Activities</span>
          <span>Evidence</span>
          <span>Actions</span>
        </div>
        {props.reports.map((report) => (
          <div className="table-row" role="row" key={report.id}>
            <span>{report.clubName}</span>
            <span>{report.period}</span>
            <span><StatusBadge status={report.status} /></span>
            <span>{report.details.length}</span>
            <span className="evidence-cell" title={report.attachments.map((attachment) => attachment.fileName).join(", ")}>
              <Paperclip size={15} aria-hidden />
              {report.attachments.length}
              {report.attachments[0] && <small>{report.attachments[0].fileName}</small>}
            </span>
            <span className="actions">
              <label className="icon-upload" title="Upload evidence">
                <Upload size={16} aria-hidden />
                <span className="sr-only">Upload evidence</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf,.xlsx"
                  disabled={props.busy}
                  onChange={(event) => {
                    handleEvidenceChange(report.id, event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
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

function ActivitiesView({ activities, busy, createActivity }: { activities: ActivityItem[]; busy: boolean; createActivity: () => void }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Activity Calendar</h2>
        <button className="primary" type="button" disabled={busy} onClick={createActivity} title="Create demo activity">
          <CalendarDays size={18} aria-hidden />
          New activity
        </button>
      </div>
      <ActivityList activities={activities} />
    </section>
  );
}

function ActivityList({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) return <p className="empty">No activities loaded.</p>;
  return (
    <div className="compact-list">
      {activities.map((activity) => (
        <div key={activity.id} className="compact-row">
          <div>
            <strong>{activity.title}</strong>
            <span>{activity.clubName} - {new Date(activity.startTimeUtc).toLocaleString()} - {activity.location}</span>
          </div>
          <span className={`badge ${activity.status === "Completed" ? "success" : "info"}`}>{activity.participants.length} joined</span>
        </div>
      ))}
    </div>
  );
}

function KpiView({ leaderboard }: { leaderboard: KpiLeaderboard | null }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>KPI Leaderboard</h2>
        <span className="muted-text">{leaderboard?.period ?? "All periods"}</span>
      </div>
      {(!leaderboard || leaderboard.clubs.length === 0) ? (
        <p className="empty">No KPI data loaded.</p>
      ) : (
        <div className="report-table kpi-table" role="table" aria-label="KPI leaderboard">
          <div className="table-row table-head" role="row">
            <span>Rank</span>
            <span>Club</span>
            <span>Points</span>
            <span>Approved</span>
            <span>Participants</span>
          </div>
          {leaderboard.clubs.map((club) => (
            <div className="table-row" role="row" key={club.clubId}>
              <span>#{club.rank}</span>
              <span>{club.clubName}</span>
              <span><span className="badge success">{club.points}</span></span>
              <span>{club.approvedReports}</span>
              <span>{club.participants}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FinanceView(props: {
  proposals: BudgetProposal[];
  busy: boolean;
  canManageFinance: boolean;
  isAdmin: boolean;
  createProposal: () => void;
  approveProposal: (id: number, amount?: number) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Budget Proposals</h2>
        {props.canManageFinance && (
          <button className="primary" type="button" disabled={props.busy} onClick={props.createProposal} title="Create demo budget proposal">
            <WalletCards size={18} aria-hidden />
            New proposal
          </button>
        )}
      </div>
      {props.proposals.length === 0 ? (
        <p className="empty">No budget proposals loaded.</p>
      ) : (
        <div className="compact-list">
          {props.proposals.map((proposal) => (
            <div key={proposal.id} className="compact-row finance-row">
              <div>
                <strong>{proposal.title}</strong>
                <span>{proposal.clubName} - requested {formatCurrency(proposal.requestedAmount)} - {proposal.settlements.length} settlement</span>
              </div>
              <div className="finance-actions">
                <span className={`badge ${proposal.status === "Approved" || proposal.status === "Settled" ? "success" : "info"}`}>{proposal.status}</span>
                {props.isAdmin && proposal.status === "Submitted" && (
                  <button type="button" disabled={props.busy} onClick={() => props.approveProposal(proposal.id, proposal.requestedAmount)} title="Approve budget proposal">
                    <CheckCircle2 size={16} aria-hidden />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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
            <span>{report.period} - v{report.version}</span>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function viewLabel(view: View) {
  return {
    dashboard: "Dashboard",
    reports: "Reports",
    clubs: "Clubs",
    activities: "Activities",
    kpi: "KPI",
    finance: "Finance",
    exports: "Exports",
    notifications: "Notifications"
  }[view];
}
