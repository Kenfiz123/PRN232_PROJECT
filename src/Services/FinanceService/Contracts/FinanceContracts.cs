namespace FinanceService.Contracts;

public sealed record BudgetProposalResponse(
    int Id,
    int ClubId,
    string ClubName,
    int? ActivityId,
    string Title,
    string Description,
    decimal RequestedAmount,
    decimal? ApprovedAmount,
    string Status,
    int ProposedByUserId,
    DateTimeOffset ProposedAtUtc,
    int? ReviewedByUserId,
    DateTimeOffset? ReviewedAtUtc,
    string? ReviewNote,
    IReadOnlyCollection<SettlementResponse> Settlements);

public sealed record SettlementResponse(
    int Id,
    int BudgetProposalId,
    decimal TotalSpent,
    string ReceiptUrl,
    string Status,
    DateTimeOffset SubmittedAtUtc,
    int? ReviewedByUserId,
    DateTimeOffset? ReviewedAtUtc,
    string? ReviewNote);

public sealed record FinanceTransactionResponse(
    int Id,
    int ClubId,
    decimal Amount,
    string Type,
    string Description,
    int? ReferenceId,
    DateTimeOffset TransactionDateUtc);

public sealed record CreateBudgetProposalRequest(
    int ClubId,
    string ClubName,
    int? ActivityId,
    string Title,
    string Description,
    decimal RequestedAmount);

public sealed record ReviewBudgetProposalRequest(decimal? ApprovedAmount, string? Note);

public sealed record CreateSettlementRequest(decimal TotalSpent, string ReceiptUrl);

public sealed record ReviewSettlementRequest(string? Note);
