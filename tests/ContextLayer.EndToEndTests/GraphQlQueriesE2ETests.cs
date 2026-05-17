using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;

namespace ContextLayer.EndToEndTests;

/// <summary>
/// Verifies GraphQL queries: tenants, workspaces with nested relationships,
/// semantic attributes, selectors, context facts, and schema correctness.
/// </summary>
public sealed class GraphQlQueriesE2ETests : IAsyncLifetime
{
    private readonly UclWebApplicationFactory factory = new();
    private HttpClient client = null!;

    public async Task InitializeAsync()
    {
        await factory.SeedGoldenPathDataAsync();
        client = factory.CreateClient();
        UclWebApplicationFactory.AuthenticateAsTenantAdmin(client);
    }

    public async Task DisposeAsync()
    {
        client.Dispose();
        await factory.DisposeAsync();
    }

    [Fact]
    public async Task QueryTenants_ReturnsSeedTenant()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  tenants {
                    slug
                    name
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var tenants = payload["data"]!["tenants"]!.AsArray();
        Assert.Contains(tenants, t => t!["slug"]!.GetValue<string>() == "e2e-tenant");
    }

    [Fact]
    public async Task QueryWorkspaces_ReturnsNestedRelationship()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  workspaces(tenantSlug: "e2e-tenant") {
                    slug
                    name
                    status
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var workspaces = payload["data"]!["workspaces"]!.AsArray();
        Assert.Single(workspaces);
        Assert.Equal("primary", workspaces[0]!["slug"]!.GetValue<string>());
    }

    [Fact]
    public async Task QuerySemanticAttributes_ReturnsAttributeDefinitions()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  semanticAttributes(tenantSlug: "e2e-tenant") {
                    key
                    displayName
                    dataType
                    isSystem
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var attributes = payload["data"]!["semanticAttributes"]!.AsArray();
        Assert.True(attributes.Count >= 2, "Should have at least conversionProbability and churnRisk attributes.");
        Assert.Contains(attributes, a => a!["key"]!.GetValue<string>() == "conversionProbability");
        Assert.Contains(attributes, a => a!["key"]!.GetValue<string>() == "churnRisk");
    }

    [Fact]
    public async Task QuerySelectors_ReturnsSelectorDefinitions()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  selectors(tenantSlug: "e2e-tenant") {
                    name
                    description
                    mappingKind
                    status
                    defaultConfidence
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var selectors = payload["data"]!["selectors"]!.AsArray();
        Assert.True(selectors.Count >= 2, "Should have at least conversion and churn selectors.");
        Assert.Contains(selectors, s => s!["name"]!.GetValue<string>().Contains("Conversion", StringComparison.Ordinal));
        Assert.Contains(selectors, s => s!["name"]!.GetValue<string>().Contains("Churn", StringComparison.Ordinal));
    }

    [Fact]
    public async Task QueryContextFacts_ByExternalUserId()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  contextFacts(
                    tenantSlug: "e2e-tenant"
                    externalUserId: "user-e2e-001"
                    externalAccountId: null
                    attributeKey: null
                    skip: 0
                    take: 10
                  ) {
                    attributeKey
                    valueJson
                    confidence
                    provenanceJson
                    observedAtUtc
                    freshUntilUtc
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var facts = payload["data"]!["contextFacts"]!.AsArray();
        Assert.Equal(2, facts.Count);

        foreach (var fact in facts)
        {
            Assert.True(fact!["confidence"]!.GetValue<decimal>() > 0, "GraphQL fact should have positive confidence.");
            Assert.False(string.IsNullOrWhiteSpace(fact["provenanceJson"]!.GetValue<string>()), "GraphQL fact should have provenance.");
        }
    }

    [Fact]
    public async Task QueryContextFacts_WithAttributeKeyFilter()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  contextFacts(
                    tenantSlug: "e2e-tenant"
                    externalUserId: "user-e2e-001"
                    externalAccountId: null
                    attributeKey: "churnRisk"
                    skip: 0
                    take: 10
                  ) {
                    attributeKey
                    valueJson
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var facts = payload["data"]!["contextFacts"]!.AsArray();
        Assert.Single(facts);
        Assert.Equal("churnRisk", facts[0]!["attributeKey"]!.GetValue<string>());
    }

    [Fact]
    public async Task QueryUserContext_ReturnsFullProfile()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  userContext(input: { tenantSlug: "e2e-tenant", externalUserId: "user-e2e-001" }) {
                    externalUserId
                    fullName
                    companyName
                    summary
                    overallConfidence
                    isStale
                    facts {
                      attributeKey
                      confidence
                    }
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var context = payload["data"]!["userContext"]!.AsObject();
        Assert.Equal("user-e2e-001", context["externalUserId"]!.GetValue<string>());
        Assert.Equal("Jordan Rivera", context["fullName"]!.GetValue<string>());
        Assert.True(context["overallConfidence"]!.GetValue<decimal>() > 0, "Context profile should have positive confidence.");
        Assert.Equal(2, context["facts"]!.AsArray().Count);
    }

    [Fact]
    public async Task QueryContextSnapshot_ById()
    {
        var snapshotId = UclWebApplicationFactory.SeedIds.SnapshotId;
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = $$"""
                query {
                  contextSnapshot(tenantSlug: "e2e-tenant", snapshotId: "{{snapshotId}}") {
                    snapshotId
                    snapshotVersion
                    summary
                    overallConfidence
                    isStale
                    facts {
                      attributeKey
                      valueJson
                      confidence
                    }
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        Assert.Null(payload["errors"]);
        var snapshot = payload["data"]!["contextSnapshot"]!.AsObject();
        Assert.Equal(snapshotId, snapshot["snapshotId"]!.GetValue<Guid>());
        Assert.Equal(2, snapshot["facts"]!.AsArray().Count);
    }

    [Fact]
    public async Task QueryContextFacts_RequiresSubjectParameter()
    {
        var response = await client.PostAsJsonAsync("/graphql", new
        {
            query = """
                query {
                  contextFacts(
                    tenantSlug: "e2e-tenant"
                    externalUserId: null
                    externalAccountId: null
                    attributeKey: null
                    skip: 0
                    take: 10
                  ) {
                    attributeKey
                  }
                }
                """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        var errors = payload["errors"]!.AsArray();
        Assert.True(errors.Count >= 1, "Should return an error when no subject is provided.");
    }

    [Fact]
    public async Task QueryLicenceStatus_ReturnsResult()
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
        Assert.NotNull(payload["data"]!["licenceStatus"]);
    }
}
