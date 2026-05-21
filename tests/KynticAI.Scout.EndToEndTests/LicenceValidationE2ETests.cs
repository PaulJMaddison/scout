using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;

namespace KynticAI.Scout.EndToEndTests;

/// <summary>
/// Verifies licence validation behaviour: querying licence status,
/// and verifying billing usage endpoints reflect the tenant subscription.
/// Enterprise-only features that require an external licence service are
/// tested defensively — the test verifies the API responds gracefully.
/// </summary>
public sealed class LicenceValidationE2ETests : IAsyncLifetime
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
    public async Task LicenceStatus_ReturnsCurrentPlan()
    {
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.GetAsync("/api/v1/licence/status?tenantSlug=e2e-tenant"));

        Assert.NotNull(payload["plan"]);
        Assert.NotNull(payload["status"]);
        Assert.NotNull(payload["isValid"]);
    }

    [Fact]
    public async Task BillingUsage_ReturnsUsageMetrics()
    {
        var (payload, _) = await ScoutWebApplicationFactory.ReadJsonAsync(
            client.GetAsync("/api/v1/billing/usage?tenantSlug=e2e-tenant"));

        Assert.NotNull(payload["plan"]);
        Assert.NotNull(payload["usage"]);
        Assert.NotNull(payload["limits"]);

        var usage = payload["usage"]!.AsArray();
        Assert.True(usage.Count >= 1, "Billing usage should report at least one metric.");

        var limits = payload["limits"]!.AsArray();
        Assert.True(limits.Count >= 1, "Billing limits should report at least one limit.");
    }

    [Fact]
    public async Task GraphQl_LicenceStatus_ReturnsResult()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  licenceStatus {
                    plan
                    status
                    isValid
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var licence = payload["data"]!["licenceStatus"]!.AsObject();
        Assert.NotNull(licence["plan"]);
        Assert.NotNull(licence["isValid"]);
    }

    [Fact]
    public async Task GraphQl_CurrentPlan_ReturnsDefinition()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  currentPlan(tenantSlug: "e2e-tenant") {
                    plan
                    displayName
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var plan = payload["data"]!["currentPlan"]!.AsObject();
        Assert.NotNull(plan["plan"]);
        Assert.NotNull(plan["displayName"]);
    }

    [Fact]
    public async Task GraphQl_BillingUsage_ReturnsOverview()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  billingUsage(tenantSlug: "e2e-tenant") {
                    plan
                    currentPeriodStartUtc
                    currentPeriodEndUtc
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        Assert.NotNull(payload["data"]!["billingUsage"]);
    }

    [Fact]
    public async Task ReadOnlyUser_CannotAccessAdminBilling()
    {
        ScoutWebApplicationFactory.AuthenticateAsReadOnly(client);

        var response = await client.GetAsync("/api/v1/billing/usage?tenantSlug=e2e-tenant");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
