export type Role = "ADMIN" | "SYSTEM_ADMIN" | "STUDENT_AFFAIRS_ADMIN" | "CLUB_MANAGER" | "TREASURER" | "CLUB_MEMBER";

export type UserSummary = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: Role[];
  isActive: boolean;
  isLocked: boolean;
};

export type AuthResponse = {
  accessToken: string;
  expiresAtUtc: string;
  user: UserSummary;
};

export type Club = {
  id: number;
  code: string;
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  managers: Array<{
    id: number;
    managerUserId: number;
    managerName: string;
    assignedAtUtc: string;
    endedAtUtc?: string;
    isActive: boolean;
  }>;
};

export type ReportStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected";

export type ReportAttachment = {
  id: number;
  reportDetailId?: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedAtUtc: string;
};

export type Report = {
  id: number;
  clubId: number;
  clubName: string;
  period: string;
  status: ReportStatus;
  createdByUserId: number;
  dueDate: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  submittedAtUtc?: string;
  reviewedAtUtc?: string;
  version: number;
  details: Array<{
    id: number;
    activityName: string;
    activityDate: string;
    description: string;
    participantCount: number;
    outcome: string;
  }>;
  attachments: ReportAttachment[];
  feedback: Array<{
    id: number;
    reviewerName: string;
    decision: string;
    message: string;
    createdAtUtc: string;
  }>;
};

export type ReportSummary = {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  overdue: number;
};

export type KpiLeaderboard = {
  period?: string;
  calculatedAtUtc: string;
  clubs: Array<{
    rank: number;
    clubId: number;
    clubName: string;
    points: number;
    approvedReports: number;
    activities: number;
    participants: number;
    rejectedReports: number;
    overdueReports: number;
  }>;
};

export type ActivityItem = {
  id: number;
  clubId: number;
  clubName: string;
  title: string;
  description: string;
  startTimeUtc: string;
  endTimeUtc: string;
  location: string;
  status: string;
  createdByUserId: number;
  createdAtUtc: string;
  participants: Array<{
    id: number;
    userId: number;
    fullName: string;
    attendanceStatus: string;
    registeredAtUtc: string;
  }>;
};

export type BudgetProposal = {
  id: number;
  clubId: number;
  clubName: string;
  activityId?: number;
  title: string;
  description: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: string;
  proposedByUserId: number;
  proposedAtUtc: string;
  reviewedByUserId?: number;
  reviewedAtUtc?: string;
  reviewNote?: string;
  settlements: Array<{
    id: number;
    budgetProposalId: number;
    totalSpent: number;
    receiptUrl: string;
    status: string;
    submittedAtUtc: string;
  }>;
};

export type ExportRequest = {
  id: number;
  exportType: string;
  scope: string;
  status: string;
  period?: string;
  clubId?: number;
  requestedByName: string;
  createdAtUtc: string;
  completedAtUtc?: string;
  file?: {
    fileName: string;
    sizeBytes: number;
    expiresAtUtc: string;
    isAvailable: boolean;
  };
};

export type NotificationItem = {
  id: number;
  recipientUserId?: number;
  recipientRole?: Role;
  eventType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAtUtc: string;
};

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiClient {
  constructor(private token?: string) {}

  async login(username: string, password: string) {
    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
  }

  async getUsers() {
    return this.request<UserSummary[]>("/api/users/");
  }

  async getClubs() {
    return this.request<Club[]>("/api/clubs/");
  }

  async getReports() {
    return this.request<{ total: number; items: Report[] }>("/api/reports/?page=1&pageSize=20");
  }

  async getSummary() {
    return this.request<ReportSummary>("/api/reports/summary");
  }

  async getKpiLeaderboard(period?: string) {
    const query = period ? `?period=${encodeURIComponent(period)}` : "";
    return this.request<KpiLeaderboard>(`/api/kpis/leaderboard${query}`);
  }

  async getActivities() {
    return this.request<ActivityItem[]>("/api/activities/");
  }

  async createActivity(payload: {
    clubId: number;
    clubName: string;
    title: string;
    description: string;
    startTimeUtc: string;
    endTimeUtc: string;
    location: string;
  }) {
    return this.request<ActivityItem>("/api/activities/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async createReport(payload: {
    clubId: number;
    clubName: string;
    period: string;
    dueDate: string;
    details: Array<{
      activityName: string;
      activityDate: string;
      description: string;
      participantCount: number;
      outcome: string;
    }>;
  }) {
    return this.request<Report>("/api/reports/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async submitReport(id: number) {
    return this.request<Report>(`/api/reports/${id}/submit`, { method: "POST" });
  }

  async reviewReport(id: number) {
    return this.request<Report>(`/api/reports/${id}/review`, { method: "POST" });
  }

  async approveReport(id: number) {
    return this.request<Report>(`/api/reports/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ feedback: "Approved from administrator dashboard." })
    });
  }

  async rejectReport(id: number, feedback: string) {
    return this.request<Report>(`/api/reports/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ feedback })
    });
  }

  async uploadAttachment(reportId: number, file: File, reportDetailId?: number) {
    const formData = new FormData();
    formData.append("file", file);
    if (reportDetailId) {
      formData.append("reportDetailId", String(reportDetailId));
    }

    return this.request<Report>(`/api/reports/${reportId}/attachments/upload`, {
      method: "POST",
      body: formData
    });
  }

  async getExports() {
    return this.request<{ total: number; items: ExportRequest[] }>("/api/exports/?page=1&pageSize=20");
  }

  async createExport(exportType: "PDF" | "EXCEL", scope: string, period?: string, clubId?: number) {
    return this.request<ExportRequest>("/api/exports/", {
      method: "POST",
      body: JSON.stringify({ exportType, scope, period, clubId })
    });
  }

  async getBudgetProposals() {
    return this.request<BudgetProposal[]>("/api/finance/proposals");
  }

  async createBudgetProposal(payload: {
    clubId: number;
    clubName: string;
    activityId?: number;
    title: string;
    description: string;
    requestedAmount: number;
  }) {
    return this.request<BudgetProposal>("/api/finance/proposals", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async approveBudgetProposal(id: number, approvedAmount?: number) {
    return this.request<BudgetProposal>(`/api/finance/proposals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ approvedAmount, note: "Approved from Student Affairs dashboard." })
    });
  }

  async getNotifications(user: UserSummary) {
    const role = user.roles.find((item) => item === "ADMIN" || item === "STUDENT_AFFAIRS_ADMIN" || item === "SYSTEM_ADMIN")
      ?? user.roles[0]
      ?? "CLUB_MEMBER";
    const query = role === "ADMIN" || role === "STUDENT_AFFAIRS_ADMIN" || role === "SYSTEM_ADMIN"
      ? `recipientRole=${role}`
      : `recipientUserId=${user.id}&recipientRole=${role}`;
    return this.request<NotificationItem[]>(`/api/notifications/?${query}`);
  }

  async markNotificationRead(id: number) {
    return this.request<void>(`/api/notifications/${id}/read`, { method: "PUT" });
  }

  private async request<T>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (!(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
