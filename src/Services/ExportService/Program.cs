using System.Security.Claims;
using System.Text.Json;
using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Data;
using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using ExportService.Contracts;
using ExportService.Data;
using ExportService.Jobs;
using ExportService.Models;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ExportDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.Configure<ExportOptions>(builder.Configuration.GetSection(ExportOptions.SectionName));
builder.Services.AddClubReportJwt(builder.Configuration);
builder.Services.AddClubAccessClient(builder.Configuration);
builder.Services.AddRabbitMqEventBus(builder.Configuration);

// Add HttpClient for Report Service communication
builder.Services.AddHttpClient("ReportService", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:ReportService:BaseUrl"] ?? "http://localhost:5103/");
    client.Timeout = TimeSpan.FromSeconds(30);
});
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
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:3000", "http://localhost:5173"];
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddHealthChecks();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/error");
}

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
app.MapGet("/error", () => Results.Problem("An unexpected error occurred.")).AllowAnonymous();
app.MapGet("/", () => Results.Ok(new { service = "Export Service", status = "running" }));

var exports = app.MapGroup("/api/exports").WithTags("Exports").RequireAuthorization(AuthPolicies.AdminOrClubManagerOrMember);

exports.MapGet("/", async (
    string? status,
    int page,
    int pageSize,
    ExportDbContext db,
    ClaimsPrincipal user,
    HttpContext httpContext,
    ClubAccessClient clubAccess,
    CancellationToken cancellationToken) =>
{
    page = Math.Max(page, 1);
    pageSize = pageSize is <= 0 or > 100 ? 20 : pageSize;
    var query = db.ExportRequests.Include(x => x.File).AsQueryable();
    if (!IsAdministrator(user))
    {
        var managedClubIds = await GetManagedClubIdsAsync(clubAccess, httpContext, cancellationToken);
        var userId = user.GetUserId();
        query = query.Where(x => x.RequestedByUserId == userId && x.ClubId.HasValue && managedClubIds.Contains(x.ClubId.Value));
    }

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

exports.MapGet("/{id:int}", async (
    int id,
    ExportDbContext db,
    ClaimsPrincipal user,
    HttpContext httpContext,
    ClubAccessClient clubAccess,
    CancellationToken cancellationToken) =>
{
    var request = await db.ExportRequests.Include(x => x.File).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (request is null)
    {
        return Results.NotFound();
    }

    if (!await CanAccessExportAsync(request, user, clubAccess, httpContext, cancellationToken))
    {
        return Results.Forbid();
    }

    return Results.Ok(ToResponse(request));
});

exports.MapPost("/", async (
    CreateExportRequest request,
    ExportDbContext db,
    IEventBus eventBus,
    ClaimsPrincipal user,
    HttpContext httpContext,
    ClubAccessClient clubAccess,
    CancellationToken cancellationToken) =>
{
    var isAdministrator = IsAdministrator(user);
    if (!isAdministrator)
    {
        if (!request.ClubId.HasValue || !await CanManageClubAsync(request.ClubId.Value, clubAccess, httpContext, cancellationToken))
        {
            return Results.Forbid();
        }
    }

    var normalizedType = request.ExportType.Equals("EXCEL", StringComparison.OrdinalIgnoreCase) ? "EXCEL" : "PDF";
    var export = new ExportRequest
    {
        ExportType = normalizedType,
        Scope = isAdministrator
            ? (string.IsNullOrWhiteSpace(request.Scope) ? "Consolidated" : request.Scope.Trim())
            : "Club",
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

exports.MapGet("/{id:int}/download", async (
    int id,
    ExportDbContext db,
    ClaimsPrincipal user,
    HttpContext httpContext,
    ClubAccessClient clubAccess,
    CancellationToken cancellationToken) =>
{
    var file = await db.ExportFiles.Include(x => x.ExportRequest).FirstOrDefaultAsync(x => x.ExportRequestId == id, cancellationToken);
    if (file is null || !file.IsAvailable || !File.Exists(file.FilePath))
    {
        return Results.NotFound(new { message = "Export file is not available." });
    }

    if (!await CanAccessExportAsync(file.ExportRequest, user, clubAccess, httpContext, cancellationToken))
    {
        return Results.Forbid();
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
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseStartup");
    await db.ApplyMigrationsWithRetryAsync(logger);
}

EnsureHangfireSchema(connectionString);

RecurringJob.AddOrUpdate<ExportJob>(
    "expired-export-cleanup",
    job => job.CleanupExpiredAsync(CancellationToken.None),
    "0 2 * * *");
RecurringJob.AddOrUpdate<ExportJob>(
    "automatic-consolidated-report",
    job => job.CreateAutomaticConsolidatedExportAsync(CancellationToken.None),
    "30 23 28-31 * *");

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

static bool IsAdministrator(ClaimsPrincipal user) =>
    user.IsInRole(AuthRoles.Admin)
    || user.IsInRole(AuthRoles.SystemAdmin)
    || user.IsInRole(AuthRoles.StudentAffairsAdmin);

static async Task<HashSet<int>> GetManagedClubIdsAsync(
    ClubAccessClient clubAccess,
    HttpContext httpContext,
    CancellationToken cancellationToken)
{
    var access = await clubAccess.GetMyAccessAsync(httpContext.GetBearerToken(), cancellationToken);
    return access.Where(x => x.CanManage).Select(x => x.ClubId).ToHashSet();
}

static async Task<bool> CanManageClubAsync(
    int clubId,
    ClubAccessClient clubAccess,
    HttpContext httpContext,
    CancellationToken cancellationToken)
{
    var access = await clubAccess.GetMyAccessAsync(httpContext.GetBearerToken(), cancellationToken);
    return access.Any(x => x.ClubId == clubId && x.CanManage);
}

static async Task<bool> CanAccessExportAsync(
    ExportRequest request,
    ClaimsPrincipal user,
    ClubAccessClient clubAccess,
    HttpContext httpContext,
    CancellationToken cancellationToken)
{
    if (IsAdministrator(user))
    {
        return true;
    }

    return request.RequestedByUserId == user.GetUserId()
        && request.ClubId.HasValue
        && await CanManageClubAsync(request.ClubId.Value, clubAccess, httpContext, cancellationToken);
}
