import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  Layers3,
  LogIn,
  LogOut,
  Megaphone,
  Paperclip,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  UserRoundCog,
  UsersRound,
  WalletCards,
  XCircle
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import clubHubHero from "./assets/club-hub-hero-premium.webp";
import landingProduct from "./assets/club-hub-landing-product.webp";
import {
  ApiClient,
  ApiError,
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

const authStorageKey = "clubreport.auth";
const sessionExpiredMessage = "Session expired. Please sign in again.";

function isExpiredAuth(auth: AuthResponse) {
  const expiresAt = Date.parse(auth.expiresAtUtc);
  return Number.isNaN(expiresAt) || expiresAt <= Date.now() + 30000;
}

function readStoredAuth() {
  const raw = localStorage.getItem(authStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthResponse;
    if (isExpiredAuth(parsed)) {
      localStorage.removeItem(authStorageKey);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(authStorageKey);
    return null;
  }
}

export default function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(() => readStoredAuth());
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
    if (isExpiredAuth(auth)) {
      clearSession(sessionExpiredMessage);
      return;
    }

    let cancelled = false;
    setBusy(true);
    setError(null);
    loadAll(new ApiClient(auth.accessToken), auth.user)
      .catch((err) => {
        if (!cancelled) {
          handleRequestError(err, "Cannot load dashboard data.");
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
      handleRequestError(err, "Cannot load dashboard data.");
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
      localStorage.setItem(authStorageKey, JSON.stringify(result));
      setAuth(result);
      setView("dashboard");
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Invalid username or password." : err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  function clearSession(message?: string) {
    localStorage.removeItem(authStorageKey);
    setAuth(null);
    setView("dashboard");
    setReports([]);
    setClubs([]);
    setSummary(null);
    setActivities([]);
    setKpi(null);
    setBudgetProposals([]);
    setExportsList([]);
    setNotifications([]);
    setError(message ?? null);
  }

  function handleRequestError(err: unknown, fallback: string) {
    if (err instanceof ApiError && err.status === 401) {
      clearSession(sessionExpiredMessage);
      return;
    }

    setError(err instanceof Error ? err.message : fallback);
  }

  function logout() {
    clearSession();
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
      handleRequestError(err, "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  function chooseDemoAccount(nextUsername: string, nextPassword: string) {
    setUsername(nextUsername);
    setPassword(nextPassword);
  }

  if (!auth) {
    return (
      <main className="landing-page">
        <header className="landing-nav">
          <a className="landing-brand" href="#top" aria-label="FPTU Club Hub home">
            <span><Building2 size={23} aria-hidden /></span>
            <div>
              <strong>FPTU Club Hub</strong>
              <small>Management & Report Hub</small>
            </div>
          </a>
          <nav aria-label="Landing navigation">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#demo-login">Demo</a>
          </nav>
          <a className="landing-nav-cta" href="#demo-login">Try demo</a>
        </header>

        <section id="top" className="landing-hero">
          <div className="landing-copy">
            <span className="landing-eyebrow"><Sparkles size={15} aria-hidden /> Built for student affairs teams</span>
            <h1>FPTU Club Hub</h1>
            <p>Club operations, reporting, KPI tracking, activity calendars, budgets, exports, and notifications in one polished workspace.</p>
            <div className="landing-actions">
              <a className="landing-button landing-primary" href="#demo-login">
                <LogIn size={18} aria-hidden />
                Launch demo
              </a>
              <a className="landing-button" href="#features">
                <ArrowUpRight size={18} aria-hidden />
                Explore product
              </a>
            </div>
            <div className="landing-proof" aria-label="Product highlights">
              <span><strong>8</strong> services</span>
              <span><strong>4</strong> demo roles</span>
              <span><strong>1</strong> command center</span>
            </div>
          </div>

          <div className="landing-product">
            <img src={landingProduct} alt="" />
            <div className="product-chip chip-kpi">
              <Trophy size={18} aria-hidden />
              KPI live
            </div>
            <div className="product-chip chip-budget">
              <WalletCards size={18} aria-hidden />
              Budget ready
            </div>
          </div>
        </section>

        <section id="features" className="landing-section landing-features">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Product modules</span>
            <h2>Everything clubs need after the event ends.</h2>
            <p>Designed around repeated student affairs workflows, not a generic admin template.</p>
          </div>
          <div className="landing-feature-grid">
            <article>
              <FileText size={22} aria-hidden />
              <h3>Report workflow</h3>
              <p>Create, submit, review, approve, reject, and attach evidence with clear status states.</p>
            </article>
            <article>
              <Trophy size={22} aria-hidden />
              <h3>KPI leaderboard</h3>
              <p>Turn participation and approved reports into scannable performance rankings.</p>
            </article>
            <article>
              <WalletCards size={22} aria-hidden />
              <h3>Finance tracking</h3>
              <p>Budget proposals and settlement signals stay next to club activity context.</p>
            </article>
            <article>
              <Bell size={22} aria-hidden />
              <h3>Smart signals</h3>
              <p>Notifications keep admins, managers, treasurers, and members moving in the same flow.</p>
            </article>
          </div>
        </section>

        <section id="workflow" className="landing-section landing-workflow">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Workflow</span>
            <h2>From activity evidence to decision-ready reports.</h2>
          </div>
          <div className="workflow-steps">
            <article>
              <span>01</span>
              <h3>Collect</h3>
              <p>Clubs record activities, participants, attachments, and outcomes in one place.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Review</h3>
              <p>Student affairs can inspect reports, give feedback, and move status forward.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Decide</h3>
              <p>KPIs, finance proposals, exports, and notifications close the loop cleanly.</p>
            </article>
          </div>
        </section>

        <section id="demo-login" className="landing-section landing-demo">
          <div className="landing-demo-copy">
            <span className="landing-eyebrow">Live product demo</span>
            <h2>Open the workspace with seeded roles.</h2>
            <p>Pick a demo account, sign in, and jump straight into the real dashboard backed by the running microservices.</p>
          </div>
          <div className="landing-login-panel">
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
              <button type="button" onClick={() => chooseDemoAccount("admin@club.local", "Admin@12345")}>
                Admin
              </button>
              <button type="button" onClick={() => chooseDemoAccount("manager@club.local", "Manager@12345")}>
                Manager
              </button>
              <button type="button" onClick={() => chooseDemoAccount("treasurer@club.local", "Treasurer@12345")}>
                Treasurer
              </button>
              <button type="button" onClick={() => chooseDemoAccount("student@club.local", "Student@12345")}>
                Student
              </button>
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          <span>FPTU Club Hub</span>
          <span>ASP.NET Core microservices / React / SQL Server / RabbitMQ</span>
        </footer>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-icon">
            <Building2 size={24} aria-hidden />
          </div>
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
        <div className="sidebar-card">
          <span><ShieldCheck size={14} aria-hidden /> Signed in</span>
          <strong>{auth.user.fullName}</strong>
          <small>{auth.user.roles[0]}</small>
        </div>
        <button className="ghost logout" type="button" onClick={logout}>
          <LogOut size={18} aria-hidden />
          Sign out
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="page-title">
            <span className="workspace-label"><span className="status-dot" /> Live workspace</span>
            <h1>{viewLabel(view)}</h1>
            <p>{viewSubtitle(view)}</p>
          </div>
          <div className="topbar-actions">
            <span className="user-chip">
              <UserRoundCog size={17} aria-hidden />
              {auth.user.fullName}
              <span className="role-pill">{auth.user.roles.join(", ")}</span>
            </span>
            <button className="secondary" type="button" onClick={refreshAll} disabled={busy} title="Refresh dashboard data">
              <RefreshCcw className={busy ? "spin" : undefined} size={18} aria-hidden />
              Refresh
            </button>
          </div>
        </header>

        {error && <div className="alert">{error}</div>}
        <div className="view-frame" key={view}>
          {view === "dashboard" && <Dashboard summary={summary} reports={reports} notifications={notifications} kpi={kpi} activities={activities} budgetProposals={budgetProposals} onNavigate={setView} />}
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
  budgetProposals,
  onNavigate
}: {
  summary: ReportSummary | null;
  reports: Report[];
  notifications: NotificationItem[];
  kpi: KpiLeaderboard | null;
  activities: ActivityItem[];
  budgetProposals: BudgetProposal[];
  onNavigate: (view: View) => void;
}) {
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const topClub = kpi?.clubs[0];
  const reviewCount = (summary?.submitted ?? 0) + (summary?.underReview ?? 0);
  const approvalRate = summary?.total ? Math.round(((summary.approved ?? 0) / summary.total) * 100) : 0;
  const nextActivity = activities[0];
  const stats = [
    { label: "Reports", value: summary?.total ?? 0, hint: `${summary?.approved ?? 0} approved`, tone: "teal", icon: <FileText /> },
    { label: "In Review", value: reviewCount, hint: "needs attention", tone: "amber", icon: <ClipboardCheck /> },
    { label: "Top KPI", value: topClub?.points ?? 0, hint: topClub?.clubName ?? "No ranking yet", tone: "green", icon: <Trophy /> },
    { label: "Budgets", value: budgetProposals.length, hint: `${budgetProposals.filter((item) => item.status === "Submitted").length} pending`, tone: "coral", icon: <CircleDollarSign /> }
  ];
  return (
    <section className="dashboard-grid">
      <section className="hero-panel">
        <img src={clubHubHero} alt="" />
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={15} aria-hidden /> FPTU Club Operations</span>
          <h2>One clean command center for club reporting, KPI, activities, and budgets.</h2>
          <p>Track what needs attention, move reports through approval, and keep club operations visible without digging through separate tools.</p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={() => onNavigate("reports")}>
              <FileText size={18} aria-hidden />
              Review reports
            </button>
            <button className="secondary" type="button" onClick={() => onNavigate("activities")}>
              <CalendarDays size={18} aria-hidden />
              Activities
            </button>
          </div>
        </div>
        <div className="hero-meter" aria-label="Approval progress">
          <span>Approval rate</span>
          <strong>{approvalRate}%</strong>
          <div className="progress-track"><i style={{ width: `${approvalRate}%` }} /></div>
          <small>{reviewCount} report{reviewCount === 1 ? "" : "s"} still waiting</small>
        </div>
      </section>

      <div className="stat-band">
        {stats.map((stat) => (
          <div className={`stat ${stat.tone}`} key={stat.label}>
            <span className="stat-icon">{stat.icon}</span>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.hint}</small>
            </div>
          </div>
        ))}
      </div>

      <section className="quick-actions" aria-label="Quick actions">
        <button type="button" onClick={() => onNavigate("reports")}>
          <span><ClipboardCheck size={18} aria-hidden /></span>
          <strong>Reports</strong>
          <small>{reviewCount} pending</small>
          <ArrowUpRight size={16} aria-hidden />
        </button>
        <button type="button" onClick={() => onNavigate("kpi")}>
          <span><Trophy size={18} aria-hidden /></span>
          <strong>KPI</strong>
          <small>{topClub?.clubName ?? "No ranking"}</small>
          <ArrowUpRight size={16} aria-hidden />
        </button>
        <button type="button" onClick={() => onNavigate("finance")}>
          <span><WalletCards size={18} aria-hidden /></span>
          <strong>Finance</strong>
          <small>{budgetProposals.filter((item) => item.status === "Submitted").length} pending</small>
          <ArrowUpRight size={16} aria-hidden />
        </button>
        <button type="button" onClick={() => onNavigate("notifications")}>
          <span><Megaphone size={18} aria-hidden /></span>
          <strong>Signals</strong>
          <small>{unreadCount} unread</small>
          <ArrowUpRight size={16} aria-hidden />
        </button>
      </section>

      <section className="panel panel-large">
        <SectionTitle icon={<FileText />} title="Recent Reports" meta={`${reports.length} loaded`} />
        <ReportList reports={reports.slice(0, 6)} />
      </section>
      <section className="panel insight-panel">
        <SectionTitle icon={<Trophy />} title="Top Club" meta={kpi?.period ?? "All periods"} />
        {topClub ? (
          <div className="top-club-card">
            <span>#{topClub.rank}</span>
            <strong>{topClub.clubName}</strong>
            <div className="progress-track"><i style={{ width: `${Math.min(100, topClub.points)}%` }} /></div>
            <small>{topClub.points} points - {topClub.participants} participants</small>
          </div>
        ) : (
          <p className="empty">No KPI data loaded.</p>
        )}
        <SectionTitle icon={<Bell />} title="Unread Signals" meta={`${unreadCount} open`} />
        <NotificationList notifications={notifications.filter((item) => !item.isRead).slice(0, 4)} />
      </section>
      <section className="panel">
        <SectionTitle icon={<CalendarDays />} title="Upcoming Activities" meta={nextActivity ? new Date(nextActivity.startTimeUtc).toLocaleDateString() : "No activity"} />
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
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><ClipboardCheck size={15} aria-hidden /> Workflow</span>
          <h2>Report Workflow</h2>
          <p>{props.reports.length} reports across draft, review, and approval states.</p>
        </div>
        <button className="primary" type="button" onClick={props.createDemoReport} disabled={props.busy} title="Create a demo draft report">
          <FileText size={18} aria-hidden />
          New report
        </button>
      </div>
      <div className="feedback-row inline-field">
        <label>
          Rejection feedback
          <input value={props.feedback} onChange={(event) => props.setFeedback(event.target.value)} />
        </label>
      </div>
      {props.reports.length === 0 ? (
        <p className="empty">No reports loaded.</p>
      ) : (
        <div className="report-board" aria-label="Reports">
          {props.reports.map((report) => (
            <article className={`report-card ${statusTone[report.status]}`} key={report.id}>
            <div className="report-card-head">
              <div>
                <span>{report.period}</span>
                <h3>{report.clubName}</h3>
              </div>
              <StatusBadge status={report.status} />
            </div>
            <div className="report-meta">
              <span><CalendarDays size={15} aria-hidden /> Due {new Date(report.dueDate).toLocaleDateString()}</span>
              <span><Layers3 size={15} aria-hidden /> {report.details.length} activities</span>
              <span><Paperclip size={15} aria-hidden /> {report.attachments.length} evidence</span>
            </div>
            <p>{report.details[0]?.outcome ?? "No outcome recorded yet."}</p>
            <div className="report-actions">
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
                <button type="button" onClick={() => props.submit(report.id)} title="Submit report" disabled={props.busy}>
                  <Send size={16} aria-hidden />
                </button>
              )}
              {props.isAdmin && report.status === "Submitted" && (
                <button type="button" onClick={() => props.review(report.id)} title="Mark under review" disabled={props.busy}>
                  <RefreshCcw size={16} aria-hidden />
                </button>
              )}
              {props.isAdmin && (report.status === "Submitted" || report.status === "Under Review") && (
                <>
                  <button type="button" onClick={() => props.approve(report.id)} title="Approve report" disabled={props.busy}>
                    <CheckCircle2 size={16} aria-hidden />
                  </button>
                  <button type="button" onClick={() => props.reject(report.id)} title="Reject report" disabled={props.busy}>
                    <XCircle size={16} aria-hidden />
                  </button>
                </>
              )}
            </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ClubsView({ clubs }: { clubs: Club[] }) {
  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><UsersRound size={15} aria-hidden /> Club Directory</span>
          <h2>Active Clubs</h2>
          <p>{clubs.length} clubs with manager and contact information.</p>
        </div>
      </div>
      <div className="list-grid club-grid">
        {clubs.map((club) => (
          <article className="item-card club-card" key={club.id}>
            <div className="club-card-head">
              <span className="club-avatar">{club.code.slice(0, 2)}</span>
              <div>
                <strong>{club.name}</strong>
                <small>{club.code}</small>
              </div>
            </div>
            <p>{club.description}</p>
            <dl>
              <div><dt>Email</dt><dd>{club.contactEmail}</dd></div>
              <div><dt>Phone</dt><dd>{club.contactPhone}</dd></div>
              <div><dt>Manager</dt><dd>{club.managers.find((manager) => manager.isActive)?.managerName ?? "Unassigned"}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivitiesView({ activities, busy, createActivity }: { activities: ActivityItem[]; busy: boolean; createActivity: () => void }) {
  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><CalendarDays size={15} aria-hidden /> Calendar</span>
          <h2>Activity Calendar</h2>
          <p>{activities.length} scheduled and completed club activities.</p>
        </div>
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
    <div className="activity-list">
      {activities.map((activity) => (
        <article key={activity.id} className="activity-row">
          <span className="activity-dot"><CalendarDays size={16} aria-hidden /></span>
          <div>
            <strong>{activity.title}</strong>
            <span>{activity.clubName}</span>
          </div>
          <div className="activity-meta">
            <span><Clock3 size={14} aria-hidden /> {new Date(activity.startTimeUtc).toLocaleString()}</span>
            <span>{activity.location}</span>
          </div>
          <span className={`badge ${activity.status === "Completed" ? "success" : "info"}`}>{activity.participants.length} joined</span>
        </article>
      ))}
    </div>
  );
}

function KpiView({ leaderboard }: { leaderboard: KpiLeaderboard | null }) {
  const maxPoints = leaderboard?.clubs[0]?.points || 1;
  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><Trophy size={15} aria-hidden /> Performance</span>
          <h2>KPI Leaderboard</h2>
          <p>Ranking clubs by approved reports, participation, and activity performance.</p>
        </div>
        <span className="muted-text">{leaderboard?.period ?? "All periods"}</span>
      </div>
      {(!leaderboard || leaderboard.clubs.length === 0) ? (
        <p className="empty">No KPI data loaded.</p>
      ) : (
        <div className="leaderboard" aria-label="KPI leaderboard">
          {leaderboard.clubs.map((club) => (
            <article className="rank-card" key={club.clubId}>
              <span className="rank-number">#{club.rank}</span>
              <div className="rank-main">
                <strong>{club.clubName}</strong>
                <div className="progress-track"><i style={{ width: `${Math.max(8, Math.round((club.points / maxPoints) * 100))}%` }} /></div>
              </div>
              <div className="rank-stats">
                <strong>{club.points}</strong>
                <span>{club.approvedReports} approved</span>
                <span>{club.participants} participants</span>
              </div>
            </article>
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
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><WalletCards size={15} aria-hidden /> Finance</span>
          <h2>Budget Proposals</h2>
          <p>{props.proposals.length} proposals with requested amounts and settlement status.</p>
        </div>
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
        <div className="budget-grid">
          {props.proposals.map((proposal) => (
            <article key={proposal.id} className="budget-card">
              <div className="budget-card-head">
                <span><CircleDollarSign size={18} aria-hidden /></span>
                <StatusBadgeLike status={proposal.status} />
              </div>
              <div className="budget-body">
                <strong>{proposal.title}</strong>
                <span>{proposal.clubName}</span>
                <b>{formatCurrency(proposal.requestedAmount)}</b>
                <small>{proposal.settlements.length} settlement{proposal.settlements.length === 1 ? "" : "s"}</small>
              </div>
              <div className="finance-actions">
                {props.isAdmin && proposal.status === "Submitted" && (
                  <button type="button" disabled={props.busy} onClick={() => props.approveProposal(proposal.id, proposal.requestedAmount)} title="Approve budget proposal">
                    <CheckCircle2 size={16} aria-hidden />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ExportsView({ exportsList, busy, createExport }: { exportsList: ExportRequest[]; busy: boolean; createExport: (type: "PDF" | "EXCEL") => void }) {
  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><FileSpreadsheet size={15} aria-hidden /> Exports</span>
          <h2>Export History</h2>
          <p>{exportsList.length} generated or pending report files.</p>
        </div>
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
      {exportsList.length === 0 ? (
        <p className="empty">No exports loaded.</p>
      ) : (
        <div className="export-grid" aria-label="Exports">
          {exportsList.map((item) => (
            <article className="export-card" key={item.id}>
              <div>
                <span className="export-type">{item.exportType}</span>
                <strong>Export #{item.id}</strong>
                <small>{item.scope}</small>
              </div>
              <StatusBadgeLike status={item.status} />
              <span className="export-file">{item.file?.fileName ?? "Pending file"}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationsView({ notifications, markRead }: { notifications: NotificationItem[]; markRead: (id: number) => void }) {
  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><Bell size={15} aria-hidden /> Signals</span>
          <h2>Notifications</h2>
          <p>{notifications.filter((item) => !item.isRead).length} unread items across club workflows.</p>
        </div>
      </div>
      <NotificationList notifications={notifications} markRead={markRead} />
    </section>
  );
}

function ReportList({ reports }: { reports: Report[] }) {
  if (reports.length === 0) return <p className="empty">No reports loaded.</p>;
  return (
    <div className="signal-list">
      {reports.map((report) => (
        <article key={report.id} className="signal-row">
          <span className="signal-icon"><FileText size={16} aria-hidden /></span>
          <div>
            <strong>{report.clubName}</strong>
            <span>{report.period} - v{report.version}</span>
          </div>
          <StatusBadge status={report.status} />
        </article>
      ))}
    </div>
  );
}

function NotificationList({ notifications, markRead }: { notifications: NotificationItem[]; markRead?: (id: number) => void }) {
  if (notifications.length === 0) return <p className="empty">No notifications.</p>;
  return (
    <div className="signal-list">
      {notifications.map((item) => (
        <article key={item.id} className={`signal-row ${item.isRead ? "muted" : ""}`}>
          <span className="signal-icon"><Bell size={16} aria-hidden /></span>
          <div>
            <strong>{item.title}</strong>
            <span>{item.message}</span>
          </div>
          {markRead && !item.isRead && (
            <button type="button" onClick={() => markRead(item.id)} title="Mark notification as read">
              <CheckCircle2 size={16} aria-hidden />
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`badge ${statusTone[status]}`}>{status}</span>;
}

function StatusBadgeLike({ status }: { status: string }) {
  const tone = status === "Approved" || status === "Settled" || status === "Completed"
    ? "success"
    : status === "Rejected" || status === "Failed"
      ? "danger"
      : status === "Submitted" || status === "Pending"
        ? "info"
        : "neutral";

  return <span className={`badge ${tone}`}>{status}</span>;
}

function SectionTitle({ icon, title, meta }: { icon: JSX.Element; title: string; meta?: string }) {
  return (
    <div className="section-title">
      <span>{icon}</span>
      <h2>{title}</h2>
      {meta && <small>{meta}</small>}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: JSX.Element; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? "nav active" : "nav"} type="button" onClick={onClick} title={label}>
      <span className="nav-icon">{icon}</span>
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

function viewSubtitle(view: View) {
  return {
    dashboard: "Operational snapshot for clubs, reports, KPI, finance, and signals.",
    reports: "Move monthly reports from draft to review, approval, or rejection.",
    clubs: "Scan club ownership, contacts, and manager assignments.",
    activities: "Follow scheduled work, locations, participation, and outcomes.",
    kpi: "Compare club performance with a clearer ranking view.",
    finance: "Review proposals, requested budgets, and settlement progress.",
    exports: "Create and monitor consolidated PDF or Excel exports.",
    notifications: "Resolve workflow signals before they pile up."
  }[view];
}
