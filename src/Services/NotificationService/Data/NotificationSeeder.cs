using ClubReportHub.Shared.Auth;
using Microsoft.EntityFrameworkCore;
using NotificationService.Models;

namespace NotificationService.Data;

public static class NotificationSeeder
{
    public static async Task SeedAsync(NotificationDbContext db)
    {
        if (await db.Notifications.AnyAsync())
        {
            return;
        }

        db.Notifications.AddRange(
            new Notification
            {
                RecipientRole = AuthRoles.Admin,
                EventType = "System",
                Title = "Welcome to ClubReport Hub",
                Message = "The reporting workspace is ready for administrators."
            },
            new Notification
            {
                RecipientUserId = 2,
                RecipientRole = AuthRoles.ClubManager,
                EventType = "System",
                Title = "Demo club assigned",
                Message = "You can create and submit reports for the Robotics Club."
            });

        await db.SaveChangesAsync();
    }
}
