using ClubService.Models;
using Microsoft.EntityFrameworkCore;

namespace ClubService.Data;

public sealed class ClubDbContext(DbContextOptions<ClubDbContext> options) : DbContext(options)
{
    public DbSet<Club> Clubs => Set<Club>();
    public DbSet<ClubManagerAssignment> ClubManagerAssignments => Set<ClubManagerAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Club>(entity =>
        {
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.Code).HasMaxLength(30);
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.Property(x => x.ContactEmail).HasMaxLength(200);
            entity.Property(x => x.ContactPhone).HasMaxLength(40);
        });

        modelBuilder.Entity<ClubManagerAssignment>(entity =>
        {
            entity.HasIndex(x => new { x.ClubId, x.ManagerUserId, x.IsActive });
            entity.Property(x => x.ManagerName).HasMaxLength(200);
            entity.HasOne(x => x.Club)
                .WithMany(x => x.ManagerAssignments)
                .HasForeignKey(x => x.ClubId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
