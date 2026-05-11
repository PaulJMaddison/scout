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
