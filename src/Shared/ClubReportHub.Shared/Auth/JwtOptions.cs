namespace ClubReportHub.Shared.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "ClubReportHub";
    public string Audience { get; init; } = "ClubReportHub.Client";
    public string SigningKey { get; init; } = "dev-only-change-this-signing-key-with-at-least-32-characters";
    public int ExpirationMinutes { get; init; } = 120;
}
