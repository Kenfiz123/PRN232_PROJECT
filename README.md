# FPTU Club Management & Report Hub

FPTU Club Management & Report Hub is an ASP.NET Core microservices assignment implementation for centralized university club operations, activity calendars, reporting, KPI leaderboard, finance workflows, notifications, and PDF/Excel export.

## Implemented Scope

- React web UI for Student, Club Manager, Treasurer, and Administrator workflows.
- YARP API Gateway as the single public API entry point.
- Seven ASP.NET Core Web API microservices:
  - Auth Service
  - Club Service
  - Activity Service
  - Report Service
  - Finance Service
  - Export Service
  - Notification Service
- SQL Server persistence with EF Core migrations and preserved login accounts.
- JWT authentication with `ADMIN`, `STUDENT_AFFAIRS_ADMIN`, `CLUB_MANAGER`, `TREASURER`, and `CLUB_MEMBER` roles.
- RabbitMQ event publishing and notification consumption.
- Hangfire recurring jobs for deadline reminders, missing report checks, export cleanup, and automatic consolidated exports.
- Evidence upload for report attachments with file type, extension, size, and safe filename validation.
- Activity calendar, KPI leaderboard, budget proposal, settlement, and finance transaction APIs.
- PDF export through QuestPDF and Excel export through ClosedXML.
- Docker Compose stack for frontend, gateway, services, SQL Server, RabbitMQ, and persistent volumes.
- Swagger/OpenAPI enabled on every backend service and the gateway.

## Tài khoản đăng nhập

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin@club.local` | `Admin@12345` |
| Student Affairs Admin | `studentaffairs@club.local` | `Admin@12345` |
| Club Manager | `manager@club.local` | `Manager@12345` |
| Treasurer | `treasurer@club.local` | `Treasurer@12345` |
| Club Member | `student@club.local` | `Student@12345` |

## Quick Start

```powershell
copy .env.example .env
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:7000`
- RabbitMQ Management: `http://localhost:15672`

For local build checks:

```powershell
dotnet build ClubReportHub.slnx
cd src/Frontend
npm install
npm run build
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [User Guide](docs/USER_GUIDE.md)
- [API Map](docs/API.md)
- [Architecture and Diagrams](docs/ARCHITECTURE.md)
- [Testing Evidence](docs/TESTING.md)
- [Operational Data Reset Script](docs/reset-operational-data.sql)
