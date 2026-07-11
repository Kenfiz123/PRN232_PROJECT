using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ClubReportHub.Shared.Auth;

public sealed record ClubAccessSnapshot(
    int ClubId,
    string ClubName,
    bool IsManager,
    bool IsTreasurer,
    bool IsApprovedMember,
    IReadOnlyCollection<int> ManagerUserIds)
{
    public bool CanManage => IsManager;
    public bool CanManageFinance => IsManager || IsTreasurer;
    public bool CanView => IsManager || IsApprovedMember;
}

public sealed class ClubAccessClient(HttpClient httpClient, ILogger<ClubAccessClient> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<IReadOnlyList<ClubAccessSnapshot>> GetMyAccessAsync(
        string bearerToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(bearerToken))
        {
            return [];
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, "api/clubs/me/access");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Club access lookup failed with status code {StatusCode}.", response.StatusCode);
                return [];
            }

            return await response.Content.ReadFromJsonAsync<List<ClubAccessSnapshot>>(JsonOptions, cancellationToken) ?? [];
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            logger.LogWarning(ex, "Club access lookup failed.");
            return [];
        }
    }
}

public static class ClubAccessServiceCollectionExtensions
{
    public static IServiceCollection AddClubAccessClient(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpClient<ClubAccessClient>(client =>
        {
            var baseUrl = configuration["Services:ClubService:BaseUrl"] ?? "http://localhost:5102";
            client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
        });
        return services;
    }
}

public static class ClubAccessHttpContextExtensions
{
    public static string GetBearerToken(this HttpContext httpContext)
    {
        var authorization = httpContext.Request.Headers.Authorization.ToString();
        const string bearerPrefix = "Bearer ";
        return authorization.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase)
            ? authorization[bearerPrefix.Length..].Trim()
            : string.Empty;
    }
}
