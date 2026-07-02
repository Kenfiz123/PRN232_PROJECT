using Microsoft.EntityFrameworkCore;
using NotificationService.Models;

namespace NotificationService.Data;

public sealed class NotificationDbContext(DbContextOptions<NotificationDbContext> options) : DbContext(options)
{
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ProcessedEvent> ProcessedEvents => Set<ProcessedEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasIndex(x => new { x.RecipientUserId, x.IsRead });
            entity.HasIndex(x => new { x.RecipientRole, x.IsRead });
            entity.Property(x => x.RecipientRole).HasMaxLength(60);
            entity.Property(x => x.EventType).HasMaxLength(100);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.Message).HasMaxLength(2000);
        });

        modelBuilder.Entity<ProcessedEvent>(entity =>
        {
            entity.HasKey(x => x.EventId);
            entity.Property(x => x.RoutingKey).HasMaxLength(120);
        });
    }
}
