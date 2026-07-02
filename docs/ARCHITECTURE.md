# Architecture and Diagrams

## System Architecture

```mermaid
flowchart LR
    Browser["React Web UI"] --> Gateway["Ocelot API Gateway"]
    Gateway --> Auth["Auth Service"]
    Gateway --> Club["Club Service"]
    Gateway --> Report["Report Service"]
    Gateway --> Export["Export Service"]
    Gateway --> Notify["Notification Service"]
    Auth --> AuthDb[("Auth DB")]
    Club --> ClubDb[("Club DB")]
    Report --> ReportDb[("Report DB")]
    Export --> ExportDb[("Export DB")]
    Notify --> NotifyDb[("Notification DB")]
    Club --> Rabbit["RabbitMQ Topic Exchange"]
    Report --> Rabbit
    Export --> Rabbit
    Rabbit --> Notify
    Report --> HangfireReport["Hangfire Jobs"]
    Export --> HangfireExport["Hangfire Jobs"]
    Export --> Files["Export File Volume"]
```

## Microservices Diagram

```mermaid
flowchart TB
    subgraph AuthService["Auth Service"]
      User["User"]
      Role["Role"]
      UserRole["UserRole"]
    end
    subgraph ClubService["Club Service"]
      Club["Club"]
      Assignment["ClubManagerAssignment"]
    end
    subgraph ReportService["Report Service"]
      Report["Report"]
      Detail["ReportDetail"]
      Attachment["ReportAttachment"]
      Feedback["ReportFeedback"]
      Deadline["ReportingDeadline"]
    end
    subgraph ExportService["Export Service"]
      ExportRequest["ExportRequest"]
      ExportFile["ExportFile"]
    end
    subgraph NotificationService["Notification Service"]
      Notification["Notification"]
      Inbox["ProcessedEvent"]
    end
    ClubService -->|ClubCreatedEvent| RabbitMQ["RabbitMQ"]
    ReportService -->|ReportSubmitted/Approved/Rejected/DeadlineReminder| RabbitMQ
    ExportService -->|ExportRequested/Completed| RabbitMQ
    RabbitMQ --> NotificationService
```

## Deployment Diagram

```mermaid
flowchart LR
    subgraph DockerNetwork["clubreport Docker network"]
      Frontend["frontend:80"]
      Gateway["api-gateway:8080"]
      Auth["auth-service:8080"]
      Club["club-service:8080"]
      Report["report-service:8080"]
      Export["export-service:8080"]
      Notify["notification-service:8080"]
      SQL["sqlserver:1433"]
      Rabbit["rabbitmq:5672/15672"]
      VolumeSql[("sqlserver-data")]
      VolumeRabbit[("rabbitmq-data")]
      VolumeExports[("export-files")]
    end
    Host["Host Browser"] -->|3000| Frontend
    Host -->|7000| Gateway
    Frontend --> Gateway
    Gateway --> Auth
    Gateway --> Club
    Gateway --> Report
    Gateway --> Export
    Gateway --> Notify
    Auth --> SQL
    Club --> SQL
    Report --> SQL
    Export --> SQL
    Notify --> SQL
    Club --> Rabbit
    Report --> Rabbit
    Export --> Rabbit
    Rabbit --> Notify
    SQL --> VolumeSql
    Rabbit --> VolumeRabbit
    Export --> VolumeExports
```

## ERD

```mermaid
erDiagram
    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : grants
    CLUB ||--o{ CLUB_MANAGER_ASSIGNMENT : has
    CLUB ||--o{ REPORT : owns
    REPORT ||--o{ REPORT_DETAIL : contains
    REPORT ||--o{ REPORT_ATTACHMENT : includes
    REPORT ||--o{ REPORT_FEEDBACK : receives
    EXPORT_REQUEST ||--o| EXPORT_FILE : produces
    USER ||--o{ NOTIFICATION : receives

    USER {
      int Id
      string Username
      string FullName
      string Email
      string PasswordHash
      bool IsActive
      bool IsLocked
    }
    ROLE {
      int Id
      string Name
    }
    CLUB {
      int Id
      string Code
      string Name
      bool IsActive
    }
    CLUB_MANAGER_ASSIGNMENT {
      int Id
      int ClubId
      int ManagerUserId
      bool IsActive
    }
    REPORT {
      int Id
      int ClubId
      string Period
      string Status
      date DueDate
      int Version
    }
    REPORT_DETAIL {
      int Id
      int ReportId
      string ActivityName
      int ParticipantCount
    }
    REPORT_ATTACHMENT {
      int Id
      int ReportId
      string FileName
      long SizeBytes
    }
    REPORT_FEEDBACK {
      int Id
      int ReportId
      string Decision
      string Message
    }
    EXPORT_REQUEST {
      int Id
      string ExportType
      string Scope
      string Status
    }
    EXPORT_FILE {
      int Id
      int ExportRequestId
      string FileName
      long SizeBytes
      string Checksum
    }
    NOTIFICATION {
      int Id
      int RecipientUserId
      string RecipientRole
      bool IsRead
    }
```

## Business Events

| Event | Publisher | Subscriber |
| --- | --- | --- |
| `club.created` | Club Service | Notification Service |
| `report.submitted` | Report Service | Notification Service |
| `report.approved` | Report Service | Notification Service |
| `report.rejected` | Report Service | Notification Service |
| `export.requested` | Export Service | Export worker/logging path |
| `export.completed` | Export Service | Notification Service |
| `report.deadline.reminder` | Report Hangfire job | Notification Service |
