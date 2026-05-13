using System.Net;
using System.Text;
using ContextLayer.Sdk;

namespace ContextLayer.Sdk.Tests;

public sealed class ContextLayerClientTests
{
    [Fact]
    public async Task UsersGetContextAsync_UsesV1RestPath_AndAddsTracingHeaders()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            Assert.Equal(HttpMethod.Get, request.Method);
            Assert.Equal(
                "http://127.0.0.1:5198/api/v1/context/users/123?tenantSlug=demo",
                request.RequestUri!.ToString());
            Assert.True(request.Headers.Contains("X-Request-Id"));
            Assert.Equal("Bearer", request.Headers.Authorization?.Scheme);
            Assert.Equal("token-123", request.Headers.Authorization?.Parameter);

            const string json = """
            {
              "snapshotId": "8e22fcf4-6640-4fba-8992-14bd208b89fa",
              "tenantSlug": "demo",
              "externalUserId": "123",
              "fullName": "Avery Stone",
              "companyName": "Larkspur Logistics Group",
              "summary": "High intent account.",
              "overallConfidence": 0.91,
              "generatedAtUtc": "2026-05-11T10:00:00Z",
              "isStale": false,
              "sourceSummary": null,
              "history": [],
              "facts": []
            }
            """;
            return Task.FromResult(CreateJsonResponse(HttpStatusCode.OK, json));
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198",
            AccessToken = "token-123"
        });

        var result = await client.Users.GetContextAsync("demo", "123");

        Assert.NotNull(result);
        Assert.Equal("123", result!.ExternalUserId);
        Assert.Equal("Larkspur Logistics Group", result.CompanyName);
    }

    [Fact]
    public async Task ForTenant_ProvidesScopedUserClient()
    {
        var handler = new StubHttpMessageHandler(_ =>
        {
            const string json = """
            {
              "snapshotId": "8e22fcf4-6640-4fba-8992-14bd208b89fa",
              "tenantSlug": "demo",
              "externalUserId": "123",
              "fullName": "Avery Stone",
              "companyName": "Larkspur Logistics Group",
              "summary": "High intent account.",
              "overallConfidence": 0.91,
              "generatedAtUtc": "2026-05-11T10:00:00Z",
              "isStale": false,
              "sourceSummary": null,
              "history": [],
              "facts": []
            }
            """;
            return Task.FromResult(CreateJsonResponse(HttpStatusCode.OK, json));
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198"
        });

        var demo = client.ForTenant("demo");
        var result = await demo.Users.GetContextAsync("123");

        Assert.NotNull(result);
        Assert.Equal("demo", demo.TenantSlug);
    }

    [Fact]
    public async Task AccountsGetContextAsync_UsesRestPath()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            Assert.Equal(HttpMethod.Get, request.Method);
            Assert.Equal(
                "http://127.0.0.1:5198/api/v1/context/accounts/ACC-123?tenantSlug=demo",
                request.RequestUri!.ToString());

            const string json = """
            {
              "tenantSlug": "demo",
              "externalAccountId": "ACC-123",
              "accountName": "Larkspur Logistics Group",
              "domain": "larkspur.example",
              "industry": "Logistics",
              "segment": "Enterprise",
              "region": "EMEA",
              "lifecycleStage": "customer",
              "users": []
            }
            """;
            return Task.FromResult(CreateJsonResponse(HttpStatusCode.OK, json));
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198"
        });

        var result = await client.Accounts.GetContextAsync("demo", "ACC-123");

        Assert.NotNull(result);
        Assert.Equal("ACC-123", result!.ExternalAccountId);
    }

    [Fact]
    public async Task AuthGetMachineTokenAsync_UsesTokenEndpoint()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal(
                "http://127.0.0.1:5198/api/auth/token",
                request.RequestUri!.ToString());

            const string json = """
            {
              "accessToken": "machine-token",
              "tokenType": "Bearer",
              "expiresIn": 3600,
              "scope": "context:read"
            }
            """;
            return Task.FromResult(CreateJsonResponse(HttpStatusCode.OK, json));
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198"
        });

        var token = await client.Auth.GetMachineTokenAsync(
            new MachineTokenRequest("client_credentials", "workflow-client", "secret", "context:read"));

        Assert.Equal("machine-token", token.AccessToken);
        Assert.Equal("Bearer", token.TokenType);
    }

    [Fact]
    public async Task SnapshotsGetByIdAsync_UsesV1RestPath_WithoutDoublePrefix()
    {
        var snapshotId = Guid.Parse("8e22fcf4-6640-4fba-8992-14bd208b89fa");
        var handler = new StubHttpMessageHandler(request =>
        {
            Assert.Equal(HttpMethod.Get, request.Method);
            Assert.Equal(
                $"http://127.0.0.1:5198/api/v1/context/snapshots/{snapshotId}?tenantSlug=demo",
                request.RequestUri!.ToString());

            const string json = """
            {
              "snapshotId": "8e22fcf4-6640-4fba-8992-14bd208b89fa",
              "tenantId": "5e9cdd48-b71c-4eb7-92fd-d29bfbe99731",
              "tenantSlug": "demo",
              "userProfileId": "0f864ac6-dcbf-4850-bd98-1d13975d7813",
              "externalUserId": "123",
              "fullName": "Avery Stone",
              "companyName": "Larkspur Logistics Group",
              "snapshotVersion": 3,
              "summary": "Snapshot summary.",
              "overallConfidence": 0.91,
              "generatedAtUtc": "2026-05-11T10:00:00Z",
              "isStale": false,
              "facts": []
            }
            """;
            return Task.FromResult(CreateJsonResponse(HttpStatusCode.OK, json));
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198/api/v1"
        });

        var result = await client.Snapshots.GetByIdAsync("demo", snapshotId);

        Assert.NotNull(result);
        Assert.Equal(3, result!.SnapshotVersion);
    }

    [Fact]
    public async Task PackagesGetAiContextForUserAsync_UsesRestPackagePath()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal(
                "http://127.0.0.1:5198/api/v1/context/users/123/ai-safe-context-package?tenantSlug=demo",
                request.RequestUri!.ToString());

            const string json = """
            {
              "snapshotId": "8e22fcf4-6640-4fba-8992-14bd208b89fa",
              "tenantSlug": "demo",
              "externalUserId": "123",
              "fullName": "Avery Stone",
              "companyName": "Larkspur Logistics Group",
              "jobTitle": "VP Revenue",
              "segment": "enterprise",
              "salesObjective": "Prepare a renewal-risk brief.",
              "summary": "Grounded context package.",
              "overallConfidence": 0.91,
              "generatedAtUtc": "2026-05-11T10:00:00Z",
              "isStale": false,
              "humanReviewRecommended": true,
              "missingInformation": [],
              "weakSignalMessages": [],
              "facts": [],
              "contextPackageJson": "{}"
            }
            """;
            return Task.FromResult(CreateJsonResponse(HttpStatusCode.OK, json));
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198"
        });

        var result = await client.Packages.GetAiContextForUserAsync("demo", "123", "Prepare a renewal-risk brief.");

        Assert.NotNull(result);
        Assert.Equal("{}", result!.ContextPackageJson);
    }

    [Fact]
    public async Task FactsGetForUserAsync_UsesRestFactLookupPath_WithFilters()
    {
        var handler = new StubHttpMessageHandler(request =>
        {
            Assert.Equal(HttpMethod.Get, request.Method);
            Assert.Equal(
                "http://127.0.0.1:5198/api/v1/context/users/123/facts?tenantSlug=demo&attributeKey=health&page=2&pageSize=10",
                request.RequestUri!.ToString());

            const string json = """
            {
              "items": [
                {
                  "id": "8e22fcf4-6640-4fba-8992-14bd208b89fa",
                  "attributeKey": "accountHealth",
                  "valueJson": "\"green\"",
                  "valueType": "string",
                  "confidence": 0.9,
                  "observedAtUtc": "2026-05-11T10:00:00Z",
                  "freshUntilUtc": null,
                  "sourceSelectorDefinitionId": "0f864ac6-dcbf-4850-bd98-1d13975d7813",
                  "explanation": "Healthy account.",
                  "provenanceJson": "[]"
                }
              ],
              "page": 2,
              "pageSize": 10,
              "totalCount": 11,
              "hasMore": false
            }
            """;
            return Task.FromResult(CreateJsonResponse(HttpStatusCode.OK, json));
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198"
        });

        var facts = await client.Facts.GetForUserAsync(
            "demo",
            "123",
            new ContextFactLookupOptions("health", 2, 10));

        Assert.Single(facts);
        Assert.Equal("accountHealth", facts[0].AttributeKey);
    }

    [Fact]
    public async Task EventsIngestSourceSystemEventAsync_UsesRestEventContractPath()
    {
        var handler = new StubHttpMessageHandler(async request =>
        {
            Assert.Equal(HttpMethod.Post, request.Method);
            Assert.Equal(
                "http://127.0.0.1:5198/api/v1/events/source-system?tenantSlug=demo",
                request.RequestUri!.ToString());
            var body = await request.Content!.ReadAsStringAsync();
            Assert.Contains("evt-sdk-001", body, StringComparison.Ordinal);
            Assert.Contains("source.product_usage.rollup_ready", body, StringComparison.Ordinal);

            const string json = """
            {
              "eventId": "evt-sdk-001",
              "tenantId": "5e9cdd48-b71c-4eb7-92fd-d29bfbe99731",
              "tenantSlug": "demo",
              "workspaceId": null,
              "userProfileId": "0f864ac6-dcbf-4850-bd98-1d13975d7813",
              "storedSignalCount": 1,
              "matchedSelectorCount": 2,
              "status": "Processed",
              "isDuplicate": false,
              "acceptedAtUtc": "2026-05-11T10:00:00Z"
            }
            """;
            return CreateJsonResponse(HttpStatusCode.Accepted, json);
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198"
        });

        var result = await client.Events.IngestSourceSystemEventAsync(
            "demo",
            new SourceSystemEventRequest(
                "evt-sdk-001",
                "primary",
                "product",
                "source.product_usage.rollup_ready",
                new { activeDays30 = 22 },
                null,
                "123",
                "acct-123",
                DateTime.Parse("2026-05-11T10:00:00Z")));

        Assert.Equal("Processed", result.Status);
    }

    [Fact]
    public async Task UsersGetContextAsync_RetriesTransientFailure_BeforeSucceeding()
    {
        var attempts = 0;
        var handler = new StubHttpMessageHandler(_ =>
        {
            attempts++;
            if (attempts == 1)
            {
                return Task.FromResult(CreateJsonResponse(HttpStatusCode.TooManyRequests, """
                {
                  "title": "Rate limited",
                  "detail": "Try again soon.",
                  "retryable": true
                }
                """));
            }

            return Task.FromResult(CreateJsonResponse(HttpStatusCode.OK, """
            {
              "snapshotId": "8e22fcf4-6640-4fba-8992-14bd208b89fa",
              "tenantSlug": "demo",
              "externalUserId": "123",
              "fullName": "Avery Stone",
              "companyName": "Larkspur Logistics Group",
              "summary": "Recovered after retry.",
              "overallConfidence": 0.91,
              "generatedAtUtc": "2026-05-11T10:00:00Z",
              "isStale": false,
              "sourceSummary": null,
              "history": [],
              "facts": []
            }
            """));
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198",
            MaxRetries = 2,
            RetryBaseDelay = TimeSpan.Zero
        });

        var result = await client.Users.GetContextAsync("demo", "123");

        Assert.NotNull(result);
        Assert.Equal(2, attempts);
        Assert.Equal("Recovered after retry.", result!.Summary);
    }

    [Fact]
    public async Task LoginAsync_ThrowsTypedError_FromProblemDetailsPayload()
    {
        var handler = new StubHttpMessageHandler(_ =>
        {
            var response = CreateJsonResponse(HttpStatusCode.BadRequest, """
            {
              "title": "Validation failed",
              "detail": "The login payload was invalid.",
              "code": "validation_failed",
              "correlationId": "corr-123",
              "retryable": false,
              "errors": [
                {
                  "code": "required",
                  "target": "tenantSlug",
                  "message": "Tenant slug is required."
                }
              ]
            }
            """);
            response.Headers.Add("X-Request-Id", "req-123");
            return Task.FromResult(response);
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198"
        });

        var exception = await Assert.ThrowsAsync<ContextLayerException>(() =>
            client.Auth.LoginAsync(new LoginRequest(string.Empty, "admin@contextlayer.local", "bad")));

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.Equal("corr-123", exception.CorrelationId);
        Assert.Equal("validation_failed", exception.Code);
        Assert.Single(exception.Details);
        Assert.Equal("tenantSlug", exception.Details[0].Target);
    }

    [Fact]
    public async Task UsersGetContextAsync_ThrowsTypedError_FromV1ErrorEnvelope()
    {
        var handler = new StubHttpMessageHandler(_ =>
        {
            var response = CreateJsonResponse(HttpStatusCode.NotFound, """
            {
              "error": {
                "code": "context.user_not_found",
                "message": "User context was not found.",
                "correlationId": "corr-v1",
                "details": {
                  "externalUserId": ["No context exists for this user."]
                }
              }
            }
            """);
            return Task.FromResult(response);
        });

        using var httpClient = new HttpClient(handler);
        using var client = new ContextLayerClient(httpClient, new ContextLayerClientOptions
        {
            BaseUrl = "http://127.0.0.1:5198"
        });

        var exception = await Assert.ThrowsAsync<ContextLayerException>(() =>
            client.Users.GetContextAsync("demo", "missing"));

        Assert.Equal(HttpStatusCode.NotFound, exception.StatusCode);
        Assert.Equal("corr-v1", exception.CorrelationId);
        Assert.Equal("context.user_not_found", exception.Code);
        Assert.Single(exception.Details);
        Assert.Equal("externalUserId", exception.Details[0].Target);
    }

    private static HttpResponseMessage CreateJsonResponse(HttpStatusCode statusCode, string json)
        => new(statusCode)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => responder(request);
    }
}
