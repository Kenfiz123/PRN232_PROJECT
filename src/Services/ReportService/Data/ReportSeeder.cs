using Microsoft.EntityFrameworkCore;
using ReportService.Models;

namespace ReportService.Data;

public static class ReportSeeder
{
    public static async Task SeedAsync(ReportDbContext db)
    {
        if (!await db.ReportingDeadlines.AnyAsync())
        {
            db.ReportingDeadlines.AddRange(
                new ReportingDeadline { Period = "2026-07", DueDate = new DateOnly(2026, 7, 25) },
                new ReportingDeadline { Period = "2026-08", DueDate = new DateOnly(2026, 8, 25) });
        }

        if (!await db.Reports.AnyAsync())
        {
            db.Reports.Add(new Report
            {
                ClubId = 1,
                ClubName = "Robotics Club",
                Period = "2026-07",
                CreatedByUserId = 2,
                DueDate = new DateOnly(2026, 7, 25),
                Status = ReportStatuses.Draft,
                Details =
                [
                    new ReportDetail
                    {
                        ActivityName = "Line follower workshop",
                        ActivityDate = new DateOnly(2026, 7, 10),
                        Description = "Hands-on training for beginner members.",
                        ParticipantCount = 28,
                        Outcome = "Members completed basic sensor calibration."
                    }
                ]
            });
        }

        await db.SaveChangesAsync();
    }
}
