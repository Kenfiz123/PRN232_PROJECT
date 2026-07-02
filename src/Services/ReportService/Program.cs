using System.Security.Claims;
using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using ReportService.Contracts;
using ReportService.Data;
using ReportService.Jobs;
using ReportService.Models;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ReportDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddClubReportJwt(builder.Configuration);
builder.Services.AddRabbitMqEventBus(builder.Configuration);
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(connectionString, new SqlServerStorageOptions
    {
        PrepareSchemaIfNecessary = true,
        QueuePollInterval = TimeSpan.FromSeconds(10)
    }));
builder.Services.AddHangfireServer();
builder.Services.AddScoped<ReportDeadlineJobs>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new AllowAllDashboardAuthorizationFilter()]
});

app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Ok(new { service = "Report Service", status = "running" }));

var reports = app.MapGroup("/api/reports").WithTags("Reports").RequireAuthorization(AuthPolicies.AdminOrClubManager);

reports.MapGet("/", async (
    int? clubId,
    string? status,
    string? period,
    int page,
    int pageSize,
    ReportDbContext db) =>
{
    page = Math.Max(page, 1);
    pageSize = pageSize is <= 0 or > 100 ? 20 : pageSize;

    var query = db.Reports
        .Include(x => x.Details)
        .Include(x => x.Attachments)
        .Include(x => x.Feedback)
        .AsQueryable();

    if (clubId.HasValue)
    {
        query = query.Where(x => x.ClubId == clubId);
    }

    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(x => x.Status == status);
    }

    if (!string.IsNullOrWhiteSpace(period))
    {
        query = query.Where(x => x.Period == period);
    }

    var total = await query.CountAsync();
    var rows = await query
        .OrderByDescending(x => x.UpdatedAtUtc)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new { total, page, pageSize, items = rows.Select(ToResponse) });
});

reports.MapGet("/summary", async (ReportDbContext db) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var allReports = await db.Reports.ToListAsync();
    return Results.Ok(new ReportSummaryResponse(
        allReports.Count,
        allReports.Count(x => x.Status == ReportStatuses.Draft),
        allReports.Count(x => x.Status == ReportStatuses.Submitted),
        allReports.Count(x => x.Status == ReportStatuses.UnderReview),
        allReports.Count(x => x.Status == ReportStatuses.Approved),
        allReports.Count(x => x.Status == ReportStatuses.Rejected),
        allReports.Count(x => (x.Status == ReportStatuses.Draft || x.Status == ReportStatuses.Rejected) && x.DueDate < today)));
});

reports.MapGet("/aggregate", async (string? period, ReportDbContext db) =>
{
    var query = db.Reports.Include(x => x.Details).Where(x => x.Status == ReportStatuses.Approved);
    if (!string.IsNullOrWhiteSpace(period))
    {
        query = query.Where(x => x.Period == period);
    }

    var approved = await query.ToListAsync();
    var clubs = approved
        .GroupBy(x => new { x.ClubId, x.ClubName })
        .Select(group => new ClubAggregationRow(
            group.Key.ClubId,
            group.Key.ClubName,
            group.Count(),
            group.Sum(x => x.Details.Count),
            group.Sum(x => x.Details.Sum(d => d.ParticipantCount))))
        .OrderByDescending(x => x.Participants)
        .ToArray();

    return Results.Ok(new AggregationResponse(
        period,
        approved.Count,
        approved.Sum(x => x.Details.Count),
        approved.Sum(x => x.Details.Sum(d => d.ParticipantCount)),
        clubs));
});

reports.MapGet("/{id:int}", async (int id, ReportDbContext db) =>
{
    var report = await db.Reports
        .Include(x => x.Details)
        .Include(x => x.Attachments)
        .Include(x => x.Feedback)
        .FirstOrDefaultAsync(x => x.Id == id);

    return report is null ? Results.NotFound() : Results.Ok(ToResponse(report));
});

reports.MapPost("/", async (CreateReportRequest request, ReportDbContext db, ClaimsPrincipal user) =>
{
    if (await db.Reports.AnyAsync(x => x.ClubId == request.ClubId && x.Period == request.Period))
    {
        return Results.Conflict(new { message = "A report already exists for this club and period." });
    }

    var report = new Report
    {
        ClubId = request.ClubId,
        ClubName = request.ClubName.Trim(),
        Period = request.Period.Trim(),
        DueDate = request.DueDate,
        CreatedByUserId = user.GetUserId(),
        Details = request.Details.Select(ToDetail).ToList()
    };

    db.Reports.Add(report);
    await db.SaveChangesAsync();
    await AddAuditAsync(db, report.Id, "Create", user.GetUserId(), "Report draft created.");
    return Results.Created($"/api/reports/{report.Id}", ToResponse(report));
});

reports.MapPut("/{id:int}", async (int id, UpdateReportRequest request, ReportDbContext db, ClaimsPrincipal user) =>
{
    var report = await db.Reports.Include(x => x.Details).Include(x => x.Attachments).Include(x => x.Feedback).FirstOrDefaultAsync(x => x.Id == id);
    if (report is null)
    {
        return Results.NotFound();
    }

    if (report.Status is not (ReportStatuses.Draft or ReportStatuses.Rejected))
    {
        return Results.BadRequest(new { message = "Only draft or rejected reports can be edited." });
    }

    report.Period = request.Period.Trim();
    report.DueDate = request.DueDate;
    report.UpdatedAtUtc = DateTimeOffset.UtcNow;
    report.Version++;
    db.ReportDetails.RemoveRange(report.Details);
    report.Details = request.Details.Select(ToDetail).ToList();
    await db.SaveChangesAsync();
    await AddAuditAsync(db, report.Id, "Update", user.GetUserId(), "Report draft updated.");
    return Results.Ok(ToResponse(report));
});

reports.MapPost("/{id:int}/attachments", async (int id, AddAttachmentRequest request, ReportDbContext db, ClaimsPrincipal user) =>
{
    var report = await db.Reports.Include(x => x.Details).Include(x => x.Attachments).Include(x => x.Feedback).FirstOrDefaultAsync(x => x.Id == id);
    if (report is null)
    {
        return Results.NotFound();
    }

    if (request.SizeBytes > 10 * 1024 * 1024)
    {
        return Results.BadRequest(new { message = "Maximum attachment metadata size is 10 MB." });
    }

    var allowedTypes = new[] { "image/png", "image/jpeg", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
    if (!allowedTypes.Contains(request.ContentType))
    {
        return Results.BadRequest(new { message = "File type is not allowed." });
    }

    var safeName = Path.GetFileName(request.FileName);
    report.Attachments.Add(new ReportAttachment
    {
        ReportDetailId = request.ReportDetailId,
        FileName = safeName,
        ContentType = request.ContentType,
        SizeBytes = request.SizeBytes,
        StoragePath = request.StoragePath.Trim()
    });
    report.UpdatedAtUtc = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    await AddAuditAsync(db, report.Id, "Attachment", user.GetUserId(), $"Attachment metadata added: {safeName}");
    return Results.Ok(ToResponse(report));
});

reports.MapPost("/{id:int}/submit", async (int id, ReportDbContext db, IEventBus eventBus, ClaimsPrincipal user, CancellationToken cancellationToken) =>
{
    var report = await db.Reports.Include(x => x.Details).Include(x => x.Attachments).Include(x => x.Feedback).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (report is null)
    {
        return Results.NotFound();
    }

    if (report.Details.Count == 0)
    {
        return Results.BadRequest(new { message = "At least one activity detail is required before submission." });
    }

    if (report.Status is not (ReportStatuses.Draft or ReportStatuses.Rejected))
    {
        return Results.BadRequest(new { message = "Only draft or rejected reports can be submitted." });
    }

    report.Status = ReportStatuses.Submitted;
    report.SubmittedAtUtc = DateTimeOffset.UtcNow;
    report.UpdatedAtUtc = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync(cancellationToken);
    await AddAuditAsync(db, report.Id, "Submit", user.GetUserId(), "Report submitted for review.", cancellationToken);

    await eventBus.PublishAsync(new ReportSubmittedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        report.Id,
        report.ClubId,
        report.ClubName,
        report.Period,
        user.GetUserId()), EventRoutingKeys.ReportSubmitted, cancellationToken);

    return Results.Ok(ToResponse(report));
});

reports.MapPost("/{id:int}/review", async (int id, ReportDbContext db, ClaimsPrincipal user) =>
{
    var report = await db.Reports.Include(x => x.Details).Include(x => x.Attachments).Include(x => x.Feedback).FirstOrDefaultAsync(x => x.Id == id);
    if (report is null)
    {
        return Results.NotFound();
    }

    if (report.Status != ReportStatuses.Submitted)
    {
        return Results.BadRequest(new { message = "Only submitted reports can enter review." });
    }

    report.Status = ReportStatuses.UnderReview;
    report.ReviewedByUserId = user.GetUserId();
    report.ReviewedAtUtc = DateTimeOffset.UtcNow;
    report.UpdatedAtUtc = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    await AddAuditAsync(db, report.Id, "Review", user.GetUserId(), "Report marked under review.");
    return Results.Ok(ToResponse(report));
}).RequireAuthorization(AuthPolicies.AdminOnly);

reports.MapPost("/{id:int}/approve", async (int id, ReviewRequest request, ReportDbContext db, IEventBus eventBus, ClaimsPrincipal user, CancellationToken cancellationToken) =>
{
    var report = await db.Reports.Include(x => x.Details).Include(x => x.Attachments).Include(x => x.Feedback).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (report is null)
    {
        return Results.NotFound();
    }

    if (report.Status is not (ReportStatuses.Submitted or ReportStatuses.UnderReview))
    {
        return Results.BadRequest(new { message = "Only submitted or under-review reports can be approved." });
    }

    report.Status = ReportStatuses.Approved;
    report.ReviewedByUserId = user.GetUserId();
    report.ReviewedAtUtc = DateTimeOffset.UtcNow;
    report.UpdatedAtUtc = DateTimeOffset.UtcNow;
    report.Feedback.Add(new ReportFeedback
    {
        ReviewerUserId = user.GetUserId(),
        ReviewerName = user.GetDisplayName(),
        Decision = ReportStatuses.Approved,
        Message = request.Feedback ?? "Approved."
    });
    await db.SaveChangesAsync(cancellationToken);
    await AddAuditAsync(db, report.Id, "Approve", user.GetUserId(), "Report approved.", cancellationToken);

    await eventBus.PublishAsync(new ReportApprovedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        report.Id,
        report.ClubId,
        report.ClubName,
        report.Period,
        user.GetUserId()), EventRoutingKeys.ReportApproved, cancellationToken);

    return Results.Ok(ToResponse(report));
}).RequireAuthorization(AuthPolicies.AdminOnly);

reports.MapPost("/{id:int}/reject", async (int id, ReviewRequest request, ReportDbContext db, IEventBus eventBus, ClaimsPrincipal user, CancellationToken cancellationToken) =>
{
    var feedback = string.IsNullOrWhiteSpace(request.Feedback) ? "Please revise the report and resubmit." : request.Feedback.Trim();
    var report = await db.Reports.Include(x => x.Details).Include(x => x.Attachments).Include(x => x.Feedback).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (report is null)
    {
        return Results.NotFound();
    }

    if (report.Status is not (ReportStatuses.Submitted or ReportStatuses.UnderReview))
    {
        return Results.BadRequest(new { message = "Only submitted or under-review reports can be rejected." });
    }

    report.Status = ReportStatuses.Rejected;
    report.ReviewedByUserId = user.GetUserId();
    report.ReviewedAtUtc = DateTimeOffset.UtcNow;
    report.UpdatedAtUtc = DateTimeOffset.UtcNow;
    report.Feedback.Add(new ReportFeedback
    {
        ReviewerUserId = user.GetUserId(),
        ReviewerName = user.GetDisplayName(),
        Decision = ReportStatuses.Rejected,
        Message = feedback
    });
    await db.SaveChangesAsync(cancellationToken);
    await AddAuditAsync(db, report.Id, "Reject", user.GetUserId(), feedback, cancellationToken);

    await eventBus.PublishAsync(new ReportRejectedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        report.Id,
        report.ClubId,
        report.ClubName,
        report.Period,
        user.GetUserId(),
        feedback), EventRoutingKeys.ReportRejected, cancellationToken);

    return Results.Ok(ToResponse(report));
}).RequireAuthorization(AuthPolicies.AdminOnly);

var deadlines = app.MapGroup("/api/deadlines").WithTags("Deadlines").RequireAuthorization(AuthPolicies.AdminOnly);
deadlines.MapGet("/", async (ReportDbContext db) => Results.Ok(await db.ReportingDeadlines.OrderBy(x => x.Period).ToListAsync()));
deadlines.MapPost("/", async (DeadlineRequest request, ReportDbContext db) =>
{
    var deadline = await db.ReportingDeadlines.FirstOrDefaultAsync(x => x.Period == request.Period);
    if (deadline is null)
    {
        deadline = new ReportingDeadline { Period = request.Period.Trim() };
        db.ReportingDeadlines.Add(deadline);
    }

    deadline.DueDate = request.DueDate;
    deadline.IsActive = request.IsActive;
    await db.SaveChangesAsync();
    return Results.Ok(deadline);
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ReportDbContext>();
    await db.Database.MigrateAsync();
    await ReportSeeder.SeedAsync(db);
}

EnsureHangfireSchema(connectionString);

RecurringJob.AddOrUpdate<ReportDeadlineJobs>(
    "daily-submission-reminder",
    job => job.PublishDailyReminderAsync(CancellationToken.None),
    "0 8 * * *");
RecurringJob.AddOrUpdate<ReportDeadlineJobs>(
    "monthly-missing-report-check",
    job => job.PublishMissingReportCheckAsync(CancellationToken.None),
    "30 8 1 * *");

app.Run();

static void EnsureHangfireSchema(string? connectionString)
{
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        return;
    }

    using var connection = new SqlConnection(connectionString);
    connection.Open();
    SqlServerObjectsInstaller.Install(connection);
}

static ReportDetail ToDetail(UpsertReportDetailRequest request) => new()
{
    ActivityName = request.ActivityName.Trim(),
    ActivityDate = request.ActivityDate,
    Description = request.Description.Trim(),
    ParticipantCount = Math.Max(0, request.ParticipantCount),
    Outcome = request.Outcome.Trim()
};

static async Task AddAuditAsync(ReportDbContext db, int reportId, string action, int actorUserId, string description, CancellationToken cancellationToken = default)
{
    db.AuditLogs.Add(new AuditLog
    {
        ReportId = reportId,
        Action = action,
        ActorUserId = actorUserId,
        Description = description
    });
    await db.SaveChangesAsync(cancellationToken);
}

static ReportResponse ToResponse(Report report) => new(
    report.Id,
    report.ClubId,
    report.ClubName,
    report.Period,
    report.Status,
    report.CreatedByUserId,
    report.DueDate,
    report.CreatedAtUtc,
    report.UpdatedAtUtc,
    report.SubmittedAtUtc,
    report.ReviewedAtUtc,
    report.Version,
    report.Details.OrderBy(x => x.ActivityDate).Select(x => new ReportDetailResponse(
        x.Id,
        x.ActivityName,
        x.ActivityDate,
        x.Description,
        x.ParticipantCount,
        x.Outcome)).ToArray(),
    report.Attachments.OrderByDescending(x => x.UploadedAtUtc).Select(x => new ReportAttachmentResponse(
        x.Id,
        x.ReportDetailId,
        x.FileName,
        x.ContentType,
        x.SizeBytes,
        x.StoragePath,
        x.UploadedAtUtc)).ToArray(),
    report.Feedback.OrderByDescending(x => x.CreatedAtUtc).Select(x => new ReportFeedbackResponse(
        x.Id,
        x.ReviewerUserId,
        x.ReviewerName,
        x.Decision,
        x.Message,
        x.CreatedAtUtc)).ToArray());
