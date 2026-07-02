using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ClubService.Data;

public sealed class ClubDbContextFactory : IDesignTimeDbContextFactory<ClubDbContext>
{
    public ClubDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ClubDbContext>()
            .UseSqlServer("Server=localhost;Database=ClubReportHub_Club;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        return new ClubDbContext(options);
    }
}
