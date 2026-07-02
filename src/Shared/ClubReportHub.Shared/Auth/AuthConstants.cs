namespace ClubReportHub.Shared.Auth;

public static class AuthRoles
{
    public const string Admin = "ADMIN";
    public const string ClubManager = "CLUB_MANAGER";
}

public static class AuthPolicies
{
    public const string AdminOnly = "AdminOnly";
    public const string ClubManagerOnly = "ClubManagerOnly";
    public const string AdminOrClubManager = "AdminOrClubManager";
}
