namespace ClubReportHub.Shared.Events;

public abstract record IntegrationEvent(Guid EventId, DateTimeOffset OccurredAtUtc);

public sealed record ClubCreatedEvent(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    int ClubId,
    string ClubCode,
    string ClubName)
    : IntegrationEvent(EventId, OccurredAtUtc);

public sealed record ReportSubmittedEvent(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    int ReportId,
    int ClubId,
    string ClubName,
    string Period,
    int SubmittedByUserId)
    : IntegrationEvent(EventId, OccurredAtUtc);

public sealed record ReportApprovedEvent(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    int ReportId,
    int ClubId,
    string ClubName,
    string Period,
    int ApprovedByUserId)
    : IntegrationEvent(EventId, OccurredAtUtc);

public sealed record ReportRejectedEvent(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    int ReportId,
    int ClubId,
    string ClubName,
    string Period,
    int RejectedByUserId,
    string Feedback)
    : IntegrationEvent(EventId, OccurredAtUtc);

public sealed record ExportRequestedEvent(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    int ExportRequestId,
    string ExportType,
    string Scope,
    int RequestedByUserId)
    : IntegrationEvent(EventId, OccurredAtUtc);

public sealed record ExportCompletedEvent(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    int ExportRequestId,
    string ExportType,
    string FileName,
    int RequestedByUserId)
    : IntegrationEvent(EventId, OccurredAtUtc);

public sealed record ReportDeadlineReminderEvent(
    Guid EventId,
    DateTimeOffset OccurredAtUtc,
    string Period,
    DateOnly DueDate,
    IReadOnlyCollection<int> MissingClubIds)
    : IntegrationEvent(EventId, OccurredAtUtc);
