namespace ClubService.Contracts;

public sealed record ClubResponse(
    int Id,
    string Code,
    string Name,
    string Description,
    string ContactEmail,
    string ContactPhone,
    bool IsActive,
    IReadOnlyCollection<ManagerAssignmentResponse> Managers);

public sealed record ManagerAssignmentResponse(
    int Id,
    int ManagerUserId,
    string ManagerName,
    DateTimeOffset AssignedAtUtc,
    DateTimeOffset? EndedAtUtc,
    bool IsActive);

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
