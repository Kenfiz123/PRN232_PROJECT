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

## Report Service

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/reports/` | List reports |
| GET | `/api/reports/summary` | Dashboard summary |
| GET | `/api/reports/aggregate` | Approved report aggregation |
| POST | `/api/reports/` | Create draft |
| PUT | `/api/reports/{id}` | Update draft/rejected report |
| POST | `/api/reports/{id}/attachments` | Add attachment metadata |
| POST | `/api/reports/{id}/submit` | Submit report |
| POST | `/api/reports/{id}/review` | Mark under review |
| POST | `/api/reports/{id}/approve` | Approve report |
| POST | `/api/reports/{id}/reject` | Reject report with feedback |
| GET | `/api/deadlines/` | List deadlines |
| POST | `/api/deadlines/` | Upsert deadline |

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
