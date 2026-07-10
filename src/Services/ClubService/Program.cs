using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Data;
using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using ClubService.Contracts;
using ClubService.Data;
using ClubService.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ClubDbContext>(options =>
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
app.MapGet("/", () => Results.Ok(new { service = "Club Service", status = "running" }));

var clubs = app.MapGroup("/api/clubs").WithTags("Clubs").RequireAuthorization(AuthPolicies.AdminOrClubManagerOrMember);

clubs.MapGet("/", async (string? search, bool? active, ClubDbContext db) =>
{
    var query = db.Clubs.Include(x => x.ManagerAssignments).AsQueryable();
    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(x => x.Code.Contains(search) || x.Name.Contains(search));
    }

    if (active.HasValue)
    {
        query = query.Where(x => x.IsActive == active);
    }

    var result = await query.OrderBy(x => x.Name).ToListAsync();
    return Results.Ok(result.Select(ToResponse));
});

clubs.MapGet("/{id:int}", async (int id, ClubDbContext db) =>
{
    var club = await db.Clubs.Include(x => x.ManagerAssignments).FirstOrDefaultAsync(x => x.Id == id);
    return club is null ? Results.NotFound() : Results.Ok(ToResponse(club));
});

clubs.MapGet("/manager/{managerUserId:int}", async (int managerUserId, ClubDbContext db) =>
{
    var clubsForManager = await db.Clubs
        .Include(x => x.ManagerAssignments)
        .Where(x => x.ManagerAssignments.Any(m => m.ManagerUserId == managerUserId && m.IsActive))
        .OrderBy(x => x.Name)
        .ToListAsync();
    return Results.Ok(clubsForManager.Select(ToResponse));
});

clubs.MapPost("/", async (
    CreateClubRequest request,
    ClubDbContext db,
    IEventBus eventBus,
    CancellationToken cancellationToken) =>
{
    var code = request.Code.Trim().ToUpperInvariant();
    if (await db.Clubs.AnyAsync(x => x.Code == code, cancellationToken))
    {
        return Results.Conflict(new { message = "Club code already exists." });
    }

    var club = new Club
    {
        Code = code,
        Name = request.Name.Trim(),
        Description = request.Description.Trim(),
        ContactEmail = request.ContactEmail.Trim(),
        ContactPhone = request.ContactPhone.Trim()
    };
    db.Clubs.Add(club);
    await db.SaveChangesAsync(cancellationToken);

    await eventBus.PublishAsync(new ClubCreatedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        club.Id,
        club.Code,
        club.Name), EventRoutingKeys.ClubCreated, cancellationToken);

    return Results.Created($"/api/clubs/{club.Id}", ToResponse(club));
}).RequireAuthorization(AuthPolicies.AdminOnly);

clubs.MapPut("/{id:int}", async (int id, UpdateClubRequest request, ClubDbContext db) =>
{
    var club = await db.Clubs.Include(x => x.ManagerAssignments).FirstOrDefaultAsync(x => x.Id == id);
    if (club is null)
    {
        return Results.NotFound();
    }

    club.Name = request.Name.Trim();
    club.Description = request.Description.Trim();
    club.ContactEmail = request.ContactEmail.Trim();
    club.ContactPhone = request.ContactPhone.Trim();
    club.IsActive = request.IsActive;
    await db.SaveChangesAsync();
    return Results.Ok(ToResponse(club));
}).RequireAuthorization(AuthPolicies.AdminOnly);

clubs.MapDelete("/{id:int}", async (int id, ClubDbContext db) =>
{
    var club = await db.Clubs.FindAsync(id);
    if (club is null)
    {
        return Results.NotFound();
    }

    club.IsActive = false;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization(AuthPolicies.AdminOnly);

clubs.MapPost("/{id:int}/managers", async (int id, AssignManagerRequest request, ClubDbContext db) =>
{
    var club = await db.Clubs.Include(x => x.ManagerAssignments).FirstOrDefaultAsync(x => x.Id == id);
    if (club is null)
    {
        return Results.NotFound();
    }

    foreach (var assignment in club.ManagerAssignments.Where(x => x.IsActive))
    {
        assignment.IsActive = false;
        assignment.EndedAtUtc = DateTimeOffset.UtcNow;
    }

    db.ClubManagerAssignments.Add(new ClubManagerAssignment
    {
        ClubId = id,
        ManagerUserId = request.ManagerUserId,
        ManagerName = request.ManagerName.Trim(),
        IsActive = true
    });

    await db.SaveChangesAsync();
    var updated = await db.Clubs.Include(x => x.ManagerAssignments).FirstAsync(x => x.Id == id);
    return Results.Ok(ToResponse(updated));
}).RequireAuthorization(AuthPolicies.AdminOnly);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ClubDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseStartup");
    await db.ApplyMigrationsWithRetryAsync(logger);
    await ClubSeeder.SeedAsync(db);
}

app.Run();

static ClubResponse ToResponse(Club club)
{
    var managers = club.ManagerAssignments
        .OrderByDescending(x => x.IsActive)
        .ThenByDescending(x => x.AssignedAtUtc)
        .Select(x => new ManagerAssignmentResponse(
            x.Id,
            x.ManagerUserId,
            x.ManagerName,
            x.AssignedAtUtc,
            x.EndedAtUtc,
            x.IsActive))
        .ToArray();

    return new ClubResponse(
        club.Id,
        club.Code,
        club.Name,
        club.Description,
        club.ContactEmail,
        club.ContactPhone,
        club.IsActive,
        managers);
}
