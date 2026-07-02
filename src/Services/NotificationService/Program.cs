using ClubReportHub.Shared.Auth;
using Microsoft.EntityFrameworkCore;
using NotificationService.Consumers;
using NotificationService.Contracts;
using NotificationService.Data;
using NotificationService.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<NotificationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.Configure<ClubReportHub.Shared.Messaging.RabbitMqOptions>(
    builder.Configuration.GetSection(ClubReportHub.Shared.Messaging.RabbitMqOptions.SectionName));
builder.Services.AddHostedService<RabbitMqNotificationConsumer>();
builder.Services.AddClubReportJwt(builder.Configuration);
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
app.MapGet("/", () => Results.Ok(new { service = "Notification Service", status = "running" }));

var notifications = app.MapGroup("/api/notifications").WithTags("Notifications").RequireAuthorization(AuthPolicies.AdminOrClubManager);

notifications.MapGet("/", async (
    int? recipientUserId,
    string? recipientRole,
    bool? unreadOnly,
    NotificationDbContext db) =>
{
    var query = db.Notifications.AsQueryable();
    if (recipientUserId.HasValue && !string.IsNullOrWhiteSpace(recipientRole))
    {
        query = query.Where(x => x.RecipientUserId == recipientUserId || x.RecipientRole == recipientRole);
    }
    else if (recipientUserId.HasValue)
    {
        query = query.Where(x => x.RecipientUserId == recipientUserId);
    }
    else if (!string.IsNullOrWhiteSpace(recipientRole))
    {
        query = query.Where(x => x.RecipientRole == recipientRole);
    }

    if (unreadOnly == true)
    {
        query = query.Where(x => !x.IsRead);
    }

    var rows = await query.OrderByDescending(x => x.CreatedAtUtc).Take(100).ToListAsync();
    return Results.Ok(rows.Select(ToResponse));
});

notifications.MapPut("/{id:int}/read", async (int id, NotificationDbContext db) =>
{
    var notification = await db.Notifications.FindAsync(id);
    if (notification is null)
    {
        return Results.NotFound();
    }

    notification.IsRead = true;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

notifications.MapPut("/read-all", async (int? recipientUserId, string? recipientRole, NotificationDbContext db) =>
{
    var query = db.Notifications.Where(x => !x.IsRead);
    if (recipientUserId.HasValue)
    {
        query = query.Where(x => x.RecipientUserId == recipientUserId);
    }

    if (!string.IsNullOrWhiteSpace(recipientRole))
    {
        query = query.Where(x => x.RecipientRole == recipientRole);
    }

    await query.ExecuteUpdateAsync(setters => setters.SetProperty(x => x.IsRead, true));
    return Results.NoContent();
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();
    await db.Database.MigrateAsync();
    await NotificationSeeder.SeedAsync(db);
}

app.Run();

static NotificationResponse ToResponse(Notification notification) => new(
    notification.Id,
    notification.RecipientUserId,
    notification.RecipientRole,
    notification.EventType,
    notification.Title,
    notification.Message,
    notification.IsRead,
    notification.CreatedAtUtc);
