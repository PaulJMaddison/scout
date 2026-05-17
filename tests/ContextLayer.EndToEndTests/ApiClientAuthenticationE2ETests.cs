using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using ContextLayer.Api.Auth;
using ContextLayer.Api.Rest;

namespace ContextLayer.EndToEndTests;

/// <summary>
/// Verifies API client authentication: machine-to-machine token flow,
/// API key auth, 401 without credentials, and 403 with insufficient scope.
/// </summary>
public sealed class ApiClientAuthenticationE2ETests : IAsyncLifetime
{
    private readonly UclWebApplicationFactory factory = new();
    private HttpClient client = null!;

    public async Task InitializeAsync()
    {
        await factory.SeedGoldenPathDataAsync();
        client = factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        client.Dispose();
        await factory.DisposeAsync();
    }

    [Fact]
    public async Task Unauthenticated_Request_Returns401()
    {
        UclWebApplicationFactory.RemoveAuthentication(client);

        var response = await client.GetAsync("/api/v1/workspaces?tenantSlug=e2e-tenant");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MachineToken_GrantsAccess_ToProtectedEndpoints()
    {
        UclWebApplicationFactory.RemoveAuthentication(client);

        var tokenResponse = await client.PostAsJsonAsync("/api/auth/token", new MachineTokenRequest(
            "client_credentials",
            "e2e-machine-client",
            "e2e-machine-secret-value-for-tests",
            "context:read context:write"));

        Assert.Equal(HttpStatusCode.OK, tokenResponse.StatusCode);
        var tokenPayload = JsonNode.Parse(await tokenResponse.Content.ReadAsStringAsync())!.AsObject();
        var accessToken = tokenPayload["accessToken"]!.GetValue<string>();
        Assert.False(string.IsNullOrWhiteSpace(accessToken), "Access token should not be empty.");
        Assert.Equal("Bearer", tokenPayload["tokenType"]!.GetValue<string>());
        Assert.True(tokenPayload["expiresIn"]!.GetValue<int>() > 0, "Token expiry should be positive.");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var workspacesResponse = await client.GetAsync("/api/v1/workspaces?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.OK, workspacesResponse.StatusCode);
    }

    [Fact]
    public async Task MachineToken_WithInvalidSecret_Returns401()
    {
        UclWebApplicationFactory.RemoveAuthentication(client);

        var tokenResponse = await client.PostAsJsonAsync("/api/auth/token", new MachineTokenRequest(
            "client_credentials",
            "e2e-machine-client",
            "wrong-secret",
            "context:read"));

        Assert.Equal(HttpStatusCode.Unauthorized, tokenResponse.StatusCode);
    }

    [Fact]
    public async Task ApiClientKey_GrantsAccess_WhenScopesMatch()
    {
        UclWebApplicationFactory.AuthenticateAsTenantAdmin(client);

        var createResponse = await client.PostAsJsonAsync("/api/v1/api-clients",
            new V1CreateApiClientRequest(
                "E2E Test API Client",
                "primary",
                ["context:read", "context:write", "events:ingest", "audit:read"]));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonNode.Parse(await createResponse.Content.ReadAsStringAsync())!.AsObject();
        var clientId = created["clientId"]!.GetValue<string>();
        var apiKey = created["apiKey"]!.GetValue<string>();
        Assert.False(string.IsNullOrWhiteSpace(clientId), "Client ID should not be empty.");
        Assert.False(string.IsNullOrWhiteSpace(apiKey), "API key should not be empty.");

        UclWebApplicationFactory.RemoveAuthentication(client);
        client.DefaultRequestHeaders.Add("X-API-Client-Id", clientId);
        client.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var contextResponse = await client.GetAsync("/api/v1/context/users/user-e2e-001?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.OK, contextResponse.StatusCode);
    }

    [Fact]
    public async Task ApiClientKey_WithReadOnlyScope_DeniesWriteEndpoint()
    {
        UclWebApplicationFactory.AuthenticateAsTenantAdmin(client);

        var createResponse = await client.PostAsJsonAsync("/api/v1/api-clients",
            new V1CreateApiClientRequest(
                "E2E Read-Only Client",
                "primary",
                ["context:read"]));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = JsonNode.Parse(await createResponse.Content.ReadAsStringAsync())!.AsObject();
        var clientId = created["clientId"]!.GetValue<string>();
        var apiKey = created["apiKey"]!.GetValue<string>();

        UclWebApplicationFactory.RemoveAuthentication(client);
        client.DefaultRequestHeaders.Add("X-API-Client-Id", clientId);
        client.DefaultRequestHeaders.Add("X-API-Key", apiKey);

        var recomputeResponse = await client.PostAsJsonAsync("/api/v1/context/recompute?tenantSlug=e2e-tenant",
            new V1RecomputeRequest("user-e2e-001", "e2e-scope-test"));

        Assert.Equal(HttpStatusCode.Forbidden, recomputeResponse.StatusCode);
    }

    [Fact]
    public async Task ApiClientKey_Rotation_InvalidatesOldKey()
    {
        UclWebApplicationFactory.AuthenticateAsTenantAdmin(client);

        var createResponse = await client.PostAsJsonAsync("/api/v1/api-clients",
            new V1CreateApiClientRequest("E2E Rotate Client", "primary", ["context:read"]));
        var created = JsonNode.Parse(await createResponse.Content.ReadAsStringAsync())!.AsObject();
        var clientId = created["clientId"]!.GetValue<string>();
        var oldApiKey = created["apiKey"]!.GetValue<string>();

        var rotateResponse = await client.PostAsync($"/api/v1/api-clients/{clientId}/rotate", null);
        Assert.Equal(HttpStatusCode.OK, rotateResponse.StatusCode);
        var rotated = JsonNode.Parse(await rotateResponse.Content.ReadAsStringAsync())!.AsObject();
        var newApiKey = rotated["apiKey"]!.GetValue<string>();
        Assert.NotEqual(oldApiKey, newApiKey);

        UclWebApplicationFactory.RemoveAuthentication(client);
        client.DefaultRequestHeaders.Add("X-API-Client-Id", clientId);
        client.DefaultRequestHeaders.Add("X-API-Key", oldApiKey);
        var oldKeyResponse = await client.GetAsync("/api/v1/workspaces?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.Unauthorized, oldKeyResponse.StatusCode);

        client.DefaultRequestHeaders.Remove("X-API-Key");
        client.DefaultRequestHeaders.Add("X-API-Key", newApiKey);
        var newKeyResponse = await client.GetAsync("/api/v1/workspaces?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.OK, newKeyResponse.StatusCode);
    }

    [Fact]
    public async Task ApiClientKey_Revocation_PreventsAccess()
    {
        UclWebApplicationFactory.AuthenticateAsTenantAdmin(client);

        var createResponse = await client.PostAsJsonAsync("/api/v1/api-clients",
            new V1CreateApiClientRequest("E2E Revoke Client", "primary", ["context:read"]));
        var created = JsonNode.Parse(await createResponse.Content.ReadAsStringAsync())!.AsObject();
        var clientId = created["clientId"]!.GetValue<string>();
        var apiKey = created["apiKey"]!.GetValue<string>();

        var deleteResponse = await client.DeleteAsync($"/api/v1/api-clients/{clientId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        UclWebApplicationFactory.RemoveAuthentication(client);
        client.DefaultRequestHeaders.Add("X-API-Client-Id", clientId);
        client.DefaultRequestHeaders.Add("X-API-Key", apiKey);
        var revokedResponse = await client.GetAsync("/api/v1/workspaces?tenantSlug=e2e-tenant");
        Assert.Equal(HttpStatusCode.Unauthorized, revokedResponse.StatusCode);
    }
}
