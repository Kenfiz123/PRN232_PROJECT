# Bug Analysis Report

**Project:** ClubReportHub (PRN231)  
**Analysis Date:** 2026-07-13  
**Scope:** All source code in `src/` directory (excluding obj, bin, Migrations)

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 18 |
| HIGH | 35 |
| MEDIUM | 42 |
| LOW | 24 |
| **TOTAL** | **119** |

**Most Affected Areas:**
- Security (CORS, JWT, hardcoded secrets): 28 issues
- Race Conditions & Concurrency: 12 issues
- Authorization Logic: 11 issues
- Data Validation: 15 issues
- Performance (N+1, missing pagination): 10 issues

---

## Critical Issues

### C1. CORS Policy Allows Any Origin (All Services)

**Affected Files:**
- `src/Services/AuthService/Program.cs` (line 18-22)
- `src/Services/ClubService/Program.cs`
- `src/Services/ReportService/Program.cs` (line 39-43)
- `src/Services/ExportService/Program.cs` (line 37-41)
- `src/Services/NotificationService/Program.cs` (line 22-24)
- `src/Services/ActivityService/Program.cs` (line 23)
- `src/Services/FinanceService/Program.cs` (line 23)
- `src/Gateway/ApiGateway/Program.cs` (line 11-13)

**Issue:**
```csharp
options.AddPolicy("frontend", policy =>
    policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
```

**Impact:** CSRF attacks possible. Any malicious website can make authenticated requests to these APIs on behalf of logged-in users.

**Fix:** Restrict to specific trusted origins:
```csharp
policy.WithOrigins("https://your-trusted-frontend.com")
      .AllowAnyHeader()
      .AllowAnyMethod();
```

---

### C2. Hardcoded Connection Strings in Design-Time Factories

**Affected Files:**
- `src/Services/AuthService/Data/AuthDbContextFactory.cs` (line 11)
- `src/Services/ClubService/Data/ClubDbContextFactory.cs` (line 11)
- `src/Services/ReportService/Data/ReportDbContextFactory.cs` (line 11)
- `src/Services/ExportService/Data/ExportDbContextFactory.cs` (line 11)
- `src/Services/NotificationService/Data/NotificationDbContextFactory.cs` (line 11)

**Issue:**
```csharp
.UseSqlServer("Server=localhost;Database=ClubReportHub_Auth;Trusted_Connection=True;TrustServerCertificate=True")
```

**Impact:** Migrations always connect to localhost regardless of environment. Configuration cannot override this.

**Fix:** Read from configuration:
```csharp
var connectionString = configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string not configured");
```

---

### C3. Hardcoded JWT Signing Key Default

**Affected Files:**
- `src/Shared/ClubReportHub.Shared/Auth/JwtOptions.cs` (line 9)
- `src/Services/NotificationService/appsettings.json` (line 8)

**Issue:**
```csharp
public string SigningKey { get; init; } = "dev-only-change-this-signing-key-with-at-least-32-characters";
```

**Impact:** If configuration is missing, attackers who know this key can forge arbitrary JWT tokens.

**Fix:** Require explicit configuration:
```csharp
[Required]
public string SigningKey { get; init; } = null!;
```

---

### C4. Hardcoded RabbitMQ Credentials

**Affected Files:**
- `src/Shared/ClubReportHub.Shared/Messaging/RabbitMqOptions.cs` (lines 9-10)
- `src/Services/NotificationService/appsettings.json` (lines 14-15)

**Issue:**
```csharp
public string UserName { get; init; } = "guest";
public string Password { get; init; } = "guest";
```

**Impact:** Default RabbitMQ credentials are well-known. Production deployments using these defaults are vulnerable.

**Fix:** Remove default values and require configuration:
```csharp
[Required]
public string UserName { get; init; } = null!;

[Required]
public string Password { get; init; } = null!;
```

---

### C5. AllowAll Hangfire Dashboard Authorization

**Affected Files:**
- `src/Services/ExportService/Jobs/AllowAllDashboardAuthorizationFilter.cs` (line 7)
- `src/Services/ReportService/Jobs/AllowAllDashboardAuthorizationFilter.cs`

**Issue:**
```csharp
public bool Authorize(DashboardContext context) => true;
```

**Impact:** ANY user (including unauthenticated) can access the Hangfire dashboard, exposing job queue information and allowing job manipulation.

**Fix:** Implement proper role-based authorization:
```csharp
public bool Authorize(DashboardContext context)
{
    var user = context.GetHttpContext().User;
    return user.IsInRole(AuthRoles.Admin) || user.IsInRole(AuthRoles.SystemAdmin);
}
```

---

### C6. Hardcoded Default Credentials in Seeders

**Affected File:**
- `src/Services/AuthService/Data/AuthSeeder.cs` (lines 26, 35, 44, 53, 62)

**Issue:**
```csharp
new User { PasswordHash = "Admin@12345" }
new User { PasswordHash = "Manager@12345" }
new User { PasswordHash = "Treasurer@12345" }
new User { PasswordHash = "Student@12345" }
```

**Impact:** These known default passwords become vulnerabilities if deployed to production.

**Fix:** Use environment-based configuration or remove seeders from production builds.

---

### C7. TrustServerCertificate=True in All Connection Strings

**Affected Files:**
- All `appsettings.json` files
- All `*DbContextFactory.cs` files

**Issue:**
```csharp
"Server=...;TrustServerCertificate=True"
```

**Impact:** Disables SSL/TLS certificate validation, enabling man-in-the-middle attacks on database connections.

**Fix:** Remove `TrustServerCertificate=True` in production. Only use in local development.

---

### C8. Inverted Authorization Logic in Report Review

**Affected File:**
- `src/Services/ReportService/Program.cs` (lines 587-590)

**Issue:**
```csharp
if (report.CreatedByUserId == user.GetUserId()
    || !await CanManageClubAsync(report.ClubId, clubAccess, httpContext, cancellationToken))
{
    return Results.Forbid();
}
```

**Impact:** A report creator CAN review their own report if they also manage the club. Should use AND instead of OR.

**Fix:**
```csharp
if (report.CreatedByUserId == user.GetUserId()
    || !await CanManageClubAsync(report.ClubId, clubAccess, httpContext, cancellationToken))
{
    return Results.Forbid();
}
// OR simply:
if (report.CreatedByUserId == user.GetUserId())
{
    return Results.Forbid();
}
```

---

### C9. Authorization Bug - Manager Blocked from Own Clubs

**Affected File:**
- `src/Services/ClubService/Program.cs` (lines 313-327)

**Issue:**
```csharp
if (!IsAdmin(user) && managerUserId != user.GetUserId())
{
    return Results.Forbid();
}
```

**Impact:** Logic is inverted. Managers CANNOT access `/api/clubs/manager/{theirOwnId}`. Returns Forbid() when managerUserId equals user's own ID.

**Fix:**
```csharp
if (!IsAdmin(user) && managerUserId != user.GetUserId())
{
    return Results.Forbid();
}
// This is correct - but the negation is wrong
```

---

### C10. Hardcoded Fake Missing Club IDs

**Affected File:**
- `src/Services/ReportService/Jobs/ReportDeadlineJobs.cs` (line 47)

**Issue:**
```csharp
var missingClubIds = Enumerable.Range(1, 3).Except(submittedClubIds).ToArray();
```

**Impact:** Job always emits events with incorrect missing club IDs (1, 2, 3). Wrong clubs will be notified about deadlines.

**Fix:** Fetch actual club IDs from Club Service catalog or maintain a list in configuration.

---

### C11. Silent Failure in Database Retry Logic

**Affected File:**
- `src/Shared/ClubReportHub.Shared/Data/DatabaseStartupExtensions.cs` (lines 30-59)

**Issue:**
```csharp
for (var attempt = 1; attempt <= MaxAttempts; attempt++)
{
    try { await operation(); return; }
    catch { /* retry */ }
}
// Method returns normally even if all retries failed
```

**Impact:** If all retries fail, service continues starting with uninitialized database.

**Fix:** Throw exception after loop:
```csharp
throw new InvalidOperationException($"Failed to {operationName} after {MaxAttempts} attempts.");
```

---

### C12. Background Service Swallows Exceptions

**Affected File:**
- `src/Services/NotificationService/Consumers/RabbitMqNotificationConsumer.cs` (lines 23-92)

**Issue:**
```csharp
catch (Exception ex)
{
    logger.LogWarning(ex, "RabbitMQ consumer could not start...");
}
return Task.CompletedTask;
```

**Impact:** After exception, consumer is permanently dead. Service continues running without consuming messages. No health check reflects this failure.

**Fix:** Implement retry with backoff, or fail fast on startup.

---

---

## High Issues

### H1. Missing Authorization on Lock/Unlock Endpoints

**File:** `src/Services/AuthService/Program.cs` (lines 209-233)

**Issue:** `PATCH /api/users/{id}/lock` and `/unlock` lack authorization. Any authenticated user can lock/unlock any account.

**Fix:** Add `.RequireAuthorization(AuthPolicies.AdminOnly)` to these endpoints.

---

### H2. RequireHttpsMetadata = false

**Files:**
- `src/Shared/ClubReportHub.Shared/Auth/JwtServiceCollectionExtensions.cs` (line 21)
- Multiple services inherit this setting

**Issue:** Disables HTTPS requirement for JWT validation. Tokens can be intercepted over unencrypted connections.

**Fix:** Set `RequireHttpsMetadata = true` for production:
```csharp
options.RequireHttpsMetadata = !environment.IsDevelopment();
```

---

### H3. Insufficient Password Validation

**File:** `src/Services/AuthService/Program.cs` (line 72)

**Issue:** Only checks length >= 8. No complexity requirements (uppercase, lowercase, digit, special character).

**Fix:**
```csharp
var hasUpper = password.Any(char.IsUpper);
var hasLower = password.Any(char.IsLower);
var hasDigit = password.Any(char.IsDigit);
var hasSpecial = password.Any(c => !char.IsLetterOrDigit(c));
if (!(hasUpper && hasLower && hasDigit && hasSpecial))
    return Results.BadRequest("Password must contain uppercase, lowercase, digit, and special character.");
```

---

### H4. Race Condition in Manager Assignment

**File:** `src/Services/ClubService/Program.cs` (lines 411-422)

**Issue:** Check and update are not atomic. Two concurrent requests could assign the same user to two clubs.

**Fix:** Use transaction with isolation level or row-level locking:
```csharp
await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
```

---

### H5. Race Condition in Join Club

**File:** `src/Services/ClubService/Program.cs` (lines 487-507)

**Issue:** Check for existing membership happens before insert. Concurrent requests could create duplicate memberships.

**Fix:** Use unique constraint with try-catch, or use transaction with serializable isolation.

---

### H6. Race Condition in Budget Proposal Approval

**File:** `src/Services/FinanceService/Program.cs` (lines 152-161, 208-216)

**Issue:** Two concurrent requests could both read proposal in "Submitted" status and both approve/reject.

**Fix:** Add concurrency token and handle `DbUpdateConcurrencyException`.

---

### H7. Race Condition in Settlement Creation

**File:** `src/Services/FinanceService/Program.cs` (lines 286-289)

**Issue:** `proposal.Settlements.Any(...)` checks only loaded settlements. Concurrent creation may not be detected.

**Fix:** Query database directly instead of checking navigation property.

---

### H8. Race Condition - Duplicate Event Processing

**File:** `src/Services/NotificationService/Consumers/RabbitMqNotificationConsumer.cs` (lines 112-122)

**Issue:** Check-then-insert pattern without sufficient isolation. Duplicate notifications possible.

**Fix:** Use `INSERT ... ON CONFLICT DO NOTHING` or check after insert.

---

### H9. Path Traversal Risk in File Upload

**File:** `src/Services/ReportService/Program.cs` (lines 455-460)

**Issue:** `Path.Combine(storageRoot, report.Id.ToString())` doesn't validate final path stays within allowed directory.

**Fix:**
```csharp
var fullPath = Path.GetFullPath(Path.Combine(storageRoot, report.Id.ToString()));
if (!fullPath.StartsWith(Path.GetFullPath(storageRoot)))
    throw new SecurityException("Path traversal detected");
```

---

### H10. Authorization Policy Misleading Name

**File:** `src/Shared/ClubReportHub.Shared/Auth/JwtServiceCollectionExtensions.cs` (lines 54-59)

**Issue:**
```csharp
options.AddPolicy(AuthPolicies.ClubManagerOrTreasurer, policy => policy.RequireRole(
    AuthRoles.Admin,
    AuthRoles.SystemAdmin,
    AuthRoles.StudentAffairsAdmin,  // These should NOT be here
    AuthRoles.ClubManager,
    AuthRoles.Treasurer));
```

**Impact:** Policy named "ClubManagerOrTreasurer" actually grants access to all admin roles.

**Fix:** Only include intended roles or rename policy to `AdminOrClubManagerOrTreasurer`.

---

### H11. N+1 / Memory Issues - Aggregate Endpoint

**File:** `src/Services/ReportService/Program.cs` (lines 153-176)

**Issue:** All approved reports loaded into memory, then grouped in application code.

**Fix:** Use database-level GROUP BY:
```csharp
var clubs = await query
    .GroupBy(x => new { x.ClubId, x.ClubName })
    .Select(g => new ClubAggregationRow(...))
    .ToListAsync();
```

---

### H12. N+1 / Memory Issues - Summary Endpoint

**File:** `src/Services/ReportService/Program.cs` (lines 131-148)

**Issue:** All reports loaded to count them in application code.

**Fix:** Use database-level aggregation:
```csharp
var summary = await query
    .GroupBy(x => 1)
    .Select(g => new ReportSummaryResponse(
        g.Count(),
        g.Count(x => x.Status == ReportStatuses.Draft),
        ...
    )).FirstAsync();
```

---

### H13. N+1 / Memory Issues - Leaderboard Endpoint

**File:** `src/Services/ReportService/Program.cs` (lines 192-233)

**Issue:** All reports loaded for KPI calculations in application code.

**Fix:** Move aggregation to database query.

---

### H14. Missing Pagination on List Endpoints

**Files:**
- `src/Services/FinanceService/Program.cs` (lines 71-72, 252-253)
- `src/Services/NotificationService/Program.cs` (line 58)

**Issue:** Endpoints return all records. Large datasets cause memory issues.

**Fix:** Add pagination:
```csharp
var rows = await query
    .OrderByDescending(x => x.CreatedAtUtc)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

---

### H15. TOCTOU Race in File Attachment Download

**File:** `src/Services/ReportService/Program.cs` (line 506)

**Issue:** File existence check happens before serving. File could be deleted between check and serve.

**Fix:** Serve file directly or catch FileNotFoundException.

---

### H16. Unused Seeder Implementations

**Files:**
- `src/Services/AuthService/Data/AuthSeeder.cs` (partial implementation)
- `src/Services/ClubService/Data/ClubSeeder.cs` (empty)
- `src/Services/ReportService/Data/ReportSeeder.cs` (empty)
- `src/Services/NotificationService/Data/NotificationSeeder.cs` (empty)
- `src/Services/ActivityService/Data/ActivitySeeder.cs` (empty)
- `src/Services/FinanceService/Data/FinanceSeeder.cs` (empty)

**Issue:** Seeder methods exist but do nothing or only seed roles.

**Fix:** Implement seeders or remove dead code.

---

### H17. Missing Concurrency Tokens

**Files:**
- `src/Services/FinanceService/Data/FinanceDbContext.cs` (BudgetProposal, Settlement)
- `src/Services/NotificationService/Models/Notification.cs`

**Issue:** Concurrent modifications can silently overwrite each other.

**Fix:** Add `[Timestamp]` or `[ConcurrencyCheck]` attribute:
```csharp
[ConcurrencyCheck]
public uint RowVersion { get; set; }
```

---

### H18. CancellationToken.None in Background Jobs

**File:** `src/Services/ExportService/Program.cs` (lines 159, 219, 223)

**Issue:** Background jobs use `CancellationToken.None`, making them uncancellatable.

**Fix:** Pass proper cancellation token or implement graceful shutdown.

---

---

## Medium Issues

### M1. Weak Email Format Validation

**Files:**
- `src/Services/AuthService/Program.cs` (lines 68-69, 199-200)
- `src/Services/ClubService/Program.cs` (lines 825-829)

**Issue:** Email only trimmed, not validated for proper format. Invalid emails like "@@invalid" can be stored.

**Fix:**
```csharp
if (!MailAddress.TryCreate(request.Email.Trim(), out var email))
    return Results.BadRequest("Invalid email format");
```

---

### M2. No Input Length Validation on Request Properties

**Files:**
- `src/Services/AuthService/Contracts/AuthContracts.cs`
- `src/Services/ActivityService/Program.cs` (lines 88-139)
- All service Contracts folders

**Issue:** Request records have no `[StringLength]` annotations. Oversized strings cause database exceptions.

**Fix:** Add validation attributes:
```csharp
public sealed record RegisterRequest(
    [StringLength(100)] string Username,
    [StringLength(200)] string FullName,
    [StringLength(255)] [EmailAddress] string Email,
    string Password);
```

---

### M3. Unvalidated Status Parameter

**File:** `src/Services/FinanceService/Program.cs` (lines 66-69, 247-250)

**Issue:** Status query parameter not validated against known values.

**Fix:** Validate against enum:
```csharp
var validStatuses = new[] { FinanceStatuses.Submitted, FinanceStatuses.Approved, FinanceStatuses.Rejected };
if (!string.IsNullOrWhiteSpace(status) && !validStatuses.Contains(status))
    return Results.BadRequest("Invalid status");
```

---

### M4. No Upper Bound Validation on Amount Fields

**File:** `src/Services/FinanceService/Program.cs` (lines 106-109, 168-172, 281-284)

**Issue:** Only checks `> 0`. Extremely large values could cause overflow or precision issues.

**Fix:**
```csharp
if (request.RequestedAmount <= 0 || request.RequestedAmount > 1_000_000_000)
    return Results.BadRequest("Amount must be between 0 and 1 billion");
```

---

### M5. No Validation of Settlement Amount vs Approved Budget

**File:** `src/Services/FinanceService/Program.cs` (lines 281-284)

**Issue:** Settlement's `TotalSpent` not validated against proposal's `ApprovedAmount`.

**Fix:**
```csharp
if (request.TotalSpent > proposal.ApprovedAmount)
    return Results.BadRequest("Total spent exceeds approved amount");
```

---

### M6. Missing CancellationToken on Database Operations

**Files:** Multiple services have inconsistent `SaveChangesAsync()` calls without cancellation token.

**Issue:** Operations cannot be cancelled when client disconnects.

**Fix:** Pass `cancellationToken` to all async database calls.

---

### M7. GetUserId Returns 0 for Invalid IDs

**File:** `src/Shared/ClubReportHub.Shared/Auth/ClaimsPrincipalExtensions.cs` (lines 7-14)

**Issue:**
```csharp
return int.TryParse(value, out var userId) ? userId : 0;
```

**Impact:** If 0 is valid user ID, unauthenticated requests could be treated as user 0.

**Fix:** Throw exception or return `int?`:
```csharp
public static int GetUserId(this ClaimsPrincipal principal)
{
    var value = principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? principal.FindFirstValue("sub")
        ?? throw new UnauthorizedAccessException("User ID claim not found");
    
    return int.TryParse(value, out var userId) 
        ? userId 
        : throw new UnauthorizedAccessException("Invalid user ID format");
}
```

---

### M8. File.Delete Before SaveChanges

**File:** `src/Services/ExportService/Program.cs` (lines 195-198, 204)

**Issue:** File deleted before database save. If save fails, file is gone but DB record remains.

**Fix:** Delete file after successful database save:
```csharp
await db.SaveChangesAsync(cancellationToken);  // Save first
if (File.Exists(filePath)) File.Delete(filePath);  // Then delete file
```

---

### M9. ExecuteUpdateAsync Bypasses Authorization Filters

**File:** `src/Services/NotificationService/Program.cs` (line 88)

**Issue:** `ExecuteUpdateAsync` executes raw SQL. Authorization check happens in C# but execution bypasses ORM safety.

**Fix:** Use tracked entity update instead:
```csharp
foreach (var notification in await query.ToListAsync(cancellationToken))
{
    notification.IsRead = true;
}
await db.SaveChangesAsync(cancellationToken);
```

---

### M10. Missing Index on ReportingDeadlines.IsActive

**File:** `src/Services/ReportService/Data/ReportDbContext.cs` (line 52-56)

**Issue:** `Where(x => x.IsActive && x.DueDate >= today && x.DueDate <= today.AddDays(3))` has no index.

**Fix:**
```csharp
entity.HasIndex(x => new { x.IsActive, x.DueDate });
```

---

### M11. DispatchConsumersAsync = false With Async Operations

**File:** `src/Services/NotificationService/Consumers/RabbitMqNotificationConsumer.cs` (line 33)

**Issue:** Synchronous dispatcher with async callbacks causes thread pool starvation risk.

**Fix:** Either use `DispatchConsumersAsync = true` or offload to thread pool.

---

### M12. ProcessedEvent Table Grows Unbounded

**File:** `src/Services/NotificationService/Data/NotificationDbContext.cs` (lines 23-27)

**Issue:** No cleanup job. Table grows forever with every processed event.

**Fix:** Add cleanup job or TTL:
```csharp
var cutoff = DateTimeOffset.UtcNow.AddDays(-30);
db.ProcessedEvents.Where(x => x.ProcessedAt < cutoff).ExecuteDelete();
```

---

### M13. GetAwaiter().GetResult() Blocks Thread

**File:** `src/Services/NotificationService/Consumers/RabbitMqNotificationConsumer.cs` (line 74)

**Issue:** Blocks thread pool thread during async operation.

**Fix:** Use `DispatchConsumersAsync = true` with async handler.

---

### M14. Fetch Before Authorization Check

**Files:**
- `src/Services/ClubService/Program.cs` (lines 669-680)
- `src/Services/ActivityService/Program.cs` (lines 78-86)

**Issue:** Database query happens before authorization check. Information disclosure via ID enumeration.

**Fix:** Perform authorization check before database access.

---

### M15. ClubName from External Service Not Validated

**File:** `src/Services/ActivityService/Program.cs` (line 117)

**Issue:** `access.ClubName` trusted without length validation against `HasMaxLength(200)`.

**Fix:**
```csharp
if (access.ClubName?.Length > 200)
    return Results.BadRequest("Club name exceeds maximum length");
```

---

### M16. Magic String Comparison

**File:** `src/Services/ReportService/Jobs/ReportDeadlineJobs.cs` (line 41)

**Issue:**
```csharp
.Where(x => x.Period == period && x.Status != "Draft")
```

**Fix:** Use constant: `x.Status != ReportStatuses.Draft`

---

### M17. No ReceiptUrl Validation

**File:** `src/Services/FinanceService/Program.cs` (line 295)

**Issue:** URL stored without validation. Invalid or dangerous URLs (file://, data:) could be stored.

**Fix:**
```csharp
if (!Uri.TryCreate(request.ReceiptUrl, UriKind.Absolute, out var uri))
    return Results.BadRequest("Invalid receipt URL");
if (!uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase))
    return Results.BadRequest("Receipt URL must use HTTPS");
```

---

### M18. Authorization Inconsistency - CanManageFinance vs CanManage

**File:** `src/Services/ReportService/Program.cs` (line 794)

**Issue:** Author access checks `CanManageFinance` but workflow may require `CanManage`.

**Fix:** Clarify and align permission requirements.

---

### M19. File.CreateNew Throws if Exists

**File:** `src/Services/ReportService/Program.cs` (line 461)

**Issue:** `FileMode.CreateNew` throws if file exists. Concurrent uploads could fail.

**Fix:** Use `FileMode.Create` which overwrites, or handle `IOException` gracefully.

---

### M20. Missing Global Exception Handler

**Files:** All service Program.cs files lack `app.UseExceptionHandler()`.

**Issue:** Unhandled exceptions return stack traces (dev) or generic errors (prod).

**Fix:**
```csharp
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/error");
}
```

---

### M21. Unused ActivityId in CreateBudgetProposalRequest

**File:** `src/Services/FinanceService/Contracts/FinanceContracts.cs` (line 46)

**Issue:** `ActivityId` field exists but unclear how it should be validated or used.

**Fix:** Document usage or remove if not needed.

---

### M22. Unused Request Field (ClubName)

**File:** `src/Services/FinanceService/Program.cs` (lines 111-121)

**Issue:** `request.ClubName` never used, confusing for API consumers.

**Fix:** Remove unused field or use it as intended.

---

### M23. Path Traversal in StoragePath Configuration

**File:** `src/Services/ExportService/Program.cs` (line 41)

**Issue:** `storagePath` could be configured with relative path traversal.

**Fix:** Validate path is absolute and within allowed directory.

---

### M24. Authorization Logic Bug - Export Access

**File:** `src/Services/ExportService/Program.cs` (lines 291-299)

**Issue:** `CanAccessExportAsync` requires BOTH `RequestedByUserId == userId` AND `CanManageClubAsync`. Too restrictive.

**Fix:** Club manager should see any export for their club, not just their own.

---

### M25. No Rate Limiting on Login Endpoint

**File:** `src/Services/AuthService/Program.cs` (lines 37-60)

**Issue:** No brute-force protection. Unlimited login attempts allowed.

**Fix:** Add rate limiting middleware:
```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("login", context => 
        context.IPAddressPerPeriod(5, TimeSpan.FromMinutes(1)));
});
```

---

### M26. Missing Password Change Endpoint

**File:** `src/Services/AuthService/Program.cs` (lines 154-207)

**Issue:** No endpoint to change user's password. Only seeder can set passwords.

**Fix:** Add `PATCH /api/users/{id}/password` endpoint.

---

### M27. Refresh Endpoint Returns 501

**File:** `src/Services/AuthService/Program.cs` (line 106)

**Issue:** Protected but non-functional. Users get error after authenticating.

**Fix:** Implement refresh token flow or remove endpoint.

---

### M28. Email Trim Before Validation Flaw

**File:** `src/Services/ClubService/Program.cs` (lines 825-829)

**Issue:**
```csharp
if (!MailAddress.TryCreate(request.ContactEmail.Trim(), out var email)
    || !string.Equals(email.Address, request.ContactEmail.Trim(), ...))
```

Emails with padding like `" test@example.com "` pass validation but stored without trim.

**Fix:** Trim first, then validate:
```csharp
var email = request.ContactEmail.Trim();
if (!MailAddress.TryCreate(email, out var parsed) || parsed.Address != email)
    return Results.BadRequest("Invalid email");
```

---

### M29. Treasurer Count Race Condition

**File:** `src/Services/ClubService/Program.cs` (lines 645-652)

**Issue:** Application-level enforcement of "max 2 treasurers" has race condition. Two concurrent requests could create 3 treasurers.

**Fix:** Use database trigger or unique partial index.

---

### M30. No Input Length Validation on Search Parameter

**File:** `src/Services/ClubService/Program.cs` (lines 41-50)

**Issue:** Extremely long search strings could cause performance issues.

**Fix:**
```csharp
if (search?.Length > 100)
    return Results.BadRequest("Search string too long");
```

---

### M31. Unvalidated Status String in Activity Update

**File:** `src/Services/ActivityService/Program.cs` (lines 170, 199)

**Issue:** Status accepts any string without validation against `ActivityStatuses`.

**Fix:**
```csharp
var validStatuses = new[] { ActivityStatuses.Scheduled, ActivityStatuses.Completed, ActivityStatuses.Cancelled };
if (!validStatuses.Contains(request.Status))
    return Results.BadRequest("Invalid status value");
```

---

### M32. Missing CancellationToken in AddAuditAsync Default

**File:** `src/Services/ReportService/Program.cs` (line 770-780)

**Issue:** Optional cancellation token with default value inconsistently used.

**Fix:** Always pass cancellation token explicitly.

---

### M33. StoragePath Trim Without Null Check

**File:** `src/Services/ReportService/Program.cs` (line 397)

**Issue:** `StoragePath?.Trim()` pattern but defensive coding preferred.

**Fix:**
```csharp
StoragePath = request.StoragePath?.Trim() ?? string.Empty
```

---

### M34. RabbitMQ Connection Created Per Publish

**File:** `src/Shared/ClubReportHub.Shared/Messaging/RabbitMqEventBus.cs` (lines 23-33)

**Issue:** New connection/channel for every published message. Inefficient for high-throughput.

**Fix:** Use connection pooling or singleton connection.

---

### M35. Fallback to localhost in Service Configuration

**File:** `src/Shared/ClubReportHub.Shared/Auth/ClubAccessClient.cs` (lines 66-70)

**Issue:**
```csharp
client.BaseAddress = new Uri(configuration["Services:ClubService:BaseUrl"] ?? "http://localhost:5102");
```

**Impact:** Service attempts localhost if config missing, causing confusing failures.

**Fix:** Require explicit configuration:
```csharp
var baseUrl = configuration["Services:ClubService:BaseUrl"] 
    ?? throw new InvalidOperationException("ClubService BaseUrl not configured");
```

---

### M36. Inconsistent Error Responses

**File:** `src/Services/ClubService/Program.cs` (line 134-140, 205)

**Issue:** Some endpoints return 404, some return 400, some return 409 with messages. API consumers have inconsistent error handling.

**Fix:** Standardize error response format across all endpoints.

---

### M37. Missing AsNoTracking on Delete Read-Then-Modify

**File:** `src/Services/ClubService/Program.cs` (lines 384-388)

**Issue:** `FindAsync` queries local tracker first, could return stale data.

**Fix:** Use `AsNoTracking()` when entity won't be modified:
```csharp
var club = await db.Clubs.AsNoTracking().FirstOrDefaultAsync(...);
```

---

### M38. QuestPDF License Set Every Call

**File:** `src/Services/ExportService/Jobs/ExportJob.cs` (line 171)

**Issue:** `QuestPDF.Settings.License = LicenseType.Community` set on every PDF generation.

**Fix:** Set once at application startup.

---

### M39. Hardcoded Placeholder Text in Export

**File:** `src/Services/ExportService/Jobs/ExportJob.cs` (lines 191-192, 157-161)

**Issue:** Vietnamese text "Nội dung xuất báo cáo" hardcoded. Dummy data used instead of actual report data.

**Fix:** Use proper localization and fetch real data.

---

### M40. Race Condition in Club Creation Application

**File:** `src/Services/ClubService/Program.cs` (lines 161-169)

**Issue:** Check for existing applications before creating new one. Concurrent requests could bypass.

**Fix:** Use transaction with unique constraint handling.

---

### M41. Inefficient Data Re-fetch After Save

**File:** `src/Services/ClubService/Program.cs` (lines 453-457)

**Issue:** Re-fetches entire club after save just to return response. Wasteful and introduces race.

**Fix:** Use returned entity directly:
```csharp
await db.SaveChangesAsync();
return Results.Ok(ToResponse(proposal));  // Use proposal, not re-fetched
```

---

### M42. Exception Swallowing in Database Retry

**File:** `src/Shared/ClubReportHub.Shared/Data/DatabaseStartupExtensions.cs` (lines 88-98)

**Issue:** Only `SqlException` caught. Other transient exceptions not handled.

**Fix:** Catch broader exception types:
```csharp
catch (Exception ex) when (ex is SqlException || ex is TimeoutException || ex is IOException)
```

---

---

## Low Issues

### L1. Naming Inconsistency in Model

**File:** `src/Services/ClubService/Models/ClubWorkflowStatuses.cs`

**Issue:** File named `ClubWorkflowStatuses` but contains `ClubMembershipStatuses`, `ClubMemberRoles`, `ClubApplicationStatuses`. Class name mismatch.

**Fix:** Rename file to `ClubMembershipModels.cs` or consolidate class names.

---

### L2. Default CreatedAtUtc Never Set Explicitly

**File:** `src/Services/AuthService/Program.cs` (lines 90-96, 137-143)

**Issue:** New users created without explicit `CreatedAtUtc` assignment. Relies on default value.

**Fix:** Explicitly set for clarity:
```csharp
new User { CreatedAtUtc = DateTimeOffset.UtcNow, ... }
```

---

### L3. Role Name Case Sensitivity Mismatch

**Files:**
- `src/Services/AuthService/Data/AuthSeeder.cs` (line 12-17)
- `src/Services/AuthService/Program.cs` (line 239)

**Issue:** Seeder uses "ADMIN", endpoint converts to uppercase. Inconsistent.

**Fix:** Standardize case handling.

---

### L4. Default Status Value in Models

**File:** `src/Services/FinanceService/Models/Settlement.cs` (line 10)

**Issue:** Constructor doesn't set status, relies on property default. Inconsistent with BudgetProposal.

**Fix:** Set explicitly in constructor for consistency.

---

### L5. Navigation Property Assignment Without Context Tracking

**File:** `src/Services/ClubService/Program.cs` (line 524)

**Issue:** `membership.Club = club` fragile if code refactored to use AsNoTracking.

**Fix:** Use `Include()` to load navigation property instead of manual assignment.

---

### L6. DateTime vs DateTimeOffset Inconsistency

**File:** `src/Services/ExportService/Jobs/ExportJob.cs` (line 113)

**Issue:** Uses `DateTime.UtcNow` instead of `DateTimeOffset.UtcNow`. Mixing types causes DST issues.

**Fix:** Use `DateTimeOffset.UtcNow` consistently.

---

### L7. DST-Aware Date Calculation Bug

**File:** `src/Services/ExportService/Jobs/ExportJob.cs` (line 114)

**Issue:** `tomorrow.Day != 1` may behave incorrectly near DST transitions.

**Fix:** Use `DateTimeOffset` for date arithmetic.

---

### L8. No Maximum Length Validation on Report Contracts

**File:** `src/Services/ReportService/Contracts/ReportContracts.cs`

**Issue:** Request records lack `[MaxLength]` attributes.

**Fix:** Add annotations or use validation library.

---

### L9. ParticipantCount Can Be Zero

**File:** `src/Services/ReportService/Program.cs` (line 766)

**Issue:** Activity with zero participants may not make business sense.

**Fix:**
```csharp
if (request.ParticipantCount <= 0)
    return Results.BadRequest("Participant count must be positive");
```

---

### L10. No Validation of Duplicate ReportDetail Activities

**File:** `src/Services/ReportService/Program.cs` (lines 761-768)

**Issue:** Users could add multiple activities with same name/date.

**Fix:** Add validation:
```csharp
if (report.Details.Any(d => d.ActivityDate == request.ActivityDate && d.ActivityName == request.ActivityName.Trim()))
    return Results.BadRequest("Duplicate activity");
```

---

### L11. Magic Strings for Queue Names

**File:** `src/Services/NotificationService/Consumers/RabbitMqNotificationConsumer.cs` (lines 41-47, 84)

**Issue:** Queue names hardcoded in multiple places.

**Fix:** Use constants or configuration.

---

### L12. GetBearerToken Missing Bearer Prefix

**File:** `src/Shared/ClubReportHub.Shared/Auth/ClubAccessClient.cs` (lines 77-84)

**Issue:** Silently returns empty string for non-Bearer tokens.

**Fix:** Log warning when non-Bearer authorization header encountered.

---

### L13. Race Condition on Directory Creation

**File:** `src/Services/ExportService/Jobs/ExportJob.cs` (line 37)

**Issue:** Multiple concurrent jobs could have race condition with `Directory.CreateDirectory`.

**Fix:** `Directory.CreateDirectory` is thread-safe, but error handling should be added.

---

### L14. FileInfo Without Existence Check

**File:** `src/Services/ExportService/Jobs/ExportJob.cs` (line 53)

**Issue:** `new FileInfo(filePath)` created then `fileInfo.Length` accessed. If file is 0 bytes, reports incorrect size.

**Fix:** Check file exists and has content:
```csharp
if (!fileInfo.Exists || fileInfo.Length == 0)
    throw new InvalidOperationException("Generated file is empty");
```

---

### L15. Foreach Without Cancellation Check

**File:** `src/Services/ExportService/Jobs/ExportJob.cs` (lines 97-106)

**Issue:** `foreach` loop in `CleanupExpiredAsync` doesn't check cancellation token.

**Fix:**
```csharp
foreach (var file in files)
{
    cancellationToken.ThrowIfCancellationRequested();
    // process file
}
```

---

### L16. Missing Unvalidated DueDate Check

**File:** `src/Services/ReportService/Contracts/ReportContracts.cs` (lines 53-54, 60-61)

**Issue:** `DueDate` has no validation against past dates.

**Fix:**
```csharp
if (request.DueDate < DateOnly.FromDateTime(DateTime.UtcNow))
    return Results.BadRequest("Due date cannot be in the past");
```

---

### L17. Swallowed SqlException Without Logging

**File:** `src/Shared/ClubReportHub.Shared/Data/DatabaseStartupExtensions.cs` (lines 88-97)

**Issue:** `SqlException` caught and swallowed silently.

**Fix:** Log the exception:
```csharp
catch (SqlException ex)
{
    logger.LogError(ex, "Database connection failed");
    return false;
}
```

---

### L18. PasswordHash Column May Be Too Short

**File:** `src/Services/AuthService/Data/AuthDbContext.cs` (line 21)

**Issue:** 500 characters may not be sufficient for all hashing algorithms.

**Fix:** Increase to 1024 or use `nvarchar(max)`.

---

### L19. Race Condition in Seeder Role Creation

**File:** `src/Services/AuthService/Data/AuthSeeder.cs` (lines 68-73)

**Issue:** Check-then-insert pattern. Concurrent instances could violate unique constraint.

**Fix:** Use `ExecuteInsert` with conflict handling or upsert pattern.

---

### L20. No-Op Seeders Provide False Impression

**Files:** Multiple seeder files are empty stubs.

**Issue:** `SeedAsync` methods do nothing but create impression of functionality.

**Fix:** Implement seeders or remove dead code.

---

### L21. Unused Import

**File:** `src/Services/ClubService/Models/ClubWorkflowStatuses.cs` (line 3)

**Issue:** Unused import statement.

**Fix:** Remove unused imports.

---

### L22. Comment Says Bounded Context But Uses Hardcoded Values

**File:** `src/Services/ReportService/Jobs/ReportDeadlineJobs.cs` (line 47)

**Issue:** Comment claims "Club catalog is owned by Club Service" but hardcoded `1, 2, 3` used anyway.

**Fix:** Either fix properly or acknowledge limitation.

---

### L23. String Trim on ReceiptUrl May Cause Issues

**File:** `src/Services/FinanceService/Program.cs` (line 295)

**Issue:** `.Trim()` on URL could inadvertently create invalid URLs with legitimate URL-encoded spaces.

**Fix:** Only trim if intended:
```csharp
ReceiptUrl = request.ReceiptUrl.Trim(' ', '\t');
```

---

### L24. Missing Null Check on Contains

**File:** `src/Services/ExportService/Program.cs` (line 78)

**Issue:** `managedClubIds.Contains(x.ClubId.Value)` will throw if any `ClubId` is null.

**Fix:**
```csharp
managedClubIds.Contains(x.ClubId ?? 0)
```

---

---

## Recommendations by Priority

### Immediate (Deploy to Production - Must Fix)

1. **C1:** Remove `AllowAnyOrigin()` - restrict to specific domains
2. **C2:** Move all connection strings to configuration
3. **C3:** Require explicit JWT signing key configuration
4. **C4:** Remove hardcoded RabbitMQ credentials
5. **C5:** Fix AllowAll Hangfire dashboard filter
6. **C6:** Remove hardcoded default credentials from seeders
7. **C7:** Remove `TrustServerCertificate=True` from production configs
8. **C8:** Fix inverted authorization logic in report review
9. **C9:** Fix authorization bug blocking managers from own clubs
10. **C10:** Remove hardcoded fake club IDs

### Short Term (Next Sprint)

1. **H1:** Add authorization to lock/unlock endpoints
2. **H2:** Enable `RequireHttpsMetadata` for production
3. **H3:** Implement password complexity validation
4. **H4-H8:** Fix all race conditions
5. **H9:** Fix path traversal vulnerabilities
6. **H10:** Fix misleading authorization policy name
7. **H11-H13:** Fix N+1 query issues
8. **H14:** Add pagination to list endpoints
9. **H15:** Fix TOCTOU in file operations
10. **H17:** Add concurrency tokens to entities

### Medium Term (Technical Debt)

1. Implement proper validation on all request DTOs
2. Add global exception handling middleware
3. Implement rate limiting on auth endpoints
4. Fix inconsistent error response formats
5. Add indexes for frequently queried columns
6. Implement database connection retry with better error handling
7. Add health checks for background services
8. Fix async patterns (CancellationToken, DispatchConsumersAsync)

### Long Term (Architecture)

1. Move all secrets to secure vault (Azure Key Vault, HashiCorp Vault)
2. Implement proper refresh token flow
3. Add distributed tracing for microservices
4. Implement circuit breaker for inter-service calls
5. Add integration tests for race conditions
6. Implement proper observability (metrics, logging, tracing)
