using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceService.Data;

public static class FinanceSeeder
{
    public static async Task SeedAsync(FinanceDbContext db)
    {
        if (await db.BudgetProposals.AnyAsync())
        {
            return;
        }

        db.BudgetProposals.AddRange(
            new BudgetProposal
            {
                ClubId = 1,
                ClubName = "Robotics Club",
                ActivityId = 1,
                Title = "Robot parts for workshop",
                Description = "Sensors, wheels, batteries, and replacement controller boards.",
                RequestedAmount = 4500000,
                ApprovedAmount = 4000000,
                Status = FinanceStatuses.Approved,
                ProposedByUserId = 4,
                ReviewedByUserId = 1,
                ReviewedAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
                ReviewNote = "Approved with reduced spare-part budget.",
                Settlements =
                [
                    new Settlement
                    {
                        TotalSpent = 3850000,
                        ReceiptUrl = "https://example.local/receipts/robotics-workshop.pdf",
                        Status = FinanceStatuses.Submitted
                    }
                ]
            },
            new BudgetProposal
            {
                ClubId = 2,
                ClubName = "Music Club",
                ActivityId = 2,
                Title = "Acoustic Night equipment rental",
                Description = "Microphones, mixer, and lighting rental for student event.",
                RequestedAmount = 2500000,
                Status = FinanceStatuses.Submitted,
                ProposedByUserId = 4
            });

        db.FinanceTransactions.Add(new FinanceTransaction
        {
            ClubId = 1,
            Amount = 4000000,
            Type = TransactionTypes.BudgetApproved,
            Description = "Initial approved workshop budget.",
            ReferenceId = 1
        });

        await db.SaveChangesAsync();
    }
}
