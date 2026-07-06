using ActivityService.Models;
using Microsoft.EntityFrameworkCore;

namespace ActivityService.Data;

public static class ActivitySeeder
{
    public static async Task SeedAsync(ActivityDbContext db)
    {
        if (await db.Activities.AnyAsync())
        {
            return;
        }

        db.Activities.AddRange(
            new ClubActivity
            {
                ClubId = 1,
                ClubName = "Robotics Club",
                Title = "FPTU Robotics Weekly Workshop",
                Description = "Line follower robot calibration and demo preparation.",
                StartTimeUtc = new DateTimeOffset(2026, 7, 10, 12, 0, 0, TimeSpan.Zero),
                EndTimeUtc = new DateTimeOffset(2026, 7, 10, 14, 0, 0, TimeSpan.Zero),
                Location = "Innovation Lab",
                CreatedByUserId = 2,
                Participants =
                [
                    new ActivityParticipant
                    {
                        UserId = 5,
                        FullName = "Demo Club Member",
                        AttendanceStatus = AttendanceStatuses.Registered
                    }
                ]
            },
            new ClubActivity
            {
                ClubId = 2,
                ClubName = "Music Club",
                Title = "Acoustic Night Rehearsal",
                Description = "Prepare club performance and member onboarding session.",
                StartTimeUtc = new DateTimeOffset(2026, 7, 15, 11, 30, 0, TimeSpan.Zero),
                EndTimeUtc = new DateTimeOffset(2026, 7, 15, 13, 30, 0, TimeSpan.Zero),
                Location = "Student Hall",
                CreatedByUserId = 2
            });

        await db.SaveChangesAsync();
    }
}
