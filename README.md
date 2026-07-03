# ClubReport Hub

ClubReport Hub is an ASP.NET Core microservices assignment implementation for centralized university club reporting, approval, aggregation, notifications, and PDF/Excel export.

## Implemented Scope

- React web UI for Administrator and Club Manager workflows.
- Ocelot API Gateway as the single public API entry point.
- Five ASP.NET Core Web API microservices:
  - Auth Service
  - Club Service
  - Report Service
  - Export Service
  - Notification Service
- SQL Server persistence with EF Core migrations and seed data.
- JWT authentication with `ADMIN` and `CLUB_MANAGER` roles.
- RabbitMQ event publishing and notification consumption.
- Hangfire recurring jobs for deadline reminders, missing report checks, export cleanup, and automatic consolidated exports.
- Evidence upload for report attachments with file type, extension, size, and safe filename validation.
- PDF export through QuestPDF and Excel export through ClosedXML.
- Docker Compose stack for frontend, gateway, services, SQL Server, RabbitMQ, and persistent volumes.
- Swagger/OpenAPI enabled on every backend service and the gateway.

## Demo Accounts

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin@club.local` | `Admin@12345` |
| Club Manager | `manager@club.local` | `Manager@12345` |

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
