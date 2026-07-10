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
import clubHubCommunity from "./assets/club-hub-community-v2.webp";
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

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const authStorageKey = "clubreport.auth";
const sessionExpiredMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
const adminRoles = ["ADMIN", "SYSTEM_ADMIN", "STUDENT_AFFAIRS_ADMIN"];
const reportWorkflowRoles = [...adminRoles, "CLUB_MANAGER"];
const reportAuthorRoles = ["CLUB_MANAGER", "TREASURER"];
const financeWorkflowRoles = [...reportWorkflowRoles, "TREASURER"];
const reportTags = ["Activity report", "Treasury report", "Event report", "Monthly summary"];
const presetAccounts = [
  { label: "Quản trị viên", username: "admin@club.local", password: "Admin@12345" },
  { label: "Chủ nhiệm CLB", username: "manager@club.local", password: "Manager@12345" },
  { label: "Công tác sinh viên", username: "studentaffairs@club.local", password: "StudentAffairs@12345" },
  { label: "Thủ quỹ", username: "treasurer@club.local", password: "Treasurer@12345" },
  { label: "Thành viên", username: "student@club.local", password: "Student@12345" }
];

const reportTagLabels: Record<string, string> = {
  "Activity report": "Báo cáo hoạt động",
  "Treasury report": "Báo cáo thủ quỹ",
  "Event report": "Báo cáo sự kiện",
  "Monthly summary": "Tổng kết tháng"
};

const statusLabels: Record<string, string> = {
  Active: "Đang hoạt động",
  Inactive: "Tạm ngưng",
  Draft: "Bản nháp",
  Submitted: "Đã gửi",
  "Under Review": "Đang duyệt",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Pending: "Chờ duyệt",
  Completed: "Hoàn tất",
  Cancelled: "Đã hủy",
  Scheduled: "Đã lên lịch",
  Failed: "Lỗi",
  Settled: "Đã quyết toán",
  Locked: "Đã khóa"
};

const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên",
  SYSTEM_ADMIN: "Quản trị hệ thống",
  STUDENT_AFFAIRS_ADMIN: "Quản trị công tác sinh viên",
  CLUB_MANAGER: "Chủ nhiệm câu lạc bộ",
  TREASURER: "Thủ quỹ",
  CLUB_MEMBER: "Thành viên câu lạc bộ",
  MEMBER: "Thành viên"
};

function displayStatus(status: string) {
  return statusLabels[status] ?? status;
}

function displayReportTag(tag: string) {
  return reportTagLabels[tag] ?? tag;
}

function displayRole(role: string) {
  return roleLabels[role] ?? role.split("_").join(" ");
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function requestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return {
      400: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.",
      401: sessionExpiredMessage,
      403: "Bạn không có quyền thực hiện thao tác này.",
      404: "Không tìm thấy dữ liệu được yêu cầu.",
      409: "Dữ liệu đã thay đổi hoặc đang bị trùng. Vui lòng tải lại và thử lại.",
      500: "Máy chủ đang gặp sự cố. Vui lòng thử lại sau."
    }[error.status] ?? `Yêu cầu thất bại (HTTP ${error.status}).`;
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return "Không thể kết nối tới máy chủ. Vui lòng kiểm tra các dịch vụ đang chạy.";
  }

  return error instanceof Error ? error.message : fallback;
}

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
    reportType: "Báo cáo hoạt động",
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
  const [draftFeedback, setDraftFeedback] = useState("Vui lòng bổ sung minh chứng rõ ràng hơn và gửi lại báo cáo.");
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
    if (!auth) return;
    window.history.replaceState(null, "", window.location.pathname);
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0 }));
    return () => window.cancelAnimationFrame(frame);
  }, [auth?.accessToken]);

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
          handleRequestError(err, "Không tải được dữ liệu tổng quan.");
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
      client.getKpiLeaderboard(formatMonth(new Date())),
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
      handleRequestError(err, "Không tải được dữ liệu tổng quan.");
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
      setError(err instanceof ApiError && err.status === 401 ? "Sai tài khoản hoặc mật khẩu." : requestErrorMessage(err, "Đăng nhập thất bại."));
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
      setError("Vui lòng nhập tài khoản, họ tên, email và mật khẩu tối thiểu 8 ký tự.");
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
      setError(requestErrorMessage(err, "Đăng ký thất bại."));
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

    setError(requestErrorMessage(err, fallback));
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
          reportType: displayReportTag(value),
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
      setError("Vui lòng chọn câu lạc bộ trước khi tạo báo cáo.");
      return;
    }

    if (!reportDraft.period || !reportDraft.dueDate || !reportDraft.activityDate || !activityName || !description || !outcome) {
      setError("Vui lòng nhập đủ câu lạc bộ, kỳ báo cáo, ngày, hoạt động, mô tả và kết quả.");
      return;
    }

    if (!Number.isInteger(participantCount) || participantCount < 0) {
      setError("Số người tham gia phải là số nguyên không âm.");
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
      reportType: displayReportTag(report.reportType),
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
      setError("Vui lòng nhập mã, tên, mô tả, email và số điện thoại của câu lạc bộ.");
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
      setError("Vui lòng nhập đủ mã, tên, mô tả, mục đích, lý do, email và số điện thoại.");
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
      message: `Đơn xin tham gia ${club.name}.`,
      personalInfo: draft.personalInfo.trim(),
      goals: draft.goals.trim(),
      reason: draft.reason.trim()
    };

    if (!payload.personalInfo || !payload.goals || !payload.reason) {
      setError("Vui lòng nhập thông tin cá nhân, mục tiêu và lý do trước khi gửi đơn tham gia.");
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
      await api.approveClubApplication(id, "Đã duyệt từ khu vực quản trị.");
    });
  }

  async function rejectClubApplication(id: number) {
    if (!isAdmin) return;
    await runAction(async () => {
      await api.rejectClubApplication(id, "Đã từ chối từ khu vực quản trị.");
    });
  }

  async function approveMembership(id: number) {
    await runAction(async () => {
      await api.approveMembership(id, "Chủ nhiệm câu lạc bộ đã duyệt.");
    });
  }

  async function rejectMembership(id: number) {
    await runAction(async () => {
      await api.rejectMembership(id, "Chủ nhiệm câu lạc bộ đã từ chối.");
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
      setError("Mỗi người dùng phải có ít nhất một vai trò.");
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
      setError("Vui lòng nhập đủ câu lạc bộ, tên hoạt động, thời gian, địa điểm và mô tả.");
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
      setError("Vui lòng nhập tên người tham gia.");
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
      setError("Vui lòng nhập câu lạc bộ, tiêu đề, mô tả và số tiền đề xuất lớn hơn 0.");
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
      setError("Vui lòng nhập số tiền quyết toán và đường dẫn biên lai.");
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
      setError("File xuất chưa sẵn sàng. Vui lòng thử lại sau.");
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
      handleRequestError(err, "Không tải được file xuất.");
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
      handleRequestError(err, "Thao tác thất bại.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!auth) {
    return (
      <main className="landing-page">
        <header className="landing-nav">
          <a className="landing-brand" href="#top" aria-label="Trang chủ FPTU Club Hub">
            <span><Building2 size={23} aria-hidden /></span>
            <div>
              <strong>FPTU Club Hub</strong>
              <small>Cổng quản lý và báo cáo</small>
            </div>
          </a>
          <nav aria-label="Điều hướng trang giới thiệu">
            <a href="#features">Tính năng</a>
            <a href="#workflow">Quy trình</a>
            <a href="#login">Đăng nhập</a>
          </nav>
          <a className="landing-nav-cta" href="#login">Mở hệ thống</a>
        </header>

        <section id="top" className="landing-hero">
          <img className="landing-hero-media" src={landingProduct} alt="Giao diện tổng quan FPTU Club Hub trên máy tính và máy tính bảng" />
          <div className="landing-copy">
            <span className="landing-eyebrow"><Sparkles size={15} aria-hidden /> Dành cho công tác sinh viên</span>
            <h1>FPTU Club Hub</h1>
            <p>Quản lý câu lạc bộ, báo cáo, KPI, lịch hoạt động, ngân sách và thông báo trong một workspace thống nhất.</p>
            <div className="landing-actions">
              <a className="landing-button landing-primary" href="#login">
                <LogIn size={18} aria-hidden />
                Đăng nhập
              </a>
              <a className="landing-button" href="#features">
                <ArrowUpRight size={18} aria-hidden />
                Khám phá sản phẩm
              </a>
            </div>
            <div className="landing-proof" aria-label="Điểm nổi bật của sản phẩm">
              <span><strong>8</strong> dịch vụ</span>
              <span><strong>5</strong> vai trò</span>
              <span><strong>1</strong> trung tâm vận hành</span>
            </div>
          </div>
          <div className="product-chip chip-kpi">
            <Trophy size={18} aria-hidden />
            KPI trực tiếp
          </div>
          <div className="product-chip chip-budget">
            <WalletCards size={18} aria-hidden />
            Sẵn sàng duyệt ngân sách
          </div>
        </section>

        <section id="features" className="landing-section landing-features">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Các phân hệ</span>
            <h2>Mọi quy trình câu lạc bộ trong một nơi.</h2>
            <p>Được thiết kế theo nghiệp vụ công tác sinh viên và hoạt động thực tế của từng câu lạc bộ.</p>
          </div>
          <div className="landing-feature-grid">
            <article>
              <FileText size={22} aria-hidden />
              <h3>Luồng báo cáo</h3>
              <p>Tạo, gửi, duyệt, từ chối và đính kèm minh chứng với trạng thái rõ ràng.</p>
            </article>
            <article>
              <Trophy size={22} aria-hidden />
              <h3>Bảng xếp hạng KPI</h3>
              <p>Chuyển dữ liệu tham gia và báo cáo đã duyệt thành thứ hạng dễ theo dõi.</p>
            </article>
            <article>
              <WalletCards size={22} aria-hidden />
              <h3>Theo dõi tài chính</h3>
              <p>Đề xuất ngân sách và quyết toán luôn gắn với hoạt động của câu lạc bộ.</p>
            </article>
            <article>
              <Bell size={22} aria-hidden />
              <h3>Thông báo đúng việc</h3>
              <p>Quản trị viên, chủ nhiệm, thủ quỹ và thành viên luôn nắm được bước tiếp theo.</p>
            </article>
          </div>
        </section>

        <section id="workflow" className="landing-section landing-workflow">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Quy trình</span>
            <h2>Từ minh chứng hoạt động đến báo cáo sẵn sàng phê duyệt.</h2>
          </div>
          <div className="workflow-steps">
            <article>
              <span>01</span>
              <h3>Ghi nhận</h3>
              <p>Câu lạc bộ lưu hoạt động, người tham gia, minh chứng và kết quả tại một nơi.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Kiểm duyệt</h3>
              <p>Công tác sinh viên kiểm tra báo cáo, phản hồi và cập nhật trạng thái xử lý.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Ra quyết định</h3>
              <p>KPI, ngân sách, quyết toán, file tổng hợp và thông báo khép kín toàn bộ quy trình.</p>
            </article>
          </div>
        </section>

        <section id="login" className="landing-section landing-access">
          <div className="landing-access-copy">
            <span className="landing-eyebrow">Truy cập hệ thống</span>
            <h2>Bắt đầu bằng tài khoản của bạn.</h2>
            <p>Tài khoản mới mặc định là thành viên. Quyền quản trị, chủ nhiệm và thủ quỹ được cấp theo đúng quy trình.</p>
          </div>
          <div className="landing-login-panel">
            <div className="auth-switch" role="tablist" aria-label="Chế độ xác thực">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Đăng nhập</button>
              <button type="button" className={authMode === "register" ? "active" : ""} onClick={() => setAuthMode("register")}>Đăng ký</button>
            </div>
            {authMode === "login" ? (
              <form onSubmit={handleLogin} className="login-form">
                <label>
                  Tài khoản
                  <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
                </label>
                <label>
                  Mật khẩu
                  <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
                </label>
                {error && <div className="alert">{error}</div>}
                <button className="primary" type="submit" disabled={busy}>
                  <LogIn size={18} aria-hidden />
                  {busy ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="login-form">
                <label>
                  Tài khoản
                  <input value={registerDraft.username} onChange={(event) => updateRegisterDraftField("username", event.target.value)} autoComplete="username" />
                </label>
                <label>
                  Họ và tên
                  <input value={registerDraft.fullName} onChange={(event) => updateRegisterDraftField("fullName", event.target.value)} autoComplete="name" />
                </label>
                <label>
                  Email
                  <input value={registerDraft.email} onChange={(event) => updateRegisterDraftField("email", event.target.value)} autoComplete="email" />
                </label>
                <label>
                  Mật khẩu
                  <input value={registerDraft.password} onChange={(event) => updateRegisterDraftField("password", event.target.value)} type="password" autoComplete="new-password" />
                </label>
                {error && <div className="alert">{error}</div>}
                <button className="primary" type="submit" disabled={busy}>
                  <UsersRound size={18} aria-hidden />
                  {busy ? "Đang tạo tài khoản..." : "Tạo tài khoản thành viên"}
                </button>
              </form>
            )}
            <div className="account-row" aria-label="Tài khoản có sẵn">
              {presetAccounts.map((account) => (
                <button
                  type="button"
                  key={account.username}
                  onClick={() => {
                    setAuthMode("login");
                    setUsername(account.username);
                    setPassword(account.password);
                  }}
                >
                  {account.label}
                </button>
              ))}
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
            <span>Cổng quản lý</span>
          </div>
        </div>
        <nav aria-label="Điều hướng chính">
          <NavButton icon={<Gauge />} label="Tổng quan" active={view === "dashboard"} onClick={() => setView("dashboard")} />
          {canUseReportWorkflow && <NavButton icon={<FileText />} label="Báo cáo" active={view === "reports"} onClick={() => setView("reports")} />}
          <NavButton icon={<Building2 />} label="Câu lạc bộ" active={view === "clubs"} onClick={() => setView("clubs")} />
          <NavButton icon={<CalendarDays />} label="Hoạt động" active={view === "activities"} onClick={() => setView("activities")} />
          <NavButton icon={<Trophy />} label="KPI" active={view === "kpi"} onClick={() => setView("kpi")} />
          {canUseFinanceWorkflow && <NavButton icon={<WalletCards />} label="Tài chính" active={view === "finance"} onClick={() => setView("finance")} />}
          {canUseExports && <NavButton icon={<FileSpreadsheet />} label="Xuất file" active={view === "exports"} onClick={() => setView("exports")} />}
          <NavButton icon={<Bell />} label="Thông báo" active={view === "notifications"} onClick={() => setView("notifications")} />
          {canManageUsers && <NavButton icon={<UserRoundCog />} label="Người dùng" active={view === "users"} onClick={() => setView("users")} />}
        </nav>
        <div className="sidebar-card">
          <span><ShieldCheck size={14} aria-hidden /> Đã đăng nhập</span>
          <strong>{auth.user.fullName}</strong>
          <small>{displayRole(auth.user.roles[0])}</small>
        </div>
        <button className="ghost logout" type="button" onClick={logout} title="Đăng xuất" aria-label="Đăng xuất">
          <LogOut size={18} aria-hidden />
          Đăng xuất
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="page-title">
            <span className="workspace-label"><span className="status-dot" /> Hệ thống đang hoạt động</span>
            <h1>{viewLabel(view)}</h1>
            <p>{viewSubtitle(view)}</p>
          </div>
          <div className="topbar-actions">
            <span className="user-chip">
              <UserRoundCog size={17} aria-hidden />
              {auth.user.fullName}
              <span className="role-pill">{auth.user.roles.map(displayRole).join(", ")}</span>
            </span>
            <button className="secondary" type="button" onClick={refreshAll} disabled={busy} title="Làm mới dữ liệu">
              <RefreshCcw className={busy ? "spin" : undefined} size={18} aria-hidden />
              Làm mới
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
              <AccessNotice title="Vai trò hiện tại không có quyền truy cập báo cáo." />
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
                rejectProposal={(id) => runAction(() => api.rejectBudgetProposal(id, "Đề xuất bị từ chối bởi quản trị công tác sinh viên.").then(() => undefined))}
                setSettlementDraft={updateSettlementDraft}
                createSettlement={createSettlementFromDraft}
                approveSettlement={(id) => runAction(() => api.approveSettlement(id, "Quyết toán đã được phê duyệt trên hệ thống."))}
              />
            ) : (
              <AccessNotice title="Vai trò hiện tại không có quyền truy cập tài chính." />
            )
          )}
          {view === "exports" && (
            canUseExports ? (
              <ExportsView
                exportsList={exportsList}
                busy={busy}
                isAdmin={isAdmin}
                createExport={(type) => runAction(() => api.createExport(type, "Consolidated", formatMonth(new Date())).then(() => undefined))}
                downloadExport={downloadExportFile}
                deleteExport={(id) => runAction(() => api.deleteExport(id))}
              />
            ) : (
              <AccessNotice title="Vai trò hiện tại không có quyền xuất file." />
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
              <AccessNotice title="Vai trò hiện tại không có quyền quản lý người dùng." />
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
    { label: "Báo cáo", value: summary?.total ?? 0, hint: `${summary?.approved ?? 0} đã duyệt`, tone: "teal", icon: <FileText /> },
    { label: "Đang chờ duyệt", value: reviewCount, hint: "cần xử lý", tone: "amber", icon: <ClipboardCheck /> },
    { label: "KPI dẫn đầu", value: topClub?.points ?? 0, hint: topClub?.clubName ?? "Chưa có xếp hạng", tone: "green", icon: <Trophy /> },
    { label: "Ngân sách", value: budgetProposals.length, hint: `${budgetProposals.filter((item) => item.status === "Submitted").length} chờ duyệt`, tone: "coral", icon: <CircleDollarSign /> }
  ];
  return (
    <section className="dashboard-grid">
      <section className="hero-panel">
        <img src={clubHubCommunity} alt="Nhóm sinh viên và cán bộ cùng rà soát kế hoạch hoạt động câu lạc bộ" />
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={15} aria-hidden /> Vận hành câu lạc bộ FPTU</span>
          <h2>Một trung tâm làm việc cho báo cáo, KPI, hoạt động và ngân sách.</h2>
          <p>Nắm việc cần xử lý, duyệt báo cáo đúng luồng và theo dõi toàn bộ câu lạc bộ mà không phải chuyển qua nhiều công cụ.</p>
          <div className="hero-actions">
            {canUseReportWorkflow && (
              <button className="primary" type="button" onClick={() => onNavigate("reports")}>
                <FileText size={18} aria-hidden />
                {canAuthorReports ? "Tạo báo cáo" : "Duyệt báo cáo"}
              </button>
            )}
            <button className="secondary" type="button" onClick={() => onNavigate("activities")}>
              <CalendarDays size={18} aria-hidden />
              Hoạt động
            </button>
          </div>
        </div>
        <div className="hero-meter" aria-label="Tiến độ phê duyệt">
          <span>Tỷ lệ phê duyệt</span>
          <strong>{approvalRate}%</strong>
          <div className="progress-track"><i style={{ width: `${approvalRate}%` }} /></div>
          <small>{reviewCount} báo cáo đang chờ xử lý</small>
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

      <section className="quick-actions" aria-label="Thao tác nhanh">
        {canUseReportWorkflow && (
          <button type="button" onClick={() => onNavigate("reports")}>
            <span><ClipboardCheck size={18} aria-hidden /></span>
            <strong>Báo cáo</strong>
            <small>{reviewCount} chờ xử lý</small>
            <ArrowUpRight size={16} aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => onNavigate("kpi")}>
          <span><Trophy size={18} aria-hidden /></span>
          <strong>KPI</strong>
          <small>{topClub?.clubName ?? "Chưa có xếp hạng"}</small>
          <ArrowUpRight size={16} aria-hidden />
        </button>
        {canUseFinanceWorkflow && (
          <button type="button" onClick={() => onNavigate("finance")}>
            <span><WalletCards size={18} aria-hidden /></span>
            <strong>Tài chính</strong>
            <small>{budgetProposals.filter((item) => item.status === "Submitted").length} chờ duyệt</small>
            <ArrowUpRight size={16} aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => onNavigate("notifications")}>
          <span><Megaphone size={18} aria-hidden /></span>
          <strong>Thông báo</strong>
          <small>{unreadCount} chưa đọc</small>
          <ArrowUpRight size={16} aria-hidden />
        </button>
      </section>

      {canUseReportWorkflow && (
        <section className="panel panel-large">
          <SectionTitle icon={<FileText />} title="Báo cáo gần đây" meta={`${reports.length} báo cáo`} />
          <ReportList reports={reports.slice(0, 6)} />
        </section>
      )}
      <section className="panel insight-panel">
        <SectionTitle icon={<Trophy />} title="Câu lạc bộ dẫn đầu" meta={kpi?.period ?? "Tất cả kỳ"} />
        {topClub ? (
          <div className="top-club-card">
            <span>#{topClub.rank}</span>
            <strong>{topClub.clubName}</strong>
            <div className="progress-track"><i style={{ width: `${Math.min(100, topClub.points)}%` }} /></div>
            <small>{topClub.points} điểm - {topClub.participants} người tham gia</small>
          </div>
        ) : (
          <p className="empty">Chưa có dữ liệu KPI.</p>
        )}
        <SectionTitle icon={<Bell />} title="Thông báo chưa đọc" meta={`${unreadCount} thông báo`} />
        <NotificationList notifications={notifications.filter((item) => !item.isRead).slice(0, 4)} />
      </section>
      <section className="panel">
        <SectionTitle icon={<CalendarDays />} title="Hoạt động sắp tới" meta={nextActivity ? formatDate(nextActivity.startTimeUtc) : "Chưa có hoạt động"} />
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
          <span className="section-kicker"><ClipboardCheck size={15} aria-hidden /> Quy trình báo cáo</span>
          <h2>Quản lý báo cáo</h2>
          <p>{props.reports.length} báo cáo ở các trạng thái soạn thảo, kiểm duyệt và phê duyệt.</p>
        </div>
      </div>
      {props.canAuthorReports ? (
        <form className="report-form" onSubmit={handleCreateReport} aria-label="Tạo báo cáo">
          <div className="report-form-head">
            <div>
              <span className="section-kicker"><FileText size={15} aria-hidden /> Nội dung báo cáo</span>
              <h3>{props.reportDraft.editingReportId ? "Chỉnh sửa báo cáo" : "Tạo báo cáo mới"}</h3>
            </div>
            <div className="split-actions">
              {props.reportDraft.editingReportId && (
                <button type="button" onClick={props.cancelReportEdit} disabled={props.busy}>
                  Hủy chỉnh sửa
                </button>
              )}
              <button className="primary" type="submit" disabled={props.busy || props.clubs.length === 0}>
                <FileText size={18} aria-hidden />
                {props.reportDraft.editingReportId ? "Lưu báo cáo" : "Tạo báo cáo"}
              </button>
            </div>
          </div>
          <div className="report-form-grid">
            <label>
              Câu lạc bộ
              {props.scopedClub ? (
                <input value={props.scopedClub.name} readOnly />
              ) : (
                <select value={props.reportDraft.clubId} onChange={(event) => props.setReportDraftField("clubId", event.target.value)} disabled={props.clubs.length === 0 || Boolean(props.reportDraft.editingReportId)}>
                  {props.clubs.length === 0 ? (
                    <option value="">Chưa có câu lạc bộ</option>
                  ) : (
                    props.clubs.map((club) => (
                      <option value={club.id} key={club.id}>{club.name}</option>
                    ))
                  )}
                </select>
              )}
            </label>
            <label>
              Nhãn báo cáo
              <select value={props.reportDraft.tag} onChange={(event) => props.setReportDraftField("tag", event.target.value)}>
                {reportTags.map((tag) => <option value={tag} key={tag}>{displayReportTag(tag)}</option>)}
              </select>
            </label>
            <label>
              Tên loại báo cáo
              <input value={props.reportDraft.reportType} onChange={(event) => props.setReportDraftField("reportType", event.target.value)} placeholder="Báo cáo thủ quỹ, báo cáo hoạt động..." />
            </label>
            <label>
              Kỳ báo cáo
              <input
                type="month"
                value={props.reportDraft.period}
                onInput={(event) => props.setReportDraftField("period", event.currentTarget.value)}
                onChange={(event) => props.setReportDraftField("period", event.target.value)}
              />
            </label>
            <label>
              Hạn nộp
              <input
                type="date"
                value={props.reportDraft.dueDate}
                onInput={(event) => props.setReportDraftField("dueDate", event.currentTarget.value)}
                onChange={(event) => props.setReportDraftField("dueDate", event.target.value)}
              />
            </label>
            <label>
              Tên hoạt động
              <input value={props.reportDraft.activityName} onChange={(event) => props.setReportDraftField("activityName", event.target.value)} placeholder="Workshop tháng, giải đấu, hội thảo..." />
            </label>
            <label>
              Ngày hoạt động
              <input
                type="date"
                value={props.reportDraft.activityDate}
                onInput={(event) => props.setReportDraftField("activityDate", event.currentTarget.value)}
                onChange={(event) => props.setReportDraftField("activityDate", event.target.value)}
              />
            </label>
            <label>
              Số người tham gia
              <input type="number" min="0" value={props.reportDraft.participantCount} onChange={(event) => props.setReportDraftField("participantCount", event.target.value)} />
            </label>
            <label className="span-2">
              Nội dung chi tiết
              <textarea value={props.reportDraft.description} onChange={(event) => props.setReportDraftField("description", event.target.value)} placeholder="Hoạt động đã diễn ra như thế nào, ai tham gia và có những minh chứng gì?" />
            </label>
            <label className="span-2">
              Kết quả và đánh giá
              <textarea value={props.reportDraft.outcome} onChange={(event) => props.setReportDraftField("outcome", event.target.value)} placeholder="Kết quả, tác động, bài học và hành động tiếp theo." />
            </label>
          </div>
        </form>
      ) : (
        <div className="role-note">
          <ShieldCheck size={17} aria-hidden />
          <span>Quản trị công tác sinh viên duyệt báo cáo tại đây; chủ nhiệm và thủ quỹ tạo báo cáo trong phạm vi câu lạc bộ của mình.</span>
        </div>
      )}
      {props.isAdmin && (
        <div className="feedback-row inline-field">
        <label>
          Lý do từ chối
          <input value={props.feedback} onChange={(event) => props.setFeedback(event.target.value)} />
        </label>
        </div>
      )}
      {props.reports.length === 0 ? (
        <p className="empty">Chưa có báo cáo. Hãy tạo báo cáo đầu tiên cho câu lạc bộ.</p>
      ) : (
        <div className="report-board" aria-label="Danh sách báo cáo">
          {props.reports.map((report) => (
            <article className={`report-card ${statusTone[report.status]}`} key={report.id}>
            <div className="report-card-head">
              <div>
                <span>{report.period}</span>
                <h3>{report.clubName}</h3>
                <small>{displayReportTag(report.tag)}</small>
              </div>
              <StatusBadge status={report.status} />
            </div>
            <div className="report-meta">
              <span><CalendarDays size={15} aria-hidden /> Hạn {formatDate(report.dueDate)}</span>
              <span><Layers3 size={15} aria-hidden /> {report.details.length} hoạt động</span>
              <span><Paperclip size={15} aria-hidden /> {report.attachments.length} minh chứng</span>
            </div>
            <p>{report.details[0]?.outcome ?? "Chưa ghi nhận kết quả."}</p>
            <div className="report-actions">
              {props.canAuthorReports && (
                <label className="icon-upload" title="Tải minh chứng lên">
                  <Upload size={16} aria-hidden />
                  <span className="sr-only">Tải minh chứng lên</span>
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
                <button type="button" onClick={() => props.editReport(report)} title="Chỉnh sửa nội dung báo cáo" disabled={props.busy}>
                  Sửa
                </button>
              )}
              {props.canAuthorReports && (report.status === "Draft" || report.status === "Rejected") && (
                <button type="button" onClick={() => props.submit(report.id)} title="Gửi báo cáo" disabled={props.busy}>
                  <Send size={16} aria-hidden />
                </button>
              )}
              {props.isAdmin && report.status === "Submitted" && (
                <button type="button" onClick={() => props.review(report.id)} title="Chuyển sang đang duyệt" disabled={props.busy}>
                  <RefreshCcw size={16} aria-hidden />
                </button>
              )}
              {props.isAdmin && (report.status === "Submitted" || report.status === "Under Review") && (
                <>
                  <button type="button" onClick={() => props.approve(report.id)} title="Phê duyệt báo cáo" disabled={props.busy}>
                    <CheckCircle2 size={16} aria-hidden />
                  </button>
                  <button type="button" onClick={() => props.reject(report.id)} title="Từ chối báo cáo" disabled={props.busy}>
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
          <span className="section-kicker"><UsersRound size={15} aria-hidden /> Danh mục câu lạc bộ</span>
          <h2>Câu lạc bộ</h2>
          <p>{clubs.length} câu lạc bộ với thông tin chủ nhiệm, thành viên và phân quyền thủ quỹ.</p>
        </div>
      </div>
      {isAdmin && pendingApplications.length > 0 && (
        <div className="workflow-strip" aria-label="Đơn đăng ký thành lập câu lạc bộ">
          {pendingApplications.map((application) => (
            <article className="workflow-card application-card" key={application.id}>
              <div className="application-card-head">
                <span className="section-kicker"><Building2 size={14} aria-hidden /> Đơn thành lập câu lạc bộ</span>
                <strong>{application.name}</strong>
                <small>Mã {application.code} - người gửi: {application.requesterName}</small>
              </div>
              <div className="application-detail-grid">
                <div>
                  <span>Liên hệ</span>
                  <strong>{application.contactEmail}</strong>
                  <small>{application.contactPhone}</small>
                </div>
                <div>
                  <span>Ngày gửi</span>
                  <strong>{formatDate(application.submittedAtUtc)}</strong>
                  <small>{displayStatus(application.status)}</small>
                </div>
              </div>
              <dl className="application-detail-list">
                <div><dt>Mô tả</dt><dd>{application.description || "Chưa cung cấp"}</dd></div>
                <div><dt>Mục đích thành lập</dt><dd>{application.purpose || "Chưa cung cấp"}</dd></div>
                <div><dt>Lý do thành lập</dt><dd>{application.reason || "Chưa cung cấp"}</dd></div>
              </dl>
              <div className="card-actions">
                <button type="button" onClick={() => approveApplication(application.id)} disabled={busy}>
                  <CheckCircle2 size={16} aria-hidden />
                  Phê duyệt
                </button>
                <button type="button" onClick={() => rejectApplication(application.id)} disabled={busy}>
                  <XCircle size={16} aria-hidden />
                  Từ chối
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {(isAdmin || managedClubs.length === 0) && (
        <form className="module-form" onSubmit={handleCreateClub} aria-label={isAdmin ? "Tạo câu lạc bộ" : "Đăng ký thành lập câu lạc bộ"}>
          <div className="module-form-head">
            <div>
              <span className="section-kicker"><Building2 size={15} aria-hidden /> Hồ sơ câu lạc bộ</span>
              <h3>{isAdmin ? "Tạo câu lạc bộ" : "Đăng ký thành lập câu lạc bộ"}</h3>
            </div>
            <button className="primary" type="submit" disabled={busy}>
              <Building2 size={18} aria-hidden />
              {isAdmin ? "Tạo câu lạc bộ" : "Gửi đơn đăng ký"}
            </button>
          </div>
          <div className="module-form-grid">
            <label>
              Mã câu lạc bộ
              <input value={clubDraft.code} onChange={(event) => setClubDraftField("code", event.target.value)} placeholder="AI, MUSIC, ROBOT" />
            </label>
            <label>
              Tên câu lạc bộ
              <input value={clubDraft.name} onChange={(event) => setClubDraftField("name", event.target.value)} placeholder="Tên đầy đủ của câu lạc bộ" />
            </label>
            <label>
              Email liên hệ
              <input value={clubDraft.contactEmail} onChange={(event) => setClubDraftField("contactEmail", event.target.value)} placeholder="club@fpt.edu.vn" />
            </label>
            <label>
              Số điện thoại liên hệ
              <input value={clubDraft.contactPhone} onChange={(event) => setClubDraftField("contactPhone", event.target.value)} placeholder="0900000000" />
            </label>
            <label className="span-2">
              Mô tả câu lạc bộ
              <textarea value={clubDraft.description} onChange={(event) => setClubDraftField("description", event.target.value)} placeholder="Sứ mệnh, nhóm hoạt động chính và định hướng phát triển." />
            </label>
            {!isAdmin && (
              <>
                <label className="span-2">
                  Mục đích thành lập
                  <textarea value={clubDraft.purpose} onChange={(event) => setClubDraftField("purpose", event.target.value)} placeholder="Câu lạc bộ sẽ mang lại giá trị gì cho sinh viên và đời sống học đường?" />
                </label>
                <label className="span-2">
                  Lý do thành lập
                  <textarea value={clubDraft.reason} onChange={(event) => setClubDraftField("reason", event.target.value)} placeholder="Vì sao công tác sinh viên nên phê duyệt câu lạc bộ ở thời điểm này?" />
                </label>
              </>
            )}
          </div>
        </form>
      )}
      {clubs.length === 0 ? (
        <p className="empty">Chưa có câu lạc bộ. Hãy gửi hồ sơ thành lập để bắt đầu.</p>
      ) : (
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
      )}
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
        <div><dt>Điện thoại</dt><dd>{club.contactPhone}</dd></div>
        <div><dt>Chủ nhiệm</dt><dd>{activeManager?.managerName ?? "Chưa phân công"}</dd></div>
        <div><dt>Thành viên</dt><dd>{approvedMembers.length} đã duyệt / {pendingMembers.length} chờ duyệt</dd></div>
      </dl>
      {!isAdmin && (
        <div className="membership-state">
          {isOwner && <span className="badge success">Chủ nhiệm</span>}
          {myMembership && <span className={`badge ${myMembership.status === "Approved" ? "success" : myMembership.status === "Pending" ? "info" : "danger"}`}>{displayRole(myMembership.role)} / {displayStatus(myMembership.status)}</span>}
          {!isCurrentUserInClub && <span className="muted-text">Chưa tham gia</span>}
        </div>
      )}
      {canJoin && (
        <form className="join-request-form" onSubmit={(event) => {
          event.preventDefault();
          joinClub(club);
          }}>
          <div className="join-request-head">
            <span><UsersRound size={15} aria-hidden /> Đơn tham gia</span>
            <small>Đơn sẽ được gửi tới chủ nhiệm câu lạc bộ</small>
          </div>
          <label>
            Thông tin cá nhân
            <textarea value={joinDraft.personalInfo} onChange={(event) => setJoinDraftField(club.id, "personalInfo", event.target.value)} placeholder="Mã sinh viên, lớp, số điện thoại, kỹ năng hiện có..." />
          </label>
          <label>
            Mục tiêu
            <textarea value={joinDraft.goals} onChange={(event) => setJoinDraftField(club.id, "goals", event.target.value)} placeholder="Bạn muốn học hỏi hoặc đóng góp điều gì?" />
          </label>
          <label>
            Lý do tham gia
            <textarea value={joinDraft.reason} onChange={(event) => setJoinDraftField(club.id, "reason", event.target.value)} placeholder="Vì sao câu lạc bộ này phù hợp với bạn?" />
          </label>
          <button className="secondary" type="submit" disabled={busy}>
            <Send size={16} aria-hidden />
            Gửi đơn tham gia
          </button>
        </form>
      )}
      {isAdmin && (
        <div className="card-actions">
          <select aria-label={`Phân công chủ nhiệm cho ${club.name}`} defaultValue="" onChange={(event) => event.target.value && assignManager(club, Number(event.target.value))} disabled={busy || managers.length === 0}>
            <option value="">Phân công chủ nhiệm</option>
            {managers.map((manager) => (
              <option value={manager.id} key={manager.id}>{manager.fullName}</option>
            ))}
          </select>
          <button type="button" onClick={() => toggleClubActive(club)} disabled={busy}>
            {club.isActive ? "Tạm ngưng" : "Kích hoạt"}
          </button>
          <button
            className="danger-action"
            type="button"
            onClick={() => window.confirm(`Xóa câu lạc bộ ${club.name}? Thao tác này không thể hoàn tác.`) && deleteClub(club.id)}
            disabled={busy}
          >
            Xóa
          </button>
        </div>
      )}
      {canManageMembers && (
        <div className="member-panel">
          <div className="member-panel-head">
            <strong>Quy trình thành viên</strong>
            <span>{treasurers.length}/2 thủ quỹ</span>
          </div>
          {pendingMembers.length > 0 && (
            <div className="member-list">
              {pendingMembers.map((member) => (
                <div className="member-row member-row-detail" key={member.id}>
                  <div className="member-request-copy">
                    <span>{member.fullName}</span>
                    <small>{member.requestMessage ?? "Không có lời nhắn"}</small>
                    <dl className="member-request-detail">
                      <div><dt>Thông tin cá nhân</dt><dd>{member.personalInfo || "Chưa cung cấp"}</dd></div>
                      <div><dt>Mục tiêu</dt><dd>{member.goals || "Chưa cung cấp"}</dd></div>
                      <div><dt>Lý do tham gia</dt><dd>{member.reason || "Chưa cung cấp"}</dd></div>
                    </dl>
                  </div>
                  <div className="member-request-actions">
                    <button type="button" onClick={() => approveMembership(member.id)} disabled={busy}>Phê duyệt</button>
                    <button type="button" onClick={() => rejectMembership(member.id)} disabled={busy}>Từ chối</button>
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
                  <button type="button" onClick={() => demoteTreasurer(member)} disabled={busy}>Chuyển thành viên</button>
                ) : (
                  <button type="button" onClick={() => assignTreasurer(club, member)} disabled={busy || treasurers.length >= 2}>Giao quyền thủ quỹ</button>
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
          <span className="section-kicker"><CalendarDays size={15} aria-hidden /> Lịch hoạt động</span>
          <h2>Hoạt động câu lạc bộ</h2>
          <p>{activities.length} hoạt động đã lên lịch hoặc đã hoàn tất.</p>
        </div>
      </div>
      {canCreateActivity && (
        <form className="module-form" onSubmit={handleSaveActivity} aria-label="Lưu hoạt động">
          <div className="module-form-head">
            <div>
              <span className="section-kicker"><CalendarDays size={15} aria-hidden /> Thông tin hoạt động</span>
              <h3>{activityDraft.editingActivityId ? "Chỉnh sửa hoạt động" : "Tạo hoạt động"}</h3>
            </div>
            <button className="primary" type="submit" disabled={busy || clubs.length === 0}>
              <CalendarDays size={18} aria-hidden />
              {activityDraft.editingActivityId ? "Lưu hoạt động" : "Tạo hoạt động"}
            </button>
          </div>
          <div className="module-form-grid">
            <label>
              Câu lạc bộ
              <select value={activityDraft.clubId} onChange={(event) => setActivityDraftField("clubId", event.target.value)} disabled={clubs.length === 0}>
                {clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
              </select>
            </label>
            <label>
              Tên hoạt động
              <input value={activityDraft.title} onChange={(event) => setActivityDraftField("title", event.target.value)} placeholder="Workshop, sự kiện, cuộc thi..." />
            </label>
            <label>
              Địa điểm
              <input value={activityDraft.location} onChange={(event) => setActivityDraftField("location", event.target.value)} placeholder="Hội trường FPTU, phòng học, đường dẫn trực tuyến..." />
            </label>
            <label>
              Bắt đầu
              <input
                type="datetime-local"
                value={activityDraft.startTime}
                onInput={(event) => setActivityDraftField("startTime", event.currentTarget.value)}
                onChange={(event) => setActivityDraftField("startTime", event.target.value)}
              />
            </label>
            <label>
              Kết thúc
              <input
                type="datetime-local"
                value={activityDraft.endTime}
                onInput={(event) => setActivityDraftField("endTime", event.currentTarget.value)}
                onChange={(event) => setActivityDraftField("endTime", event.target.value)}
              />
            </label>
            <label>
              Trạng thái
              <select value={activityDraft.status} onChange={(event) => setActivityDraftField("status", event.target.value)}>
                <option value="Scheduled">Đã lên lịch</option>
                <option value="Completed">Hoàn tất</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </label>
            <label className="span-2">
              Mô tả
              <textarea value={activityDraft.description} onChange={(event) => setActivityDraftField("description", event.target.value)} placeholder="Nội dung, mục tiêu, kết quả dự kiến và ghi chú tổ chức." />
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
  if (activities.length === 0) return <p className="empty">Chưa có hoạt động. Hãy tạo hoạt động đầu tiên cho câu lạc bộ.</p>;
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
            <span><Clock3 size={14} aria-hidden /> {formatDateTime(activity.startTimeUtc)}</span>
            <span>{activity.location}</span>
          </div>
          <span className={`badge ${activity.status === "Completed" ? "success" : "info"}`}>{activity.participants.length} người tham gia</span>
          {canManage && (
            <div className="activity-actions">
              <button type="button" onClick={() => editActivity?.(activity)} disabled={busy}>Sửa</button>
              {activity.status !== "Completed" && <button type="button" onClick={() => completeActivity?.(activity.id)} disabled={busy}>Hoàn tất</button>}
              <input value={participantDrafts[activity.id] ?? ""} onChange={(event) => setParticipantDraft?.(activity.id, event.target.value)} placeholder="Tên người tham gia" />
              <button type="button" onClick={() => addParticipant?.(activity.id)} disabled={busy}>Thêm người tham gia</button>
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
          <span className="section-kicker"><Trophy size={15} aria-hidden /> Hiệu quả hoạt động</span>
          <h2>Bảng xếp hạng KPI</h2>
          <p>Xếp hạng câu lạc bộ theo báo cáo đã duyệt, mức độ tham gia và hiệu quả hoạt động.</p>
        </div>
        <span className="muted-text">{leaderboard?.period ?? "Tất cả kỳ"}</span>
      </div>
      {(!leaderboard || leaderboard.clubs.length === 0) ? (
        <p className="empty">Chưa có dữ liệu KPI. Điểm sẽ được cập nhật khi có báo cáo và hoạt động đã duyệt.</p>
      ) : (
        <div className="leaderboard" aria-label="Bảng xếp hạng KPI">
          {leaderboard.clubs.map((club) => (
            <article className="rank-card" key={club.clubId}>
              <span className="rank-number">#{club.rank}</span>
              <div className="rank-main">
                <strong>{club.clubName}</strong>
                <div className="progress-track"><i style={{ width: `${Math.max(8, Math.round((club.points / maxPoints) * 100))}%` }} /></div>
              </div>
              <div className="rank-stats">
                <strong>{club.points}</strong>
                <span>{club.approvedReports} báo cáo đã duyệt</span>
                <span>{club.participants} người tham gia</span>
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
          <span className="section-kicker"><WalletCards size={15} aria-hidden /> Tài chính</span>
          <h2>Đề xuất ngân sách</h2>
          <p>{props.proposals.length} đề xuất kèm số tiền yêu cầu và trạng thái quyết toán.</p>
        </div>
      </div>
      {props.canManageFinance && (
        <form className="module-form" onSubmit={handleCreateProposal} aria-label="Tạo đề xuất ngân sách">
          <div className="module-form-head">
            <div>
              <span className="section-kicker"><WalletCards size={15} aria-hidden /> Thông tin đề xuất</span>
              <h3>Tạo đề xuất ngân sách</h3>
            </div>
            <button className="primary" type="submit" disabled={props.busy || props.clubs.length === 0}>
              <WalletCards size={18} aria-hidden />
              Tạo đề xuất
            </button>
          </div>
          <div className="module-form-grid">
            <label>
              Câu lạc bộ
              <select value={props.financeDraft.clubId} onChange={(event) => props.setFinanceDraftField("clubId", event.target.value)} disabled={props.clubs.length === 0}>
                {props.clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
              </select>
            </label>
            <label>
              Hoạt động liên quan
              <select value={props.financeDraft.activityId} onChange={(event) => props.setFinanceDraftField("activityId", event.target.value)}>
                <option value="">Không gắn hoạt động</option>
                {activityOptions.map((activity) => <option value={activity.id} key={activity.id}>{activity.title}</option>)}
              </select>
            </label>
            <label>
              Số tiền đề xuất
              <input type="number" min="1" value={props.financeDraft.requestedAmount} onChange={(event) => props.setFinanceDraftField("requestedAmount", event.target.value)} placeholder="3000000" />
            </label>
            <label className="span-2">
              Tiêu đề
              <input value={props.financeDraft.title} onChange={(event) => props.setFinanceDraftField("title", event.target.value)} placeholder="Ngân sách sự kiện, vật tư workshop..." />
            </label>
            <label className="span-2">
              Nội dung chi tiết
              <textarea value={props.financeDraft.description} onChange={(event) => props.setFinanceDraftField("description", event.target.value)} placeholder="Ngân sách dùng cho hạng mục nào và vì sao cần thiết?" />
            </label>
          </div>
        </form>
      )}
      {props.proposals.length === 0 ? (
        <p className="empty">Chưa có đề xuất ngân sách.</p>
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
                <small>{proposal.settlements.length} quyết toán</small>
              </div>
              <div className="finance-actions">
                {props.isAdmin && proposal.status === "Submitted" && (
                  <>
                    <button type="button" disabled={props.busy} onClick={() => props.approveProposal(proposal.id, proposal.requestedAmount)} title="Phê duyệt đề xuất ngân sách">
                      <CheckCircle2 size={16} aria-hidden />
                      Phê duyệt
                    </button>
                    <button type="button" disabled={props.busy} onClick={() => props.rejectProposal(proposal.id)} title="Từ chối đề xuất ngân sách">
                      <XCircle size={16} aria-hidden />
                      Từ chối
                    </button>
                  </>
                )}
                {proposal.status === "Approved" && (
                  <div className="settlement-form">
                    <input type="number" min="1" value={props.settlementDrafts[proposal.id]?.totalSpent ?? ""} onChange={(event) => props.setSettlementDraft(proposal.id, "totalSpent", event.target.value)} placeholder="Số tiền đã chi" />
                    <input value={props.settlementDrafts[proposal.id]?.receiptUrl ?? ""} onChange={(event) => props.setSettlementDraft(proposal.id, "receiptUrl", event.target.value)} placeholder="Đường dẫn biên lai" />
                    <button type="button" disabled={props.busy} onClick={() => props.createSettlement(proposal.id)}>Gửi quyết toán</button>
                  </div>
                )}
                {proposal.settlements.map((settlement) => (
                  <div className="settlement-row" key={settlement.id}>
                    <span>{formatCurrency(settlement.totalSpent)} / {displayStatus(settlement.status)}</span>
                    {settlement.receiptUrl && <a href={settlement.receiptUrl} target="_blank" rel="noreferrer">Biên lai</a>}
                    {props.isAdmin && settlement.status === "Submitted" && (
                      <button type="button" disabled={props.busy} onClick={() => props.approveSettlement(settlement.id)}>
                        Duyệt quyết toán
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
          <span className="section-kicker"><FileSpreadsheet size={15} aria-hidden /> Xuất file</span>
          <h2>Lịch sử xuất báo cáo</h2>
          <p>{exportsList.length} file đã tạo hoặc đang chờ xử lý.</p>
        </div>
        <div className="split-actions">
          <button type="button" onClick={() => createExport("PDF")} disabled={busy} title="Tạo file PDF">
            <Download size={16} aria-hidden />
            PDF
          </button>
          <button type="button" onClick={() => createExport("EXCEL")} disabled={busy} title="Tạo file Excel">
            <FileSpreadsheet size={16} aria-hidden />
            Excel
          </button>
        </div>
      </div>
      {exportsList.length === 0 ? (
        <p className="empty">Chưa có file xuất. Hãy tạo PDF hoặc Excel tổng hợp đầu tiên.</p>
      ) : (
        <div className="export-grid" aria-label="Danh sách file xuất">
          {exportsList.map((item) => (
            <article className="export-card" key={item.id}>
              <div>
                <span className="export-type">{item.exportType}</span>
                <strong>File xuất #{item.id}</strong>
                <small>{item.scope}</small>
              </div>
              <StatusBadgeLike status={item.status} />
              <span className="export-file">{item.file?.fileName ?? "Đang chờ tạo file"}</span>
              <div className="card-actions">
                <button type="button" onClick={() => downloadExport(item)} disabled={busy || !item.file?.isAvailable}>
                  <Download size={16} aria-hidden />
                  Tải xuống
                </button>
                {isAdmin && (
                  <button className="danger-action" type="button" onClick={() => window.confirm(`Xóa file xuất #${item.id}?`) && deleteExport(item.id)} disabled={busy}>
                    Xóa
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
          <span className="section-kicker"><Bell size={15} aria-hidden /> Luồng công việc</span>
          <h2>Thông báo</h2>
          <p>{notifications.filter((item) => !item.isRead).length} thông báo chưa đọc trong các quy trình câu lạc bộ.</p>
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
          <span className="section-kicker"><UserRoundCog size={15} aria-hidden /> Kiểm soát truy cập</span>
          <h2>Người dùng và vai trò</h2>
          <p>{users.length} tài khoản. Tài khoản mới luôn bắt đầu với quyền thành viên.</p>
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
                  <span>{displayRole(role)}</span>
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
  if (reports.length === 0) return <p className="empty">Chưa có báo cáo.</p>;
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
  if (notifications.length === 0) return <p className="empty">Không có thông báo mới.</p>;
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
            <button type="button" onClick={() => markRead(item.id)} title="Đánh dấu đã đọc">
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
          <span className="section-kicker"><ShieldCheck size={15} aria-hidden /> Quyền truy cập</span>
          <h2>{title}</h2>
          <p>Khu vực này không khả dụng với vai trò hiện tại nên hệ thống sẽ không gọi các API không có quyền.</p>
        </div>
      </div>
      <p className="empty">Hãy liên hệ quản trị viên nếu bạn cần thêm quyền cho quy trình này.</p>
    </section>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`badge ${statusTone[status]}`}>{displayStatus(status)}</span>;
}

function StatusBadgeLike({ status }: { status: string }) {
  const tone = status === "Approved" || status === "Settled" || status === "Completed"
    ? "success"
    : status === "Rejected" || status === "Failed"
      ? "danger"
      : status === "Submitted" || status === "Pending"
        ? "info"
        : "neutral";

  return <span className={`badge ${tone}`}>{roleLabels[status] ? displayRole(status) : displayStatus(status)}</span>;
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
    dashboard: "Tổng quan",
    reports: "Báo cáo",
    clubs: "Câu lạc bộ",
    activities: "Hoạt động",
    kpi: "KPI",
    finance: "Tài chính",
    exports: "Xuất file",
    notifications: "Thông báo",
    users: "Người dùng"
  }[view];
}

function viewSubtitle(view: View) {
  return {
    dashboard: "Theo dõi nhanh câu lạc bộ, báo cáo, KPI, tài chính và việc cần xử lý.",
    reports: "Tạo báo cáo và đưa qua các bước gửi, kiểm duyệt, phê duyệt hoặc từ chối.",
    clubs: "Quản lý chủ nhiệm, thành viên, đơn tham gia và hồ sơ thành lập câu lạc bộ.",
    activities: "Theo dõi lịch, địa điểm, người tham gia và kết quả hoạt động.",
    kpi: "So sánh hiệu quả hoạt động của các câu lạc bộ theo dữ liệu đã duyệt.",
    finance: "Quản lý đề xuất ngân sách và tiến độ quyết toán.",
    exports: "Tạo và theo dõi file tổng hợp PDF hoặc Excel.",
    notifications: "Xử lý thông báo công việc trước khi bị tồn đọng.",
    users: "Quản lý vai trò, quyền truy cập và trách nhiệm của từng tài khoản."
  }[view];
}
