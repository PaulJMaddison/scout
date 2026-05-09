using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using ContextLayer.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace ContextLayer.IntegrationTests;

public sealed class GraphQlAuthorizationIntegrationTests
{
    [Fact]
    public async Task GraphQl_RejectsAnonymousRequests()
    {
        await using var factory = new ContextLayerWebApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = "{ dataSources(tenantSlug: \"demo\") { id } }"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_IsRateLimited_AfterRepeatedFailures()
    {
        await using var factory = new ContextLayerWebApplicationFactory();
        using var client = factory.CreateClient();

        HttpResponseMessage? lastResponse = null;
        for (var attempt = 0; attempt < 6; attempt++)
        {
            lastResponse = await client.PostAsJsonAsync("/api/auth/login", new
            {
                tenantSlug = "demo",
                email = "rep@contextlayer.local",
                password = "WrongPassword123!"
            });
        }

        Assert.NotNull(lastResponse);
        Assert.Equal(HttpStatusCode.TooManyRequests, lastResponse!.StatusCode);
    }

    [Fact]
    public async Task Health_EchoesRequestIdentifier_ForTracing()
    {
        await using var factory = new ContextLayerWebApplicationFactory();
        using var client = factory.CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Get, "/health");
        request.Headers.Add("X-Request-Id", "trace-req-123");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("X-Request-Id", out var values));
        Assert.Equal("trace-req-123", values.Single());
    }

    [Fact]
    public async Task SalesRep_CannotUpsertDataSource()
    {
        await using var factory = new ContextLayerWebApplicationFactory();
        using var client = factory.CreateClient();
        AuthenticateAs(client, "sales_rep", "rep@contextlayer.local", "Jordan Kim");

        var response = await client.PostAsJsonAsync("/graphql", new
        {
            operationName = "UpsertDataSource",
            query = """
                mutation UpsertDataSource($input: UpsertDataSourceInput!) {
                  upsertDataSource(input: $input) {
                    id
                  }
                }
                """,
            variables = new
            {
                input = new
                {
                    tenantSlug = "demo",
                    name = "Rep Attempt",
                    description = "Should be blocked.",
                    kind = "CRM",
                    connectionConfigJson = "{}"
                }
            }
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        var errors = payload["errors"]?.AsArray();
        Assert.NotNull(errors);
        Assert.Contains(errors!, error =>
            error?["message"]?.GetValue<string>().Contains("authorized", StringComparison.OrdinalIgnoreCase) == true);
    }

    [Fact]
    public async Task SalesRep_UserProfiles_AreMasked()
    {
        await using var factory = new ContextLayerWebApplicationFactory();
        using var client = factory.CreateClient();
        AuthenticateAs(client, "sales_rep", "rep@contextlayer.local", "Jordan Kim");

        var payload = await ExecuteGraphQlAsync(client, """
            query GetUserProfiles {
              userProfiles(tenantSlug: "demo") {
                externalUserId
                email
                isEmailMasked
              }
            }
            """);

        var firstUser = payload["data"]?["userProfiles"]?[0];
        Assert.NotNull(firstUser);
        Assert.True(firstUser!["isEmailMasked"]!.GetValue<bool>());
        Assert.Equal("a***@northstarlogistics.io", firstUser["email"]!.GetValue<string>());
    }

    [Fact]
    public async Task TenantAdmin_CanReadAuditEvents_AndOpsSummary()
    {
        await using var factory = new ContextLayerWebApplicationFactory();
        using var client = factory.CreateClient();
        AuthenticateAs(client, "tenant_admin", "admin@contextlayer.local", "Dana Mercer");

        var graphqlPayload = await ExecuteGraphQlAsync(client, """
            query GetAuditEvents {
              auditEvents(tenantSlug: "demo") {
                action
                entityType
              }
            }
            """);

        Assert.NotNull(graphqlPayload["data"]?["auditEvents"]);
        Assert.True(graphqlPayload["data"]!["auditEvents"]!.AsArray().Count > 0);

        var opsResponse = await client.GetAsync("/api/ops/summary");
        Assert.Equal(HttpStatusCode.OK, opsResponse.StatusCode);

        var opsPayload = JsonNode.Parse(await opsResponse.Content.ReadAsStringAsync())!.AsObject();
        Assert.Equal("demo", opsPayload["tenant"]!.GetValue<string>());
    }

    private static void AuthenticateAs(HttpClient client, string role, string email, string displayName)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("context-layer-tests-signing-key-1234567890"));
        var token = new JwtSecurityToken(
            issuer: "ContextLayer.Tests",
            audience: "ContextLayer.Tests",
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString("D")),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString("D")),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(ClaimTypes.Email, email),
                new Claim("tenant_id", Guid.NewGuid().ToString("D")),
                new Claim("tenant_slug", "demo"),
                new Claim("display_name", displayName),
                new Claim(ClaimTypes.Role, role)
            ],
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    }

    private static async Task<JsonObject> ExecuteGraphQlAsync(HttpClient client, string query)
    {
        var response = await client.PostAsJsonAsync("/graphql", new { query });
        var content = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"GraphQL request failed with {(int)response.StatusCode}: {content}");
        }

        return JsonNode.Parse(content)!.AsObject();
    }

    private sealed class ContextLayerWebApplicationFactory : WebApplicationFactory<Program>
    {
        private readonly InMemoryDatabaseRoot _databaseRoot = new();
        private readonly string _databaseName = $"contextlayer-tests-{Guid.NewGuid():N}";

        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Auth:Issuer"] = "ContextLayer.Tests",
                    ["Auth:Audience"] = "ContextLayer.Tests",
                    ["Auth:SigningKey"] = "context-layer-tests-signing-key-1234567890",
                    ["Auth:AccessTokenMinutes"] = "60",
                    ["Telemetry:OtlpEndpoint"] = string.Empty
                });
            });

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<ContextLayerDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<ContextLayerDbContext>>();
                services.RemoveAll<ContextLayerDbContext>();
                services.RemoveAll<DbContextOptions<CustomerOpsDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<CustomerOpsDbContext>>();
                services.RemoveAll<CustomerOpsDbContext>();

                services.AddDbContext<ContextLayerDbContext>(options =>
                    options.UseInMemoryDatabase(_databaseName, _databaseRoot));
                services.AddDbContext<CustomerOpsDbContext>(options =>
                    options.UseInMemoryDatabase($"{_databaseName}-ops", _databaseRoot));
                services.AddScoped<ContextLayer.Application.Abstractions.IContextLayerDbContext>(provider =>
                    provider.GetRequiredService<ContextLayerDbContext>());
                services.AddScoped<ContextLayer.Application.Abstractions.ICustomerOpsDbContext>(provider =>
                    provider.GetRequiredService<CustomerOpsDbContext>());
            });
        }
    }
}
