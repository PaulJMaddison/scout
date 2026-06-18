using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Domain.Enums;
using KynticAI.Scout.Domain.Saas;
using KynticAI.Scout.Infrastructure.Auth;
using KynticAI.Scout.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;

namespace KynticAI.Scout.EndToEndTests;

/// <summary>
/// Shared WebApplicationFactory for E2E tests. Uses EF Core InMemory provider
/// with a unique database per factory instance for full test isolation.
/// </summary>
internal sealed class ScoutWebApplicationFactory : WebApplicationFactory<Program>
{
    private const string TestSigningKey = "scout-tests-signing-key-1234567890";
    private const string TestIssuer = "KynticAI.Scout.Tests";
    private const string TestAudience = "KynticAI.Scout.Tests";

    private readonly string databaseName = $"e2e-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            var settings = new Dictionary<string, string?>
            {
                ["Platform:Mode"] = "BackendOnly",
                ["Platform:EnableRest"] = "true",
                ["Platform:EnableGraphQl"] = "true",
                ["Platform:EnableOpenApi"] = "true",
                ["Bootstrap:ApplyMigrationsOnStartup"] = "false",
                ["Bootstrap:SeedDemoData"] = "false",
                ["Auth:Issuer"] = TestIssuer,
                ["Auth:Audience"] = TestAudience,
                ["Auth:SigningKey"] = TestSigningKey,
                ["Auth:MachineClients:0:ClientId"] = "e2e-machine-client",
                ["Auth:MachineClients:0:ClientSecret"] = "e2e-machine-secret-value-for-tests",
                ["Auth:MachineClients:0:TenantSlug"] = "e2e-tenant",
                ["Auth:MachineClients:0:DisplayName"] = "E2E Machine Client",
                ["Auth:MachineClients:0:Role"] = "tenant_admin",
                ["Auth:MachineClients:0:Scopes:0"] = "context:read",
                ["Auth:MachineClients:0:Scopes:1"] = "context:write",
                ["Auth:MachineClients:0:Scopes:2"] = "selectors:write",
                ["Auth:MachineClients:0:Scopes:3"] = "events:ingest",
                ["Auth:MachineClients:0:Scopes:4"] = "audit:read",
                ["Auth:MachineClients:0:Scopes:5"] = "admin:manage",
                ["Auth:MachineClients:0:Scopes:6"] = "blueprints:write",
                ["Auth:MachineClients:0:Scopes:7"] = "billing:read",
                ["Telemetry:OtlpEndpoint"] = string.Empty
            };

            config.AddInMemoryCollection(settings);
        });

        builder.ConfigureServices(services =>
        {
            var dbDescriptors = services
                .Where(d =>
                    d.ServiceType.FullName != null &&
                    (d.ServiceType.FullName.Contains("DbContextOptions", StringComparison.Ordinal) ||
                     d.ServiceType.FullName.Contains("IDbContextOptionsConfiguration", StringComparison.Ordinal) ||
                     d.ServiceType == typeof(ScoutDbContext) ||
                     d.ServiceType == typeof(CustomerOpsDbContext) ||
                     d.ServiceType == typeof(IScoutDbContext) ||
                     d.ServiceType == typeof(ICustomerOpsDbContext)))
                .ToList();

            foreach (var descriptor in dbDescriptors)
                services.Remove(descriptor);

            services.AddDbContext<ScoutDbContext>(options =>
                options.UseInMemoryDatabase(databaseName));
            services.AddDbContext<CustomerOpsDbContext>(options =>
                options.UseInMemoryDatabase($"{databaseName}-ops"));
            services.AddScoped<IScoutDbContext>(provider =>
                provider.GetRequiredService<ScoutDbContext>());
            services.AddScoped<ICustomerOpsDbContext>(provider =>
                provider.GetRequiredService<CustomerOpsDbContext>());

            services.RemoveAll<PasswordHashingService>();
            services.AddSingleton(new PasswordHashingService(1_000));
        });
    }

    public static class SeedIds
    {
        public static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
        public static readonly Guid WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
        public static readonly Guid AdminId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");
        public static readonly Guid UserProfileId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");
        public static readonly Guid DataSourceId = Guid.Parse("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5");
        public static readonly Guid AttributeId = Guid.Parse("f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6");
        public static readonly Guid ChurnAttributeId = Guid.Parse("a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7");
        public static readonly Guid SelectorId = Guid.Parse("b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8");
        public static readonly Guid ChurnSelectorId = Guid.Parse("c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9");
        public static readonly Guid SnapshotId = Guid.Parse("d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0");
    }

    public async Task SeedGoldenPathDataAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var contextDb = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var customerOpsDb = scope.ServiceProvider.GetRequiredService<CustomerOpsDbContext>();
        var utcNow = DateTime.UtcNow;

        var tenant = Tenant.Create("e2e-tenant", "E2E Test Tenant", utcNow);
        SetId(tenant, SeedIds.TenantId);
        var workspace = Workspace.Create(tenant.Id, "primary", "Primary", "Primary workspace for E2E tests", true, utcNow);
        SetId(workspace, SeedIds.WorkspaceId);
        var admin = OperatorAccount.Create(tenant.Id, "admin@e2e-test.local", "E2E Admin", "not-used", OperatorRole.TenantAdmin, utcNow);
        SetId(admin, SeedIds.AdminId);
        var member = WorkspaceMember.Create(tenant.Id, workspace.Id, admin.Id, WorkspaceMemberRole.Owner, utcNow);
        var userProfile = UserProfile.Create(tenant.Id, "user-e2e-001", "Jordan Rivera", "jordan@acme-e2e.test", "Acme E2E Corp", "VP Sales", "enterprise", utcNow, utcNow);
        SetId(userProfile, SeedIds.UserProfileId);

        var dataSource = DataSource.Create(tenant.Id, "E2E CRM Source", "CRM data for E2E tests", DataSourceKind.Crm, """{"connectorType":"mockSignal"}""", utcNow);
        SetId(dataSource, SeedIds.DataSourceId);

        var conversionAttribute = SemanticAttributeDefinition.Create(tenant.Id, "conversionProbability", "Conversion Probability", "Probability of conversion from prospect to customer.", SemanticDataType.Percentage, "0.85", false, utcNow);
        SetId(conversionAttribute, SeedIds.AttributeId);
        var churnAttribute = SemanticAttributeDefinition.Create(tenant.Id, "churnRisk", "Churn Risk", "Risk of customer churn.", SemanticDataType.Enum, "\"low\"", false, utcNow);
        SetId(churnAttribute, SeedIds.ChurnAttributeId);

        var conversionSelector = SelectorDefinition.Create(
            tenant.Id, dataSource.Id, conversionAttribute.Id,
            "CRM Conversion Selector", "Maps CRM conversion probability via direct field.",
            SelectorMappingKind.DirectFieldMapping,
            """{"rule":{"valuePath":"crm.conversionScore"}}""",
            "Conversion probability is {{sourceValue}}.",
            """{"requiredPaths":["crm.conversionScore"]}""",
            0.92m, 1440, 1, null, utcNow);
        SetId(conversionSelector, SeedIds.SelectorId);
        conversionSelector.Publish(utcNow);

        var churnSelector = SelectorDefinition.Create(
            tenant.Id, dataSource.Id, churnAttribute.Id,
            "CRM Churn Risk Selector", "Classifies churn risk via threshold.",
            SelectorMappingKind.ThresholdClassification,
            """{"rule":{"valuePath":"crm.churnScore","thresholds":[{"max":0.3,"label":"low"},{"max":0.7,"label":"medium"},{"max":1.0,"label":"high"}]}}""",
            "Churn risk classified as {{sourceValue}}.",
            """{"requiredPaths":["crm.churnScore"]}""",
            0.88m, 720, 2, null, utcNow);
        SetId(churnSelector, SeedIds.ChurnSelectorId);
        churnSelector.Publish(utcNow);

        var snapshot = ContextSnapshot.Create(tenant.Id, userProfile.Id, 1, "Jordan Rivera at Acme E2E Corp shows strong conversion signals and low churn risk.", 0.90m, utcNow);
        SetId(snapshot, SeedIds.SnapshotId);

        var conversionFact = ContextFact.Create(tenant.Id, snapshot.Id, conversionAttribute.Id, conversionSelector.Id, "conversionProbability", "0.85", FactValueType.Number, 0.92m, utcNow, utcNow.AddDays(1), "Conversion probability mapped from CRM conversion score.", """[{"source":"crm","field":"conversionScore","connector":"mockSignal"}]""", utcNow);
        var churnFact = ContextFact.Create(tenant.Id, snapshot.Id, churnAttribute.Id, churnSelector.Id, "churnRisk", "\"low\"", FactValueType.Enum, 0.88m, utcNow, utcNow.AddDays(1), "Churn risk classified from CRM churn score.", """[{"source":"crm","field":"churnScore","connector":"mockSignal"}]""", utcNow);

                var signal1 = UserSignal.Create(tenant.Id, userProfile.Id, dataSource.Id, "crm.conversionScore", "0.85", FactValueType.Number, utcNow, "[]", utcNow);
                var signal2 = UserSignal.Create(tenant.Id, userProfile.Id, dataSource.Id, "crm.churnScore", "0.15", FactValueType.Number, utcNow, "[]", utcNow);

        contextDb.Tenants.Add(tenant);
        contextDb.Workspaces.Add(workspace);
        contextDb.OperatorAccounts.Add(admin);
        contextDb.WorkspaceMembers.Add(member);
        contextDb.TenantSubscriptions.Add(TenantSubscription.Create(tenant.Id, SubscriptionPlan.Pro, SubscriptionStatus.Active, "e2e-provider", "{}", utcNow.AddDays(-30), null, utcNow.AddMonths(1), utcNow));
        contextDb.UserProfiles.Add(userProfile);
        contextDb.DataSources.Add(dataSource);
        contextDb.SemanticAttributeDefinitions.AddRange(conversionAttribute, churnAttribute);
        contextDb.SelectorDefinitions.AddRange(conversionSelector, churnSelector);
        contextDb.ContextSnapshots.Add(snapshot);
        contextDb.ContextFacts.AddRange(conversionFact, churnFact);
        contextDb.UserSignals.AddRange(signal1, signal2);

        var opsTenant = CustomerOpsTenant.Create("e2e-tenant", "E2E Test Tenant", utcNow);
        var account = CustomerAccount.Create(opsTenant.Id, "acct-e2e-001", "Acme E2E Corp", "acme-e2e.test", "Technology", "enterprise", "EMEA", "customer", "Jordan", 200, 500_000m, utcNow);
        var contact = CustomerContact.Create(opsTenant.Id, account.Id, "contact-e2e-001", "user-e2e-001", "Jordan Rivera", "jordan@acme-e2e.test", "VP Sales", "executive", "Sales", "email", true, utcNow);
        customerOpsDb.CustomerOpsTenants.Add(opsTenant);
        customerOpsDb.CustomerAccounts.Add(account);
        customerOpsDb.CustomerContacts.Add(contact);

        await contextDb.SaveChangesAsync();
        await customerOpsDb.SaveChangesAsync();
    }

    public static void AuthenticateAsTenantAdmin(HttpClient client, string tenantSlug = "e2e-tenant")
    {
        client.DefaultRequestHeaders.Remove("X-API-Client-Id");
        client.DefaultRequestHeaders.Remove("X-API-Key");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSigningKey));
        var token = new JwtSecurityToken(
            issuer: TestIssuer,
            audience: TestAudience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, SeedIds.AdminId.ToString("D")),
                new Claim(ClaimTypes.NameIdentifier, SeedIds.AdminId.ToString("D")),
                new Claim("tenant_id", SeedIds.TenantId.ToString("D")),
                new Claim("tenant_slug", tenantSlug),
                new Claim("workspace_id", SeedIds.WorkspaceId.ToString("D")),
                new Claim("workspace_slug", "primary"),
                new Claim("display_name", "E2E Admin"),
                new Claim(ClaimTypes.Email, "admin@e2e-test.local"),
                new Claim(ClaimTypes.Role, "tenant_admin")
            ],
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
    }

    public static void AuthenticateAsReadOnly(HttpClient client, string tenantSlug = "e2e-tenant")
    {
        client.DefaultRequestHeaders.Remove("X-API-Client-Id");
        client.DefaultRequestHeaders.Remove("X-API-Key");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSigningKey));
        var token = new JwtSecurityToken(
            issuer: TestIssuer,
            audience: TestAudience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString("D")),
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString("D")),
                new Claim("tenant_id", SeedIds.TenantId.ToString("D")),
                new Claim("tenant_slug", tenantSlug),
                new Claim("display_name", "E2E Reader"),
                new Claim(ClaimTypes.Email, "reader@e2e-test.local"),
                new Claim(ClaimTypes.Role, "read_only")
            ],
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
    }

    public static void RemoveAuthentication(HttpClient client)
    {
        client.DefaultRequestHeaders.Authorization = null;
        client.DefaultRequestHeaders.Remove("X-API-Client-Id");
        client.DefaultRequestHeaders.Remove("X-API-Key");
    }

    public static async Task<(JsonObject Payload, HttpResponseMessage Response)> ReadJsonAsync(Task<HttpResponseMessage> requestTask)
    {
        var response = await requestTask;
        response.EnsureSuccessStatusCode();
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();
        return (payload, response);
    }

    private static void SetId<T>(T entity, Guid id)
        where T : class
        => typeof(T).BaseType!.GetProperty("Id")!.SetValue(entity, id);
}
