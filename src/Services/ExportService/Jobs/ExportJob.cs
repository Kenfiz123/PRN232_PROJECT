using System.Security.Cryptography;
using ClosedXML.Excel;
using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using ExportService.Data;
using ExportService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ExportService.Jobs;

public sealed class ExportJob(
    ExportDbContext db,
    IEventBus eventBus,
    IOptions<ExportOptions> options,
    ILogger<ExportJob> logger)
{
    private readonly ExportOptions _options = options.Value;

    public async Task GenerateAsync(int exportRequestId, CancellationToken cancellationToken = default)
    {
        var request = await db.ExportRequests.Include(x => x.File).FirstOrDefaultAsync(x => x.Id == exportRequestId, cancellationToken);
        if (request is null)
        {
            logger.LogWarning("Export request {ExportRequestId} was not found", exportRequestId);
            return;
        }

        try
        {
            request.Status = ExportStatuses.Processing;
            await db.SaveChangesAsync(cancellationToken);

            Directory.CreateDirectory(_options.StoragePath);
            var normalizedType = request.ExportType.Equals("EXCEL", StringComparison.OrdinalIgnoreCase) ? "EXCEL" : "PDF";
            var extension = normalizedType == "EXCEL" ? "xlsx" : "pdf";
            var fileName = $"clubreport-{request.Scope.ToLowerInvariant()}-{request.Id}.{extension}";
            var filePath = Path.Combine(_options.StoragePath, fileName);

            if (normalizedType == "EXCEL")
            {
                GenerateExcel(request, filePath);
            }
            else
            {
                GeneratePdf(request, filePath);
            }

            var fileInfo = new FileInfo(filePath);
            var checksum = await ComputeChecksumAsync(filePath, cancellationToken);
            request.Status = ExportStatuses.Completed;
            request.CompletedAtUtc = DateTimeOffset.UtcNow;
            request.ErrorMessage = null;
            request.File = new ExportFile
            {
                FileName = fileName,
                FilePath = filePath,
                ContentType = normalizedType == "EXCEL"
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "application/pdf",
                SizeBytes = fileInfo.Length,
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(_options.RetentionDays),
                Checksum = checksum,
                IsAvailable = true
            };

            await db.SaveChangesAsync(cancellationToken);
            await eventBus.PublishAsync(new ExportCompletedEvent(
                Guid.NewGuid(),
                DateTimeOffset.UtcNow,
                request.Id,
                request.ExportType,
                fileName,
                request.RequestedByUserId), EventRoutingKeys.ExportCompleted, cancellationToken);
        }
        catch (Exception ex)
        {
            request.Status = ExportStatuses.Failed;
            request.ErrorMessage = ex.Message;
            await db.SaveChangesAsync(cancellationToken);
            logger.LogError(ex, "Export request {ExportRequestId} failed", exportRequestId);
            throw;
        }
    }

    public async Task CleanupExpiredAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var expired = await db.ExportFiles
            .Include(x => x.ExportRequest)
            .Where(x => x.IsAvailable && x.ExpiresAtUtc <= now)
            .ToListAsync(cancellationToken);

        foreach (var file in expired)
        {
            if (File.Exists(file.FilePath))
            {
                File.Delete(file.FilePath);
            }

            file.IsAvailable = false;
            file.ExportRequest.Status = ExportStatuses.Expired;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task CreateAutomaticConsolidatedExportAsync(CancellationToken cancellationToken = default)
    {
        var tomorrow = DateTime.UtcNow.AddDays(1);
        if (tomorrow.Day != 1)
        {
            return;
        }

        var period = DateTime.UtcNow.ToString("yyyy-MM");
        var request = new ExportRequest
        {
            ExportType = "EXCEL",
            Scope = "Consolidated",
            Period = period,
            RequestedByUserId = 0,
            RequestedByName = "Hangfire",
            CriteriaJson = $$"""{"period":"{{period}}","automatic":true}"""
        };
        db.ExportRequests.Add(request);
        await db.SaveChangesAsync(cancellationToken);
        await GenerateAsync(request.Id, cancellationToken);
    }

    private static void GenerateExcel(ExportRequest request, string filePath)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("ClubReport Export");
        worksheet.Cell(1, 1).Value = "ClubReport Hub Export";
        worksheet.Cell(2, 1).Value = "Request ID";
        worksheet.Cell(2, 2).Value = request.Id;
        worksheet.Cell(3, 1).Value = "Type";
        worksheet.Cell(3, 2).Value = request.ExportType;
        worksheet.Cell(4, 1).Value = "Scope";
        worksheet.Cell(4, 2).Value = request.Scope;
        worksheet.Cell(5, 1).Value = "Period";
        worksheet.Cell(5, 2).Value = request.Period ?? "All";
        worksheet.Cell(6, 1).Value = "Club ID";
        worksheet.Cell(6, 2).Value = request.ClubId?.ToString() ?? "All";
        worksheet.Cell(7, 1).Value = "Requested By";
        worksheet.Cell(7, 2).Value = request.RequestedByName;
        worksheet.Cell(8, 1).Value = "Generated At UTC";
        worksheet.Cell(8, 2).Value = DateTimeOffset.UtcNow.ToString("u");

        worksheet.Cell(10, 1).Value = "Metric";
        worksheet.Cell(10, 2).Value = "Value";
        worksheet.Cell(11, 1).Value = "Approved reports";
        worksheet.Cell(11, 2).Value = request.Scope.Equals("Consolidated", StringComparison.OrdinalIgnoreCase) ? 12 : 1;
        worksheet.Cell(12, 1).Value = "Total activities";
        worksheet.Cell(12, 2).Value = request.Scope.Equals("Consolidated", StringComparison.OrdinalIgnoreCase) ? 48 : 4;
        worksheet.Cell(13, 1).Value = "Total participants";
        worksheet.Cell(13, 2).Value = request.Scope.Equals("Consolidated", StringComparison.OrdinalIgnoreCase) ? 1240 : 86;

        worksheet.Range("A1:B1").Merge().Style.Font.SetBold().Font.SetFontSize(16);
        worksheet.Range("A10:B10").Style.Font.SetBold();
        worksheet.Columns().AdjustToContents();
        workbook.SaveAs(filePath);
    }

    private static void GeneratePdf(ExportRequest request, string filePath)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.DefaultTextStyle(x => x.FontSize(11));
                page.Header().Text("ClubReport Hub").SemiBold().FontSize(18).FontColor(Colors.Blue.Darken2);
                page.Content().Column(column =>
                {
                    column.Spacing(10);
                    column.Item().Text($"Export request #{request.Id}").SemiBold().FontSize(15);
                    column.Item().Text($"Type: {request.ExportType}");
                    column.Item().Text($"Scope: {request.Scope}");
                    column.Item().Text($"Period: {request.Period ?? "All"}");
                    column.Item().Text($"Club ID: {request.ClubId?.ToString() ?? "All"}");
                    column.Item().Text($"Requested by: {request.RequestedByName}");
                    column.Item().Text($"Generated at UTC: {DateTimeOffset.UtcNow:u}");
                    column.Item().LineHorizontal(1);
                    column.Item().Text("Demo export content").SemiBold();
                    column.Item().Text("The production integration point can replace this generated summary with aggregated report data from Report Service.");
                });
                page.Footer().AlignRight().Text(text =>
                {
                    text.Span("Page ");
                    text.CurrentPageNumber();
                });
            });
        }).GeneratePdf(filePath);
    }

    private static async Task<string> ComputeChecksumAsync(string filePath, CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(filePath);
        using var sha256 = SHA256.Create();
        var hash = await sha256.ComputeHashAsync(stream, cancellationToken);
        return Convert.ToHexString(hash);
    }
}
