namespace AuthService.Contracts;

public sealed record LoginRequest(string Username, string Password);

public sealed record RegisterRequest(
    string Username,
    string FullName,
    string Email,
    string Password);

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset ExpiresAtUtc,
    UserSummary User);

public sealed record UserSummary(
    int Id,
    string Username,
    string FullName,
    string Email,
    IReadOnlyCollection<string> Roles,
    bool IsActive,
    bool IsLocked);

public sealed record CreateUserRequest(
    string Username,
    string FullName,
    string Email,
    string Password,
    IReadOnlyCollection<string> Roles);

public sealed record UpdateUserRequest(
    string FullName,
    string Email,
    bool IsActive,
    IReadOnlyCollection<string> Roles);

public sealed record CreateRoleRequest(string Name);
