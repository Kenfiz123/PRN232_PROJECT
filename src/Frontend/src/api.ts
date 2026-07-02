export type Role = "ADMIN" | "CLUB_MANAGER";

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
  attachments: unknown[];
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

  async getExports() {
    return this.request<{ total: number; items: ExportRequest[] }>("/api/exports/?page=1&pageSize=20");
  }

  async createExport(exportType: "PDF" | "EXCEL", scope: string, period?: string, clubId?: number) {
    return this.request<ExportRequest>("/api/exports/", {
      method: "POST",
      body: JSON.stringify({ exportType, scope, period, clubId })
    });
  }

  async getNotifications(user: UserSummary) {
    const role = user.roles.includes("ADMIN") ? "ADMIN" : "CLUB_MANAGER";
    const query = user.roles.includes("ADMIN")
      ? `recipientRole=${role}`
      : `recipientUserId=${user.id}&recipientRole=${role}`;
    return this.request<NotificationItem[]>(`/api/notifications/?${query}`);
  }

  async markNotificationRead(id: number) {
    return this.request<void>(`/api/notifications/${id}/read`, { method: "PUT" });
  }

  private async request<T>(path: string, init: RequestInit = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...init.headers
      }
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
