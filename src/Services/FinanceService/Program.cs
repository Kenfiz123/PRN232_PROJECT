using System.Security.Claims;
using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Events;
using ClubReportHub.Shared.Messaging;
using FinanceService.Contracts;
using FinanceService.Data;
using FinanceService.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<FinanceDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddClubReportJwt(builder.Configuration);
builder.Services.AddRabbitMqEventBus(builder.Configuration);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
});
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapGet("/", () => Results.Ok(new { service = "Finance Service", status = "running" }));

var finance = app.MapGroup("/api/finance").WithTags("Finance").RequireAuthorization(AuthPolicies.ClubManagerOrTreasurer);

finance.MapGet("/proposals", async (int? clubId, string? status, FinanceDbContext db) =>
{
    var query = db.BudgetProposals.Include(x => x.Settlements).AsQueryable();
    if (clubId.HasValue)
    {
        query = query.Where(x => x.ClubId == clubId);
    }

    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(x => x.Status == status);
    }

    var rows = await query.OrderByDescending(x => x.ProposedAtUtc).ToListAsync();
    return Results.Ok(rows.Select(ToBudgetProposalResponse));
});

finance.MapGet("/proposals/{id:int}", async (int id, FinanceDbContext db) =>
{
    var proposal = await db.BudgetProposals.Include(x => x.Settlements).FirstOrDefaultAsync(x => x.Id == id);
    return proposal is null ? Results.NotFound() : Results.Ok(ToBudgetProposalResponse(proposal));
});

finance.MapPost("/proposals", async (
    CreateBudgetProposalRequest request,
    FinanceDbContext db,
    IEventBus eventBus,
    ClaimsPrincipal user,
    CancellationToken cancellationToken) =>
{
    if (request.RequestedAmount <= 0)
    {
        return Results.BadRequest(new { message = "Requested amount must be greater than zero." });
    }

    var proposal = new BudgetProposal
    {
        ClubId = request.ClubId,
        ClubName = request.ClubName.Trim(),
        ActivityId = request.ActivityId,
        Title = request.Title.Trim(),
        Description = request.Description.Trim(),
        RequestedAmount = request.RequestedAmount,
        ProposedByUserId = user.GetUserId()
    };

    db.BudgetProposals.Add(proposal);
    await db.SaveChangesAsync(cancellationToken);

    await eventBus.PublishAsync(new BudgetProposalSubmittedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        proposal.Id,
        proposal.ClubId,
        proposal.ClubName,
        proposal.RequestedAmount,
        proposal.ProposedByUserId), EventRoutingKeys.BudgetProposalSubmitted, cancellationToken);

    return Results.Created($"/api/finance/proposals/{proposal.Id}", ToBudgetProposalResponse(proposal));
});

finance.MapPost("/proposals/{id:int}/approve", async (
    int id,
    ReviewBudgetProposalRequest request,
    FinanceDbContext db,
    IEventBus eventBus,
    ClaimsPrincipal user,
    CancellationToken cancellationToken) =>
{
    var proposal = await db.BudgetProposals.Include(x => x.Settlements).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    if (proposal is null)
    {
        return Results.NotFound();
    }

    var approvedAmount = request.ApprovedAmount ?? proposal.RequestedAmount;
    if (approvedAmount <= 0)
    {
        return Results.BadRequest(new { message = "Approved amount must be greater than zero." });
    }

    proposal.Status = FinanceStatuses.Approved;
    proposal.ApprovedAmount = approvedAmount;
    proposal.ReviewedByUserId = user.GetUserId();
    proposal.ReviewedAtUtc = DateTimeOffset.UtcNow;
    proposal.ReviewNote = string.IsNullOrWhiteSpace(request.Note) ? "Budget approved." : request.Note.Trim();
    db.FinanceTransactions.Add(new FinanceTransaction
    {
        ClubId = proposal.ClubId,
        Amount = approvedAmount,
        Type = TransactionTypes.BudgetApproved,
        Description = proposal.Title,
        ReferenceId = proposal.Id
    });
    await db.SaveChangesAsync(cancellationToken);

    await eventBus.PublishAsync(new BudgetApprovedEvent(
        Guid.NewGuid(),
        DateTimeOffset.UtcNow,
        proposal.Id,
        proposal.ClubId,
        proposal.ClubName,
        approvedAmount,
        user.GetUserId()), EventRoutingKeys.BudgetApproved, cancellationToken);

    return Results.Ok(ToBudgetProposalResponse(proposal));
}).RequireAuthorization(AuthPolicies.AdminOnly);

finance.MapPost("/proposals/{id:int}/reject", async (
    int id,
    ReviewBudgetProposalRequest request,
    FinanceDbContext db,
    ClaimsPrincipal user) =>
{
    var proposal = await db.BudgetProposals.Include(x => x.Settlements).FirstOrDefaultAsync(x => x.Id == id);
    if (proposal is null)
    {
        return Results.NotFound();
    }

    proposal.Status = FinanceStatuses.Rejected;
    proposal.ReviewedByUserId = user.GetUserId();
    proposal.ReviewedAtUtc = DateTimeOffset.UtcNow;
    proposal.ReviewNote = string.IsNullOrWhiteSpace(request.Note) ? "Budget rejected." : request.Note.Trim();
    await db.SaveChangesAsync();
    return Results.Ok(ToBudgetProposalResponse(proposal));
}).RequireAuthorization(AuthPolicies.AdminOnly);

finance.MapGet("/settlements", async (string? status, FinanceDbContext db) =>
{
    var query = db.Settlements.Include(x => x.BudgetProposal).AsQueryable();
    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(x => x.Status == status);
    }

    var rows = await query.OrderByDescending(x => x.SubmittedAtUtc).ToListAsync();
    return Results.Ok(rows.Select(ToSettlementResponse));
});

finance.MapPost("/proposals/{id:int}/settlements", async (
    int id,
    CreateSettlementRequest request,
    FinanceDbContext db) =>
{
    var proposal = await db.BudgetProposals.Include(x => x.Settlements).FirstOrDefaultAsync(x => x.Id == id);
    if (proposal is null)
    {
        return Results.NotFound();
    }

    if (proposal.Status != FinanceStatuses.Approved)
    {
        return Results.BadRequest(new { message = "Only approved budget proposals can be settled." });
    }

    if (request.TotalSpent <= 0)
    {
        return Results.BadRequest(new { message = "Total spent must be greater than zero." });
    }

    var settlement = new Settlement
    {
        BudgetProposalId = id,
        TotalSpent = request.TotalSpent,
        ReceiptUrl = request.ReceiptUrl.Trim()
    };
    proposal.Settlements.Add(settlement);
    db.FinanceTransactions.Add(new FinanceTransaction
    {
        ClubId = proposal.ClubId,
        Amount = request.TotalSpent,
        Type = TransactionTypes.SettlementSubmitted,
        Description = $"Settlement submitted for {proposal.Title}",
        ReferenceId = proposal.Id
    });
    await db.SaveChangesAsync();
    return Results.Ok(ToBudgetProposalResponse(proposal));
});

finance.MapPost("/settlements/{id:int}/approve", async (
    int id,
    ReviewSettlementRequest request,
    FinanceDbContext db,
    ClaimsPrincipal user) =>
{
    var settlement = await db.Settlements.Include(x => x.BudgetProposal).FirstOrDefaultAsync(x => x.Id == id);
    if (settlement is null)
    {
        return Results.NotFound();
    }

    settlement.Status = FinanceStatuses.Approved;
    settlement.ReviewedByUserId = user.GetUserId();
    settlement.ReviewedAtUtc = DateTimeOffset.UtcNow;
    settlement.ReviewNote = string.IsNullOrWhiteSpace(request.Note) ? "Settlement approved." : request.Note.Trim();
    settlement.BudgetProposal.Status = FinanceStatuses.Settled;
    db.FinanceTransactions.Add(new FinanceTransaction
    {
        ClubId = settlement.BudgetProposal.ClubId,
        Amount = settlement.TotalSpent,
        Type = TransactionTypes.SettlementApproved,
        Description = $"Settlement approved for {settlement.BudgetProposal.Title}",
        ReferenceId = settlement.BudgetProposalId
    });
    await db.SaveChangesAsync();
    return Results.Ok(ToSettlementResponse(settlement));
}).RequireAuthorization(AuthPolicies.AdminOnly);

finance.MapGet("/transactions", async (int? clubId, FinanceDbContext db) =>
{
    var query = db.FinanceTransactions.AsQueryable();
    if (clubId.HasValue)
    {
        query = query.Where(x => x.ClubId == clubId);
    }

    var rows = await query.OrderByDescending(x => x.TransactionDateUtc).Take(100).ToListAsync();
    return Results.Ok(rows.Select(ToFinanceTransactionResponse));
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FinanceDbContext>();
    await db.Database.EnsureCreatedAsync();
    await FinanceSeeder.SeedAsync(db);
}

app.Run();

static BudgetProposalResponse ToBudgetProposalResponse(BudgetProposal proposal) => new(
    proposal.Id,
    proposal.ClubId,
    proposal.ClubName,
    proposal.ActivityId,
    proposal.Title,
    proposal.Description,
    proposal.RequestedAmount,
    proposal.ApprovedAmount,
    proposal.Status,
    proposal.ProposedByUserId,
    proposal.ProposedAtUtc,
    proposal.ReviewedByUserId,
    proposal.ReviewedAtUtc,
    proposal.ReviewNote,
    proposal.Settlements.OrderByDescending(x => x.SubmittedAtUtc).Select(ToSettlementResponse).ToArray());

static SettlementResponse ToSettlementResponse(Settlement settlement) => new(
    settlement.Id,
    settlement.BudgetProposalId,
    settlement.TotalSpent,
    settlement.ReceiptUrl,
    settlement.Status,
    settlement.SubmittedAtUtc,
    settlement.ReviewedByUserId,
    settlement.ReviewedAtUtc,
    settlement.ReviewNote);

static FinanceTransactionResponse ToFinanceTransactionResponse(FinanceTransaction transaction) => new(
    transaction.Id,
    transaction.ClubId,
    transaction.Amount,
    transaction.Type,
    transaction.Description,
    transaction.ReferenceId,
    transaction.TransactionDateUtc);
