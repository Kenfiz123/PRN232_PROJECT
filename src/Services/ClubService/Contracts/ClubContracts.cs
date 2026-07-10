namespace ClubService.Contracts;

public sealed record ClubResponse(
    int Id,
    string Code,
    string Name,
    string Description,
    string ContactEmail,
    string ContactPhone,
    bool IsActive,
    IReadOnlyCollection<ManagerAssignmentResponse> Managers,
    IReadOnlyCollection<ClubMembershipResponse> Members);

public sealed record ManagerAssignmentResponse(
    int Id,
    int ManagerUserId,
    string ManagerName,
    DateTimeOffset AssignedAtUtc,
    DateTimeOffset? EndedAtUtc,
    bool IsActive);

public sealed record ClubMembershipResponse(
    int Id,
    int ClubId,
    string ClubName,
    int UserId,
    string FullName,
    string Role,
    string Status,
    string? RequestMessage,
    DateTimeOffset RequestedAtUtc,
    DateTimeOffset? ReviewedAtUtc,
    int? ReviewedByUserId);

public sealed record ClubCreationApplicationResponse(
    int Id,
    int RequesterUserId,
    string RequesterName,
    string Code,
    string Name,
    string Description,
    string ContactEmail,
    string ContactPhone,
    string Status,
    string? ReviewNote,
    int? CreatedClubId,
    DateTimeOffset SubmittedAtUtc,
    DateTimeOffset? ReviewedAtUtc,
    int? ReviewedByUserId);

public sealed record CreateClubRequest(
    string Code,
    string Name,
    string Description,
    string ContactEmail,
    string ContactPhone);

public sealed record UpdateClubRequest(
    string Name,
    string Description,
    string ContactEmail,
    string ContactPhone,
    bool IsActive);

public sealed record AssignManagerRequest(int ManagerUserId, string ManagerName);

public sealed record JoinClubRequest(string? Message);

public sealed record ReviewClubMembershipRequest(string? Note);

public sealed record AssignTreasurerRequest(int MemberUserId, string MemberName);

public sealed record CreateClubApplicationRequest(
    string Code,
    string Name,
    string Description,
    string ContactEmail,
    string ContactPhone);

public sealed record ReviewClubApplicationRequest(string? Note);
