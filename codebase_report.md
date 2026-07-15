# ClubReportHub - Project Codebase Report

## 1. Project Structure and Services

The project is a microservices-based ASP.NET Core application for managing club activities, reports, and finances. The architecture consists of:

### Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| **AuthService** | 5001 | User authentication, JWT token generation, role management |
| **ClubService** | 5002 | Club management, memberships, manager assignments |
| **ReportService** | 5003 | Activity reporting, submissions, reviews, KPI tracking |
| **ActivityService** | 5004 | Activity scheduling, participant registration |
| **FinanceService** | 5005 | Budget proposals, settlements, transactions |
| **ExportService** | 5006 | PDF/Excel export of reports |
| **NotificationService** | 5007 | Event-driven notifications via RabbitMQ |
| **ApiGateway** | 5000 | YARP reverse proxy routing to all services |

### Project Structure

```
src/
├── Gateway/
│   └── ApiGateway/          # YARP API Gateway
├── Services/
│   ├── AuthService/         # Authentication & Authorization
│   ├── ClubService/         # Club Management
│   ├── ReportService/       # Reporting & KPIs
│   ├── ActivityService/     # Activity Management
│   ├── FinanceService/      # Financial Management
│   ├── ExportService/       # Export Functionality
│   └── NotificationService/ # Notifications
└── Shared/
    └── ClubReportHub.Shared/ # Common code (Auth, Events, Messaging)
```

---

## 2. Models/Database Schema

### 2.1 AuthService

**Database:** SQL Server - `AuthDbContext`

**Tables:**
- **Users** - User accounts
- **Roles** - System roles
- **UserRoles** - Many-to-many relationship

```
User
├── Id (int, PK)
├── Username (string)
├── FullName (string)
├── Email (string)
├── PasswordHash (string)
├── IsActive (bool)
├── IsLocked (bool)
├── CreatedAtUtc (datetimeoffset)
└── UserRoles (ICollection<UserRole>)

Role
├── Id (int, PK)
├── Name (string)
└── UserRoles (ICollection<UserRole>)

UserRole
├── UserId (int, FK)
├── User (User)
├── RoleId (int, FK)
└── Role (Role)
```

**Roles:**
- `ADMIN` - Full system administration
- `SYSTEM_ADMIN` - System-level admin
- `STUDENT_AFFAIRS_ADMIN` - Student affairs management
- `CLUB_MANAGER` - Club owner/manager
- `TREASURER` - Financial management
- `CLUB_MEMBER` - Regular member

---

### 2.2 ClubService

**Database:** SQL Server - `ClubDbContext`

**Tables:**
- **Clubs** - Club information
- **ClubManagerAssignments** - Manager assignments
- **ClubMemberships** - Member records
- **ClubCreationApplications** - New club applications

```
Club
├── Id (int, PK)
├── Code (string) - Unique club code
├── Name (string)
├── Description (string)
├── ContactEmail (string)
├── ContactPhone (string)
├── IsActive (bool)
├── CreatedAtUtc (datetimeoffset)
├── ManagerAssignments (ICollection<ClubManagerAssignment>)
└── Memberships (ICollection<ClubMembership>)

ClubManagerAssignment
├── Id (int, PK)
├── ClubId (int, FK)
├── Club (Club)
├── ManagerUserId (int)
├── ManagerName (string)
├── AssignedAtUtc (datetimeoffset)
├── EndedAtUtc (datetimeoffset?)
├── IsActive (bool)
└── Club (Club)

ClubMembership
├── Id (int, PK)
├── ClubId (int, FK)
├── Club (Club)
├── UserId (int)
├── FullName (string)
├── Role (string) - Member/Treasurer
├── Status (string) - Pending/Approved/Rejected
├── RequestMessage (string?)
├── PersonalInfo (string)
├── Goals (string)
├── Reason (string)
├── ReviewNote (string?)
├── RequestedAtUtc (datetimeoffset)
├── ReviewedAtUtc (datetimeoffset?)
└── ReviewedByUserId (int?)

ClubCreationApplication
├── Id (int, PK)
├── RequesterUserId (int)
├── RequesterName (string)
├── Code (string)
├── Name (string)
├── Description (string)
├── Purpose (string)
├── Reason (string)
├── ContactEmail (string)
├── ContactPhone (string)
├── Status (string) - Submitted/Approved/Rejected
├── ReviewNote (string?)
├── CreatedClubId (int?)
├── SubmittedAtUtc (datetimeoffset)
├── ReviewedAtUtc (datetimeoffset?)
└── ReviewedByUserId (int?)
```

---

### 2.3 ReportService

**Database:** SQL Server - `ReportDbContext`

**Tables:**
- **Reports** - Main report entity
- **ReportDetails** - Activity details within reports
- **ReportAttachments** - File attachments
- **ReportFeedback** - Review feedback
- **ReportingDeadlines** - Deadline configuration
- **AuditLogs** - Action audit trail

```
Report
├── Id (int, PK)
├── ClubId (int)
├── ClubName (string)
├── Period (string) - e.g., "2024-01"
├── ReportType (string)
├── Tag (string)
├── Status (string) - Draft/Submitted/UnderReview/Approved/Rejected
├── CreatedByUserId (int)
├── DueDate (date)
├── CreatedAtUtc (datetimeoffset)
├── UpdatedAtUtc (datetimeoffset)
├── SubmittedAtUtc (datetimeoffset?)
├── ReviewedAtUtc (datetimeoffset?)
├── ReviewedByUserId (int?)
├── Version (int)
├── Details (ICollection<ReportDetail>)
├── Attachments (ICollection<ReportAttachment>)
└── Feedback (ICollection<ReportFeedback>)

ReportDetail
├── Id (int, PK)
├── ReportId (int, FK)
├── Report (Report)
├── ActivityName (string)
├── ActivityDate (date)
├── Description (string)
├── ParticipantCount (int)
└── Outcome (string)

ReportAttachment
├── Id (int, PK)
├── ReportId (int, FK)
├── ReportDetailId (int?)
├── FileName (string)
├── ContentType (string)
├── SizeBytes (long)
├── StoragePath (string)
└── UploadedAtUtc (datetimeoffset)

ReportFeedback
├── Id (int, PK)
├── ReportId (int, FK)
├── ReviewerUserId (int)
├── ReviewerName (string)
├── Decision (string)
├── Message (string)
└── CreatedAtUtc (datetimeoffset)

ReportingDeadline
├── Id (int, PK)
├── Period (string)
├── DueDate (date)
└── IsActive (bool)

AuditLog
├── Id (int, PK)
├── ReportId (int, FK)
├── Action (string)
├── ActorUserId (int)
├── Description (string)
└── CreatedAtUtc (datetimeoffset)
```

**Report Statuses:**
- `Draft` - Initial state
- `Submitted` - Submitted for review
- `UnderReview` - Being reviewed by manager
- `Approved` - Final approval by admin
- `Rejected` - Rejected with feedback

---

### 2.4 ActivityService

**Database:** SQL Server - `ActivityDbContext`

**Tables:**
- **Activities** - Club activities
- **ActivityParticipants** - Participant registrations

```
ClubActivity
├── Id (int, PK)
├── ClubId (int)
├── ClubName (string)
├── Title (string)
├── Description (string)
├── StartTimeUtc (datetimeoffset)
├── EndTimeUtc (datetimeoffset)
├── Location (string)
├── Status (string) - Scheduled/Completed/Cancelled
├── CreatedByUserId (int)
├── CreatedAtUtc (datetimeoffset)
├── UpdatedAtUtc (datetimeoffset)
└── Participants (ICollection<ActivityParticipant>)

ActivityParticipant
├── Id (int, PK)
├── ActivityId (int, FK)
├── UserId (int)
├── FullName (string)
├── AttendanceStatus (string)
└── RegisteredAtUtc (datetimeoffset)

ActivityStatuses
├── Scheduled = "Scheduled"
├── Completed = "Completed"
└── Cancelled = "Cancelled"
```

---

### 2.5 FinanceService

**Database:** SQL Server - `FinanceDbContext`

**Tables:**
- **BudgetProposals** - Funding requests
- **Settlements** - Expense settlements
- **FinanceTransactions** - Transaction records

```
BudgetProposal
├── Id (int, PK)
├── ClubId (int)
├── ClubName (string)
├── ActivityId (int?)
├── Title (string)
├── Description (string)
├── RequestedAmount (decimal)
├── ApprovedAmount (decimal?)
├── Status (string) - Draft/Submitted/Approved/Rejected/Settled
├── ProposedByUserId (int)
├── ProposedAtUtc (datetimeoffset)
├── ReviewedByUserId (int?)
├── ReviewedAtUtc (datetimeoffset?)
├── ReviewNote (string?)
└── Settlements (ICollection<Settlement>)

Settlement
├── Id (int, PK)
├── BudgetProposalId (int, FK)
├── TotalSpent (decimal)
├── ReceiptUrl (string)
├── Status (string) - Submitted/Approved/Rejected
├── SubmittedAtUtc (datetimeoffset)
├── ReviewedByUserId (int?)
├── ReviewedAtUtc (datetimeoffset?)
└── ReviewNote (string?)

FinanceTransaction
├── Id (int, PK)
├── ClubId (int)
├── Amount (decimal)
├── Type (string) - BudgetApproved/SettlementSubmitted/SettlementApproved
├── Description (string)
├── ReferenceId (int?)
└── TransactionDateUtc (datetimeoffset)

FinanceStatuses
├── Draft = "Draft"
├── Submitted = "Submitted"
├── Approved = "Approved"
├── Rejected = "Rejected"
└── Settled = "Settled"

TransactionTypes
├── BudgetApproved = "BudgetApproved"
├── SettlementSubmitted = "SettlementSubmitted"
└── SettlementApproved = "SettlementApproved"
```

---

### 2.6 ExportService

**Database:** SQL Server - `ExportDbContext`

**Tables:**
- **ExportRequests** - Export job requests
- **ExportFiles** - Generated files

```
ExportRequest
├── Id (int, PK)
├── ExportType (string) - PDF/EXCEL
├── Scope (string) - Individual/Club/Consolidated
├── Status (string) - Queued/Processing/Completed/Failed/Expired
├── Period (string?)
├── ClubId (int?)
├── RequestedByUserId (int)
├── RequestedByName (string)
├── CriteriaJson (string)
├── ErrorMessage (string?)
├── CreatedAtUtc (datetimeoffset)
├── CompletedAtUtc (datetimeoffset?)
└── File (ExportFile?)

ExportFile
├── Id (int, PK)
├── ExportRequestId (int, FK)
├── ExportRequest (ExportRequest)
├── FileName (string)
├── ContentType (string)
├── FilePath (string)
├── SizeBytes (long)
├── ExpiresAtUtc (datetimeoffset)
├── Checksum (string)
└── IsAvailable (bool)

ExportStatuses
├── Queued = "Queued"
├── Processing = "Processing"
├── Completed = "Completed"
├── Failed = "Failed"
└── Expired = "Expired"
```

---

### 2.7 NotificationService

**Database:** SQL Server - `NotificationDbContext`

**Tables:**
- **Notifications** - User notifications
- **ProcessedEvents** - Event processing tracking

```
Notification
├── Id (int, PK)
├── RecipientUserId (int?)
├── RecipientRole (string?)
├── EventType (string)
├── Title (string)
├── Message (string)
├── IsRead (bool)
└── CreatedAtUtc (datetimeoffset)

ProcessedEvent
├── Id (int, PK)
├── EventId (Guid)
├── EventType (string)
├── ProcessedAtUtc (datetimeoffset)
└── ErrorMessage (string?)
```

---

## 3. API Endpoints

### 3.1 AuthService (Port 5001)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login with username/password | Anonymous |
| POST | `/api/auth/register` | Register new user | Anonymous |
| POST | `/api/auth/refresh` | Refresh JWT token | Required |
| GET | `/api/users` | List all users | Admin/SystemAdmin |
| POST | `/api/users` | Create new user | Admin/SystemAdmin |
| PUT | `/api/users/{id}` | Update user | Admin/SystemAdmin |
| PATCH | `/api/users/{id}/lock` | Lock user account | Admin/SystemAdmin |
| PATCH | `/api/users/{id}/unlock` | Unlock user account | Admin/SystemAdmin |
| GET | `/api/roles` | List all roles | Admin |
| POST | `/api/roles` | Create new role | Admin |

---

### 3.2 ClubService (Port 5002)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/clubs` | List clubs (with search/filter) | Required |
| GET | `/api/clubs/me/managed` | Get clubs I manage | Manager |
| GET | `/api/clubs/me/memberships` | Get my memberships | Required |
| GET | `/api/clubs/me/access` | Get my access summary | Required |
| GET | `/api/clubs/applications` | List club creation applications | Admin |
| POST | `/api/clubs/applications` | Submit club creation application | Required |
| POST | `/api/clubs/applications/{id}/approve` | Approve club application | Admin |
| POST | `/api/clubs/applications/{id}/reject` | Reject club application | Admin |
| GET | `/api/clubs/{id}` | Get club details | Required |
| POST | `/api/clubs` | Create new club (admin) | Admin |
| PUT | `/api/clubs/{id}` | Update club | Admin |
| DELETE | `/api/clubs/{id}` | Delete club | Admin/Owner |
| POST | `/api/clubs/{id}/managers` | Assign manager | Admin |
| POST | `/api/clubs/{id}/join` | Request to join club | Required |
| GET | `/api/clubs/{id}/memberships` | List club memberships | Manager/Admin |
| POST | `/api/clubs/memberships/{id}/approve` | Approve membership | Manager/Admin |
| POST | `/api/clubs/memberships/{id}/reject` | Reject membership | Manager/Admin |
| POST | `/api/clubs/{id}/treasurers` | Assign treasurer | Manager/Admin |
| POST | `/api/clubs/memberships/{id}/member` | Demote to member | Manager/Admin |

---

### 3.3 ReportService (Port 5003)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports` | List reports (paginated) | Required |
| GET | `/api/reports/summary` | Get report statistics | Required |
| GET | `/api/reports/aggregate` | Aggregate approved reports | Required |
| GET | `/api/kpis/rules` | Get KPI rules | Required |
| GET | `/api/kpis/leaderboard` | Get club rankings | Required |
| GET | `/api/reports/{id}` | Get report details | Required |
| POST | `/api/reports` | Create new report | Manager |
| PUT | `/api/reports/{id}` | Update report (draft/rejected) | Author |
| POST | `/api/reports/{id}/attachments` | Add attachment metadata | Author |
| POST | `/api/reports/{id}/attachments/upload` | Upload attachment file | Author |
| GET | `/api/reports/{id}/attachments/{aid}/download` | Download attachment | Required |
| POST | `/api/reports/{id}/submit` | Submit report for review | Author |
| POST | `/api/reports/{id}/review` | Forward to admin review | Manager |
| POST | `/api/reports/{id}/approve` | Approve report | Admin |
| POST | `/api/reports/{id}/reject` | Reject report | Manager/Admin |
| GET | `/api/deadlines` | List reporting deadlines | Admin |
| POST | `/api/deadlines` | Create/update deadline | Admin |

---

### 3.4 ActivityService (Port 5004)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/activities` | List activities | Required |
| GET | `/api/activities/{id}` | Get activity details | Required |
| GET | `/api/clubs/{clubId}/activities` | Get club activities | Required |
| POST | `/api/activities` | Create new activity | Manager |
| PUT | `/api/activities/{id}` | Update activity | Manager |
| POST | `/api/activities/{id}/participants` | Register participant | Required |
| PATCH | `/api/activities/{id}/complete` | Mark activity complete | Manager |

---

### 3.5 FinanceService (Port 5005)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/finance/proposals` | List budget proposals | Required |
| GET | `/api/finance/proposals/{id}` | Get proposal details | Required |
| POST | `/api/finance/proposals` | Submit budget proposal | Treasurer/Manager |
| POST | `/api/finance/proposals/{id}/approve` | Approve proposal | Admin |
| POST | `/api/finance/proposals/{id}/reject` | Reject proposal | Admin |
| GET | `/api/finance/settlements` | List settlements | Required |
| POST | `/api/finance/proposals/{id}/settlements` | Submit settlement | Treasurer |
| POST | `/api/finance/settlements/{id}/approve` | Approve settlement | Admin |
| GET | `/api/finance/transactions` | List transactions | Required |

---

### 3.6 ExportService (Port 5006)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/exports` | List export requests | Required |
| GET | `/api/exports/{id}` | Get export status | Required |
| POST | `/api/exports` | Create export job | Manager/Admin |
| GET | `/api/exports/{id}/download` | Download exported file | Required |
| DELETE | `/api/exports/{id}` | Delete/cancel export | Admin |

---

### 3.7 NotificationService (Port 5007)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | List notifications | Required |
| PUT | `/api/notifications/{id}/read` | Mark as read | Required |
| PUT | `/api/notifications/read-all` | Mark all as read | Required |

---

## 4. Dependencies Between Services

### 4.1 Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   ApiGateway    │
                                    │   (YARP :5000)  │
                                    └────────┬────────┘
                                             │
         ┌───────────────┬───────────────────┼───────────────────┬───────────────┐
         │               │                   │                   │               │
         ▼               ▼                   ▼                   ▼               ▼
┌─────────────┐  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  ┌─────────────┐
│ AuthService │  │ClubService  │    │ReportService│    │ActivitySvc  │  │FinanceSvc   │
│   :5001     │  │   :5002     │    │   :5003     │    │   :5004     │  │   :5005     │
└──────┬──────┘  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  └──────┬──────┘
       │                │                  │                  │               │
       │                │                  │                  │               │
       ▼                ▼                  ▼                  ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           RabbitMQ Message Bus                                       │
│   (ClubCreated, ReportSubmitted, ReportApproved, BudgetApproved, etc.)              │
└─────────────────────────────────────────────────────────────────────────────────────┘
                     │                    │                    │
                     ▼                    ▼                    ▼
              ┌────────────┐      ┌──────────────┐      ┌────────────┐
              │Notification│      │  ExportSvc   │      │   Other    │
              │  Service   │      │    :5006     │      │  Consumers │
              │   :5007   │      └──────────────┘      └────────────┘
              └────────────┘
```

### 4.2 Service Dependencies

#### AuthService
- **Database:** SQL Server (AuthDbContext)
- **Dependencies:** None (foundational service)
- **Provides:** JWT authentication, user/role management

#### ClubService
- **Database:** SQL Server (ClubDbContext)
- **Dependencies:**
  - AuthService (for JWT validation)
  - RabbitMQ (publishes `ClubCreatedEvent`)
- **Consumes Events:** None
- **Publishes Events:**
  - `ClubCreatedEvent` - When a club is created

#### ReportService
- **Database:** SQL Server (ReportDbContext)
- **Dependencies:**
  - ClubService (via ClubAccessClient for authorization)
  - AuthService (JWT)
  - RabbitMQ
  - Hangfire (background jobs)
- **Consumes Events:** None
- **Publishes Events:**
  - `ReportSubmittedEvent`
  - `ReportApprovedEvent`
  - `ReportRejectedEvent`
  - `ReportDeadlineReminderEvent`

#### ActivityService
- **Database:** SQL Server (ActivityDbContext)
- **Dependencies:**
  - ClubService (via ClubAccessClient)
  - AuthService
  - RabbitMQ
- **Consumes Events:** None
- **Publishes Events:**
  - `ActivityCreatedEvent`

#### FinanceService
- **Database:** SQL Server (FinanceDbContext)
- **Dependencies:**
  - ClubService (via ClubAccessClient)
  - AuthService
  - RabbitMQ
- **Consumes Events:** None
- **Publishes Events:**
  - `BudgetProposalSubmittedEvent`
  - `BudgetApprovedEvent`
  - `SettlementOverdueEvent`

#### ExportService
- **Database:** SQL Server (ExportDbContext)
- **Dependencies:**
  - ClubService (via ClubAccessClient)
  - AuthService
  - RabbitMQ
  - Hangfire (background jobs)
- **Consumes Events:** None
- **Publishes Events:**
  - `ExportRequestedEvent`
  - `ExportCompletedEvent`

#### NotificationService
- **Database:** SQL Server (NotificationDbContext)
- **Dependencies:**
  - RabbitMQ (consumes all events)
  - AuthService
- **Consumes Events:**
  - `ClubCreatedEvent`
  - `UserRegisteredEvent`
  - `ActivityCreatedEvent`
  - `ReportSubmittedEvent`
  - `ReportApprovedEvent`
  - `ReportRejectedEvent`
  - `BudgetProposalSubmittedEvent`
  - `BudgetApprovedEvent`
  - `SettlementOverdueEvent`
  - `ExportRequestedEvent`
  - `ExportCompletedEvent`
  - `ReportDeadlineReminderEvent`
- **Publishes Events:** None (consumer only)

### 4.3 Shared Components

#### ClubReportHub.Shared
- **Auth:**
  - `JwtTokenFactory` - JWT token generation
  - `JwtOptions` - JWT configuration
  - `ClaimsPrincipalExtensions` - User identity helpers
  - `ClubAccessClient` - HTTP client to check user club access
  - Auth constants (Roles, Policies)

- **Messaging:**
  - `IEventBus` - Event publishing interface
  - `RabbitMqEventBus` - RabbitMQ implementation
  - `EventRoutingKeys` - Event routing key definitions

- **Data:**
  - `DatabaseStartupExtensions` - Migration helpers

### 4.4 Integration Events

| Event | Published By | Consumed By |
|-------|--------------|-------------|
| `ClubCreatedEvent` | ClubService | NotificationService |
| `UserRegisteredEvent` | AuthService | NotificationService |
| `ActivityCreatedEvent` | ActivityService | NotificationService |
| `ReportSubmittedEvent` | ReportService | NotificationService |
| `ReportApprovedEvent` | ReportService | NotificationService |
| `ReportRejectedEvent` | ReportService | NotificationService |
| `KpiCalculatedEvent` | ReportService | - |
| `BudgetProposalSubmittedEvent` | FinanceService | NotificationService |
| `BudgetApprovedEvent` | FinanceService | NotificationService |
| `SettlementOverdueEvent` | FinanceService | NotificationService |
| `ExportRequestedEvent` | ExportService | NotificationService |
| `ExportCompletedEvent` | ExportService | NotificationService |
| `ReportDeadlineReminderEvent` | ReportService (Hangfire) | NotificationService |

---

## 5. Background Jobs (Hangfire)

### ReportService Jobs
- **Daily Submission Reminder** - Runs at 8:00 AM daily
- **Monthly Missing Report Check** - Runs at 8:30 AM on the 1st of each month

### ExportService Jobs
- **Expired Export Cleanup** - Runs at 2:00 AM daily
- **Automatic Consolidated Report** - Runs at 11:30 PM on the 28th-31st of each month

---

## 6. Security & Authorization

### Authentication
- JWT Bearer tokens via AuthService
- Token validation on all protected endpoints

### Authorization Policies
- `AdminOnly` - Admin or SystemAdmin role
- `ClubManagerOnly` - Club manager role
- `TreasurerOnly` - Treasurer role
- `ClubMemberOnly` - Club member role
- `AdminOrClubManager` - Admin or manager
- `AdminOrClubManagerOrMember` - Any authenticated user
- `ClubManagerOrTreasurer` - Manager or treasurer

### Authorization Checks
- Club-level access is validated via `ClubAccessClient` which calls ClubService's `/api/clubs/me/access` endpoint
- Access includes: `CanManage`, `CanManageFinance`, `CanView`

---

## 7. Technology Stack

- **Framework:** ASP.NET Core 8.0 (Minimal APIs)
- **Database:** SQL Server + Entity Framework Core
- **Authentication:** JWT Bearer Tokens
- **Messaging:** RabbitMQ
- **Background Jobs:** Hangfire
- **API Gateway:** YARP (Yet Another Reverse Proxy)
- **File Storage:** Local filesystem
- **CORS:** Enabled for all origins (development)

---

*Generated on: 2026-07-13*
