using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
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
    IHttpClientFactory httpClientFactory,
    IEventBus eventBus,
    IOptions<ExportOptions> options,
    ILogger<ExportJob> logger)
{
    private readonly ExportOptions _options = options.Value;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

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

            // Fetch real data from Report Service
            var reportData = await FetchReportDataAsync(request, cancellationToken);

            Directory.CreateDirectory(_options.StoragePath);
            var normalizedType = request.ExportType.Equals("EXCEL", StringComparison.OrdinalIgnoreCase) ? "EXCEL" : "PDF";
            var extension = normalizedType == "EXCEL" ? "xlsx" : "pdf";
            var fileName = $"clubreport-{request.Scope.ToLowerInvariant()}-{request.Id}.{extension}";
            var filePath = Path.Combine(_options.StoragePath, fileName);

            if (normalizedType == "EXCEL")
            {
                GenerateExcel(request, reportData, filePath);
            }
            else
            {
                GeneratePdf(request, reportData, filePath);
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
        var tomorrow = DateTimeOffset.UtcNow.AddDays(1);
        if (tomorrow.Day != 1)
        {
            return;
        }

        var period = DateTimeOffset.UtcNow.ToString("yyyy-MM");
        var request = new ExportRequest
        {
            ExportType = "EXCEL",
            Scope = "Consolidated",
            Period = period,
            RequestedByUserId = 0,
            RequestedByName = "Hangfire",
            CriteriaJson = $"{{\"period\":\"{period}\",\"automatic\":true}}"
        };
        db.ExportRequests.Add(request);
        await db.SaveChangesAsync(cancellationToken);
        await GenerateAsync(request.Id, cancellationToken);
    }

    private async Task<ExportReportData?> FetchReportDataAsync(ExportRequest request, CancellationToken cancellationToken)
    {
        try
        {
            using var httpClient = httpClientFactory.CreateClient("ReportService");
            httpClient.BaseAddress = new Uri("http://report-service:8080/");

            AggregationResponse? aggregation = null;
            KpiLeaderboardResponse? leaderboard = null;

            // Fetch aggregation data
            var aggUrl = string.IsNullOrEmpty(request.Period)
                ? "/api/reports/aggregate"
                : $"/api/reports/aggregate?period={Uri.EscapeDataString(request.Period)}";

            var aggResponse = await httpClient.GetAsync(aggUrl, cancellationToken);
            if (aggResponse.IsSuccessStatusCode)
            {
                aggregation = await aggResponse.Content.ReadFromJsonAsync<AggregationResponse>(JsonOptions, cancellationToken);
            }

            // Fetch KPI leaderboard
            var kpiUrl = string.IsNullOrEmpty(request.Period)
                ? "/api/kpis/leaderboard"
                : $"/api/kpis/leaderboard?period={Uri.EscapeDataString(request.Period)}";

            var kpiResponse = await httpClient.GetAsync(kpiUrl, cancellationToken);
            if (kpiResponse.IsSuccessStatusCode)
            {
                leaderboard = await kpiResponse.Content.ReadFromJsonAsync<KpiLeaderboardResponse>(JsonOptions, cancellationToken);
            }

            return new ExportReportData(aggregation, leaderboard);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to fetch report data from Report Service, using limited data");
            return null;
        }
    }

    private void GenerateExcel(ExportRequest request, ExportReportData? data, string filePath)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("ClubReport Export");
        var row = 1;

        // Header
        worksheet.Cell(row, 1).Value = "ClubReport Hub - Báo Cáo Tổng Hợp";
        worksheet.Range(row, 1, row, 4).Merge().Style.Font.SetBold().Font.SetFontSize(16);
        row++;

        // Metadata
        worksheet.Cell(row, 1).Value = "Request ID";
        worksheet.Cell(row, 2).Value = request.Id;
        row++;
        worksheet.Cell(row, 1).Value = "Loại";
        worksheet.Cell(row, 2).Value = request.ExportType;
        row++;
        worksheet.Cell(row, 1).Value = "Phạm vi";
        worksheet.Cell(row, 2).Value = request.Scope;
        row++;
        worksheet.Cell(row, 1).Value = "Kỳ báo cáo";
        worksheet.Cell(row, 2).Value = request.Period ?? "Tất cả";
        row++;
        worksheet.Cell(row, 1).Value = "Người yêu cầu";
        worksheet.Cell(row, 2).Value = request.RequestedByName;
        row++;
        worksheet.Cell(row, 1).Value = "Thời gian tạo (UTC)";
        worksheet.Cell(row, 2).Value = DateTimeOffset.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
        row += 2;

        // Summary Section
        worksheet.Cell(row, 1).Value = "TÓM TẮT BÁO CÁO";
        worksheet.Range(row, 1, row, 4).Merge().Style.Font.SetBold().Font.SetFontSize(14).Font.SetUnderline();
        row++;

        worksheet.Cell(row, 1).Value = "Tổng số báo cáo được phê duyệt";
        worksheet.Cell(row, 2).Value = data?.Aggregation?.ApprovedReports ?? 0;
        row++;
        worksheet.Cell(row, 1).Value = "Tổng số hoạt động";
        worksheet.Cell(row, 2).Value = data?.Aggregation?.TotalActivities ?? 0;
        row++;
        worksheet.Cell(row, 1).Value = "Tổng số người tham gia";
        worksheet.Cell(row, 2).Value = data?.Aggregation?.TotalParticipants ?? 0;
        row += 2;

        // KPI Leaderboard Section
        if (data?.Leaderboard?.Clubs.Count > 0)
        {
            worksheet.Cell(row, 1).Value = "BẢNG XẾP HẠNG KPI";
            worksheet.Range(row, 1, row, 4).Merge().Style.Font.SetBold().Font.SetFontSize(14).Font.SetUnderline();
            row++;

            // Headers
            var headers = new[] { "Hạng", "Câu lạc bộ", "Điểm KPI", "Báo cáo", "Hoạt động", "Người tham gia", "Bị từ chối", "Quá hạn" };
            for (var col = 0; col < headers.Length; col++)
            {
                worksheet.Cell(row, col + 1).Value = headers[col];
                worksheet.Cell(row, col + 1).Style.Font.SetBold();
            }
            worksheet.Range(row, 1, row, headers.Length).Style.Fill.SetBackgroundColor(Colors.Grey.Lighten2);
            row++;

            foreach (var club in data.Leaderboard.Clubs)
            {
                worksheet.Cell(row, 1).Value = club.Rank;
                worksheet.Cell(row, 2).Value = club.ClubName;
                worksheet.Cell(row, 3).Value = club.Points;
                worksheet.Cell(row, 4).Value = club.ApprovedReports;
                worksheet.Cell(row, 5).Value = club.Activities;
                worksheet.Cell(row, 6).Value = club.Participants;
                worksheet.Cell(row, 7).Value = club.RejectedReports;
                worksheet.Cell(row, 8).Value = club.OverdueReports;
                row++;
            }
            row++;
        }

        // Club Details Section
        if (data?.Aggregation?.Clubs.Count > 0)
        {
            worksheet.Cell(row, 1).Value = "CHI TIẾT THEO CÂU LẠC BỘ";
            worksheet.Range(row, 1, row, 4).Merge().Style.Font.SetBold().Font.SetFontSize(14).Font.SetUnderline();
            row++;

            var clubHeaders = new[] { "ID", "Tên câu lạc bộ", "Báo cáo được phê duyệt", "Hoạt động", "Người tham gia" };
            for (var col = 0; col < clubHeaders.Length; col++)
            {
                worksheet.Cell(row, col + 1).Value = clubHeaders[col];
                worksheet.Cell(row, col + 1).Style.Font.SetBold();
            }
            worksheet.Range(row, 1, row, clubHeaders.Length).Style.Fill.SetBackgroundColor(Colors.Grey.Lighten2);
            row++;

            foreach (var club in data.Aggregation.Clubs)
            {
                worksheet.Cell(row, 1).Value = club.ClubId;
                worksheet.Cell(row, 2).Value = club.ClubName;
                worksheet.Cell(row, 3).Value = club.ApprovedReports;
                worksheet.Cell(row, 4).Value = club.Activities;
                worksheet.Cell(row, 5).Value = club.Participants;
                row++;
            }
        }

        // If no real data, show sample data notice
        if (data is null)
        {
            row += 2;
            worksheet.Cell(row, 1).Value = "Lưu ý: Dữ liệu báo cáo sẽ được tải từ Report Service trong môi trường production.";
            worksheet.Range(row, 1, row, 4).Merge().Style.Font.SetItalic();
        }

        worksheet.Columns().AdjustToContents();
        workbook.SaveAs(filePath);
    }

    private void GeneratePdf(ExportRequest request, ExportReportData? data, string filePath)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.DefaultTextStyle(x => x.FontSize(11));
                page.Header().Text("ClubReport Hub - Báo Cáo Tổng Hợp").SemiBold().FontSize(18).FontColor(Colors.Blue.Darken2);
                page.Content().Column(column =>
                {
                    column.Spacing(10);

                    // Metadata
                    column.Item().Text($"Mã yêu cầu: #{request.Id}").SemiBold();
                    column.Item().Text($"Loại: {request.ExportType} | Phạm vi: {request.Scope}");
                    column.Item().Text($"Kỳ báo cáo: {request.Period ?? "Tất cả"}");
                    column.Item().Text($"Người yêu cầu: {request.RequestedByName}");
                    column.Item().Text($"Thời gian tạo: {DateTimeOffset.UtcNow:u}");

                    column.Item().LineHorizontal(1);

                    // Summary
                    column.Item().Text("TÓM TẮT").SemiBold().FontSize(13);
                    column.Item().Text($"• Tổng báo cáo được phê duyệt: {data?.Aggregation?.ApprovedReports ?? 0}");
                    column.Item().Text($"• Tổng hoạt động: {data?.Aggregation?.TotalActivities ?? 0}");
                    column.Item().Text($"• Tổng người tham gia: {data?.Aggregation?.TotalParticipants ?? 0}");

                    // KPI Leaderboard
                    if (data?.Leaderboard?.Clubs.Count > 0)
                    {
                        column.Item().Text("BẢNG XẾP HẠNG KPI").SemiBold().FontSize(13);
                        column.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(30);
                                columns.RelativeColumn();
                                columns.ConstantColumn(60);
                                columns.ConstantColumn(50);
                                columns.ConstantColumn(50);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Hạng").SemiBold();
                                header.Cell().Text("Câu lạc bộ").SemiBold();
                                header.Cell().Text("Điểm").SemiBold();
                                header.Cell().Text("Báo cáo").SemiBold();
                                header.Cell().Text("Hoạt động").SemiBold();
                            });

                            foreach (var club in data.Leaderboard.Clubs.Take(10))
                            {
                                table.Cell().Text(club.Rank.ToString());
                                table.Cell().Text(club.ClubName);
                                table.Cell().Text(club.Points.ToString("N2"));
                                table.Cell().Text(club.ApprovedReports.ToString());
                                table.Cell().Text(club.Activities.ToString());
                            }
                        });
                    }

                    if (data is null)
                    {
                        column.Item().Text("Lưu ý: Kết nối Report Service không khả dụng. Dữ liệu sẽ được tải trong production.").Italic();
                    }
                });

                page.Footer().AlignRight().Text(text =>
                {
                    text.Span("Trang ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
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

// Data transfer objects for export
public sealed record ExportReportData(AggregationResponse? Aggregation, KpiLeaderboardResponse? Leaderboard);

public sealed record AggregationResponse(string? Period, int ApprovedReports, int TotalActivities, int TotalParticipants, IReadOnlyCollection<ClubAggregationRow> Clubs);

public sealed record ClubAggregationRow(int ClubId, string ClubName, int ApprovedReports, int Activities, int Participants);

public sealed record KpiLeaderboardResponse(string? Period, DateTimeOffset CalculatedAtUtc, IReadOnlyCollection<KpiLeaderboardRow> Clubs);

public sealed record KpiLeaderboardRow(int Rank, int ClubId, string ClubName, decimal Points, int ApprovedReports, int Activities, int Participants, int RejectedReports, int OverdueReports);
