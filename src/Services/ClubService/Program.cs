using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Data;
using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using ClubService.Contracts;
using ClubService.Data;
using ClubService.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
    var query = db.Clubs
        .Include(x => x.ManagerAssignments)
        .Include(x => x.Memberships)
        .AsQueryable();
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

clubs.MapGet("/me/managed", async (ClaimsPrincipal user, ClubDbContext db) =>
{
    var userId = user.GetUserId();
    var clubsForManager = await db.Clubs
        .Include(x => x.ManagerAssignments)
        .Include(x => x.Memberships)
        .Where(x => x.ManagerAssignments.Any(m => m.ManagerUserId == userId && m.IsActive))
        .OrderBy(x => x.Name)
        .ToListAsync();
    return Results.Ok(clubsForManager.Select(ToResponse));
});

clubs.MapGet("/me/memberships", async (ClaimsPrincipal user, ClubDbContext db) =>
{
    var userId = user.GetUserId();
    var memberships = await db.ClubMemberships
        .Include(x => x.Club)
        .Where(x => x.UserId == userId)
        .OrderByDescending(x => x.RequestedAtUtc)
        .ToListAsync();
    return Results.Ok(memberships.Select(ToMembershipResponse));
});

clubs.MapGet("/applications", async (ClubDbContext db) =>
{
    var applications = await db.ClubCreationApplications
        .OrderByDescending(x => x.SubmittedAtUtc)
        .ToListAsync();
    return Results.Ok(applications.Select(ToApplicationResponse));
}).RequireAuthorization(AuthPolicies.AdminOnly);

clubs.MapPost("/applications", async (
    CreateClubApplicationRequest request,
    ClaimsPrincipal user,
    ClubDbContext db) =>
{
    var userId = user.GetUserId();
    var code = request.Code.Trim().ToUpperInvariant();

    if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new { message = "Club code and name are required." });
    }

    if (await db.ClubManagerAssignments.AnyAsync(x => x.ManagerUserId == userId && x.IsActive))
    {
        return Results.Conflict(new { message = "Each club owner can manage one club only." });
    }

    if (await db.Clubs.AnyAsync(x => x.Code == code))
    {
        return Results.Conflict(new { message = "Club code already exists." });
    }

    if (await db.ClubCreationApplications.AnyAsync(x => x.RequesterUserId == userId && x.Status == ClubApplicationStatuses.Submitted))
    {
        return Results.Conflict(new { message = "You already have a pending club creation application." });
    }

    var application = new ClubCreationApplication
    {
        RequesterUserId = userId,
        RequesterName = user.GetDisplayName(),
        Code = code,
        Name = request.Name.Trim(),
        Description = request.Description.Trim(),
        ContactEmail = request.ContactEmail.Trim(),
        ContactPhone = request.ContactPhone.Trim()
    };

    db.ClubCreationApplications.Add(application);
    await db.SaveChangesAsync();
    return Results.Created($"/api/clubs/applications/{application.Id}", ToApplicationResponse(application));
});

clubs.MapPost("/applications/{applicationId:int}/approve", async (
    int applicationId,
    ReviewClubApplicationRequest request,
    ClaimsPrincipal user,
    ClubDbContext db,
    IEventBus eventBus,
    CancellationToken cancellationToken) =>
{
    var application = await db.ClubCreationApplications.FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
    if (application is null)
    {
        return Results.NotFound();
    }

    if (application.Status != ClubApplicationStatuses.Submitted)
    {
        return Results.Conflict(new { message = "Application was already reviewed." });
    }

    if (await db.ClubManagerAssignments.AnyAsync(x => x.ManagerUserId == application.RequesterUserId && x.IsActive, cancellationToken))
    {
        return Results.Conflict(new { message = "Requester already owns a club." });
    }

    if (await db.Clubs.AnyAsync(x => x.Code == application.Code, cancellationToken))
    {
        return Results.Conflict(new { message = "Club code already exists." });
    }

    var club = new Club
    {
        Code = application.Code,
        Name = application.Name,
        Description = application.Description,
        ContactEmail = application.ContactEmail,
        ContactPhone = application.ContactPhone
    };
    club.ManagerAssignments.Add(new ClubManagerAssignment
    {
        ManagerUserId = application.RequesterUserId,
        ManagerName = application.RequesterName,
        IsActive = true
    });
    club.Memberships.Add(new ClubMembership
    {
        UserId = application.RequesterUserId,
        FullName = application.RequesterName,
        Role = ClubMemberRoles.Member,
        Status = ClubMembershipStatuses.Approved,
        ReviewedAtUtc = DateTimeOffset.UtcNow,
        ReviewedByUserId = user.GetUserId()
    });

    db.Clubs.Add(club);
    await db.SaveChangesAsync(cancellationToken);

    application.Status = ClubApplicationStatuses.Approved;
    application.ReviewNote = request.Note?.Trim();
    application.CreatedClubId = club.Id;
    application.ReviewedAtUtc = DateTimeOffset.UtcNow;
    application.ReviewedByUserId = user.GetUserId();
    await db.SaveChangesAsync(cancellationToken);

    await eventBus.PublishAsync(new ClubCreatedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        club.Id,
        club.Code,
        club.Name), EventRoutingKeys.ClubCreated, cancellationToken);

    return Results.Ok(ToApplicationResponse(application));
}).RequireAuthorization(AuthPolicies.AdminOnly);

clubs.MapPost("/applications/{applicationId:int}/reject", async (
    int applicationId,
    ReviewClubApplicationRequest request,
    ClaimsPrincipal user,
    ClubDbContext db) =>
{
    var application = await db.ClubCreationApplications.FirstOrDefaultAsync(x => x.Id == applicationId);
    if (application is null)
    {
        return Results.NotFound();
    }

    if (application.Status != ClubApplicationStatuses.Submitted)
    {
        return Results.Conflict(new { message = "Application was already reviewed." });
    }

    application.Status = ClubApplicationStatuses.Rejected;
    application.ReviewNote = request.Note?.Trim();
    application.ReviewedAtUtc = DateTimeOffset.UtcNow;
    application.ReviewedByUserId = user.GetUserId();
    await db.SaveChangesAsync();
    return Results.Ok(ToApplicationResponse(application));
}).RequireAuthorization(AuthPolicies.AdminOnly);

clubs.MapGet("/{id:int}", async (int id, ClubDbContext db) =>
{
    var club = await db.Clubs
        .Include(x => x.ManagerAssignments)
        .Include(x => x.Memberships)
        .FirstOrDefaultAsync(x => x.Id == id);
    return club is null ? Results.NotFound() : Results.Ok(ToResponse(club));
});

clubs.MapGet("/manager/{managerUserId:int}", async (int managerUserId, ClubDbContext db) =>
{
    var clubsForManager = await db.Clubs
        .Include(x => x.ManagerAssignments)
        .Include(x => x.Memberships)
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
    var club = await db.Clubs
        .Include(x => x.ManagerAssignments)
        .Include(x => x.Memberships)
        .FirstOrDefaultAsync(x => x.Id == id);
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
    var club = await db.Clubs
        .Include(x => x.ManagerAssignments)
        .Include(x => x.Memberships)
        .FirstOrDefaultAsync(x => x.Id == id);
    if (club is null)
    {
        return Results.NotFound();
    }

    var managesAnotherClub = await db.ClubManagerAssignments
        .AnyAsync(x => x.ManagerUserId == request.ManagerUserId && x.ClubId != id && x.IsActive);
    if (managesAnotherClub)
    {
        return Results.Conflict(new { message = "Each club owner can manage one club only." });
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

    var existingMembership = club.Memberships.FirstOrDefault(x => x.UserId == request.ManagerUserId);
    if (existingMembership is null)
    {
        club.Memberships.Add(new ClubMembership
        {
            ClubId = id,
            UserId = request.ManagerUserId,
            FullName = request.ManagerName.Trim(),
            Role = ClubMemberRoles.Member,
            Status = ClubMembershipStatuses.Approved,
            ReviewedAtUtc = DateTimeOffset.UtcNow
        });
    }
    else
    {
        existingMembership.FullName = request.ManagerName.Trim();
        existingMembership.Status = ClubMembershipStatuses.Approved;
        existingMembership.ReviewedAtUtc = DateTimeOffset.UtcNow;
    }

    await db.SaveChangesAsync();
    var updated = await db.Clubs
        .Include(x => x.ManagerAssignments)
        .Include(x => x.Memberships)
        .FirstAsync(x => x.Id == id);
    return Results.Ok(ToResponse(updated));
}).RequireAuthorization(AuthPolicies.AdminOnly);

clubs.MapPost("/{id:int}/join", async (
    int id,
    JoinClubRequest request,
    ClaimsPrincipal user,
    ClubDbContext db) =>
{
    var club = await db.Clubs
        .Include(x => x.ManagerAssignments)
        .Include(x => x.Memberships)
        .FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
    if (club is null)
    {
        return Results.NotFound();
    }

    var userId = user.GetUserId();
    if (club.ManagerAssignments.Any(x => x.ManagerUserId == userId && x.IsActive))
    {
        return Results.Conflict(new { message = "Club owner is already attached to this club." });
    }

    var existing = club.Memberships.FirstOrDefault(x => x.UserId == userId);
    if (existing is not null)
    {
        if (existing.Status == ClubMembershipStatuses.Rejected)
        {
            existing.Status = ClubMembershipStatuses.Pending;
            existing.Role = ClubMemberRoles.Member;
            existing.RequestMessage = request.Message?.Trim();
            existing.RequestedAtUtc = DateTimeOffset.UtcNow;
            existing.ReviewedAtUtc = null;
            existing.ReviewedByUserId = null;
            await db.SaveChangesAsync();
            return Results.Ok(ToMembershipResponseWithClub(existing, club));
        }

        return Results.Conflict(new { message = $"Membership request already exists with status {existing.Status}." });
    }

    var membership = new ClubMembership
    {
        ClubId = id,
        UserId = userId,
        FullName = user.GetDisplayName(),
        RequestMessage = request.Message?.Trim(),
        Role = ClubMemberRoles.Member,
        Status = ClubMembershipStatuses.Pending
    };
    db.ClubMemberships.Add(membership);
    await db.SaveChangesAsync();

    membership.Club = club;
    return Results.Created($"/api/clubs/memberships/{membership.Id}", ToMembershipResponse(membership));
});

clubs.MapGet("/{id:int}/memberships", async (int id, ClaimsPrincipal user, ClubDbContext db) =>
{
    if (!IsAdmin(user) && !await UserOwnsClubAsync(db, id, user.GetUserId()))
    {
        return Results.Forbid();
    }

    var memberships = await db.ClubMemberships
        .Include(x => x.Club)
        .Where(x => x.ClubId == id)
        .OrderBy(x => x.Status)
        .ThenBy(x => x.FullName)
        .ToListAsync();
    return Results.Ok(memberships.Select(ToMembershipResponse));
});

clubs.MapPost("/memberships/{membershipId:int}/approve", async (
    int membershipId,
    ReviewClubMembershipRequest request,
    ClaimsPrincipal user,
    ClubDbContext db) =>
{
    var membership = await db.ClubMemberships
        .Include(x => x.Club)
        .FirstOrDefaultAsync(x => x.Id == membershipId);
    if (membership is null)
    {
        return Results.NotFound();
    }

    if (!IsAdmin(user) && !await UserOwnsClubAsync(db, membership.ClubId, user.GetUserId()))
    {
        return Results.Forbid();
    }

    membership.Status = ClubMembershipStatuses.Approved;
    membership.Role = ClubMemberRoles.Member;
    membership.ReviewedAtUtc = DateTimeOffset.UtcNow;
    membership.ReviewedByUserId = user.GetUserId();
    await db.SaveChangesAsync();
    return Results.Ok(ToMembershipResponse(membership));
});

clubs.MapPost("/memberships/{membershipId:int}/reject", async (
    int membershipId,
    ReviewClubMembershipRequest request,
    ClaimsPrincipal user,
    ClubDbContext db) =>
{
    var membership = await db.ClubMemberships
        .Include(x => x.Club)
        .FirstOrDefaultAsync(x => x.Id == membershipId);
    if (membership is null)
    {
        return Results.NotFound();
    }

    if (!IsAdmin(user) && !await UserOwnsClubAsync(db, membership.ClubId, user.GetUserId()))
    {
        return Results.Forbid();
    }

    membership.Status = ClubMembershipStatuses.Rejected;
    membership.Role = ClubMemberRoles.Member;
    membership.ReviewedAtUtc = DateTimeOffset.UtcNow;
    membership.ReviewedByUserId = user.GetUserId();
    await db.SaveChangesAsync();
    return Results.Ok(ToMembershipResponse(membership));
});

clubs.MapPost("/{id:int}/treasurers", async (
    int id,
    AssignTreasurerRequest request,
    ClaimsPrincipal user,
    ClubDbContext db) =>
{
    if (!IsAdmin(user) && !await UserOwnsClubAsync(db, id, user.GetUserId()))
    {
        return Results.Forbid();
    }

    var club = await db.Clubs
        .Include(x => x.Memberships)
        .FirstOrDefaultAsync(x => x.Id == id);
    if (club is null)
    {
        return Results.NotFound();
    }

    var membership = club.Memberships.FirstOrDefault(x => x.UserId == request.MemberUserId);
    if (membership is null || membership.Status != ClubMembershipStatuses.Approved)
    {
        return Results.BadRequest(new { message = "Treasurer must be an approved member of this club." });
    }

    if (membership.Role != ClubMemberRoles.Treasurer)
    {
        var treasurerCount = club.Memberships.Count(x => x.Role == ClubMemberRoles.Treasurer && x.Status == ClubMembershipStatuses.Approved);
        if (treasurerCount >= 2)
        {
            return Results.Conflict(new { message = "A club can have at most two treasurers." });
        }
    }

    membership.FullName = string.IsNullOrWhiteSpace(request.MemberName) ? membership.FullName : request.MemberName.Trim();
    membership.Role = ClubMemberRoles.Treasurer;
    membership.ReviewedAtUtc = DateTimeOffset.UtcNow;
    membership.ReviewedByUserId = user.GetUserId();
    await db.SaveChangesAsync();

    membership.Club = club;
    return Results.Ok(ToMembershipResponse(membership));
});

clubs.MapPost("/memberships/{membershipId:int}/member", async (
    int membershipId,
    ClaimsPrincipal user,
    ClubDbContext db) =>
{
    var membership = await db.ClubMemberships
        .Include(x => x.Club)
        .FirstOrDefaultAsync(x => x.Id == membershipId);
    if (membership is null)
    {
        return Results.NotFound();
    }

    if (!IsAdmin(user) && !await UserOwnsClubAsync(db, membership.ClubId, user.GetUserId()))
    {
        return Results.Forbid();
    }

    membership.Role = ClubMemberRoles.Member;
    membership.ReviewedAtUtc = DateTimeOffset.UtcNow;
    membership.ReviewedByUserId = user.GetUserId();
    await db.SaveChangesAsync();
    return Results.Ok(ToMembershipResponse(membership));
});

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

    var members = club.Memberships
        .OrderBy(x => x.Status)
        .ThenByDescending(x => x.Role == ClubMemberRoles.Treasurer)
        .ThenBy(x => x.FullName)
        .Select(x => ToMembershipResponseWithClub(x, club))
        .ToArray();

    return new ClubResponse(
        club.Id,
        club.Code,
        club.Name,
        club.Description,
        club.ContactEmail,
        club.ContactPhone,
        club.IsActive,
        managers,
        members);
}

static ClubMembershipResponse ToMembershipResponse(ClubMembership membership)
{
    return ToMembershipResponseWithClub(membership, membership.Club);
}

static ClubMembershipResponse ToMembershipResponseWithClub(ClubMembership membership, Club club)
{
    return new ClubMembershipResponse(
        membership.Id,
        membership.ClubId,
        club.Name,
        membership.UserId,
        membership.FullName,
        membership.Role,
        membership.Status,
        membership.RequestMessage,
        membership.RequestedAtUtc,
        membership.ReviewedAtUtc,
        membership.ReviewedByUserId);
}

static ClubCreationApplicationResponse ToApplicationResponse(ClubCreationApplication application)
{
    return new ClubCreationApplicationResponse(
        application.Id,
        application.RequesterUserId,
        application.RequesterName,
        application.Code,
        application.Name,
        application.Description,
        application.ContactEmail,
        application.ContactPhone,
        application.Status,
        application.ReviewNote,
        application.CreatedClubId,
        application.SubmittedAtUtc,
        application.ReviewedAtUtc,
        application.ReviewedByUserId);
}

static bool IsAdmin(ClaimsPrincipal user)
{
    return user.IsInRole(AuthRoles.Admin)
        || user.IsInRole(AuthRoles.SystemAdmin)
        || user.IsInRole(AuthRoles.StudentAffairsAdmin);
}

static Task<bool> UserOwnsClubAsync(ClubDbContext db, int clubId, int userId)
{
    return db.ClubManagerAssignments.AnyAsync(x => x.ClubId == clubId && x.ManagerUserId == userId && x.IsActive);
}
