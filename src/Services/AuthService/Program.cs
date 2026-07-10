using AuthService.Contracts;
using AuthService.Data;
using AuthService.Models;
using ClubReportHub.Shared.Auth;
using ClubReportHub.Shared.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddClubReportJwt(builder.Configuration);
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
app.MapGet("/", () => Results.Ok(new { service = "Auth Service", status = "running" }));

var auth = app.MapGroup("/api/auth").WithTags("Authentication");
auth.MapPost("/login", async (
    LoginRequest request,
    AuthDbContext db,
    IPasswordHasher<User> passwordHasher,
    JwtTokenFactory tokenFactory) =>
{
    var user = await db.Users
        .Include(x => x.UserRoles)
        .ThenInclude(x => x.Role)
        .FirstOrDefaultAsync(x => x.Username == request.Username || x.Email == request.Username);

    if (user is null || !user.IsActive || user.IsLocked)
    {
        return Results.Unauthorized();
    }

    var passwordResult = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
    if (passwordResult == PasswordVerificationResult.Failed)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(CreateAuthResponse(user, tokenFactory));
}).AllowAnonymous();

auth.MapPost("/register", async (
    RegisterRequest request,
    AuthDbContext db,
    IPasswordHasher<User> passwordHasher,
    JwtTokenFactory tokenFactory) =>
{
    var username = request.Username.Trim();
    var email = request.Email.Trim();
    var fullName = request.FullName.Trim();

    if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(fullName) || request.Password.Length < 8)
    {
        return Results.BadRequest(new { message = "Username, full name, email, and an 8+ character password are required." });
    }

    if (await db.Users.AnyAsync(x => x.Username == username || x.Email == email))
    {
        return Results.Conflict(new { message = "Username or email already exists." });
    }

    var memberRole = await db.Roles.FirstOrDefaultAsync(x => x.Name == AuthRoles.ClubMember);
    if (memberRole is null)
    {
        memberRole = new Role { Name = AuthRoles.ClubMember };
        db.Roles.Add(memberRole);
        await db.SaveChangesAsync();
    }

    var user = new User
    {
        Username = username,
        FullName = fullName,
        Email = email,
        IsActive = true
    };
    user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
    user.UserRoles.Add(new UserRole { User = user, Role = memberRole });

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Created($"/api/users/{user.Id}", CreateAuthResponse(user, tokenFactory, [AuthRoles.ClubMember]));
}).AllowAnonymous();

auth.MapPost("/refresh", () => Results.Problem("Refresh token flow is reserved for the production hardening step.", statusCode: StatusCodes.Status501NotImplemented))
    .RequireAuthorization();

var users = app.MapGroup("/api/users").WithTags("Users").RequireAuthorization(AuthPolicies.AdminOnly);
users.MapGet("/", async (AuthDbContext db) =>
{
    var usersResult = await db.Users
        .Include(x => x.UserRoles)
        .ThenInclude(x => x.Role)
        .OrderBy(x => x.FullName)
        .ToListAsync();
    return Results.Ok(usersResult.Select(x => ToSummary(x)));
});

users.MapPost("/", async (
    CreateUserRequest request,
    AuthDbContext db,
    IPasswordHasher<User> passwordHasher) =>
{
    if (await db.Users.AnyAsync(x => x.Username == request.Username || x.Email == request.Email))
    {
        return Results.Conflict(new { message = "Username or email already exists." });
    }

    var roles = await db.Roles.Where(x => request.Roles.Contains(x.Name)).ToListAsync();
    if (roles.Count == 0)
    {
        return Results.BadRequest(new { message = "At least one valid role is required." });
    }

    var user = new User
    {
        Username = request.Username,
        FullName = request.FullName,
        Email = request.Email,
        IsActive = true
    };
    user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
    db.Users.Add(user);
    await db.SaveChangesAsync();

    db.UserRoles.AddRange(roles.Select(role => new UserRole { UserId = user.Id, RoleId = role.Id }));
    await db.SaveChangesAsync();

    return Results.Created($"/api/users/{user.Id}", ToSummary(user, withRoles: roles.Select(x => x.Name)));
});

users.MapPut("/{id:int}", async (int id, UpdateUserRequest request, AuthDbContext db) =>
{
    var user = await db.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).FirstOrDefaultAsync(x => x.Id == id);
    if (user is null)
    {
        return Results.NotFound();
    }

    user.FullName = request.FullName;
    user.Email = request.Email;
    user.IsActive = request.IsActive;

    var roles = await db.Roles.Where(x => request.Roles.Contains(x.Name)).ToListAsync();
    db.UserRoles.RemoveRange(user.UserRoles);
    db.UserRoles.AddRange(roles.Select(role => new UserRole { UserId = user.Id, RoleId = role.Id }));
    await db.SaveChangesAsync();
    return Results.Ok(ToSummary(user, withRoles: roles.Select(x => x.Name)));
});

users.MapPatch("/{id:int}/lock", async (int id, AuthDbContext db) =>
{
    var user = await db.Users.FindAsync(id);
    if (user is null)
    {
        return Results.NotFound();
    }

    user.IsLocked = true;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

users.MapPatch("/{id:int}/unlock", async (int id, AuthDbContext db) =>
{
    var user = await db.Users.FindAsync(id);
    if (user is null)
    {
        return Results.NotFound();
    }

    user.IsLocked = false;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

var rolesGroup = app.MapGroup("/api/roles").WithTags("Roles").RequireAuthorization(AuthPolicies.AdminOnly);
rolesGroup.MapGet("/", async (AuthDbContext db) => Results.Ok(await db.Roles.OrderBy(x => x.Name).ToListAsync()));
rolesGroup.MapPost("/", async (CreateRoleRequest request, AuthDbContext db) =>
{
    var roleName = request.Name.Trim().ToUpperInvariant();
    if (await db.Roles.AnyAsync(x => x.Name == roleName))
    {
        return Results.Conflict(new { message = "Role already exists." });
    }

    var role = new Role { Name = roleName };
    db.Roles.Add(role);
    await db.SaveChangesAsync();
    return Results.Created($"/api/roles/{role.Id}", role);
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseStartup");
    await db.ApplyMigrationsWithRetryAsync(logger);
    await AuthSeeder.SeedAsync(db, scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>());
}

app.Run();

static UserSummary ToSummary(User user, IEnumerable<string>? withRoles = null)
{
    var roles = withRoles?.ToArray() ?? user.UserRoles.Select(x => x.Role.Name).OrderBy(x => x).ToArray();
    return new UserSummary(user.Id, user.Username, user.FullName, user.Email, roles, user.IsActive, user.IsLocked);
}

static AuthResponse CreateAuthResponse(User user, JwtTokenFactory tokenFactory, IEnumerable<string>? withRoles = null)
{
    var roles = withRoles?.ToArray() ?? user.UserRoles.Select(x => x.Role.Name).OrderBy(x => x).ToArray();
    var token = tokenFactory.CreateToken(user.Id, user.Username, user.FullName, roles);
    return new AuthResponse(
        token.AccessToken,
        token.ExpiresAtUtc,
        ToSummary(user, roles));
}
