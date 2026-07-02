using System.Security.Claims;
using System.Text.Json;
using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using ExportService.Contracts;
using ExportService.Data;
using ExportService.Jobs;
using ExportService.Models;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ExportDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.Configure<ExportOptions>(builder.Configuration.GetSection(ExportOptions.SectionName));
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
builder.Services.AddScoped<ExportJob>();
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
app.MapGet("/", () => Results.Ok(new { service = "Export Service", status = "running" }));

var exports = app.MapGroup("/api/exports").WithTags("Exports").RequireAuthorization(AuthPolicies.AdminOrClubManager);

exports.MapGet("/", async (string? status, int page, int pageSize, ExportDbContext db) =>
{
    page = Math.Max(page, 1);
    pageSize = pageSize is <= 0 or > 100 ? 20 : pageSize;
    var query = db.ExportRequests.Include(x => x.File).AsQueryable();
    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(x => x.Status == status);
    }

    var total = await query.CountAsync();
    var items = await query.OrderByDescending(x => x.CreatedAtUtc)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Results.Ok(new { total, page, pageSize, items = items.Select(ToResponse) });
});

exports.MapGet("/{id:int}", async (int id, ExportDbContext db) =>
{
    var request = await db.ExportRequests.Include(x => x.File).FirstOrDefaultAsync(x => x.Id == id);
    return request is null ? Results.NotFound() : Results.Ok(ToResponse(request));
});

exports.MapPost("/", async (
    CreateExportRequest request,
    ExportDbContext db,
    IEventBus eventBus,
    ClaimsPrincipal user,
    CancellationToken cancellationToken) =>
{
    var normalizedType = request.ExportType.Equals("EXCEL", StringComparison.OrdinalIgnoreCase) ? "EXCEL" : "PDF";
    var export = new ExportRequest
    {
        ExportType = normalizedType,
        Scope = string.IsNullOrWhiteSpace(request.Scope) ? "Individual" : request.Scope.Trim(),
        Period = request.Period,
        ClubId = request.ClubId,
        RequestedByUserId = user.GetUserId(),
        RequestedByName = user.GetDisplayName(),
        CriteriaJson = JsonSerializer.Serialize(new { request.Period, request.ClubId })
    };

    db.ExportRequests.Add(export);
    await db.SaveChangesAsync(cancellationToken);
    await eventBus.PublishAsync(new ExportRequestedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        export.Id,
        export.ExportType,
        export.Scope,
        export.RequestedByUserId), EventRoutingKeys.ExportRequested, cancellationToken);

    BackgroundJob.Enqueue<ExportJob>(job => job.GenerateAsync(export.Id, CancellationToken.None));
    return Results.Accepted($"/api/exports/{export.Id}", ToResponse(export));
});

exports.MapGet("/{id:int}/download", async (int id, ExportDbContext db) =>
{
    var file = await db.ExportFiles.Include(x => x.ExportRequest).FirstOrDefaultAsync(x => x.ExportRequestId == id);
    if (file is null || !file.IsAvailable || !File.Exists(file.FilePath))
    {
        return Results.NotFound(new { message = "Export file is not available." });
    }

    return Results.File(file.FilePath, file.ContentType, file.FileName);
});

exports.MapDelete("/{id:int}", async (int id, ExportDbContext db) =>
{
    var request = await db.ExportRequests.Include(x => x.File).FirstOrDefaultAsync(x => x.Id == id);
    if (request is null)
    {
        return Results.NotFound();
    }

    if (request.File is not null)
    {
        if (File.Exists(request.File.FilePath))
        {
            File.Delete(request.File.FilePath);
        }

        request.File.IsAvailable = false;
    }

    request.Status = ExportStatuses.Expired;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization(AuthPolicies.AdminOnly);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ExportDbContext>();
    await db.Database.MigrateAsync();
}

RecurringJob.AddOrUpdate<ExportJob>(
    "expired-export-cleanup",
    job => job.CleanupExpiredAsync(CancellationToken.None),
    "0 2 * * *");
RecurringJob.AddOrUpdate<ExportJob>(
    "automatic-consolidated-report",
    job => job.CreateAutomaticConsolidatedExportAsync(CancellationToken.None),
    "30 23 28-31 * *");

app.Run();

static ExportResponse ToResponse(ExportRequest request) => new(
    request.Id,
    request.ExportType,
    request.Scope,
    request.Status,
    request.Period,
    request.ClubId,
    request.RequestedByUserId,
    request.RequestedByName,
    request.CreatedAtUtc,
    request.CompletedAtUtc,
    request.ErrorMessage,
    request.File is null ? null : new ExportFileResponse(
        request.File.Id,
        request.File.FileName,
        request.File.ContentType,
        request.File.SizeBytes,
        request.File.ExpiresAtUtc,
        request.File.Checksum,
        request.File.IsAvailable));
