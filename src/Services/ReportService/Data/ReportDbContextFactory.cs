using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ReportService.Data;

public sealed class ReportDbContextFactory : IDesignTimeDbContextFactory<ReportDbContext>
{
    public ReportDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ReportDbContext>()
            .UseSqlServer("Server=localhost;Database=ClubReportHub_Report;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        return new ReportDbContext(options);
    }
}
