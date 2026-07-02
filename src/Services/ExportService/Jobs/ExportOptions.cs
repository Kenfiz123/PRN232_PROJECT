namespace ExportService.Jobs;

public sealed class ExportOptions
{
    public const string SectionName = "Exports";

    public string StoragePath { get; init; } = "exports";
    public int RetentionDays { get; init; } = 14;
}
