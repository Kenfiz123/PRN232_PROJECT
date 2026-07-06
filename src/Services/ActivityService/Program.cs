using System.Security.Claims;
using ActivityService.Contracts;
using ActivityService.Data;
using ActivityService.Models;
using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ActivityDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddClubReportJwt(builder.Configuration);
builder.Services.AddRabbitMqEventBus(builder.Configuration);
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

app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Ok(new { service = "Activity Service", status = "running" }));

var activities = app.MapGroup("/api/activities").WithTags("Activities").RequireAuthorization(AuthPolicies.AdminOrClubManagerOrMember);

activities.MapGet("/", async (
    int? clubId,
    string? status,
    DateTimeOffset? from,
    DateTimeOffset? to,
    ActivityDbContext db) =>
{
    var query = db.Activities.Include(x => x.Participants).AsQueryable();
    if (clubId.HasValue)
    {
        query = query.Where(x => x.ClubId == clubId);
    }

    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(x => x.Status == status);
    }

    if (from.HasValue)
    {
        query = query.Where(x => x.StartTimeUtc >= from.Value);
    }

    if (to.HasValue)
    {
        query = query.Where(x => x.StartTimeUtc <= to.Value);
    }

    var rows = await query.OrderBy(x => x.StartTimeUtc).ToListAsync();
    return Results.Ok(rows.Select(ToResponse));
});

activities.MapGet("/{id:int}", async (int id, ActivityDbContext db) =>
{
    var activity = await db.Activities.Include(x => x.Participants).FirstOrDefaultAsync(x => x.Id == id);
    return activity is null ? Results.NotFound() : Results.Ok(ToResponse(activity));
});

app.MapGet("/api/clubs/{clubId:int}/activities", async (int clubId, ActivityDbContext db) =>
{
    var rows = await db.Activities
        .Include(x => x.Participants)
        .Where(x => x.ClubId == clubId)
        .OrderBy(x => x.StartTimeUtc)
        .ToListAsync();
    return Results.Ok(rows.Select(ToResponse));
}).RequireAuthorization(AuthPolicies.AdminOrClubManagerOrMember).WithTags("Activities");

activities.MapPost("/", async (
    CreateActivityRequest request,
    ActivityDbContext db,
    IEventBus eventBus,
    ClaimsPrincipal user,
    CancellationToken cancellationToken) =>
{
    if (request.EndTimeUtc <= request.StartTimeUtc)
    {
        return Results.BadRequest(new { message = "End time must be after start time." });
    }

    var activity = new ClubActivity
    {
        ClubId = request.ClubId,
        ClubName = request.ClubName.Trim(),
        Title = request.Title.Trim(),
        Description = request.Description.Trim(),
        StartTimeUtc = request.StartTimeUtc,
        EndTimeUtc = request.EndTimeUtc,
        Location = request.Location.Trim(),
        CreatedByUserId = user.GetUserId()
    };

    db.Activities.Add(activity);
    await db.SaveChangesAsync(cancellationToken);

    await eventBus.PublishAsync(new ActivityCreatedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        activity.Id,
        activity.ClubId,
        activity.ClubName,
        activity.Title,
        activity.StartTimeUtc), EventRoutingKeys.ActivityCreated, cancellationToken);

    return Results.Created($"/api/activities/{activity.Id}", ToResponse(activity));
}).RequireAuthorization(AuthPolicies.AdminOrClubManager);

activities.MapPut("/{id:int}", async (int id, UpdateActivityRequest request, ActivityDbContext db) =>
{
    var activity = await db.Activities.Include(x => x.Participants).FirstOrDefaultAsync(x => x.Id == id);
    if (activity is null)
    {
        return Results.NotFound();
    }

    if (request.EndTimeUtc <= request.StartTimeUtc)
    {
        return Results.BadRequest(new { message = "End time must be after start time." });
    }

    activity.Title = request.Title.Trim();
    activity.Description = request.Description.Trim();
    activity.StartTimeUtc = request.StartTimeUtc;
    activity.EndTimeUtc = request.EndTimeUtc;
    activity.Location = request.Location.Trim();
    activity.Status = request.Status.Trim();
    activity.UpdatedAtUtc = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(ToResponse(activity));
}).RequireAuthorization(AuthPolicies.AdminOrClubManager);

activities.MapPost("/{id:int}/participants", async (
    int id,
    RegisterActivityParticipantRequest request,
    ActivityDbContext db,
    ClaimsPrincipal user) =>
{
    var activity = await db.Activities.Include(x => x.Participants).FirstOrDefaultAsync(x => x.Id == id);
    if (activity is null)
    {
        return Results.NotFound();
    }

    var userId = request.UserId ?? user.GetUserId();
    if (activity.Participants.Any(x => x.UserId == userId))
    {
        return Results.Conflict(new { message = "Participant is already registered for this activity." });
    }

    activity.Participants.Add(new ActivityParticipant
    {
        UserId = userId,
        FullName = string.IsNullOrWhiteSpace(request.FullName) ? user.GetDisplayName() : request.FullName.Trim()
    });
    await db.SaveChangesAsync();
    return Results.Ok(ToResponse(activity));
});

activities.MapPatch("/{id:int}/complete", async (int id, ActivityDbContext db) =>
{
    var activity = await db.Activities.Include(x => x.Participants).FirstOrDefaultAsync(x => x.Id == id);
    if (activity is null)
    {
        return Results.NotFound();
    }

    activity.Status = ActivityStatuses.Completed;
    activity.UpdatedAtUtc = DateTimeOffset.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(ToResponse(activity));
}).RequireAuthorization(AuthPolicies.AdminOrClubManager);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ActivityDbContext>();
    await db.Database.EnsureCreatedAsync();
    await ActivitySeeder.SeedAsync(db);
}

app.Run();

static ActivityResponse ToResponse(ClubActivity activity) => new(
    activity.Id,
    activity.ClubId,
    activity.ClubName,
    activity.Title,
    activity.Description,
    activity.StartTimeUtc,
    activity.EndTimeUtc,
    activity.Location,
    activity.Status,
    activity.CreatedByUserId,
    activity.CreatedAtUtc,
    activity.Participants
        .OrderBy(x => x.RegisteredAtUtc)
        .Select(x => new ActivityParticipantResponse(
            x.Id,
            x.UserId,
            x.FullName,
            x.AttendanceStatus,
            x.RegisteredAtUtc))
        .ToArray());
