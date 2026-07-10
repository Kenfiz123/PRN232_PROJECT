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
  ClubApplication,
  ClubMembership,
  ExportRequest,
  KpiLeaderboard,
  NotificationItem,
  Report,
  Role,
  RoleRecord,
  ReportStatus,
  ReportSummary
} from "./api";

type View = "dashboard" | "reports" | "clubs" | "activities" | "kpi" | "finance" | "exports" | "notifications" | "users";

type ReportDraftForm = {
  editingReportId?: number;
  clubId: string;
  period: string;
  reportType: string;
  tag: string;
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
  purpose: string;
  reason: string;
  contactEmail: string;
  contactPhone: string;
};

type JoinClubForm = {
  personalInfo: string;
  goals: string;
  reason: string;
};

type RegisterForm = {
  username: string;
  fullName: string;
  email: string;
  password: string;
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
const reportAuthorRoles = ["CLUB_MANAGER", "TREASURER"];
const financeWorkflowRoles = [...reportWorkflowRoles, "TREASURER"];
const reportTags = ["Activity report", "Treasury report", "Event report", "Monthly summary"];

function hasAnyRole(user: AuthResponse["user"] | null | undefined, allowedRoles: string[]) {
  return user?.roles.some((role) => allowedRoles.includes(role)) ?? false;
}

function canAccessView(view: View, access: { reports: boolean; finance: boolean; exports: boolean; admin: boolean }) {
  if (view === "reports") {
    return access.reports;
  }

  if (view === "exports") {
    return access.exports;
  }

  if (view === "finance") {
    return access.finance;
  }

  if (view === "users") {
    return access.admin;
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
    reportType: "Activity report",
    tag: "Activity report",
    dueDate: getDueDateForPeriod(period),
    activityName: "",
    activityDate: "",
    participantCount: "0",
    description: "",
    outcome: ""
  };
}

function getAvailableReportPeriod(reports: Report[], clubId: number, tag = "Activity report") {
  const usedPeriods = new Set(reports.filter((report) => report.clubId === clubId && report.tag === tag).map((report) => report.period));
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
    purpose: "",
    reason: "",
    contactEmail: "",
    contactPhone: ""
  };
}

function createJoinClubDraft(): JoinClubForm {
  return {
    personalInfo: "",
    goals: "",
    reason: ""
  };
}

function createRegisterDraft(): RegisterForm {
  return {
    username: "",
    fullName: "",
    email: "",
    password: ""
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
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("admin@club.local");
  const [password, setPassword] = useState("Admin@12345");
  const [registerDraft, setRegisterDraft] = useState<RegisterForm>(() => createRegisterDraft());
  const [clubs, setClubs] = useState<Club[]>([]);
  const [managedClubs, setManagedClubs] = useState<Club[]>([]);
  const [myMemberships, setMyMemberships] = useState<ClubMembership[]>([]);
  const [clubApplications, setClubApplications] = useState<ClubApplication[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [kpi, setKpi] = useState<KpiLeaderboard | null>(null);
  const [budgetProposals, setBudgetProposals] = useState<BudgetProposal[]>([]);
  const [exportsList, setExportsList] = useState<ExportRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [users, setUsers] = useState<AuthResponse["user"][]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftFeedback, setDraftFeedback] = useState("Please add clearer evidence and resubmit.");
  const [reportDraft, setReportDraft] = useState<ReportDraftForm>(() => createReportDraft());
  const [clubDraft, setClubDraft] = useState<ClubForm>(() => createClubDraft());
  const [activityDraft, setActivityDraft] = useState<ActivityForm>(() => createActivityDraft());
  const [financeDraft, setFinanceDraft] = useState<FinanceForm>(() => createFinanceDraft());
  const [joinDrafts, setJoinDrafts] = useState<Record<number, JoinClubForm>>({});
  const [participantDrafts, setParticipantDrafts] = useState<Record<number, string>>({});
  const [settlementDrafts, setSettlementDrafts] = useState<Record<number, SettlementForm>>({});

  const api = useMemo(() => new ApiClient(auth?.accessToken), [auth?.accessToken]);
  const isAdmin = hasAnyRole(auth?.user, adminRoles);
  const canManageUsers = hasAnyRole(auth?.user, ["ADMIN", "SYSTEM_ADMIN"]);
  const treasurerMembership = myMemberships.find((membership) => membership.status === "Approved" && membership.role === "TREASURER");
  const scopedTreasurerClub = treasurerMembership ? clubs.find((club) => club.id === treasurerMembership.clubId) : undefined;
  const scopedManagedClub = managedClubs[0];
  const reportClubScope = scopedManagedClub ?? scopedTreasurerClub;
  const canAuthorReports = hasAnyRole(auth?.user, reportAuthorRoles) || Boolean(scopedManagedClub || scopedTreasurerClub);
  const canUseReportWorkflow = isAdmin || canAuthorReports;
  const canUseFinanceWorkflow = hasAnyRole(auth?.user, financeWorkflowRoles) || Boolean(scopedTreasurerClub);
  const canUseExports = hasAnyRole(auth?.user, reportWorkflowRoles);
  const reportClubs = reportClubScope ? [reportClubScope] : clubs;
  const visibleReports = reportClubScope ? reports.filter((report) => report.clubId === reportClubScope.id) : reports;

  useEffect(() => {
    if (auth && !canAccessView(view, { reports: canUseReportWorkflow, finance: canUseFinanceWorkflow, exports: canUseExports, admin: canManageUsers })) {
      setView("dashboard");
    }
  }, [auth?.accessToken, view, canUseReportWorkflow, canUseFinanceWorkflow, canUseExports, canManageUsers]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [view]);

  useEffect(() => {
    if (reportClubs.length === 0) return;

    if (reportClubScope && reportDraft.clubId === String(reportClubScope.id)) return;
    if (!reportClubScope && reportDraft.clubId) return;

    const club = reportClubScope ?? reportClubs[0];
    const period = getAvailableReportPeriod(reports, club.id, reportDraft.tag);
    setReportDraft((current) => ({
      ...current,
      clubId: String(club.id),
      period,
      dueDate: getDueDateForPeriod(period)
    }));
  }, [reportClubs, reportClubScope, reports, reportDraft.clubId, reportDraft.tag]);

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
    const canLoadFinance = hasAnyRole(user, financeWorkflowRoles);
    const canLoadUsers = hasAnyRole(user, ["ADMIN", "SYSTEM_ADMIN"]);
    const canLoadApplications = hasAnyRole(user, adminRoles);
    const canLoadExports = hasAnyRole(user, reportWorkflowRoles);
    const [clubRows, managedRows, membershipRows, reportPage, reportSummary, activityRows, kpiRows, budgetRows, exportPage, notificationRows, userRows, roleRows, applicationRows] = await Promise.all([
      client.getClubs(),
      client.getManagedClubs(),
      client.getMyClubMemberships(),
      client.getReports(),
      client.getSummary(),
      client.getActivities(),
      client.getKpiLeaderboard("2026-07"),
      canLoadFinance ? client.getBudgetProposals() : Promise.resolve([]),
      canLoadExports ? client.getExports() : Promise.resolve({ total: 0, items: [] }),
      client.getNotifications(user),
      canLoadUsers ? client.getUsers() : Promise.resolve([]),
      canLoadUsers ? client.getRoles() : Promise.resolve([]),
      canLoadApplications ? client.getClubApplications() : Promise.resolve([])
    ]);
    setClubs(clubRows);
    setManagedClubs(managedRows);
    setMyMemberships(membershipRows);
    setReports(reportPage.items);
    setSummary(reportSummary);
    setActivities(activityRows);
    setKpi(kpiRows);
    setBudgetProposals(budgetRows);
    setExportsList(exportPage.items);
    setNotifications(notificationRows);
    setUsers(userRows);
    setRoles(roleRows);
    setClubApplications(applicationRows);
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

  function updateRegisterDraftField(field: keyof RegisterForm, value: string) {
    setRegisterDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    const payload = {
      username: registerDraft.username.trim(),
      fullName: registerDraft.fullName.trim(),
      email: registerDraft.email.trim(),
      password: registerDraft.password
    };

    if (!payload.username || !payload.fullName || !payload.email || payload.password.length < 8) {
      setError("Fill username, full name, email, and an 8+ character password.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await new ApiClient().register(payload);
      localStorage.setItem(authStorageKey, JSON.stringify(result));
      setAuth(result);
      setRegisterDraft(createRegisterDraft());
      setView("clubs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
    setManagedClubs([]);
    setMyMemberships([]);
    setClubApplications([]);
    setSummary(null);
    setActivities([]);
    setKpi(null);
    setBudgetProposals([]);
    setExportsList([]);
    setNotifications([]);
    setUsers([]);
    setRoles([]);
    setJoinDrafts({});
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
        const period = Number.isNaN(clubId) ? current.period : getAvailableReportPeriod(reports, clubId, current.tag);
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

      if (field === "tag") {
        const clubId = Number(current.clubId);
        const period = Number.isNaN(clubId) ? current.period : getAvailableReportPeriod(reports, clubId, value);
        return {
          ...current,
          tag: value,
          reportType: value,
          period,
          dueDate: getDueDateForPeriod(period)
        };
      }

      return {
        ...current,
        [field]: value
      };
    });
  }

  async function createReportFromDraft() {
    if (!canAuthorReports) return;

    const club = reportClubScope ?? clubs.find((item) => String(item.id) === reportDraft.clubId);
    const participantCount = Number(reportDraft.participantCount);
    const activityName = reportDraft.activityName.trim();
    const description = reportDraft.description.trim();
    const outcome = reportDraft.outcome.trim();
    const tag = reportDraft.tag.trim() || "Activity report";
    const reportType = reportDraft.reportType.trim() || tag;

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
          reportType,
          tag,
          dueDate: reportDraft.dueDate,
          details
        });
        return;
      }

      await api.createReport({
        clubId: club.id,
        clubName: club.name,
        period: reportDraft.period,
        reportType,
        tag,
        dueDate: reportDraft.dueDate,
        details
      });
    });

    if (created) {
      const nextPeriod = getNextPeriod(reportDraft.period);
      setReportDraft({
        ...createReportDraft(nextPeriod),
        clubId: String(club.id),
        reportType,
        tag
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
      reportType: report.reportType,
      tag: report.tag,
      dueDate: report.dueDate.slice(0, 10),
      activityName: detail?.activityName ?? "",
      activityDate: detail?.activityDate?.slice(0, 10) ?? "",
      participantCount: String(detail?.participantCount ?? 0),
      description: detail?.description ?? "",
      outcome: detail?.outcome ?? ""
    });
  }

  function cancelReportEdit() {
    const clubId = reportClubScope ? String(reportClubScope.id) : reportDraft.clubId || (clubs[0] ? String(clubs[0].id) : "");
    const period = clubId ? getAvailableReportPeriod(reports, Number(clubId), reportDraft.tag) : getNextPeriod();
    setReportDraft({
      ...createReportDraft(period),
      clubId,
      reportType: reportDraft.reportType,
      tag: reportDraft.tag
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

  async function applyForClubFromForm() {
    if (isAdmin) return;
    const payload = {
      code: clubDraft.code.trim().toUpperCase(),
      name: clubDraft.name.trim(),
      description: clubDraft.description.trim(),
      purpose: clubDraft.purpose.trim(),
      reason: clubDraft.reason.trim(),
      contactEmail: clubDraft.contactEmail.trim(),
      contactPhone: clubDraft.contactPhone.trim()
    };

    if (!payload.code || !payload.name || !payload.description || !payload.purpose || !payload.reason || !payload.contactEmail || !payload.contactPhone) {
      setError("Fill in club code, name, description, purpose, reason, email, and phone.");
      return;
    }

    const created = await runAction(async () => {
      await api.applyToCreateClub(payload);
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

  function updateJoinDraft(clubId: number, field: keyof JoinClubForm, value: string) {
    setJoinDrafts((current) => ({
      ...current,
      [clubId]: {
        ...(current[clubId] ?? createJoinClubDraft()),
        [field]: value
      }
    }));
  }

  async function joinClub(club: Club) {
    const draft = joinDrafts[club.id] ?? createJoinClubDraft();
    const payload = {
      message: `Request to join ${club.name}.`,
      personalInfo: draft.personalInfo.trim(),
      goals: draft.goals.trim(),
      reason: draft.reason.trim()
    };

    if (!payload.personalInfo || !payload.goals || !payload.reason) {
      setError("Fill in personal info, goals, and reason before requesting to join.");
      return;
    }

    await runAction(async () => {
      await api.joinClub(club.id, payload);
    });
    setJoinDrafts((current) => ({ ...current, [club.id]: createJoinClubDraft() }));
  }

  async function approveClubApplication(id: number) {
    if (!isAdmin) return;
    await runAction(async () => {
      await api.approveClubApplication(id, "Approved from admin workspace.");
    });
  }

  async function rejectClubApplication(id: number) {
    if (!isAdmin) return;
    await runAction(async () => {
      await api.rejectClubApplication(id, "Rejected from admin workspace.");
    });
  }

  async function approveMembership(id: number) {
    await runAction(async () => {
      await api.approveMembership(id, "Approved by club owner.");
    });
  }

  async function rejectMembership(id: number) {
    await runAction(async () => {
      await api.rejectMembership(id, "Rejected by club owner.");
    });
  }

  async function assignTreasurer(club: Club, membership: ClubMembership) {
    await runAction(async () => {
      await api.assignTreasurer(club.id, {
        memberUserId: membership.userId,
        memberName: membership.fullName
      });
    });
  }

  async function demoteTreasurer(membership: ClubMembership) {
    await runAction(async () => {
      await api.demoteClubMember(membership.id);
    });
  }

  async function updateUserRole(user: AuthResponse["user"], role: Role, enabled: boolean) {
    if (!isAdmin) return;
    const nextRoles = enabled
      ? Array.from(new Set([...user.roles, role]))
      : user.roles.filter((item) => item !== role);

    if (nextRoles.length === 0) {
      setError("A user must keep at least one role.");
      return;
    }

    await runAction(async () => {
      await api.updateUser(user.id, {
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        roles: nextRoles
      });
    });
  }

  async function uploadEvidence(reportId: number, file: File) {
    if (!canAuthorReports) return;
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
    setAuthMode("login");
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
            <div className="auth-switch" role="tablist" aria-label="Authentication mode">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Sign in</button>
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Register</button>
            </div>
            {authMode === "login" ? (
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
            ) : (
              <form onSubmit={handleRegister} className="login-form">
                <label>
                  Username
                  <input value={registerDraft.username} onChange={(event) => updateRegisterDraftField("username", event.target.value)} autoComplete="username" />
                </label>
                <label>
                  Full name
                  <input value={registerDraft.fullName} onChange={(event) => updateRegisterDraftField("fullName", event.target.value)} autoComplete="name" />
                </label>
                <label>
                  Email
                  <input value={registerDraft.email} onChange={(event) => updateRegisterDraftField("email", event.target.value)} autoComplete="email" />
                </label>
                <label>
                  Password
                  <input value={registerDraft.password} onChange={(event) => updateRegisterDraftField("password", event.target.value)} type="password" autoComplete="new-password" />
                </label>
                {error && <div className="alert">{error}</div>}
                <button className="primary" type="submit" disabled={busy}>
                  <UsersRound size={18} aria-hidden />
                  Create member account
                </button>
              </form>
            )}
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
          {canUseExports && <NavButton icon={<FileSpreadsheet />} label="Exports" active={view === "exports"} onClick={() => setView("exports")} />}
          <NavButton icon={<Bell />} label="Notifications" active={view === "notifications"} onClick={() => setView("notifications")} />
          {canManageUsers && <NavButton icon={<UserRoundCog />} label="Users" active={view === "users"} onClick={() => setView("users")} />}
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
              canAuthorReports={canAuthorReports}
              canUseFinanceWorkflow={canUseFinanceWorkflow}
              onNavigate={setView}
            />
          )}
          {view === "reports" && (
            canUseReportWorkflow ? (
              <ReportsView
                clubs={reportClubs}
                reports={visibleReports}
                scopedClub={reportClubScope}
                reportDraft={reportDraft}
                isAdmin={isAdmin}
                canAuthorReports={canAuthorReports}
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
              currentUser={auth.user}
              managedClubs={managedClubs}
              myMemberships={myMemberships}
              joinDrafts={joinDrafts}
              applications={clubApplications}
              isAdmin={isAdmin}
              busy={busy}
              clubDraft={clubDraft}
              setClubDraftField={updateClubDraftField}
              createClub={createClubFromForm}
              applyForClub={applyForClubFromForm}
              toggleClubActive={toggleClubActive}
              assignManager={assignManager}
              joinClub={joinClub}
              setJoinDraftField={updateJoinDraft}
              approveApplication={approveClubApplication}
              rejectApplication={rejectClubApplication}
              approveMembership={approveMembership}
              rejectMembership={rejectMembership}
              assignTreasurer={assignTreasurer}
              demoteTreasurer={demoteTreasurer}
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
              canCreateActivity={canAuthorReports}
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
            canUseExports ? (
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
          {view === "users" && (
            canManageUsers ? (
              <UsersView
                users={users}
                roles={roles}
                busy={busy}
                updateUserRole={updateUserRole}
              />
            ) : (
              <AccessNotice title="Users are not available for this role." />
            )
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
  canAuthorReports,
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
  canAuthorReports: boolean;
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
                {canAuthorReports ? "Create report" : "Review reports"}
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
  scopedClub?: Club;
  reportDraft: ReportDraftForm;
  isAdmin: boolean;
  canAuthorReports: boolean;
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
      {props.canAuthorReports ? (
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
              {props.scopedClub ? (
                <input value={props.scopedClub.name} readOnly />
              ) : (
                <select value={props.reportDraft.clubId} onChange={(event) => props.setReportDraftField("clubId", event.target.value)} disabled={props.clubs.length === 0 || Boolean(props.reportDraft.editingReportId)}>
                  {props.clubs.length === 0 ? (
                    <option value="">No clubs loaded</option>
                  ) : (
                    props.clubs.map((club) => (
                      <option value={club.id} key={club.id}>{club.name}</option>
                    ))
                  )}
                </select>
              )}
            </label>
            <label>
              Report tag
              <select value={props.reportDraft.tag} onChange={(event) => props.setReportDraftField("tag", event.target.value)}>
                {reportTags.map((tag) => <option value={tag} key={tag}>{tag}</option>)}
              </select>
            </label>
            <label>
              Report type
              <input value={props.reportDraft.reportType} onChange={(event) => props.setReportDraftField("reportType", event.target.value)} placeholder="Treasury report, activity report..." />
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
      ) : (
        <div className="role-note">
          <ShieldCheck size={17} aria-hidden />
          <span>Student Affairs/Admin reviews submitted reports here; club owners and treasurers create reports from their own club workspace.</span>
        </div>
      )}
      {props.isAdmin && (
        <div className="feedback-row inline-field">
        <label>
          Rejection feedback
          <input value={props.feedback} onChange={(event) => props.setFeedback(event.target.value)} />
        </label>
        </div>
      )}
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
                <small>{report.tag}</small>
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
              {props.canAuthorReports && (
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
              )}
              {props.canAuthorReports && (report.status === "Draft" || report.status === "Rejected") && (
                <button type="button" onClick={() => props.editReport(report)} title="Edit report content" disabled={props.busy}>
                  Edit
                </button>
              )}
              {props.canAuthorReports && (report.status === "Draft" || report.status === "Rejected") && (
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
  currentUser,
  managedClubs,
  myMemberships,
  joinDrafts,
  applications,
  isAdmin,
  busy,
  clubDraft,
  setClubDraftField,
  createClub,
  applyForClub,
  toggleClubActive,
  assignManager,
  joinClub,
  setJoinDraftField,
  approveApplication,
  rejectApplication,
  approveMembership,
  rejectMembership,
  assignTreasurer,
  demoteTreasurer,
  deleteClub
}: {
  clubs: Club[];
  users: AuthResponse["user"][];
  currentUser: AuthResponse["user"];
  managedClubs: Club[];
  myMemberships: ClubMembership[];
  joinDrafts: Record<number, JoinClubForm>;
  applications: ClubApplication[];
  isAdmin: boolean;
  busy: boolean;
  clubDraft: ClubForm;
  setClubDraftField: (field: keyof ClubForm, value: string) => void;
  createClub: () => void;
  applyForClub: () => void;
  toggleClubActive: (club: Club) => void;
  assignManager: (club: Club, managerUserId: number) => void;
  joinClub: (club: Club) => void;
  setJoinDraftField: (clubId: number, field: keyof JoinClubForm, value: string) => void;
  approveApplication: (id: number) => void;
  rejectApplication: (id: number) => void;
  approveMembership: (id: number) => void;
  rejectMembership: (id: number) => void;
  assignTreasurer: (club: Club, membership: ClubMembership) => void;
  demoteTreasurer: (membership: ClubMembership) => void;
  deleteClub: (id: number) => void;
}) {
  const managers = users.filter((user) => user.roles.includes("CLUB_MANAGER"));
  const ownedClubIds = new Set(managedClubs.map((club) => club.id));
  const myMembershipByClub = new Map(myMemberships.map((membership) => [membership.clubId, membership]));
  const pendingApplications = applications.filter((application) => application.status === "Submitted");

  function handleCreateClub(event: FormEvent) {
    event.preventDefault();
    if (isAdmin) {
      createClub();
      return;
    }

    applyForClub();
  }

  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><UsersRound size={15} aria-hidden /> Club Directory</span>
          <h2>Active Clubs</h2>
          <p>{clubs.length} clubs with ownership, membership, and treasury delegation.</p>
        </div>
      </div>
      {isAdmin && pendingApplications.length > 0 && (
        <div className="workflow-strip" aria-label="Club creation applications">
          {pendingApplications.map((application) => (
            <article className="workflow-card application-card" key={application.id}>
              <div className="application-card-head">
                <span className="section-kicker"><Building2 size={14} aria-hidden /> Club application</span>
                <strong>{application.name}</strong>
                <small>{application.code} requested by {application.requesterName}</small>
              </div>
              <div className="application-detail-grid">
                <div>
                  <span>Contact</span>
                  <strong>{application.contactEmail}</strong>
                  <small>{application.contactPhone}</small>
                </div>
                <div>
                  <span>Submitted</span>
                  <strong>{new Date(application.submittedAtUtc).toLocaleDateString()}</strong>
                  <small>{application.status}</small>
                </div>
              </div>
              <dl className="application-detail-list">
                <div><dt>Description</dt><dd>{application.description || "Not provided"}</dd></div>
                <div><dt>Purpose</dt><dd>{application.purpose || "Not provided"}</dd></div>
                <div><dt>Reason</dt><dd>{application.reason || "Not provided"}</dd></div>
              </dl>
              <div className="card-actions">
                <button type="button" onClick={() => approveApplication(application.id)} disabled={busy}>
                  <CheckCircle2 size={16} aria-hidden />
                  Approve
                </button>
                <button type="button" onClick={() => rejectApplication(application.id)} disabled={busy}>
                  <XCircle size={16} aria-hidden />
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {(isAdmin || managedClubs.length === 0) && (
        <form className="module-form" onSubmit={handleCreateClub} aria-label={isAdmin ? "Create club" : "Apply to create club"}>
          <div className="module-form-head">
            <div>
              <span className="section-kicker"><Building2 size={15} aria-hidden /> Club setup</span>
              <h3>{isAdmin ? "Create club" : "Apply to create a club"}</h3>
            </div>
            <button className="primary" type="submit" disabled={busy}>
              <Building2 size={18} aria-hidden />
              {isAdmin ? "Create club" : "Submit application"}
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
            {!isAdmin && (
              <>
                <label className="span-2">
                  Purpose
                  <textarea value={clubDraft.purpose} onChange={(event) => setClubDraftField("purpose", event.target.value)} placeholder="What value will this club bring to students and campus life?" />
                </label>
                <label className="span-2">
                  Reason
                  <textarea value={clubDraft.reason} onChange={(event) => setClubDraftField("reason", event.target.value)} placeholder="Why should Student Affairs approve this club now?" />
                </label>
              </>
            )}
          </div>
        </form>
      )}
      <div className="list-grid club-grid">
        {clubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            currentUser={currentUser}
            managers={managers}
            isAdmin={isAdmin}
            isOwner={ownedClubIds.has(club.id)}
            busy={busy}
            myMembership={myMembershipByClub.get(club.id)}
            joinDraft={joinDrafts[club.id] ?? createJoinClubDraft()}
            assignManager={assignManager}
            toggleClubActive={toggleClubActive}
            deleteClub={deleteClub}
            joinClub={joinClub}
            setJoinDraftField={setJoinDraftField}
            approveMembership={approveMembership}
            rejectMembership={rejectMembership}
            assignTreasurer={assignTreasurer}
            demoteTreasurer={demoteTreasurer}
          />
        ))}
      </div>
    </section>
  );
}

function ClubCard({
  club,
  currentUser,
  managers,
  isAdmin,
  isOwner,
  busy,
  myMembership,
  joinDraft,
  assignManager,
  toggleClubActive,
  deleteClub,
  joinClub,
  setJoinDraftField,
  approveMembership,
  rejectMembership,
  assignTreasurer,
  demoteTreasurer
}: {
  club: Club;
  currentUser: AuthResponse["user"];
  managers: AuthResponse["user"][];
  isAdmin: boolean;
  isOwner: boolean;
  busy: boolean;
  myMembership?: ClubMembership;
  joinDraft: JoinClubForm;
  assignManager: (club: Club, managerUserId: number) => void;
  toggleClubActive: (club: Club) => void;
  deleteClub: (id: number) => void;
  joinClub: (club: Club) => void;
  setJoinDraftField: (clubId: number, field: keyof JoinClubForm, value: string) => void;
  approveMembership: (id: number) => void;
  rejectMembership: (id: number) => void;
  assignTreasurer: (club: Club, membership: ClubMembership) => void;
  demoteTreasurer: (membership: ClubMembership) => void;
}) {
  const activeManager = club.managers.find((manager) => manager.isActive);
  const members = club.members ?? [];
  const pendingMembers = members.filter((member) => member.status === "Pending");
  const approvedMembers = members.filter((member) => member.status === "Approved");
  const treasurers = approvedMembers.filter((member) => member.role === "TREASURER");
  const canManageMembers = isAdmin || isOwner;
  const canJoin = !isAdmin && !isOwner && !myMembership && club.isActive;
  const isCurrentUserInClub = currentUser.id === activeManager?.managerUserId || Boolean(myMembership);

  return (
    <article className="item-card club-card">
      <div className="club-card-head">
        <span className="club-avatar">{club.code.slice(0, 2)}</span>
        <div>
          <strong>{club.name}</strong>
          <small>{club.code}</small>
        </div>
        <StatusBadgeLike status={club.isActive ? "Active" : "Inactive"} />
      </div>
      <p>{club.description}</p>
      <dl>
        <div><dt>Email</dt><dd>{club.contactEmail}</dd></div>
        <div><dt>Phone</dt><dd>{club.contactPhone}</dd></div>
        <div><dt>Owner</dt><dd>{activeManager?.managerName ?? "Unassigned"}</dd></div>
        <div><dt>Members</dt><dd>{approvedMembers.length} approved / {pendingMembers.length} pending</dd></div>
      </dl>
      {!isAdmin && (
        <div className="membership-state">
          {isOwner && <span className="badge success">Owner</span>}
          {myMembership && <span className={`badge ${myMembership.status === "Approved" ? "success" : myMembership.status === "Pending" ? "info" : "danger"}`}>{myMembership.role} / {myMembership.status}</span>}
          {!isCurrentUserInClub && <span className="muted-text">Not joined</span>}
        </div>
      )}
      {canJoin && (
        <form className="join-request-form" onSubmit={(event) => {
          event.preventDefault();
          joinClub(club);
        }}>
          <div className="join-request-head">
            <span><UsersRound size={15} aria-hidden /> Join request</span>
            <small>Sent to the club owner for review</small>
          </div>
          <label>
            Personal info
            <textarea value={joinDraft.personalInfo} onChange={(event) => setJoinDraftField(club.id, "personalInfo", event.target.value)} placeholder="Student ID, class, phone, current skills..." />
          </label>
          <label>
            Goals
            <textarea value={joinDraft.goals} onChange={(event) => setJoinDraftField(club.id, "goals", event.target.value)} placeholder="What do you want to learn or contribute?" />
          </label>
          <label>
            Reason
            <textarea value={joinDraft.reason} onChange={(event) => setJoinDraftField(club.id, "reason", event.target.value)} placeholder="Why this club fits you." />
          </label>
          <button className="secondary" type="submit" disabled={busy}>
            <Send size={16} aria-hidden />
            Request to join
          </button>
        </form>
      )}
      {isAdmin && (
        <div className="card-actions">
          <select aria-label={`Assign manager for ${club.name}`} defaultValue="" onChange={(event) => event.target.value && assignManager(club, Number(event.target.value))} disabled={busy || managers.length === 0}>
            <option value="">Assign owner</option>
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
      {canManageMembers && (
        <div className="member-panel">
          <div className="member-panel-head">
            <strong>Membership workflow</strong>
            <span>{treasurers.length}/2 treasurers</span>
          </div>
          {pendingMembers.length > 0 && (
            <div className="member-list">
              {pendingMembers.map((member) => (
                <div className="member-row member-row-detail" key={member.id}>
                  <div className="member-request-copy">
                    <span>{member.fullName}</span>
                    <small>{member.requestMessage ?? "No message"}</small>
                    <dl className="member-request-detail">
                      <div><dt>Personal info</dt><dd>{member.personalInfo || "Not provided"}</dd></div>
                      <div><dt>Goals</dt><dd>{member.goals || "Not provided"}</dd></div>
                      <div><dt>Reason</dt><dd>{member.reason || "Not provided"}</dd></div>
                    </dl>
                  </div>
                  <div className="member-request-actions">
                    <button type="button" onClick={() => approveMembership(member.id)} disabled={busy}>Approve</button>
                    <button type="button" onClick={() => rejectMembership(member.id)} disabled={busy}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="member-list">
            {approvedMembers.map((member) => (
              <div className="member-row" key={member.id}>
                <span>{member.fullName}</span>
                <StatusBadgeLike status={member.role} />
                {member.role === "TREASURER" ? (
                  <button type="button" onClick={() => demoteTreasurer(member)} disabled={busy}>Make member</button>
                ) : (
                  <button type="button" onClick={() => assignTreasurer(club, member)} disabled={busy || treasurers.length >= 2}>Assign treasurer</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
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

function UsersView({
  users,
  roles,
  busy,
  updateUserRole
}: {
  users: AuthResponse["user"][];
  roles: RoleRecord[];
  busy: boolean;
  updateUserRole: (user: AuthResponse["user"], role: Role, enabled: boolean) => void;
}) {
  const roleOptions = (roles.length > 0 ? roles.map((role) => role.name) : [
    "ADMIN",
    "SYSTEM_ADMIN",
    "STUDENT_AFFAIRS_ADMIN",
    "CLUB_MANAGER",
    "TREASURER",
    "CLUB_MEMBER"
  ]) as Role[];

  return (
    <section className="surface">
      <div className="surface-head">
        <div>
          <span className="section-kicker"><UserRoundCog size={15} aria-hidden /> Access control</span>
          <h2>Users & Roles</h2>
          <p>{users.length} accounts with editable role assignments.</p>
        </div>
      </div>
      <div className="user-role-list">
        {users.map((user) => (
          <article className="user-role-card" key={user.id}>
            <div>
              <strong>{user.fullName}</strong>
              <small>{user.email}</small>
              <StatusBadgeLike status={user.isActive && !user.isLocked ? "Active" : "Locked"} />
            </div>
            <div className="role-toggle-grid">
              {roleOptions.map((role) => (
                <label key={role} className="role-toggle">
                  <input
                    type="checkbox"
                    checked={user.roles.includes(role)}
                    disabled={busy}
                    onChange={(event) => updateUserRole(user, role, event.currentTarget.checked)}
                  />
                  <span>{role.split("_").join(" ")}</span>
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>
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
    notifications: "Notifications",
    users: "Users"
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
    notifications: "Resolve workflow signals before they pile up.",
    users: "Manage account roles, access, and workflow ownership."
  }[view];
}
