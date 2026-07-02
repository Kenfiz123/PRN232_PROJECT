namespace ExportService.Models;

public sealed class ExportRequest
{
    public int Id { get; set; }
    public string ExportType { get; set; } = "PDF";
    public string Scope { get; set; } = "Individual";
    public string Status { get; set; } = ExportStatuses.Queued;
    public string? Period { get; set; }
    public int? ClubId { get; set; }
    public int RequestedByUserId { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public string CriteriaJson { get; set; } = "{}";
    public string? ErrorMessage { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAtUtc { get; set; }
    public ExportFile? File { get; set; }
}
