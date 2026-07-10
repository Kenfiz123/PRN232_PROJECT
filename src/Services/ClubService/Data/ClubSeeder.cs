using ClubService.Models;
using Microsoft.EntityFrameworkCore;

namespace ClubService.Data;

public static class ClubSeeder
{
    public static async Task SeedAsync(ClubDbContext db)
    {
        Club? robotics;

        if (!await db.Clubs.AnyAsync())
        {
            robotics = new Club
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
        }
        else
        {
            robotics = await db.Clubs.FirstOrDefaultAsync(x => x.Code == "ROB");
            if (robotics is null)
            {
                return;
            }
        }

        if (!await db.ClubManagerAssignments.AnyAsync(x => x.ClubId == robotics.Id && x.ManagerUserId == 2 && x.IsActive))
        {
            db.ClubManagerAssignments.Add(new ClubManagerAssignment
            {
                ClubId = robotics.Id,
                ManagerUserId = 2,
                ManagerName = "Demo Club Manager",
                IsActive = true
            });
        }

        await EnsureMembershipAsync(db, robotics.Id, 2, "Demo Club Manager", ClubMemberRoles.Member);
        await EnsureMembershipAsync(db, robotics.Id, 4, "Demo Club Treasurer", ClubMemberRoles.Treasurer);
        await EnsureMembershipAsync(db, robotics.Id, 5, "Demo Club Member", ClubMemberRoles.Member);

        await db.SaveChangesAsync();
    }

    private static async Task EnsureMembershipAsync(ClubDbContext db, int clubId, int userId, string fullName, string role)
    {
        var membership = await db.ClubMemberships.FirstOrDefaultAsync(x => x.ClubId == clubId && x.UserId == userId);
        if (membership is null)
        {
            db.ClubMemberships.Add(new ClubMembership
            {
                ClubId = clubId,
                UserId = userId,
                FullName = fullName,
                Role = role,
                Status = ClubMembershipStatuses.Approved,
                ReviewedAtUtc = DateTimeOffset.UtcNow,
                ReviewedByUserId = 1
            });
            return;
        }

        membership.FullName = fullName;
        membership.Role = role;
        membership.Status = ClubMembershipStatuses.Approved;
    }
}
