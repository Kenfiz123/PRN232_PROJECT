# API Map

All public calls should go through the API Gateway at `http://localhost:7000`.

## Auth Service

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Issue JWT token |
| POST | `/api/auth/refresh` | Reserved refresh endpoint |
| GET | `/api/users/` | List users |
| POST | `/api/users/` | Create user |
| PUT | `/api/users/{id}` | Update user |
| PATCH | `/api/users/{id}/lock` | Lock user |
| PATCH | `/api/users/{id}/unlock` | Unlock user |
| GET | `/api/roles/` | List roles |
| POST | `/api/roles/` | Create role |

## Club Service

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/clubs/` | List clubs |
| GET | `/api/clubs/{id}` | Get club |
| POST | `/api/clubs/` | Create club and publish event |
| PUT | `/api/clubs/{id}` | Update club |
| DELETE | `/api/clubs/{id}` | Deactivate club |
| POST | `/api/clubs/{id}/managers` | Assign manager |

## Activity Service

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/activities/` | List activities with optional filters |
| GET | `/api/activities/{id}` | Get activity details |
| GET | `/api/clubs/{id}/activities` | List club calendar entries |
| POST | `/api/activities/` | Create activity and publish event |
| PUT | `/api/activities/{id}` | Update activity |
| POST | `/api/activities/{id}/participants` | Register participant |
| PATCH | `/api/activities/{id}/complete` | Mark activity completed |

## Report Service

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/reports/` | List reports |
| GET | `/api/reports/summary` | Dashboard summary |
| GET | `/api/reports/aggregate` | Approved report aggregation |
| GET | `/api/kpis/rules` | List KPI scoring rules |
| GET | `/api/kpis/leaderboard` | Calculate KPI leaderboard |
| POST | `/api/reports/` | Create draft |
| PUT | `/api/reports/{id}` | Update draft/rejected report |
| POST | `/api/reports/{id}/attachments` | Add attachment metadata |
| POST | `/api/reports/{id}/attachments/upload` | Upload evidence file with validation |
| GET | `/api/reports/{id}/attachments/{attachmentId}/download` | Download uploaded evidence |
| POST | `/api/reports/{id}/submit` | Submit report |
| POST | `/api/reports/{id}/review` | Mark under review |
| POST | `/api/reports/{id}/approve` | Approve report |
| POST | `/api/reports/{id}/reject` | Reject report with feedback |
| GET | `/api/deadlines/` | List deadlines |
| POST | `/api/deadlines/` | Upsert deadline |

## Finance Service

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/finance/proposals` | List budget proposals |
| POST | `/api/finance/proposals` | Submit budget proposal |
| POST | `/api/finance/proposals/{id}/approve` | Approve budget proposal |
| POST | `/api/finance/proposals/{id}/reject` | Reject budget proposal |
| GET | `/api/finance/settlements` | List settlements |
| POST | `/api/finance/proposals/{id}/settlements` | Submit financial settlement |
| POST | `/api/finance/settlements/{id}/approve` | Approve settlement |
| GET | `/api/finance/transactions` | List finance transactions |

## Export Service

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/exports/` | List export requests |
| POST | `/api/exports/` | Queue PDF/Excel generation |
| GET | `/api/exports/{id}` | Export status |
| GET | `/api/exports/{id}/download` | Download generated file |
| DELETE | `/api/exports/{id}` | Expire generated file |

## Notification Service

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/notifications/` | List notifications |
| PUT | `/api/notifications/{id}/read` | Mark one notification read |
| PUT | `/api/notifications/read-all` | Mark filtered notifications read |
