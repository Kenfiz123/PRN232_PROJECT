using AuthService.Models;
using ClubReportHub.Shared.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public static class AuthSeeder
{
    public static async Task SeedAsync(AuthDbContext db, IPasswordHasher<User> passwordHasher)
    {
        await EnsureRoleAsync(db, AuthRoles.Admin);
        await EnsureRoleAsync(db, AuthRoles.ClubManager);
        await db.SaveChangesAsync();

        await EnsureUserAsync(
            db,
            passwordHasher,
            username: "admin@club.local",
            fullName: "System Administrator",
            email: "admin@club.local",
            password: "Admin@12345",
            roles: [AuthRoles.Admin]);

        await EnsureUserAsync(
            db,
            passwordHasher,
            username: "manager@club.local",
            fullName: "Demo Club Manager",
            email: "manager@club.local",
            password: "Manager@12345",
            roles: [AuthRoles.ClubManager]);

        await db.SaveChangesAsync();
    }

    private static async Task EnsureRoleAsync(AuthDbContext db, string roleName)
    {
        if (!await db.Roles.AnyAsync(x => x.Name == roleName))
        {
            db.Roles.Add(new Role { Name = roleName });
        }
    }

    private static async Task EnsureUserAsync(
        AuthDbContext db,
        IPasswordHasher<User> passwordHasher,
        string username,
        string fullName,
        string email,
        string password,
        IReadOnlyCollection<string> roles)
    {
        var existing = await db.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Username == username);
        if (existing is not null)
        {
            return;
        }

        var user = new User
        {
            Username = username,
            FullName = fullName,
            Email = email,
            IsActive = true
        };
        user.PasswordHash = passwordHasher.HashPassword(user, password);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var roleEntities = await db.Roles.Where(x => roles.Contains(x.Name)).ToListAsync();
        foreach (var role in roleEntities)
        {
            db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        }
    }
}
