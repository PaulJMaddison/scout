using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Api.Rest;
using KynticAI.Scout.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace KynticAI.Scout.EndToEndTests;

/// <summary>
/// Golden path: tenant -> workspace -> data source -> semantic attributes ->
/// selectors -> context facts -> context snapshot. Proves the core Scout
/// pipeline works from data ingestion to context consumption.
/// </summary>
public sealed class GoldenPathE2ETests : IAsyncLifetime
{
    private readonly ScoutWebApplicationFactory factory = new();
    private HttpClient client = null!;

    public async Task InitializeAsync()
    {
        await factory.SeedGoldenPathDataAsync();
        client = factory.CreateClient();
        ScoutWebApplicationFactory.AuthenticateAsTenantAdmin(client);
    }

    public async Task DisposeAsync()
    {
        client.Dispose();
        await factory.DisposeAsync();
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        var response = await client.GetAsync("/api/v1/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Equal("ok", payload["status"]!.GetValue<string>());
    }

    [Fact]
    public async Task Workspaces_AreListedForTenant()
    {
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.GetAsync("/api/v1/workspaces?tenantSlug=e2e-tenant&page=1&pageSize=10"));

        var items = payload["items"]!.AsArray();
        Assert.Single(items);
        Assert.Equal("primary", items[0]!["slug"]!.GetValue<string>());
    }

    [Fact]
    public async Task SemanticAttributes_AreListedWithFiltering()
    {
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.GetAsync("/api/v1/semantic-attributes?tenantSlug=e2e-tenant&q=conversion&pageSize=10"));

        var items = payload["items"]!.AsArray();
        Assert.Single(items);
        Assert.Equal("conversionProbability", items[0]!["key"]!.GetValue<string>());
    }

    [Fact]
    public async Task UserContext_ReturnsFactsWithProvenanceAndConfidence()
    {
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.GetAsync("/api/v1/context/users/user-e2e-001?tenantSlug=e2e-tenant"));

        Assert.Equal("user-e2e-001", payload["externalUserId"]!.GetValue<string>());
        Assert.Equal("Jordan Rivera", payload["fullName"]!.GetValue<string>());
        Assert.True(payload["overallConfidence"]!.GetValue<decimal>() > 0, "Overall confidence should be positive.");
        Assert.NotEqual(default, payload["generatedAtUtc"]!.GetValue<DateTime>());

        var facts = payload["facts"]!.AsArray();
        Assert.Equal(2, facts.Count);

        var conversionFact = facts.SingleOrDefault(f => f!["attributeKey"]!.GetValue<string>() == "conversionProbability");
        Assert.NotNull(conversionFact);
        Assert.Equal("0.85", conversionFact!["valueJson"]!.GetValue<string>());
        Assert.True(conversionFact["confidence"]!.GetValue<decimal>() >= 0.90m, "Conversion fact confidence should be >= 0.90.");
        Assert.NotNull(conversionFact["provenanceJson"]!.GetValue<string>());
        Assert.Contains("crm", conversionFact["provenanceJson"]!.GetValue<string>(), StringComparison.Ordinal);
        Assert.NotEqual(default, conversionFact["observedAtUtc"]!.GetValue<DateTime>());
        Assert.NotNull(conversionFact["freshUntilUtc"]);

        var churnFact = facts.SingleOrDefault(f => f!["attributeKey"]!.GetValue<string>() == "churnRisk");
        Assert.NotNull(churnFact);
        Assert.Equal("\"low\"", churnFact!["valueJson"]!.GetValue<string>());
        Assert.True(churnFact["confidence"]!.GetValue<decimal>() >= 0.80m, "Churn fact confidence should be >= 0.80.");
    }

    [Fact]
    public async Task UserContextFacts_SupportsAttributeKeyFiltering()
    {
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.GetAsync("/api/v1/context/users/user-e2e-001/facts?tenantSlug=e2e-tenant&attributeKey=churnRisk&pageSize=10"));

        var items = payload["items"]!.AsArray();
        Assert.Single(items);
        Assert.Equal("churnRisk", items[0]!["attributeKey"]!.GetValue<string>());
    }

    [Fact]
    public async Task ContextSnapshot_AggregatesFactsCorrectly()
    {
        var snapshotId = ScoutWebApplicationFactory.SeedIds.SnapshotId;
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.GetAsync($"/api/v1/context/snapshots/{snapshotId}?tenantSlug=e2e-tenant"));

        Assert.Equal(snapshotId, payload["snapshotId"]!.GetValue<Guid>());
        Assert.Equal(1, payload["snapshotVersion"]!.GetValue<int>());
        Assert.True(payload["overallConfidence"]!.GetValue<decimal>() > 0, "Snapshot confidence should be positive.");
        Assert.Contains("Jordan Rivera", payload["summary"]!.GetValue<string>(), StringComparison.Ordinal);
        Assert.False(payload["isStale"]!.GetValue<bool>(), "Snapshot should not be stale immediately after creation.");

        var facts = payload["facts"]!.AsArray();
        Assert.Equal(2, facts.Count);

        var attributeKeys = facts.Select(f => f!["attributeKey"]!.GetValue<string>()).OrderBy(k => k).ToList();
        Assert.Contains("churnRisk", attributeKeys);
        Assert.Contains("conversionProbability", attributeKeys);

        foreach (var fact in facts)
        {
            Assert.NotNull(fact!["provenanceJson"]!.GetValue<string>());
            Assert.True(fact["confidence"]!.GetValue<decimal>() > 0, "Each fact should have positive confidence.");
            Assert.NotEqual(default, fact["observedAtUtc"]!.GetValue<DateTime>());
        }
    }

    [Fact]
    public async Task AccountContext_ReturnsUsersForAccount()
    {
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.GetAsync("/api/v1/context/accounts/acct-e2e-001?tenantSlug=e2e-tenant"));

        Assert.Equal("acct-e2e-001", payload["externalAccountId"]!.GetValue<string>());
        Assert.Equal("Acme E2E Corp", payload["accountName"]!.GetValue<string>());

        var users = payload["users"]!.AsArray();
        Assert.Single(users);
        Assert.Equal("user-e2e-001", users[0]!["externalUserId"]!.GetValue<string>());
    }

    [Fact]
    public async Task MissingUser_Returns404WithStructuredError()
    {
        var response = await client.GetAsync("/api/v1/context/users/does-not-exist?tenantSlug=e2e-tenant");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Equal("context.user_not_found", error["error"]!["code"]!.GetValue<string>());
    }

    [Fact]
    public async Task ContextRecompute_AcceptsRequest()
    {
        var response = await client.PostAsJsonAsync("/api/v1/context/recompute?tenantSlug=e2e-tenant",
            new V1RecomputeRequest("user-e2e-001", "e2e-golden-path-test"));

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.NotNull(payload["correlationId"]!.GetValue<string>());
    }

    [Fact]
    public async Task AiSafeContextPackage_ReturnsGroundedFacts()
    {
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.PostAsJsonAsync(
                "/api/v1/context/users/user-e2e-001/ai-safe-context-package?tenantSlug=e2e-tenant",
                new V1AiSafeContextPackageRequest("Explore expansion opportunity for enterprise tier.")));

        Assert.Equal("user-e2e-001", payload["externalUserId"]!.GetValue<string>());
        Assert.Equal("Explore expansion opportunity for enterprise tier.", payload["salesObjective"]!.GetValue<string>());
        Assert.True(payload["facts"]!.AsArray().Count >= 1, "AI-safe package should contain at least one grounded fact.");
    }
}
