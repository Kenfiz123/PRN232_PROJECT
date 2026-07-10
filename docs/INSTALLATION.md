# Installation Guide

## Prerequisites

- Docker Desktop
- .NET SDK 8 or newer
- Node.js 22 or newer

## Docker Run

1. Copy the environment template:

   ```powershell
   copy .env.example .env
   ```

2. Start all containers:

   ```powershell
   docker compose up --build
   ```

3. Wait until SQL Server and RabbitMQ health checks pass. The services run EF Core migrations automatically at startup and preserve login accounts.

4. Open `http://localhost:3000`.

## Important Ports

| Component | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| API Gateway | `http://localhost:7000` |
| Auth Service | `http://localhost:5101/swagger` |
| Club Service | `http://localhost:5102/swagger` |
| Report Service | `http://localhost:5103/swagger` |
| Export Service | `http://localhost:5104/swagger` |
| Notification Service | `http://localhost:5105/swagger` |
| Activity Service | `http://localhost:5106/swagger` |
| Finance Service | `http://localhost:5107/swagger` |
| RabbitMQ Management | `http://localhost:15672` |
| SQL Server | `localhost,14333` |

## Local Development

Build backend:

```powershell
dotnet build ClubReportHub.slnx
```

Build frontend:

```powershell
cd src/Frontend
npm install
npm run build
```

Create a new migration after model changes:

```powershell
dotnet ef migrations add MigrationName --project src/Services/ReportService/ReportService.csproj --startup-project src/Services/ReportService/ReportService.csproj --output-dir Migrations
```

## Reset operational data

Keep `ClubReportHub_Auth` and clear clubs, activities, reports, finance, exports, and notifications:

```powershell
Get-Content .\docs\reset-operational-data.sql | docker exec -i clubreport-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "ClubReportHub!2026" -C -b
```
