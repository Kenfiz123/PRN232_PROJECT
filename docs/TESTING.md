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

## Suggested Manual Demo Flow

1. Start the stack with `docker compose up --build`.
2. Log in as Administrator.
3. Refresh the dashboard and verify clubs, reports, summary, exports, and notifications load.
4. Log out and log in as Club Manager.
5. Create a demo report and submit it.
6. Log in as Administrator and approve or reject the submitted report.
7. Create a PDF export and an Excel export.
8. Verify RabbitMQ queues in `http://localhost:15672`.
9. Verify Hangfire dashboards:
   - Report Service: `http://localhost:5103/hangfire`
   - Export Service: `http://localhost:5104/hangfire`

## Residual Risks

- The export service currently generates a demonstrable export summary. A production version should pull approved report rows from Report Service through an internal API or read model.
- File upload is implemented as attachment metadata validation. Actual binary upload/storage can be added behind the same endpoint shape.
- Gateway route matching should be smoke-tested through Docker because Ocelot routes target Docker service names.
