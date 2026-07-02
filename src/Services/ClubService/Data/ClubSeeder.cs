using ClubService.Models;
using Microsoft.EntityFrameworkCore;

namespace ClubService.Data;

public static class ClubSeeder
{
    public static async Task SeedAsync(ClubDbContext db)
    {
        if (await db.Clubs.AnyAsync())
        {
            return;
        }

        var robotics = new Club
        {
            Code = "ROB",
            Name = "Robotics Club",
            Description = "Student club focused on robotics, automation, and competition preparation.",
            ContactEmail = "robotics@university.local",
            ContactPhone = "0900000001"
        };
        var music = new Club
        {
            Code = "MUS",
            Name = "Music Club",
            Description = "Performance, practice, and campus music event coordination.",
            ContactEmail = "music@university.local",
            ContactPhone = "0900000002"
        };
        var volunteer = new Club
        {
            Code = "VOL",
            Name = "Volunteer Club",
            Description = "Community outreach and campus volunteering activities.",
            ContactEmail = "volunteer@university.local",
            ContactPhone = "0900000003"
        };

        db.Clubs.AddRange(robotics, music, volunteer);
        await db.SaveChangesAsync();

        db.ClubManagerAssignments.Add(new ClubManagerAssignment
        {
            ClubId = robotics.Id,
            ManagerUserId = 2,
            ManagerName = "Demo Club Manager",
            IsActive = true
        });

        await db.SaveChangesAsync();
    }
}
