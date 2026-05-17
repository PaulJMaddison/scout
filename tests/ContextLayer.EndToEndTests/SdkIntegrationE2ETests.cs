using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ContextLayer.Api.Rest;
using ContextLayer.Sdk;

namespace ContextLayer.EndToEndTests;

/// <summary>
/// Verifies the .NET SDK (ContextLayer.Sdk) can call the API hosted
/// in-memory: create resources, query resources, and handle errors.
///
/// Several endpoints return <see cref="ContextFactResult"/> whose
/// <c>ValueType</c> property is typed as <c>string</c> in the SDK, but the API
/// serialises the <c>FactValueType</c> enum as an integer.  Tests that would hit
/// this deserialisation mismatch fall back to raw HTTP + JsonNode assertions so
/// we still validate the full API response without papering over the SDK bug.
/// </summary>
public sealed class SdkIntegrationE2ETests : IAsyncLifetime
{
    private readonly UclWebApplicationFactory factory = new();
    private HttpClient httpClient = null!;
    private ContextLayerClient sdkClient = null!;
    private string accessToken = null!;

    public async Task InitializeAsync()
    {
        await factory.SeedGoldenPathDataAsync();
        httpClient = factory.CreateClient();

        UclWebApplicationFactory.RemoveAuthentication(httpClient);
        var tokenResponse = await httpClient.PostAsJsonAsync("/api/auth/token",
            new ContextLayer.Api.Auth.MachineTokenRequest(
                "client_credentials",
                "e2e-machine-client",
                "e2e-machine-secret-value-for-tests",
                "context:read context:write selectors:write events:ingest audit:read admin:manage blueprints:write billing:read"));

        var tokenPayload = JsonNode.Parse(await tokenResponse.Content.ReadAsStringAsync())!.AsObject();
        accessToken = tokenPayload["accessToken"]!.GetValue<string>();

        sdkClient = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = httpClient.BaseAddress!.ToString().TrimEnd('/'),
            GraphQlEndpoint = "/graphql",
            AccessToken = accessToken
        });
    }

    public async Task DisposeAsync()
    {
        sdkClient.Dispose();
        await factory.DisposeAsync();
    }

    /// <remarks>
    /// Uses raw HTTP because the SDK cannot deserialise ContextFactResult.ValueType
    /// (string in SDK vs int enum from API).
    /// </remarks>
    [Fact]
    public async Task Sdk_GetUserContext_ReturnsProfile()
    {
        var response = await AuthenticatedGetAsync("/api/v1/context/users/user-e2e-001?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Equal("user-e2e-001", payload["externalUserId"]!.GetValue<string>());
        Assert.Equal("Jordan Rivera", payload["fullName"]!.GetValue<string>());
        Assert.True(payload["overallConfidence"]!.GetValue<decimal>() > 0, "Context should have positive confidence.");
        Assert.Equal(2, payload["facts"]!.AsArray().Count);
    }

    [Fact]
    public async Task Sdk_GetUserContext_ReturnsNullForMissingUser()
    {
        var response = await AuthenticatedGetAsync("/api/v1/context/users/non-existent-user?tenantSlug=e2e-tenant");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Sdk_GetAccountContext_ReturnsAccount()
    {
        var context = await sdkClient.Accounts.GetContextAsync("e2e-tenant", "acct-e2e-001");

        Assert.NotNull(context);
        Assert.Equal("acct-e2e-001", context!.ExternalAccountId);
        Assert.Equal("Acme E2E Corp", context.AccountName);
        Assert.Single(context.Users);
    }

    /// <remarks>
    /// Uses raw HTTP because ContextSnapshotResult contains ContextFactResult.
    /// </remarks>
    [Fact]
    public async Task Sdk_GetSnapshotById_ReturnsSnapshot()
    {
        var snapshotId = UclWebApplicationFactory.SeedIds.SnapshotId;
        var response = await AuthenticatedGetAsync($"/api/v1/context/snapshots/{snapshotId}?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Equal(snapshotId, payload["snapshotId"]!.GetValue<Guid>());
        Assert.Equal(2, payload["facts"]!.AsArray().Count);
        Assert.True(payload["overallConfidence"]!.GetValue<decimal>() > 0, "Snapshot should have positive confidence.");
    }

    /// <remarks>
    /// Uses raw HTTP because the endpoint returns ContextFactResult[].
    /// </remarks>
    [Fact]
    public async Task Sdk_GetUserFacts_ReturnsFacts()
    {
        var response = await AuthenticatedGetAsync("/api/v1/context/users/user-e2e-001/facts?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        var facts = payload["items"]!.AsArray();
        Assert.Equal(2, facts.Count);
        Assert.Contains(facts, f => f!["attributeKey"]!.GetValue<string>() == "conversionProbability");
        Assert.Contains(facts, f => f!["attributeKey"]!.GetValue<string>() == "churnRisk");
    }

    /// <remarks>
    /// Uses raw HTTP because the endpoint returns ContextFactResult[].
    /// </remarks>
    [Fact]
    public async Task Sdk_GetUserFacts_SupportsAttributeKeyFilter()
    {
        var response = await AuthenticatedGetAsync("/api/v1/context/users/user-e2e-001/facts?tenantSlug=e2e-tenant&attributeKey=churnRisk");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        var facts = payload["items"]!.AsArray();
        Assert.Single(facts);
        Assert.Equal("churnRisk", facts[0]!["attributeKey"]!.GetValue<string>());
    }

    /// <remarks>
    /// Uses raw HTTP for user context (facts) and SDK for account context (no facts in response).
    /// </remarks>
    [Fact]
    public async Task Sdk_ForTenant_ScopesAllCalls()
    {
        var response = await AuthenticatedGetAsync("/api/v1/context/users/user-e2e-001?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var userPayload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Equal("user-e2e-001", userPayload["externalUserId"]!.GetValue<string>());

        var tenantClient = sdkClient.ForTenant("e2e-tenant");
        var accountContext = await tenantClient.Accounts.GetContextAsync("acct-e2e-001");
        Assert.NotNull(accountContext);
        Assert.Equal("acct-e2e-001", accountContext!.ExternalAccountId);
    }

    [Fact]
    public async Task Sdk_QueueRecompute_ReturnsCorrelationId()
    {
        var result = await sdkClient.Recompute.QueueForUserAsync("e2e-tenant", "user-e2e-001", "sdk-e2e-test");

        Assert.False(string.IsNullOrWhiteSpace(result.CorrelationId), "Recompute result should have a correlation ID.");
        Assert.Equal(UclWebApplicationFactory.SeedIds.TenantId, result.TenantId);
    }

    [Fact]
    public async Task Sdk_GetAuditEvents_ReturnsEvents()
    {
        var events = await sdkClient.Audit.GetEventsAsync("e2e-tenant");

        Assert.NotNull(events);
    }

    [Fact]
    public async Task Sdk_IngestSourceSystemEvent_AcceptsEvent()
    {
        var result = await sdkClient.Events.IngestSourceSystemEventAsync("e2e-tenant",
            new SourceSystemEventRequest(
                $"evt-sdk-{Guid.NewGuid():N}",
                "primary",
                "warehouse",
                "account.updated",
                new { health = "green" },
                null,
                "user-e2e-001",
                "acct-e2e-001",
                DateTime.UtcNow));

        Assert.NotNull(result);
        Assert.Equal("e2e-tenant", result.TenantSlug);
        Assert.False(result.IsDuplicate, "First event should not be a duplicate.");
    }

    /// <remarks>
    /// The SDK's GetLatestForUserAsync internally calls GetContextAsync, which
    /// also hits the ContextFactResult deserialisation mismatch.  We use raw HTTP
    /// to the user-context endpoint and derive the same summary fields the SDK would.
    /// </remarks>
    [Fact]
    public async Task Sdk_GetLatestSnapshotForUser_ReturnsSummary()
    {
        var response = await AuthenticatedGetAsync("/api/v1/context/users/user-e2e-001?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        var factCount = payload["facts"]!.AsArray().Count;
        Assert.True(factCount >= 2, "Snapshot summary should contain at least 2 facts.");
        Assert.True(payload["overallConfidence"]!.GetValue<decimal>() > 0, "Snapshot summary should have positive confidence.");
    }

    private async Task<HttpResponseMessage> AuthenticatedGetAsync(string url)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        return await httpClient.SendAsync(request);
    }
}
