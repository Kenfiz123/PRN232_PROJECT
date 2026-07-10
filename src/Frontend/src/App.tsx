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

type ReportDraftForm = {
  editingReportId?: number;
  clubId: string;
  period: string;
  dueDate: string;
  activityName: string;
  activityDate: string;
  participantCount: string;
  description: string;
  outcome: string;
};

type ClubForm = {
  code: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
};

type ActivityForm = {
  editingActivityId?: number;
  clubId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
};

type FinanceForm = {
  clubId: string;
  activityId: string;
  title: string;
  description: string;
  requestedAmount: string;
};

type SettlementForm = {
  totalSpent: string;
  receiptUrl: string;
};

const statusTone: Record<ReportStatus, string> = {
  Draft: "neutral",
  Submitted: "info",
  "Under Review": "warning",
  Approved: "success",
  Rejected: "danger"
};

const authStorageKey = "clubreport.auth";
const sessionExpiredMessage = "Session expired. Please sign in again.";
const adminRoles = ["ADMIN", "SYSTEM_ADMIN", "STUDENT_AFFAIRS_ADMIN"];
const reportWorkflowRoles = [...adminRoles, "CLUB_MANAGER"];
const financeWorkflowRoles = [...reportWorkflowRoles, "TREASURER"];

function hasAnyRole(user: AuthResponse["user"] | null | undefined, allowedRoles: string[]) {
  return user?.roles.some((role) => allowedRoles.includes(role)) ?? false;
}

function canAccessView(view: View, user: AuthResponse["user"]) {
  if (view === "reports" || view === "exports") {
    return hasAnyRole(user, reportWorkflowRoles);
  }

  if (view === "finance") {
    return hasAnyRole(user, financeWorkflowRoles);
  }

  return true;
}

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getNextPeriod(period?: string) {
  const cursor = period && /^\d{4}-\d{2}$/.test(period)
    ? new Date(`${period}-01T00:00:00`)
    : new Date();
  cursor.setMonth(cursor.getMonth() + 1);
  return formatMonth(cursor);
}

function getDueDateForPeriod(period: string) {
  return /^\d{4}-\d{2}$/.test(period) ? `${period}-25` : "";
}

function createReportDraft(period = getNextPeriod()): ReportDraftForm {
  return {
    editingReportId: undefined,
    clubId: "",
    period,
    dueDate: getDueDateForPeriod(period),
    activityName: "",
    activityDate: "",
    participantCount: "0",
    description: "",
    outcome: ""
  };
}

function getAvailableReportPeriod(reports: Report[], clubId: number) {
  const usedPeriods = new Set(reports.filter((report) => report.clubId === clubId).map((report) => report.period));
  let period = getNextPeriod();

  for (let index = 0; index < 24; index++) {
    if (!usedPeriods.has(period)) {
      return period;
    }

    period = getNextPeriod(period);
  }

  return period;
}

function toDateTimeInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function createActivityDraft(): ActivityForm {
  const start = new Date(Date.now() + 86400000);
  const end = new Date(start.getTime() + 7200000);
  return {
    editingActivityId: undefined,
    clubId: "",
    title: "",
    description: "",
    startTime: toDateTimeInputValue(start),
    endTime: toDateTimeInputValue(end),
    location: "",
    status: "Scheduled"
  };
}

function createFinanceDraft(): FinanceForm {
  return {
    clubId: "",
    activityId: "",
    title: "",
    description: "",
    requestedAmount: ""
  };
}

function createClubDraft(): ClubForm {
  return {
    code: "",
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: ""
  };
}

function toIsoFromDateTimeInput(value: string) {
  return new Date(value).toISOString();
}

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
  const [users, setUsers] = useState<AuthResponse["user"][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftFeedback, setDraftFeedback] = useState("Please add clearer evidence and resubmit.");
  const [reportDraft, setReportDraft] = useState<ReportDraftForm>(() => createReportDraft());
  const [clubDraft, setClubDraft] = useState<ClubForm>(() => createClubDraft());
  const [activityDraft, setActivityDraft] = useState<ActivityForm>(() => createActivityDraft());
  const [financeDraft, setFinanceDraft] = useState<FinanceForm>(() => createFinanceDraft());
  const [participantDrafts, setParticipantDrafts] = useState<Record<number, string>>({});
  const [settlementDrafts, setSettlementDrafts] = useState<Record<number, SettlementForm>>({});

  const api = useMemo(() => new ApiClient(auth?.accessToken), [auth?.accessToken]);
  const isAdmin = hasAnyRole(auth?.user, adminRoles);
  const canUseReportWorkflow = hasAnyRole(auth?.user, reportWorkflowRoles);
  const canUseFinanceWorkflow = hasAnyRole(auth?.user, financeWorkflowRoles);

  useEffect(() => {
    if (auth && !canAccessView(view, auth.user)) {
      setView("dashboard");
    }
  }, [auth?.accessToken, view]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [view]);

  useEffect(() => {
    if (clubs.length === 0 || reportDraft.clubId) return;

    const club = clubs[0];
    const period = getAvailableReportPeriod(reports, club.id);
    setReportDraft((current) => ({
      ...current,
      clubId: String(club.id),
      period,
      dueDate: getDueDateForPeriod(period)
    }));
  }, [clubs, reports, reportDraft.clubId]);

  useEffect(() => {
    if (clubs.length === 0) return;

    const defaultClubId = String(clubs[0].id);
    setActivityDraft((current) => current.clubId ? current : { ...current, clubId: defaultClubId });
    setFinanceDraft((current) => current.clubId ? current : { ...current, clubId: defaultClubId });
  }, [clubs]);

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
    const canLoadReports = hasAnyRole(user, reportWorkflowRoles);
    const canLoadFinance = hasAnyRole(user, financeWorkflowRoles);
    const canLoadUsers = hasAnyRole(user, adminRoles);
    const [clubRows, reportPage, reportSummary, activityRows, kpiRows, budgetRows, exportPage, notificationRows, userRows] = await Promise.all([
      client.getClubs(),
      canLoadReports ? client.getReports() : Promise.resolve({ total: 0, items: [] }),
      canLoadReports ? client.getSummary() : Promise.resolve(null),
      client.getActivities(),
      client.getKpiLeaderboard("2026-07"),
      canLoadFinance ? client.getBudgetProposals() : Promise.resolve([]),
      canLoadReports ? client.getExports() : Promise.resolve({ total: 0, items: [] }),
      client.getNotifications(user),
      canLoadUsers ? client.getUsers() : Promise.resolve([])
    ]);
    setClubs(clubRows);
    setReports(reportPage.items);
    setSummary(reportSummary);
    setActivities(activityRows);
    setKpi(kpiRows);
    setBudgetProposals(budgetRows);
    setExportsList(exportPage.items);
    setNotifications(notificationRows);
    setUsers(userRows);
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
    setUsers([]);
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

  function updateReportDraftField(field: keyof ReportDraftForm, value: string) {
    setReportDraft((current) => {
      if (field === "clubId") {
        const clubId = Number(value);
        const period = Number.isNaN(clubId) ? current.period : getAvailableReportPeriod(reports, clubId);
        return {
          ...current,
          clubId: value,
          period,
          dueDate: getDueDateForPeriod(period)
        };
      }

      if (field === "period") {
        return {
          ...current,
          period: value,
          dueDate: getDueDateForPeriod(value)
        };
      }

      return {
        ...current,
        [field]: value
      };
    });
  }

  async function createReportFromDraft() {
    if (!canUseReportWorkflow) return;

    const club = clubs.find((item) => String(item.id) === reportDraft.clubId);
    const participantCount = Number(reportDraft.participantCount);
    const activityName = reportDraft.activityName.trim();
    const description = reportDraft.description.trim();
    const outcome = reportDraft.outcome.trim();

    if (!club) {
      setError("Choose a club before creating a report.");
      return;
    }

    if (!reportDraft.period || !reportDraft.dueDate || !reportDraft.activityDate || !activityName || !description || !outcome) {
      setError("Fill in club, period, dates, activity, description, and outcome before creating a report.");
      return;
    }

    if (!Number.isInteger(participantCount) || participantCount < 0) {
      setError("Participant count must be a whole number.");
      return;
    }

    const details = [
      {
        activityName,
        activityDate: reportDraft.activityDate,
        description,
        participantCount,
        outcome
      }
    ];

    const created = await runAction(async () => {
      if (reportDraft.editingReportId) {
        await api.updateReport(reportDraft.editingReportId, {
          period: reportDraft.period,
          dueDate: reportDraft.dueDate,
          details
        });
        return;
      }

      await api.createReport({
        clubId: club.id,
        clubName: club.name,
        period: reportDraft.period,
        dueDate: reportDraft.dueDate,
        details
      });
    });

    if (created) {
      const nextPeriod = getNextPeriod(reportDraft.period);
      setReportDraft({
        ...createReportDraft(nextPeriod),
        clubId: String(club.id)
      });
    }
  }

  function editReport(report: Report) {
    const detail = report.details[0];
    setView("reports");
    setReportDraft({
      editingReportId: report.id,
      clubId: String(report.clubId),
      period: report.period,
      dueDate: report.dueDate.slice(0, 10),
      activityName: detail?.activityName ?? "",
      activityDate: detail?.activityDate?.slice(0, 10) ?? "",
      participantCount: String(detail?.participantCount ?? 0),
      description: detail?.description ?? "",
      outcome: detail?.outcome ?? ""
    });
  }

  function cancelReportEdit() {
    const clubId = reportDraft.clubId || (clubs[0] ? String(clubs[0].id) : "");
    const period = clubId ? getAvailableReportPeriod(reports, Number(clubId)) : getNextPeriod();
    setReportDraft({
      ...createReportDraft(period),
      clubId
    });
  }

  function updateClubDraftField(field: keyof ClubForm, value: string) {
    setClubDraft((current) => ({
      ...current,
      [field]: field === "code" ? value.toUpperCase() : value
    }));
  }

  async function createClubFromForm() {
    if (!isAdmin) return;
    const payload = {
      code: clubDraft.code.trim().toUpperCase(),
      name: clubDraft.name.trim(),
      description: clubDraft.description.trim(),
      contactEmail: clubDraft.contactEmail.trim(),
      contactPhone: clubDraft.contactPhone.trim()
    };

    if (!payload.code || !payload.name || !payload.description || !payload.contactEmail || !payload.contactPhone) {
      setError("Fill in club code, name, description, email, and phone.");
      return;
    }

    const created = await runAction(async () => {
      await api.createClub(payload);
    });

    if (created) {
      setClubDraft(createClubDraft());
    }
  }

  async function toggleClubActive(club: Club) {
    if (!isAdmin) return;
    await runAction(async () => {
      await api.updateClub(club.id, {
        name: club.name,
        description: club.description,
        contactEmail: club.contactEmail,
        contactPhone: club.contactPhone,
        isActive: !club.isActive
      });
    });
  }

  async function assignManager(club: Club, managerUserId: number) {
    const manager = users.find((user) => user.id === managerUserId);
    if (!isAdmin || !manager) return;
    await runAction(async () => {
      await api.assignClubManager(club.id, {
        managerUserId: manager.id,
        managerName: manager.fullName
      });
    });
  }

  async function deleteClub(id: number) {
    if (!isAdmin) return;
    await runAction(async () => {
      await api.deleteClub(id);
    });
  }

  async function uploadEvidence(reportId: number, file: File) {
    if (!canUseReportWorkflow) return;
    await runAction(async () => {
      await api.uploadAttachment(reportId, file);
    });
  }

  function updateActivityDraftField(field: keyof ActivityForm, value: string) {
    setActivityDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveActivity() {
    if (!canUseReportWorkflow) return;
    const club = clubs.find((item) => String(item.id) === activityDraft.clubId);
    const title = activityDraft.title.trim();
    const description = activityDraft.description.trim();
    const location = activityDraft.location.trim();

    if (!club || !title || !description || !activityDraft.startTime || !activityDraft.endTime || !location) {
      setError("Fill in club, activity title, time, location, and description.");
      return;
    }

    const saved = await runAction(async () => {
      const payload = {
        clubId: club.id,
        clubName: club.name,
        title,
        description,
        startTimeUtc: toIsoFromDateTimeInput(activityDraft.startTime),
        endTimeUtc: toIsoFromDateTimeInput(activityDraft.endTime),
        location
      };

      if (activityDraft.editingActivityId) {
        await api.updateActivity(activityDraft.editingActivityId, {
          ...payload,
          status: activityDraft.status
        });
        return;
      }

      await api.createActivity(payload);
    });

    if (saved) {
      setActivityDraft({ ...createActivityDraft(), clubId: String(club.id) });
    }
  }

  function editActivity(activity: ActivityItem) {
    setActivityDraft({
      editingActivityId: activity.id,
      clubId: String(activity.clubId),
      title: activity.title,
      description: activity.description,
      startTime: toDateTimeInputValue(new Date(activity.startTimeUtc)),
      endTime: toDateTimeInputValue(new Date(activity.endTimeUtc)),
      location: activity.location,
      status: activity.status
    });
  }

  function updateParticipantDraft(activityId: number, value: string) {
    setParticipantDrafts((current) => ({ ...current, [activityId]: value }));
  }

  async function addParticipant(activityId: number) {
    const fullName = participantDrafts[activityId]?.trim();
    if (!fullName) {
      setError("Enter participant name before adding.");
      return;
    }

    const added = await runAction(async () => {
      await api.addActivityParticipant(activityId, { fullName });
    });

    if (added) {
      setParticipantDrafts((current) => ({ ...current, [activityId]: "" }));
    }
  }

  function updateFinanceDraftField(field: keyof FinanceForm, value: string) {
    setFinanceDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === "clubId" ? { activityId: "" } : {})
    }));
  }

  async function createBudgetProposalFromForm() {
    if (!canUseFinanceWorkflow) return;
    const club = clubs.find((item) => String(item.id) === financeDraft.clubId);
    const requestedAmount = Number(financeDraft.requestedAmount);
    const title = financeDraft.title.trim();
    const description = financeDraft.description.trim();

    if (!club || !title || !description || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setError("Fill in club, proposal title, description, and a positive requested amount.");
      return;
    }

    const created = await runAction(async () => {
      await api.createBudgetProposal({
        clubId: club.id,
        clubName: club.name,
        activityId: financeDraft.activityId ? Number(financeDraft.activityId) : undefined,
        title,
        description,
        requestedAmount
      });
    });

    if (created) {
      setFinanceDraft({ ...createFinanceDraft(), clubId: String(club.id) });
    }
  }

  function updateSettlementDraft(proposalId: number, field: keyof SettlementForm, value: string) {
    setSettlementDrafts((current) => ({
      ...current,
      [proposalId]: {
        totalSpent: current[proposalId]?.totalSpent ?? "",
        receiptUrl: current[proposalId]?.receiptUrl ?? "",
        [field]: value
      }
    }));
  }

  async function createSettlementFromDraft(proposalId: number) {
    const draft = settlementDrafts[proposalId];
    const totalSpent = Number(draft?.totalSpent);
    const receiptUrl = draft?.receiptUrl.trim() ?? "";

    if (!Number.isFinite(totalSpent) || totalSpent <= 0 || !receiptUrl) {
      setError("Enter settlement amount and receipt URL.");
      return;
    }

    const created = await runAction(async () => {
      await api.createSettlement(proposalId, { totalSpent, receiptUrl });
    });

    if (created) {
      setSettlementDrafts((current) => ({ ...current, [proposalId]: { totalSpent: "", receiptUrl: "" } }));
    }
  }

  async function downloadExportFile(item: ExportRequest) {
    if (!item.file?.isAvailable) {
      setError("Export file is not ready yet.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const blob = await api.downloadExport(item.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.file.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      handleRequestError(err, "Cannot download export.");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refreshAll();
      return true;
    } catch (err) {
      handleRequestError(err, "Action failed.");
      return false;
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
          {canUseReportWorkflow && <NavButton icon={<FileText />} label="Reports" active={view === "reports"} onClick={() => setView("reports")} />}
          <NavButton icon={<Building2 />} label="Clubs" active={view === "clubs"} onClick={() => setView("clubs")} />
          <NavButton icon={<CalendarDays />} label="Activities" active={view === "activities"} onClick={() => setView("activities")} />
          <NavButton icon={<Trophy />} label="KPI" active={view === "kpi"} onClick={() => setView("kpi")} />
          {canUseFinanceWorkflow && <NavButton icon={<WalletCards />} label="Finance" active={view === "finance"} onClick={() => setView("finance")} />}
          {canUseReportWorkflow && <NavButton icon={<FileSpreadsheet />} label="Exports" active={view === "exports"} onClick={() => setView("exports")} />}
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
          {view === "dashboard" && (
            <Dashboard
              summary={summary}
              reports={reports}
              notifications={notifications}
              kpi={kpi}
              activities={activities}
              budgetProposals={budgetProposals}
              canUseReportWorkflow={canUseReportWorkflow}
              canUseFinanceWorkflow={canUseFinanceWorkflow}
              onNavigate={setView}
            />
          )}
          {view === "reports" && (
            canUseReportWorkflow ? (
              <ReportsView
                clubs={clubs}
                reports={reports}
                reportDraft={reportDraft}
                isAdmin={isAdmin}
                busy={busy}
                feedback={draftFeedback}
                setFeedback={setDraftFeedback}
                setReportDraftField={updateReportDraftField}
                createReport={createReportFromDraft}
                editReport={editReport}
                cancelReportEdit={cancelReportEdit}
                submit={(id) => runAction(() => api.submitReport(id).then(() => undefined))}
                review={(id) => runAction(() => api.reviewReport(id).then(() => undefined))}
                approve={(id) => runAction(() => api.approveReport(id).then(() => undefined))}
                reject={(id) => runAction(() => api.rejectReport(id, draftFeedback).then(() => undefined))}
                uploadEvidence={uploadEvidence}
              />
            ) : (
              <AccessNotice title="Reports are not available for this role." />
            )
          )}
          {view === "clubs" && (
            <ClubsView
              clubs={clubs}
              users={users}
              isAdmin={isAdmin}
              busy={busy}
              clubDraft={clubDraft}
              setClubDraftField={updateClubDraftField}
              createClub={createClubFromForm}
              toggleClubActive={toggleClubActive}
              assignManager={assignManager}
              deleteClub={deleteClub}
            />
          )}
          {view === "activities" && (
            <ActivitiesView
              clubs={clubs}
              activities={activities}
              activityDraft={activityDraft}
              participantDrafts={participantDrafts}
              busy={busy}
              canCreateActivity={canUseReportWorkflow}
              setActivityDraftField={updateActivityDraftField}
              saveActivity={saveActivity}
              editActivity={editActivity}
              addParticipant={addParticipant}
              setParticipantDraft={updateParticipantDraft}
              completeActivity={(id) => runAction(() => api.completeActivity(id).then(() => undefined))}
            />
          )}
          {view === "kpi" && <KpiView leaderboard={kpi} />}
          {view === "finance" && (
            canUseFinanceWorkflow ? (
              <FinanceView
                proposals={budgetProposals}
                busy={busy}
                canManageFinance={canUseFinanceWorkflow}
                isAdmin={isAdmin}
                clubs={clubs}
                activities={activities}
                financeDraft={financeDraft}
                settlementDrafts={settlementDrafts}
                setFinanceDraftField={updateFinanceDraftField}
                createProposal={createBudgetProposalFromForm}
                approveProposal={(id, amount) => runAction(() => api.approveBudgetProposal(id, amount).then(() => undefined))}
                rejectProposal={(id) => runAction(() => api.rejectBudgetProposal(id, "Rejected from Student Affairs dashboard.").then(() => undefined))}
                setSettlementDraft={updateSettlementDraft}
                createSettlement={createSettlementFromDraft}
                approveSettlement={(id) => runAction(() => api.approveSettlement(id, "Settlement approved from dashboard."))}
              />
            ) : (
              <AccessNotice title="Finance is not available for this role." />
            )
          )}
          {view === "exports" && (
            canUseReportWorkflow ? (
              <ExportsView
                exportsList={exportsList}
                busy={busy}
                isAdmin={isAdmin}
                createExport={(type) => runAction(() => api.createExport(type, "Consolidated", "2026-07").then(() => undefined))}
                downloadExport={downloadExportFile}
                deleteExport={(id) => runAction(() => api.deleteExport(id))}
              />
            ) : (
              <AccessNotice title="Exports are not available for this role." />
            )
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
  canUseReportWorkflow,
  canUseFinanceWorkflow,
  onNavigate
}: {
  summary: ReportSummary | null;
  reports: Report[];
  notifications: NotificationItem[];
  kpi: KpiLeaderboard | null;
  activities: ActivityItem[];
  budgetProposals: BudgetProposal[];
  canUseReportWorkflow: boolean;
  canUseFinanceWorkflow: boolean;
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
            {canUseReportWorkflow && (
              <button className="primary" type="button" onClick={() => onNavigate("reports")}>
                <FileText size={18} aria-hidden />
                Review reports
              </button>
            )}
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
        {canUseReportWorkflow && (
          <button type="button" onClick={() => onNavigate("reports")}>
            <span><ClipboardCheck size={18} aria-hidden /></span>
            <strong>Reports</strong>
            <small>{reviewCount} pending</small>
            <ArrowUpRight size={16} aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => onNavigate("kpi")}>
          <span><Trophy size={18} aria-hidden /></span>
          <strong>KPI</strong>
          <small>{topClub?.clubName ?? "No ranking"}</small>
          <ArrowUpRight size={16} aria-hidden />
        </button>
        {canUseFinanceWorkflow && (
          <button type="button" onClick={() => onNavigate("finance")}>
            <span><WalletCards size={18} aria-hidden /></span>
            <strong>Finance</strong>
            <small>{budgetProposals.filter((item) => item.status === "Submitted").length} pending</small>
            <ArrowUpRight size={16} aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => onNavigate("notifications")}>
          <span><Megaphone size={18} aria-hidden /></span>
          <strong>Signals</strong>
          <small>{unreadCount} unread</small>
          <ArrowUpRight size={16} aria-hidden />
        </button>
      </section>

      {canUseReportWorkflow && (
        <section className="panel panel-large">
          <SectionTitle icon={<FileText />} title="Recent Reports" meta={`${reports.length} loaded`} />
          <ReportList reports={reports.slice(0, 6)} />
        </section>
      )}
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
  clubs: Club[];
  reports: Report[];
  reportDraft: ReportDraftForm;
  isAdmin: boolean;
  busy: boolean;
  feedback: string;
  setFeedback: (value: string) => void;
  setReportDraftField: (field: keyof ReportDraftForm, value: string) => void;
  createReport: () => void;
  editReport: (report: Report) => void;
  cancelReportEdit: () => void;
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

  function handleCreateReport(event: FormEvent) {
    event.preventDefault();
    props.createReport();
  }

  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><ClipboardCheck size={15} aria-hidden /> Workflow</span>
          <h2>Report Workflow</h2>
          <p>{props.reports.length} reports across draft, review, and approval states.</p>
        </div>
      </div>
      <form className="report-form" onSubmit={handleCreateReport} aria-label="Create report">
        <div className="report-form-head">
          <div>
            <span className="section-kicker"><FileText size={15} aria-hidden /> New report</span>
            <h3>{props.reportDraft.editingReportId ? "Edit report content" : "Enter report content"}</h3>
          </div>
          <div className="split-actions">
            {props.reportDraft.editingReportId && (
              <button type="button" onClick={props.cancelReportEdit} disabled={props.busy}>
                Cancel edit
              </button>
            )}
            <button className="primary" type="submit" disabled={props.busy || props.clubs.length === 0}>
              <FileText size={18} aria-hidden />
              {props.reportDraft.editingReportId ? "Save report" : "Create report"}
            </button>
          </div>
        </div>
        <div className="report-form-grid">
          <label>
            Club
            <select value={props.reportDraft.clubId} onChange={(event) => props.setReportDraftField("clubId", event.target.value)} disabled={props.clubs.length === 0 || Boolean(props.reportDraft.editingReportId)}>
              {props.clubs.length === 0 ? (
                <option value="">No clubs loaded</option>
              ) : (
                props.clubs.map((club) => (
                  <option value={club.id} key={club.id}>{club.name}</option>
                ))
              )}
            </select>
          </label>
          <label>
            Report period
            <input
              type="month"
              value={props.reportDraft.period}
              onInput={(event) => props.setReportDraftField("period", event.currentTarget.value)}
              onChange={(event) => props.setReportDraftField("period", event.target.value)}
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={props.reportDraft.dueDate}
              onInput={(event) => props.setReportDraftField("dueDate", event.currentTarget.value)}
              onChange={(event) => props.setReportDraftField("dueDate", event.target.value)}
            />
          </label>
          <label>
            Activity name
            <input value={props.reportDraft.activityName} onChange={(event) => props.setReportDraftField("activityName", event.target.value)} placeholder="Monthly workshop, tournament, seminar..." />
          </label>
          <label>
            Activity date
            <input
              type="date"
              value={props.reportDraft.activityDate}
              onInput={(event) => props.setReportDraftField("activityDate", event.currentTarget.value)}
              onChange={(event) => props.setReportDraftField("activityDate", event.target.value)}
            />
          </label>
          <label>
            Participants
            <input type="number" min="0" value={props.reportDraft.participantCount} onChange={(event) => props.setReportDraftField("participantCount", event.target.value)} />
          </label>
          <label className="span-2">
            Report description
            <textarea value={props.reportDraft.description} onChange={(event) => props.setReportDraftField("description", event.target.value)} placeholder="What happened, who joined, and what evidence is attached?" />
          </label>
          <label className="span-2">
            Outcome
            <textarea value={props.reportDraft.outcome} onChange={(event) => props.setReportDraftField("outcome", event.target.value)} placeholder="Result, impact, lessons learned, or follow-up actions." />
          </label>
        </div>
      </form>
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
                <button type="button" onClick={() => props.editReport(report)} title="Edit report content" disabled={props.busy}>
                  Edit
                </button>
              )}
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

function ClubsView({
  clubs,
  users,
  isAdmin,
  busy,
  clubDraft,
  setClubDraftField,
  createClub,
  toggleClubActive,
  assignManager,
  deleteClub
}: {
  clubs: Club[];
  users: AuthResponse["user"][];
  isAdmin: boolean;
  busy: boolean;
  clubDraft: ClubForm;
  setClubDraftField: (field: keyof ClubForm, value: string) => void;
  createClub: () => void;
  toggleClubActive: (club: Club) => void;
  assignManager: (club: Club, managerUserId: number) => void;
  deleteClub: (id: number) => void;
}) {
  const managers = users.filter((user) => user.roles.includes("CLUB_MANAGER"));

  function handleCreateClub(event: FormEvent) {
    event.preventDefault();
    createClub();
  }

  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><UsersRound size={15} aria-hidden /> Club Directory</span>
          <h2>Active Clubs</h2>
          <p>{clubs.length} clubs with manager and contact information.</p>
        </div>
      </div>
      {isAdmin && (
        <form className="module-form" onSubmit={handleCreateClub} aria-label="Create club">
          <div className="module-form-head">
            <div>
              <span className="section-kicker"><Building2 size={15} aria-hidden /> Club setup</span>
              <h3>Create club</h3>
            </div>
            <button className="primary" type="submit" disabled={busy}>
              <Building2 size={18} aria-hidden />
              Create club
            </button>
          </div>
          <div className="module-form-grid">
            <label>
              Code
              <input value={clubDraft.code} onChange={(event) => setClubDraftField("code", event.target.value)} placeholder="AI, MUSIC, ROBOT" />
            </label>
            <label>
              Name
              <input value={clubDraft.name} onChange={(event) => setClubDraftField("name", event.target.value)} placeholder="Club name" />
            </label>
            <label>
              Contact email
              <input value={clubDraft.contactEmail} onChange={(event) => setClubDraftField("contactEmail", event.target.value)} placeholder="club@fpt.edu.vn" />
            </label>
            <label>
              Contact phone
              <input value={clubDraft.contactPhone} onChange={(event) => setClubDraftField("contactPhone", event.target.value)} placeholder="0900000000" />
            </label>
            <label className="span-2">
              Description
              <textarea value={clubDraft.description} onChange={(event) => setClubDraftField("description", event.target.value)} placeholder="Club mission, activities, and ownership notes." />
            </label>
          </div>
        </form>
      )}
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
            {isAdmin && (
              <div className="card-actions">
                <select aria-label={`Assign manager for ${club.name}`} defaultValue="" onChange={(event) => event.target.value && assignManager(club, Number(event.target.value))} disabled={busy || managers.length === 0}>
                  <option value="">Assign manager</option>
                  {managers.map((manager) => (
                    <option value={manager.id} key={manager.id}>{manager.fullName}</option>
                  ))}
                </select>
                <button type="button" onClick={() => toggleClubActive(club)} disabled={busy}>
                  {club.isActive ? "Deactivate" : "Activate"}
                </button>
                <button type="button" onClick={() => deleteClub(club.id)} disabled={busy}>
                  Delete
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivitiesView({
  clubs,
  activities,
  activityDraft,
  participantDrafts,
  busy,
  canCreateActivity,
  setActivityDraftField,
  saveActivity,
  editActivity,
  addParticipant,
  setParticipantDraft,
  completeActivity
}: {
  clubs: Club[];
  activities: ActivityItem[];
  activityDraft: ActivityForm;
  participantDrafts: Record<number, string>;
  busy: boolean;
  canCreateActivity: boolean;
  setActivityDraftField: (field: keyof ActivityForm, value: string) => void;
  saveActivity: () => void;
  editActivity: (activity: ActivityItem) => void;
  addParticipant: (id: number) => void;
  setParticipantDraft: (id: number, value: string) => void;
  completeActivity: (id: number) => void;
}) {
  function handleSaveActivity(event: FormEvent) {
    event.preventDefault();
    saveActivity();
  }

  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><CalendarDays size={15} aria-hidden /> Calendar</span>
          <h2>Activity Calendar</h2>
          <p>{activities.length} scheduled and completed club activities.</p>
        </div>
      </div>
      {canCreateActivity && (
        <form className="module-form" onSubmit={handleSaveActivity} aria-label="Save activity">
          <div className="module-form-head">
            <div>
              <span className="section-kicker"><CalendarDays size={15} aria-hidden /> Activity input</span>
              <h3>{activityDraft.editingActivityId ? "Edit activity" : "Create activity"}</h3>
            </div>
            <button className="primary" type="submit" disabled={busy || clubs.length === 0}>
              <CalendarDays size={18} aria-hidden />
              {activityDraft.editingActivityId ? "Save activity" : "Create activity"}
            </button>
          </div>
          <div className="module-form-grid">
            <label>
              Club
              <select value={activityDraft.clubId} onChange={(event) => setActivityDraftField("clubId", event.target.value)} disabled={clubs.length === 0}>
                {clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
              </select>
            </label>
            <label>
              Title
              <input value={activityDraft.title} onChange={(event) => setActivityDraftField("title", event.target.value)} placeholder="Workshop, event, competition..." />
            </label>
            <label>
              Location
              <input value={activityDraft.location} onChange={(event) => setActivityDraftField("location", event.target.value)} placeholder="FPTU hall, room, online link..." />
            </label>
            <label>
              Start
              <input
                type="datetime-local"
                value={activityDraft.startTime}
                onInput={(event) => setActivityDraftField("startTime", event.currentTarget.value)}
                onChange={(event) => setActivityDraftField("startTime", event.target.value)}
              />
            </label>
            <label>
              End
              <input
                type="datetime-local"
                value={activityDraft.endTime}
                onInput={(event) => setActivityDraftField("endTime", event.currentTarget.value)}
                onChange={(event) => setActivityDraftField("endTime", event.target.value)}
              />
            </label>
            <label>
              Status
              <select value={activityDraft.status} onChange={(event) => setActivityDraftField("status", event.target.value)}>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
            <label className="span-2">
              Description
              <textarea value={activityDraft.description} onChange={(event) => setActivityDraftField("description", event.target.value)} placeholder="Agenda, objective, expected outcome, organizer notes." />
            </label>
          </div>
        </form>
      )}
      <ActivityList
        activities={activities}
        canManage={canCreateActivity}
        busy={busy}
        participantDrafts={participantDrafts}
        editActivity={editActivity}
        addParticipant={addParticipant}
        setParticipantDraft={setParticipantDraft}
        completeActivity={completeActivity}
      />
    </section>
  );
}

function ActivityList({
  activities,
  canManage = false,
  busy = false,
  participantDrafts = {},
  editActivity,
  addParticipant,
  setParticipantDraft,
  completeActivity
}: {
  activities: ActivityItem[];
  canManage?: boolean;
  busy?: boolean;
  participantDrafts?: Record<number, string>;
  editActivity?: (activity: ActivityItem) => void;
  addParticipant?: (id: number) => void;
  setParticipantDraft?: (id: number, value: string) => void;
  completeActivity?: (id: number) => void;
}) {
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
          {canManage && (
            <div className="activity-actions">
              <button type="button" onClick={() => editActivity?.(activity)} disabled={busy}>Edit</button>
              {activity.status !== "Completed" && <button type="button" onClick={() => completeActivity?.(activity.id)} disabled={busy}>Complete</button>}
              <input value={participantDrafts[activity.id] ?? ""} onChange={(event) => setParticipantDraft?.(activity.id, event.target.value)} placeholder="Participant name" />
              <button type="button" onClick={() => addParticipant?.(activity.id)} disabled={busy}>Add participant</button>
            </div>
          )}
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
  clubs: Club[];
  activities: ActivityItem[];
  financeDraft: FinanceForm;
  settlementDrafts: Record<number, SettlementForm>;
  setFinanceDraftField: (field: keyof FinanceForm, value: string) => void;
  createProposal: () => void;
  approveProposal: (id: number, amount?: number) => void;
  rejectProposal: (id: number) => void;
  setSettlementDraft: (proposalId: number, field: keyof SettlementForm, value: string) => void;
  createSettlement: (proposalId: number) => void;
  approveSettlement: (id: number) => void;
}) {
  function handleCreateProposal(event: FormEvent) {
    event.preventDefault();
    props.createProposal();
  }

  const selectedClubId = Number(props.financeDraft.clubId);
  const activityOptions = props.activities.filter((activity) => activity.clubId === selectedClubId);

  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><WalletCards size={15} aria-hidden /> Finance</span>
          <h2>Budget Proposals</h2>
          <p>{props.proposals.length} proposals with requested amounts and settlement status.</p>
        </div>
      </div>
      {props.canManageFinance && (
        <form className="module-form" onSubmit={handleCreateProposal} aria-label="Create budget proposal">
          <div className="module-form-head">
            <div>
              <span className="section-kicker"><WalletCards size={15} aria-hidden /> Proposal input</span>
              <h3>Create budget proposal</h3>
            </div>
            <button className="primary" type="submit" disabled={props.busy || props.clubs.length === 0}>
              <WalletCards size={18} aria-hidden />
              Create proposal
            </button>
          </div>
          <div className="module-form-grid">
            <label>
              Club
              <select value={props.financeDraft.clubId} onChange={(event) => props.setFinanceDraftField("clubId", event.target.value)} disabled={props.clubs.length === 0}>
                {props.clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
              </select>
            </label>
            <label>
              Related activity
              <select value={props.financeDraft.activityId} onChange={(event) => props.setFinanceDraftField("activityId", event.target.value)}>
                <option value="">No activity</option>
                {activityOptions.map((activity) => <option value={activity.id} key={activity.id}>{activity.title}</option>)}
              </select>
            </label>
            <label>
              Requested amount
              <input type="number" min="1" value={props.financeDraft.requestedAmount} onChange={(event) => props.setFinanceDraftField("requestedAmount", event.target.value)} placeholder="3000000" />
            </label>
            <label className="span-2">
              Title
              <input value={props.financeDraft.title} onChange={(event) => props.setFinanceDraftField("title", event.target.value)} placeholder="Event budget, workshop supplies..." />
            </label>
            <label className="span-2">
              Description
              <textarea value={props.financeDraft.description} onChange={(event) => props.setFinanceDraftField("description", event.target.value)} placeholder="What this budget covers and why it is needed." />
            </label>
          </div>
        </form>
      )}
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
                <small>{proposal.description}</small>
                <small>{proposal.settlements.length} settlement{proposal.settlements.length === 1 ? "" : "s"}</small>
              </div>
              <div className="finance-actions">
                {props.isAdmin && proposal.status === "Submitted" && (
                  <>
                    <button type="button" disabled={props.busy} onClick={() => props.approveProposal(proposal.id, proposal.requestedAmount)} title="Approve budget proposal">
                      <CheckCircle2 size={16} aria-hidden />
                      Approve
                    </button>
                    <button type="button" disabled={props.busy} onClick={() => props.rejectProposal(proposal.id)} title="Reject budget proposal">
                      <XCircle size={16} aria-hidden />
                      Reject
                    </button>
                  </>
                )}
                {proposal.status === "Approved" && (
                  <div className="settlement-form">
                    <input type="number" min="1" value={props.settlementDrafts[proposal.id]?.totalSpent ?? ""} onChange={(event) => props.setSettlementDraft(proposal.id, "totalSpent", event.target.value)} placeholder="Spent amount" />
                    <input value={props.settlementDrafts[proposal.id]?.receiptUrl ?? ""} onChange={(event) => props.setSettlementDraft(proposal.id, "receiptUrl", event.target.value)} placeholder="Receipt URL" />
                    <button type="button" disabled={props.busy} onClick={() => props.createSettlement(proposal.id)}>Submit settlement</button>
                  </div>
                )}
                {proposal.settlements.map((settlement) => (
                  <div className="settlement-row" key={settlement.id}>
                    <span>{formatCurrency(settlement.totalSpent)} / {settlement.status}</span>
                    {settlement.receiptUrl && <a href={settlement.receiptUrl} target="_blank" rel="noreferrer">Receipt</a>}
                    {props.isAdmin && settlement.status === "Submitted" && (
                      <button type="button" disabled={props.busy} onClick={() => props.approveSettlement(settlement.id)}>
                        Approve settlement
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ExportsView({
  exportsList,
  busy,
  isAdmin,
  createExport,
  downloadExport,
  deleteExport
}: {
  exportsList: ExportRequest[];
  busy: boolean;
  isAdmin: boolean;
  createExport: (type: "PDF" | "EXCEL") => void;
  downloadExport: (item: ExportRequest) => void;
  deleteExport: (id: number) => void;
}) {
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
              <div className="card-actions">
                <button type="button" onClick={() => downloadExport(item)} disabled={busy || !item.file?.isAvailable}>
                  <Download size={16} aria-hidden />
                  Download
                </button>
                {isAdmin && (
                  <button type="button" onClick={() => deleteExport(item.id)} disabled={busy}>
                    Delete
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

function AccessNotice({ title }: { title: string }) {
  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><ShieldCheck size={15} aria-hidden /> Role access</span>
          <h2>{title}</h2>
          <p>This workspace area is hidden for the current demo role so the app does not call forbidden APIs.</p>
        </div>
      </div>
      <p className="empty">Use an Admin or Club Manager demo account for this workflow.</p>
    </section>
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
