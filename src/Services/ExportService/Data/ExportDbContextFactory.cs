using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ExportService.Data;

public sealed class ExportDbContextFactory : IDesignTimeDbContextFactory<ExportDbContext>
{
    public ExportDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ExportDbContext>()
            .UseSqlServer("Server=localhost;Database=ClubReportHub_Export;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        return new ExportDbContext(options);
    }
}
