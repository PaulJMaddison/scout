using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Infrastructure.Configuration;
using KynticAI.Scout.Infrastructure.Persistence;
using KynticAI.Scout.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace KynticAI.Scout.UnitTests;

public sealed class LocalLicenceServiceTests
{
    [Fact]
    public async Task Loads_and_verifies_cloud_signed_licence_envelope()
    {
        using var rsa = RSA.Create(2048);
        var licencePath = Path.Combine(Path.GetTempPath(), $"scout-cloud-envelope-{Guid.NewGuid():N}.json");
        await File.WriteAllTextAsync(licencePath, CreateCloudEnvelope(rsa));
        await using var db = NewDb();
        var service = new LocalLicenceService(
            Options.Create(new LicenceOptions
            {
                Mode = "Licensed",
                FilePath = licencePath,
                PublicKeyPem = rsa.ExportRSAPublicKeyPem(),
                RequireValidLicence = true
            }),
            Options.Create(new ControlPlaneOptions { BaseUrl = "https://cloud.example.invalid", UpdateChannel = "stable" }),
            db,
            new TestCurrentActorService(),
            new TestClock());

        var status = await service.GetStatusAsync(CancellationToken.None);

        Assert.Equal("Active", status.Status);
        Assert.True(status.IsValid);
        Assert.Equal("Business", status.Plan);
        Assert.Equal("Northstar Components Ltd", status.LicensedTo);
        Assert.Contains(status.Entitlements, entitlement => entitlement.Key == "enterpriseFeatures" && entitlement.Value.Contains("postgresql"));
        Assert.Contains(db.AuditEvents, audit => audit.Action == "licence.added");
        Assert.DoesNotContain(status.Warnings, warning => warning.Contains("not verified", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Rejects_cloud_licence_envelope_with_bad_signature()
    {
        using var signer = RSA.Create(2048);
        using var verifier = RSA.Create(2048);
        var licencePath = Path.Combine(Path.GetTempPath(), $"scout-cloud-envelope-bad-{Guid.NewGuid():N}.json");
        await File.WriteAllTextAsync(licencePath, CreateCloudEnvelope(signer));
        await using var db = NewDb();
        var service = new LocalLicenceService(
            Options.Create(new LicenceOptions
            {
                Mode = "Licensed",
                FilePath = licencePath,
                PublicKeyPem = verifier.ExportRSAPublicKeyPem(),
                RequireValidLicence = true
            }),
            Options.Create(new ControlPlaneOptions()),
            db,
            new TestCurrentActorService(),
            new TestClock());

        var status = await service.GetStatusAsync(CancellationToken.None);

        Assert.Equal("LicenceRequired", status.Status);
        Assert.False(status.IsValid);
        Assert.Contains(status.Warnings, warning => warning.Contains("signature", StringComparison.OrdinalIgnoreCase));
    }

    private static ScoutDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<ScoutDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new ScoutDbContext(options);
    }

    private static string CreateCloudEnvelope(RSA rsa)
    {
        var payload = JsonSerializer.Serialize(new
        {
            licenceKey = "Scout-20260513-FICTIONAL",
            issuedTo = "Northstar Components Ltd",
            issuedAt = new DateTimeOffset(2026, 5, 13, 9, 0, 0, TimeSpan.Zero),
            expiresAt = new DateTimeOffset(2026, 8, 13, 9, 0, 0, TimeSpan.Zero),
            entitlements = new
            {
                plan = 2,
                maxUsers = 25,
                maxConnectors = 4,
                updateChannel = 0,
                enterpriseFeatures = new[] { "postgresql", "support-bundles" }
            }
        }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        var signature = rsa.SignData(Encoding.UTF8.GetBytes(payload), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        return JsonSerializer.Serialize(new
        {
            format = "Scout-LICENCE-v1",
            payload,
            signature = Convert.ToBase64String(signature)
        }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }

    private sealed class TestClock : IClock
    {
        public DateTime UtcNow { get; } = new(2026, 5, 13, 10, 0, 0, DateTimeKind.Utc);
    }

    private sealed class TestCurrentActorService : ICurrentActorService
    {
        public ActorContext GetCurrentActor() => ActorContext.System();
    }
}
