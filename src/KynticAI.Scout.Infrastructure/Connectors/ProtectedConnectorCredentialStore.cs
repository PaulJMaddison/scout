using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

namespace KynticAI.Scout.Infrastructure.Connectors;

internal sealed class ProtectedConnectorCredentialStore(
    ScoutDbContext dbContext,
    IDataProtectionProvider dataProtectionProvider,
    IClock clock) : IConnectorCredentialStore
{
    private readonly IDataProtector protector = dataProtectionProvider.CreateProtector("KynticAI.Scout.ConnectorCredentials");

    public async Task<JsonObject> PersistCredentialsAsync(
        Guid tenantId,
        Guid dataSourceId,
        string connectorType,
        JsonObject credentials,
        CancellationToken cancellationToken)
    {
        var references = new JsonObject();
        foreach (var kvp in credentials)
        {
            if (kvp.Value is null)
            {
                continue;
            }

            var secretKey = kvp.Key.Trim();
            if (string.IsNullOrWhiteSpace(secretKey))
            {
                continue;
            }

            var secretReference = $"secret://{tenantId:D}/{dataSourceId:D}/{secretKey}";
            var protectedValue = protector.Protect(kvp.Value.ToJsonString());
            var existing = await dbContext.ConnectorCredentials.FirstOrDefaultAsync(
                x => x.TenantId == tenantId && x.DataSourceId == dataSourceId && x.SecretKey == secretKey,
                cancellationToken);
            if (existing is null)
            {
                dbContext.ConnectorCredentials.Add(ConnectorCredential.Create(
                    tenantId,
                    dataSourceId,
                    connectorType,
                    secretKey,
                    secretReference,
                    protectedValue,
                    clock.UtcNow));
            }
            else
            {
                existing.Rotate(protectedValue, clock.UtcNow);
            }

            references[secretKey] = secretReference;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return references;
    }

    public async Task<JsonObject> ResolveConfigurationSecretsAsync(
        Guid tenantId,
        JsonObject configuration,
        CancellationToken cancellationToken)
    {
        var clone = configuration.DeepClone() as JsonObject ?? new JsonObject();
        if (clone["credentials"] is not JsonObject credentials)
        {
            return clone;
        }

        foreach (var kvp in credentials.ToList())
        {
            var secretReference = kvp.Value?.GetValue<string>();
            if (string.IsNullOrWhiteSpace(secretReference) || !secretReference.StartsWith("secret://", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var credential = await dbContext.ConnectorCredentials.FirstOrDefaultAsync(
                x => x.TenantId == tenantId && x.SecretReference == secretReference,
                cancellationToken)
                ?? throw new InvalidOperationException($"Connector secret '{secretReference}' was not found.");
            credentials[kvp.Key] = JsonNode.Parse(protector.Unprotect(credential.ProtectedValue));
        }

        return clone;
    }
}
