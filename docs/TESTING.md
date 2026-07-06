# Testing Evidence

## Completed Checks

Backend compile:

```powershell
dotnet build ClubReportHub.slnx
```

Frontend compile and production build:

```powershell
cd src/Frontend
npm install
npm run build
```

EF Core migrations were generated for:

- Auth Service
- Club Service
- Report Service
- Export Service
- Notification Service

Activity Service and Finance Service create their isolated SQL Server schemas on startup for the expanded FCMRH demo.

## Suggested Manual Demo Flow

1. Start the stack with `docker compose up --build`.
2. Log in as Administrator.
3. Refresh the dashboard and verify clubs, reports, summary, exports, and notifications load.
4. Open Activities and create a demo activity.
5. Open KPI and verify the leaderboard loads.
6. Open Finance and approve a submitted budget proposal.
7. Log out and log in as Club Manager.
8. Create a demo report and submit it.
9. Log in as Administrator and approve or reject the submitted report.
10. Create a PDF export and an Excel export.
11. Verify RabbitMQ queues in `http://localhost:15672`.
12. Verify Hangfire dashboards:
   - Report Service: `http://localhost:5103/hangfire`
   - Export Service: `http://localhost:5104/hangfire`

## Residual Risks

- The export service currently generates a demonstrable export summary. A production version should pull approved report rows from Report Service through an internal API or read model.
- Activity and Finance service schemas are created at startup for the demo; production hardening can add explicit EF migrations for those services.
- Gateway route matching should be smoke-tested through Docker because YARP routes target Docker service names.
