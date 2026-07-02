using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using Microsoft.EntityFrameworkCore;
using ReportService.Data;

namespace ReportService.Jobs;

public sealed class ReportDeadlineJobs(ReportDbContext db, IEventBus eventBus, ILogger<ReportDeadlineJobs> logger)
{
    public async Task PublishDailyReminderAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var reminders = await db.ReportingDeadlines
            .Where(x => x.IsActive && x.DueDate >= today && x.DueDate <= today.AddDays(3))
            .ToListAsync(cancellationToken);

        foreach (var deadline in reminders)
        {
            await PublishReminderForPeriod(deadline.Period, deadline.DueDate, cancellationToken);
        }
    }

    public async Task PublishMissingReportCheckAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var overdue = await db.ReportingDeadlines
            .Where(x => x.IsActive && x.DueDate < today)
            .OrderByDescending(x => x.DueDate)
            .Take(3)
            .ToListAsync(cancellationToken);

        foreach (var deadline in overdue)
        {
            await PublishReminderForPeriod(deadline.Period, deadline.DueDate, cancellationToken);
        }
    }

    private async Task PublishReminderForPeriod(string period, DateOnly dueDate, CancellationToken cancellationToken)
    {
        var submittedClubIds = await db.Reports
            .Where(x => x.Period == period && x.Status != "Draft")
            .Select(x => x.ClubId)
            .Distinct()
            .ToListAsync(cancellationToken);

        // Demo club catalog is owned by Club Service; this bounded context only emits the report-side fact.
        var missingClubIds = Enumerable.Range(1, 3).Except(submittedClubIds).ToArray();
        await eventBus.PublishAsync(new ReportDeadlineReminderEvent(
            Guid.NewGuid(),
            DateTimeOffset.UtcNow,
            period,
            dueDate,
            missingClubIds), EventRoutingKeys.ReportDeadlineReminder, cancellationToken);

        logger.LogInformation("Published deadline reminder for {Period} with {MissingCount} missing clubs", period, missingClubIds.Length);
    }
}
