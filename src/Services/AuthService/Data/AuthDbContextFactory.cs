using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AuthService.Data;

public sealed class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
{
    public AuthDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AuthDbContext>()
            .UseSqlServer("Server=localhost;Database=ClubReportHub_Auth;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        return new AuthDbContext(options);
    }
}
