using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Domain.Enums;
using KynticAI.Scout.Infrastructure.Configuration;
using KynticAI.Scout.Infrastructure.Extensions;
using KynticAI.Scout.Infrastructure.Persistence;
using KynticAI.Scout.MigrationTool;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace KynticAI.Scout.UnitTests;

public sealed class StorageAdapterBoundaryTests
{
    [Fact]
    public void StorageAdapterOptions_DefaultsKeepCloudAndVectorsDisabled()
    {
        var options = new StorageAdapterOptions();

        Assert.Equal(StorageAdapterProviderKeys.ScoutPostgres, options.Provider);
        Assert.Equal(StorageAdapterProviderKeys.Disabled, options.VectorProvider);
        Assert.False(options.EnableEnterpriseRuntime);
        Assert.False(options.EnableVectorWrites);
        Assert.False(options.EnableDualWrite);
        Assert.False(options.AllowCloudDataMovement);
        Assert.Equal(384, options.ExpectedEmbeddingDimensions);
    }

    [Fact]
    public async Task DefaultStorageAdapter_ReportsScoutPostgresCapabilitiesWithoutCloudDataMovement()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var adapter = ResolveDefaultAdapter(scope);

        var capabilities = await adapter.GetCapabilitiesAsync(new StorageAdapterCapabilitiesRequest(CreateContext()));

        Assert.Equal(StorageAdapterProviderKeys.ScoutPostgres, capabilities.AdapterKey);
        Assert.Equal(StorageAdapterProviderKeys.ScoutPostgres, capabilities.ProviderKind);
        Assert.Equal(StorageAdapterProviderKeys.Disabled, capabilities.VectorProviderKind);
        Assert.True(capabilities.UsesCustomerOwnedDataPlane);
        Assert.False(capabilities.UsesCloudDataPlane);
        Assert.False(capabilities.RequiresEnterpriseRuntime);
        Assert.True(capabilities.SupportsExport);
        Assert.False(capabilities.SupportsVectorWrites);
        Assert.False(capabilities.SupportsDenseEmbeddings);
        Assert.True(capabilities.SupportedScopes.HasFlag(StorageAdapterDataScope.TenantMetadata));
        Assert.True(capabilities.SupportedScopes.HasFlag(StorageAdapterDataScope.SourceEvents));
        Assert.True(capabilities.SupportedScopes.HasFlag(StorageAdapterDataScope.SelectorDefinitions));
        Assert.True(capabilities.SupportedScopes.HasFlag(StorageAdapterDataScope.ContextSnapshots));
        Assert.True(capabilities.SupportedScopes.HasFlag(StorageAdapterDataScope.ContextFacts));
        Assert.True(capabilities.SupportedScopes.HasFlag(StorageAdapterDataScope.AuditEvents));
        Assert.False(capabilities.SupportedScopes.HasFlag(StorageAdapterDataScope.Vectors));
    }

    [Fact]
    public async Task DefaultStorageAdapter_HealthCheckUsesLocalScoutStorageOnly()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var adapter = ResolveDefaultAdapter(scope);

        var health = await adapter.CheckHealthAsync(new StorageAdapterHealthRequest(CreateContext()));

        Assert.Equal(StorageAdapterReadiness.Available, health.Readiness);
        Assert.Equal(StorageAdapterProviderKeys.ScoutPostgres, health.AdapterKey);
        Assert.Empty(health.Errors);
        Assert.False(health.Diagnostics["usesCloudDataPlane"]!.GetValue<bool>());
    }

    [Fact]
    public async Task DefaultStorageAdapter_SkipsVectorWritesWithoutPrivateRuntime()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var adapter = ResolveDefaultAdapter(scope);
        var now = DateTime.UtcNow;
        var record = new StorageVectorRecord(
            "vec-test-001",
            "relationship_set",
            "relationship-set-001",
            "pilot-alpha",
            [0.1f, 0.2f, 0.3f],
            new JsonObject { ["source"] = "unit-test" },
            now,
            now);

        var result = await adapter.WriteVectorAsync(new StorageVectorWriteRequest(
            CreateContext(),
            record,
            TargetProvider: StorageAdapterProviderKeys.EnterpriseRuntime));

        Assert.Equal(StorageVectorWriteStatus.Skipped, result.Status);
        Assert.Equal(0, result.WrittenRecords);
        Assert.NotEmpty(result.Errors);
        Assert.False(result.Diagnostics["usesCloudDataPlane"]!.GetValue<bool>());
    }

    [Fact]
    public void DefaultStorageAdapterResolver_SelectsScoutPostgresFromDefaultConfiguration()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();

        var resolver = scope.ServiceProvider.GetRequiredService<ILocalDataPlaneStorageAdapterResolver>();
        var adapter = resolver.GetRequiredAdapter();

        Assert.Equal(StorageAdapterProviderKeys.ScoutPostgres, resolver.DefaultProviderKey);
        Assert.Equal(StorageAdapterProviderKeys.ScoutPostgres, adapter.AdapterKey);
        Assert.Contains(StorageAdapterProviderKeys.ScoutPostgres, resolver.RegisteredProviderKeys);
    }

    [Fact]
    public void DefaultStorageAdapterResolver_UsesRegisteredEnterpriseRuntimeWhenConfigured()
    {
        using var provider = BuildServiceProvider(
            options => options.Provider = StorageAdapterProviderKeys.EnterpriseRuntime,
            services => services.AddLocalDataPlaneStorageAdapter<TestEnterpriseRuntimeStorageAdapter>());
        using var scope = provider.CreateScope();

        var resolver = scope.ServiceProvider.GetRequiredService<ILocalDataPlaneStorageAdapterResolver>();
        var adapter = resolver.GetRequiredAdapter();

        Assert.Equal(StorageAdapterProviderKeys.EnterpriseRuntime, resolver.DefaultProviderKey);
        Assert.Equal(StorageAdapterProviderKeys.EnterpriseRuntime, adapter.AdapterKey);
        Assert.Contains(StorageAdapterProviderKeys.ScoutPostgres, resolver.RegisteredProviderKeys);
        Assert.Contains(StorageAdapterProviderKeys.EnterpriseRuntime, resolver.RegisteredProviderKeys);
    }

    [Fact]
    public void DefaultStorageAdapterResolver_FailsClosedWhenConfiguredEnterpriseRuntimeIsMissing()
    {
        using var provider = BuildServiceProvider(options => options.Provider = StorageAdapterProviderKeys.EnterpriseRuntime);
        using var scope = provider.CreateScope();

        var resolver = scope.ServiceProvider.GetRequiredService<ILocalDataPlaneStorageAdapterResolver>();
        var exception = Assert.Throws<InvalidOperationException>(() => resolver.GetRequiredAdapter());

        Assert.Contains(StorageAdapterProviderKeys.EnterpriseRuntime, exception.Message, StringComparison.Ordinal);
        Assert.Contains(StorageAdapterProviderKeys.ScoutPostgres, exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task DefaultStorageAdapter_ExportsScoutRelationalRecordsWithTenantLayerMetadata()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var adapter = ResolveDefaultAdapter(scope);

        var batches = await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.SourceEvents
                | StorageAdapterDataScope.UserSignals
                | StorageAdapterDataScope.SelectorExecutions
                | StorageAdapterDataScope.ContextFacts
                | StorageAdapterDataScope.Provenance
                | StorageAdapterDataScope.AuditEvents,
            MaxRecords: 20));

        var batch = Assert.Single(batches);
        Assert.True(batch.IsFinal);
        Assert.Equal(6, batch.Records.Count);
        Assert.NotNull(batch.ValidationReport);
        Assert.True(batch.ValidationReport!.IsValid);
        Assert.Equal(6, batch.ValidationReport.CheckedRecords);
        Assert.False(batch.Diagnostics["usesCloudDataPlane"]!.GetValue<bool>());
        Assert.Contains(batch.Records, record => record.RecordKind == "source_system_event");
        Assert.Contains(batch.Records, record => record.RecordKind == "user_signal");
        Assert.Contains(batch.Records, record => record.RecordKind == "selector_execution");
        Assert.Contains(batch.Records, record => record.RecordKind == "context_fact");
        Assert.Contains(batch.Records, record => record.RecordKind == "provenance_metadata");
        Assert.Contains(batch.Records, record => record.RecordKind == "audit_event");

        var sourceEvent = batch.Records.Single(record => record.RecordKind == "source_system_event");
        var tenantContext = sourceEvent.Metadata["tenantContext"]!.AsObject();
        var anchor = sourceEvent.Metadata["portableAnchor"]!.AsObject();
        Assert.Equal("crm", sourceEvent.SourceSystem);
        Assert.Equal("evt-001", sourceEvent.SourceRecordId);
        Assert.Equal(tenant.Slug, tenantContext["layer"]!.GetValue<string>());
        Assert.Equal(tenant.Slug, anchor["layer"]!.GetValue<string>());
        Assert.Equal("source_system_event", anchor["entity_type"]!.GetValue<string>());
    }

    [Fact]
    public async Task DefaultStorageAdapter_ExportsAllPagesFromSingleSnapshot()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var adapter = ResolveDefaultAdapter(scope);

        var batches = await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.SourceEvents
                | StorageAdapterDataScope.UserSignals
                | StorageAdapterDataScope.SelectorExecutions
                | StorageAdapterDataScope.ContextFacts
                | StorageAdapterDataScope.Provenance
                | StorageAdapterDataScope.AuditEvents,
            MaxRecords: 2));

        Assert.Equal(3, batches.Count);
        Assert.All(batches.Take(2), batch => Assert.False(batch.IsFinal));
        Assert.True(batches[^1].IsFinal);
        Assert.Equal(6, batches.Sum(batch => batch.Records.Count));
        Assert.All(batches, batch =>
        {
            Assert.True(batch.ValidationReport!.IsValid);
            Assert.Equal(6, batch.ValidationReport.CheckedRecords);
        });
    }

    [Fact]
    public async Task DefaultStorageAdapter_ExportsTenantSelectorAndContextMetadataWithoutCredentialConfig()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var adapter = ResolveDefaultAdapter(scope);

        var batches = await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.TenantMetadata
                | StorageAdapterDataScope.SelectorDefinitions
                | StorageAdapterDataScope.ContextSnapshots,
            MaxRecords: 20));

        var batch = Assert.Single(batches);
        Assert.True(batch.ValidationReport!.IsValid);
        Assert.Equal(3, batch.Records.Count);
        var tenantMetadata = batch.Records.Single(record => record.RecordKind == "tenant_context_metadata");
        var firstDataSource = tenantMetadata.Payload["dataSources"]!.AsArray()[0]!.AsObject();
        Assert.True(firstDataSource["connectionConfigExcluded"]!.GetValue<bool>());
        Assert.Contains(
            tenantMetadata.Metadata["excludedFields"]!.AsArray(),
            item => item!.GetValue<string>() == "data_sources.connection_config_json");
        Assert.Contains(batch.Records, record => record.RecordKind == "selector_definition");
        Assert.Contains(batch.Records, record => record.RecordKind == "context_snapshot");
    }

    [Fact]
    public async Task DefaultStorageAdapter_ExcludesSourceEventHeadersFromPortableRecords()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var adapter = ResolveDefaultAdapter(scope);

        var batch = Assert.Single(await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.SourceEvents,
            MaxRecords: 20)));

        var sourceEvent = Assert.Single(batch.Records);
        Assert.Null(sourceEvent.Metadata["headers"]);
        Assert.True(sourceEvent.Metadata["headersExcluded"]!.GetValue<bool>());
        Assert.Contains(
            sourceEvent.Metadata["excludedFields"]!.AsArray(),
            item => item!.GetValue<string>() == "headersJson");
    }

    [Fact]
    public async Task DefaultStorageAdapter_NormalizesPortableRecordTimestampsToUtc()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var user = await dbContext.UserProfiles.SingleAsync();
        var dataSource = await dbContext.DataSources.SingleAsync();
        var observedAtUtc = new DateTime(2026, 6, 18, 13, 30, 0, DateTimeKind.Unspecified);
        var receivedAtUtc = new DateTime(2026, 6, 18, 13, 31, 0, DateTimeKind.Unspecified);
        var sourceEvent = SourceSystemEvent.Create(
            tenant.Id,
            null,
            "evt-unspecified-timestamp-001",
            "crm",
            "account.updated",
            user.ExternalUserId,
            "account-001",
            user.Id,
            dataSource.Id,
            """{"accountId":"account-001","health":"amber"}""",
            "{}",
            "corr-unspecified-timestamp-001",
            observedAtUtc,
            receivedAtUtc);
        sourceEvent.MarkProcessed(0, "Processed for UTC timestamp export validation.", receivedAtUtc);
        dbContext.SourceSystemEvents.Add(sourceEvent);
        await dbContext.SaveChangesAsync();
        var adapter = ResolveDefaultAdapter(scope);

        var batch = Assert.Single(await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.SourceEvents,
            MaxRecords: 20)));

        Assert.True(batch.ValidationReport!.IsValid);
        var exportedEvent = batch.Records.Single(record => record.RecordId == sourceEvent.Id.ToString("D"));
        Assert.Equal(DateTimeKind.Utc, exportedEvent.ObservedAtUtc.Kind);
        Assert.Equal("2026-06-18T13:31:00.0000000Z", exportedEvent.Metadata["receivedAtUtc"]!.GetValue<string>());
        var json = JsonSerializer.Serialize(exportedEvent, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.Contains("\"observedAtUtc\":\"2026-06-18T13:30:00Z\"", json);
    }

    [Fact]
    public async Task DefaultStorageAdapter_AddsLocalProvenanceReferenceForContextFacts()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var snapshot = await dbContext.ContextSnapshots.SingleAsync();
        var selector = await dbContext.SelectorDefinitions.SingleAsync();
        var semanticAttribute = await dbContext.SemanticAttributeDefinitions.SingleAsync();
        var utcNow = new DateTime(2026, 6, 18, 13, 40, 0, DateTimeKind.Utc);
        var fact = ContextFact.Create(
            tenant.Id,
            snapshot.Id,
            semanticAttribute.Id,
            selector.Id,
            "nested_only_context_fact",
            "\"email\"",
            FactValueType.String,
            0.87m,
            utcNow,
            utcNow.AddHours(12),
            "Nested provenance shape from local connector output.",
            """[{"selector":{"Id":"selector-001"},"source":[{"source":"sqlDatabase","tableName":"customer_email_signals"}]}]""",
            utcNow);
        dbContext.ContextFacts.Add(fact);
        await dbContext.SaveChangesAsync();
        var adapter = ResolveDefaultAdapter(scope);

        var batch = Assert.Single(await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.ContextFacts,
            MaxRecords: 20)));

        Assert.True(batch.ValidationReport!.IsValid);
        var exportedFact = batch.Records.Single(record => record.RecordId == fact.Id.ToString("D"));
        Assert.Contains(exportedFact.Provenance, entry =>
        {
            var provenance = entry!.AsObject();
            return provenance["sourceSystem"]?.GetValue<string>() == "scout-selector"
                && provenance["sourceRecordId"]?.GetValue<string>() == selector.Id.ToString("D")
                && provenance["contextFactId"]?.GetValue<string>() == fact.Id.ToString("D");
        });
    }

    [Fact]
    public async Task DefaultStorageAdapter_PromotesUserSignalEventProvenanceToSourceRecordReference()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var user = await dbContext.UserProfiles.SingleAsync();
        var dataSource = await dbContext.DataSources.SingleAsync();
        var utcNow = new DateTime(2026, 6, 18, 13, 45, 0, DateTimeKind.Utc);
        var signal = UserSignal.Create(
            tenant.Id,
            user.Id,
            dataSource.Id,
            "mock_crm.source.crm.contact_updated",
            """{"crm":{"preferredChannel":"email"}}""",
            FactValueType.Json,
            utcNow,
            """{"eventId":"evt-user-signal-001","sourceSystem":"mock_crm","eventType":"source.crm.contact_updated","sourceSystemEventId":"source-event-pk-001"}""",
            utcNow);
        dbContext.UserSignals.Add(signal);
        await dbContext.SaveChangesAsync();
        var adapter = ResolveDefaultAdapter(scope);

        var batch = Assert.Single(await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.UserSignals,
            MaxRecords: 20)));

        Assert.True(batch.ValidationReport!.IsValid);
        var exportedSignal = batch.Records.Single(record => record.RecordId == signal.Id.ToString("D"));
        var provenance = Assert.Single(exportedSignal.Provenance)!.AsObject();
        Assert.Equal("mock_crm", provenance["sourceSystem"]!.GetValue<string>());
        Assert.Equal("evt-user-signal-001", provenance["sourceRecordId"]!.GetValue<string>());
    }

    [Fact]
    public async Task DefaultStorageAdapter_AddsLocalProvenanceReferenceForSelectorExecutions()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var selector = await dbContext.SelectorDefinitions.SingleAsync();
        var user = await dbContext.UserProfiles.SingleAsync();
        var utcNow = new DateTime(2026, 6, 18, 13, 50, 0, DateTimeKind.Utc);
        var execution = SelectorExecution.Create(
            tenant.Id,
            selector.Id,
            user.Id,
            "corr-selector-execution-local-reference",
            "unit-test",
            SelectorExecutionMode.Live,
            utcNow);
        execution.MarkSucceeded(
            "\"email\"",
            FactValueType.String,
            0.88m,
            utcNow,
            "Nested provenance shape from local selector execution.",
            """[{"selector":{"Id":"selector-001"},"source":[{"source":"sqlDatabase","tableName":"customer_email_signals"}]}]""",
            """{"engagement_channel_signal":"email"}""",
            "[]",
            """{"steps":["mapped"]}""",
            utcNow);
        dbContext.SelectorExecutions.Add(execution);
        await dbContext.SaveChangesAsync();
        var adapter = ResolveDefaultAdapter(scope);

        var batch = Assert.Single(await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.SelectorExecutions,
            MaxRecords: 20)));

        Assert.True(batch.ValidationReport!.IsValid);
        var exportedExecution = batch.Records.Single(record => record.RecordId == execution.Id.ToString("D"));
        Assert.Contains(exportedExecution.Provenance, entry =>
        {
            var provenance = entry!.AsObject();
            return provenance["sourceSystem"]?.GetValue<string>() == "scout-selector"
                && provenance["sourceRecordId"]?.GetValue<string>() == selector.Id.ToString("D")
                && provenance["selectorExecutionId"]?.GetValue<string>() == execution.Id.ToString("D");
        });
    }

    [Fact]
    public async Task DefaultStorageAdapter_PreservesObjectShapedProvenanceAsPortableArray()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var user = await dbContext.UserProfiles.SingleAsync();
        var dataSource = await dbContext.DataSources.SingleAsync();
        var utcNow = new DateTime(2026, 6, 18, 12, 20, 0, DateTimeKind.Utc);
        var signal = UserSignal.Create(
            tenant.Id,
            user.Id,
            dataSource.Id,
            "crm.object-provenance",
            """{"health":"green"}""",
            FactValueType.Json,
            utcNow,
            """{"sourceSystem":"crm","sourceRecordId":"evt-object-001"}""",
            utcNow);
        dbContext.UserSignals.Add(signal);
        await dbContext.SaveChangesAsync();
        var adapter = ResolveDefaultAdapter(scope);

        var batch = Assert.Single(await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.UserSignals,
            MaxRecords: 20)));

        Assert.True(batch.ValidationReport!.IsValid);
        var exportedSignal = batch.Records.Single(record => record.RecordId == signal.Id.ToString("D"));
        var provenance = exportedSignal.Provenance;
        var provenanceEntry = Assert.Single(provenance)!.AsObject();
        Assert.Equal("crm", provenanceEntry["sourceSystem"]!.GetValue<string>());
        Assert.Equal("evt-object-001", provenanceEntry["sourceRecordId"]!.GetValue<string>());
    }

    [Fact]
    public async Task DefaultStorageAdapter_ValidationRejectsUnsafeCredentialKeysInSourcePayload()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var user = await dbContext.UserProfiles.SingleAsync();
        var dataSource = await dbContext.DataSources.SingleAsync();
        var utcNow = new DateTime(2026, 6, 18, 12, 15, 0, DateTimeKind.Utc);
        var unsafeEvent = SourceSystemEvent.Create(
            tenant.Id,
            null,
            "evt-secret-001",
            "crm",
            "account.updated",
            user.ExternalUserId,
            "account-001",
            user.Id,
            dataSource.Id,
            """{"accountId":"account-001","apiKey":"unsafe-test-value"}""",
            "{}",
            "corr-secret-001",
            utcNow,
            utcNow);
        unsafeEvent.MarkProcessed(0, "Processed for unsafe payload validation test.", utcNow);
        dbContext.SourceSystemEvents.Add(unsafeEvent);
        await dbContext.SaveChangesAsync();
        var adapter = ResolveDefaultAdapter(scope);

        var batch = Assert.Single(await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.SourceEvents,
            DryRun: true)));

        Assert.False(batch.ValidationReport!.IsValid);
        Assert.Contains(batch.ValidationReport.Findings, finding => finding.Code == "unsafe.secret_or_credential_key");
        Assert.Empty(batch.Records);
    }

    [Fact]
    public async Task DefaultStorageAdapter_DryRunValidatesExportWithoutReturningRecords()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var adapter = ResolveDefaultAdapter(scope);

        var batches = await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.SourceEvents | StorageAdapterDataScope.UserSignals,
            DryRun: true));

        var batch = Assert.Single(batches);
        Assert.True(batch.IsFinal);
        Assert.Empty(batch.Records);
        Assert.NotNull(batch.ValidationReport);
        Assert.True(batch.ValidationReport!.IsValid);
        Assert.Equal(2, batch.ValidationReport.CheckedRecords);
        Assert.Contains(batch.ValidationReport.Findings, finding => finding.Code == "dry_run");
        Assert.False(batch.Diagnostics["usesCloudDataPlane"]!.GetValue<bool>());
    }

    [Fact]
    public async Task DefaultStorageAdapter_ValidationRejectsVectorExportScopeWithoutPrivateAdapter()
    {
        using var provider = BuildServiceProvider();
        using var scope = provider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var adapter = ResolveDefaultAdapter(scope);

        var batches = await ExportBatchesAsync(adapter, new StorageExportRequest(
            CreateContext(tenant.Id, tenant.Slug),
            StorageAdapterDataScope.Vectors,
            DryRun: true));

        var batch = Assert.Single(batches);
        Assert.Empty(batch.Records);
        Assert.NotEmpty(batch.Errors);
        Assert.NotNull(batch.ValidationReport);
        Assert.False(batch.ValidationReport!.IsValid);
        Assert.Contains(batch.ValidationReport.Findings, finding => finding.Code == "scope.unsupported_by_scout_export");
        Assert.False(batch.Diagnostics["usesCloudDataPlane"]!.GetValue<bool>());
    }

    [Fact]
    public async Task MigrationTool_DryRunWritesValidationReportWithoutExportBatches()
    {
        using var provider = BuildServiceProvider();
        using var seedScope = provider.CreateScope();
        var dbContext = seedScope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var outputPath = CreateTemporaryOutputPath();

        try
        {
            var runner = new MigrationExportRunner(provider);
            var result = await runner.RunAsync(new MigrationExportOptions(
                tenant.Slug,
                outputPath,
                StorageAdapterDataScope.SourceEvents | StorageAdapterDataScope.UserSignals,
                MaxRecords: 10,
                DryRun: true,
                Checkpoint: null,
                Provider: null,
                TenantId: tenant.Id,
                Purpose: "unit-test-dry-run",
                CorrelationId: "corr-unit-dry-run",
                SettingsPath: null));

            Assert.Equal(MigrationToolExitCode.Success, result.ExitCode);
            Assert.True(File.Exists(Path.Combine(outputPath, "manifest.json")));
            Assert.True(File.Exists(Path.Combine(outputPath, "validation-report.json")));
            Assert.False(Directory.Exists(Path.Combine(outputPath, "batches")));

            var report = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(outputPath, "validation-report.json")))!.AsObject();
            Assert.True(report["dryRun"]!.GetValue<bool>());
            Assert.True(report["isValid"]!.GetValue<bool>());
            Assert.Equal(0, report["exportedRecords"]!.GetValue<int>());
        }
        finally
        {
            DeleteTemporaryOutputPath(outputPath);
        }
    }

    [Fact]
    public async Task MigrationTool_ExportWritesPackageManifestValidationReportAndBatches()
    {
        using var provider = BuildServiceProvider();
        using var seedScope = provider.CreateScope();
        var dbContext = seedScope.ServiceProvider.GetRequiredService<ScoutDbContext>();
        var tenant = await SeedMigrationExportGraphAsync(dbContext);
        var outputPath = CreateTemporaryOutputPath();

        try
        {
            var runner = new MigrationExportRunner(provider);
            var result = await runner.RunAsync(new MigrationExportOptions(
                tenant.Slug,
                outputPath,
                MigrationExportOptions.DefaultScope,
                MaxRecords: 2,
                DryRun: false,
                Checkpoint: null,
                Provider: null,
                TenantId: tenant.Id,
                Purpose: "unit-test-export",
                CorrelationId: "corr-unit-export",
                SettingsPath: null));

            Assert.Equal(MigrationToolExitCode.Success, result.ExitCode);
            Assert.True(result.BatchCount > 1);
            Assert.True(result.ExportedRecords > 0);
            Assert.True(File.Exists(Path.Combine(outputPath, "manifest.json")));
            Assert.True(File.Exists(Path.Combine(outputPath, "validation-report.json")));
            var batchFiles = Directory.GetFiles(Path.Combine(outputPath, "batches"), "batch-*.json");
            Assert.Equal(result.BatchCount, batchFiles.Length);

            var manifest = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(outputPath, "manifest.json")))!.AsObject();
            Assert.False(manifest["dryRun"]!.GetValue<bool>());
            Assert.False(manifest["usesCloudDataPlane"]!.GetValue<bool>());
            Assert.Contains(
                manifest["excludedFilesAndFields"]!.AsArray(),
                item => item!.GetValue<string>() == "source_system_events.headers_json");
        }
        finally
        {
            DeleteTemporaryOutputPath(outputPath);
        }
    }

    private static ServiceProvider BuildServiceProvider(
        Action<StorageAdapterOptions>? configureStorage = null,
        Action<IServiceCollection>? configureServices = null)
    {
        var services = new ServiceCollection();
        var databaseName = $"storage-adapter-{Guid.NewGuid():N}";
        services.AddDbContext<ScoutDbContext>(options =>
            options.UseInMemoryDatabase(databaseName));
        services.AddScoped<IScoutDbContext>(provider => provider.GetRequiredService<ScoutDbContext>());
        services.Configure<StorageAdapterOptions>(options => configureStorage?.Invoke(options));
        services.AddEnterpriseExtensionDefaults();
        configureServices?.Invoke(services);
        return services.BuildServiceProvider();
    }

    private static ILocalDataPlaneStorageAdapter ResolveDefaultAdapter(IServiceScope scope)
        => scope.ServiceProvider
            .GetRequiredService<IEnumerable<ILocalDataPlaneStorageAdapter>>()
            .Single(adapter => adapter.AdapterKey == StorageAdapterProviderKeys.ScoutPostgres);

    private static StorageAdapterRequestContext CreateContext(Guid? tenantId = null, string tenantSlug = "pilot-alpha")
        => new(
            new TenantContext(tenantId ?? Guid.NewGuid(), tenantSlug),
            "wp2-storage-adapter-boundary-test",
            $"corr-{Guid.NewGuid():N}");

    private static async Task<List<StorageExportBatch>> ExportBatchesAsync(
        ILocalDataPlaneStorageAdapter adapter,
        StorageExportRequest request)
    {
        var batches = new List<StorageExportBatch>();
        await foreach (var batch in adapter.ExportAsync(request))
        {
            batches.Add(batch);
        }

        return batches;
    }

    private static async Task<Tenant> SeedMigrationExportGraphAsync(ScoutDbContext dbContext)
    {
        var utcNow = new DateTime(2026, 6, 18, 12, 0, 0, DateTimeKind.Utc);
        var tenant = Tenant.Create("pilot-alpha", "Pilot Alpha", utcNow);
        var user = UserProfile.Create(
            tenant.Id,
            "user-001",
            "Ada Lovelace",
            "ada@example.test",
            "Example Ltd",
            "Revenue Lead",
            "mid-market",
            utcNow.AddMinutes(-30),
            utcNow);
        var dataSource = DataSource.Create(
            tenant.Id,
            "crm",
            "CRM event source",
            DataSourceKind.Crm,
            """{"connector":"unit-test"}""",
            utcNow);
        var semanticAttribute = SemanticAttributeDefinition.Create(
            tenant.Id,
            "account_health",
            "Account health",
            "Account health classification",
            SemanticDataType.Text,
            "\"green\"",
            false,
            utcNow);
        var selector = SelectorDefinition.Create(
            tenant.Id,
            dataSource.Id,
            semanticAttribute.Id,
            "Account health selector",
            "Maps CRM account health",
            SelectorMappingKind.DirectFieldMapping,
            """{"field":"health"}""",
            "Health from CRM",
            "{}",
            0.9m,
            1_440,
            1,
            null,
            utcNow);
        selector.Publish(utcNow);

        var sourceEvent = SourceSystemEvent.Create(
            tenant.Id,
            null,
            "evt-001",
            "crm",
            "account.updated",
            "user-001",
            "account-001",
            user.Id,
            dataSource.Id,
            """{"accountId":"account-001","health":"green"}""",
            """{"x-request-id":"req-001"}""",
            "corr-001",
            utcNow.AddMinutes(-10),
            utcNow);
        sourceEvent.MarkProcessed(1, "Processed for selector recompute.", utcNow);

        var signal = UserSignal.Create(
            tenant.Id,
            user.Id,
            dataSource.Id,
            "crm.account.updated",
            """{"health":"green"}""",
            FactValueType.Json,
            utcNow.AddMinutes(-10),
            """[{"sourceSystem":"crm","sourceRecordId":"evt-001"}]""",
            utcNow);

        var selectorExecution = SelectorExecution.Create(
            tenant.Id,
            selector.Id,
            user.Id,
            "corr-001",
            "unit-test",
            SelectorExecutionMode.Live,
            utcNow);
        selectorExecution.MarkSucceeded(
            "\"green\"",
            FactValueType.String,
            0.91m,
            utcNow.AddMinutes(-10),
            "Health from CRM",
            """[{"sourceSystem":"crm","sourceRecordId":"evt-001"}]""",
            """{"health":"green"}""",
            "[]",
            """{"steps":["mapped"]}""",
            utcNow);

        var snapshot = ContextSnapshot.Create(
            tenant.Id,
            user.Id,
            1,
            "Account health is green.",
            0.91m,
            utcNow);

        var fact = ContextFact.Create(
            tenant.Id,
            snapshot.Id,
            semanticAttribute.Id,
            selector.Id,
            "account_health",
            "\"green\"",
            FactValueType.String,
            0.91m,
            utcNow.AddMinutes(-10),
            utcNow.AddDays(1),
            "Health from CRM",
            """[{"sourceSystem":"crm","sourceRecordId":"evt-001"}]""",
            utcNow);

        var provenance = ProvenanceMetadata.Create(
            tenant.Id,
            selectorExecution.Id,
            fact.Id,
            "selector_execution",
            "crm",
            "evt-001",
            """{"selector":"Account health selector"}""",
            utcNow.AddMinutes(-10),
            utcNow);

        var audit = AuditEvent.Create(
            tenant.Id,
            "system",
            "source-system.event.received",
            "source_system_event",
            sourceEvent.Id.ToString("D"),
            "corr-001",
            """{"eventId":"evt-001"}""",
            null,
            null,
            utcNow);

        dbContext.AddRange(tenant, user, dataSource, semanticAttribute, selector, sourceEvent, signal, selectorExecution, snapshot, fact, provenance, audit);
        await dbContext.SaveChangesAsync();

        return tenant;
    }

    private static string CreateTemporaryOutputPath()
        => Path.Combine(Path.GetTempPath(), $"scout-migration-tool-{Guid.NewGuid():N}");

    private static void DeleteTemporaryOutputPath(string outputPath)
    {
        if (Directory.Exists(outputPath))
        {
            Directory.Delete(outputPath, recursive: true);
        }
    }

    private sealed class TestEnterpriseRuntimeStorageAdapter : ILocalDataPlaneStorageAdapter
    {
        public string AdapterKey => StorageAdapterProviderKeys.EnterpriseRuntime;

        public ValueTask<StorageAdapterCapabilities> GetCapabilitiesAsync(
            StorageAdapterCapabilitiesRequest request,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            return ValueTask.FromResult(new StorageAdapterCapabilities(
                AdapterKey,
                StorageAdapterProviderKeys.EnterpriseRuntime,
                StorageAdapterProviderKeys.EnterpriseRuntime,
                StorageAdapterDataScope.Vectors,
                SupportsExport: false,
                SupportsImport: false,
                SupportsBackfill: false,
                SupportsVectorWrites: true,
                SupportsDenseEmbeddings: true,
                SupportsDualWrite: false,
                UsesCustomerOwnedDataPlane: true,
                UsesCloudDataPlane: false,
                RequiresEnterpriseRuntime: true,
                ExpectedEmbeddingDimensions: 384,
                RequiredConfigurationKeys: [],
                Notes: ["Unit-test adapter used to prove configured provider selection."]));
        }

        public ValueTask<StorageAdapterHealthResult> CheckHealthAsync(
            StorageAdapterHealthRequest request,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            return ValueTask.FromResult(new StorageAdapterHealthResult(
                AdapterKey,
                StorageAdapterReadiness.Unproven,
                "Unit-test adapter only.",
                DateTime.UtcNow,
                [],
                new JsonObject { ["usesCloudDataPlane"] = false }));
        }

        public async IAsyncEnumerable<StorageExportBatch> ExportAsync(
            StorageExportRequest request,
            [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await Task.CompletedTask;
            yield break;
        }

        public ValueTask<StorageImportResult> ImportAsync(
            StorageImportRequest request,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            return ValueTask.FromResult(new StorageImportResult(
                false,
                AdapterKey,
                request.Scope,
                ImportedRecords: 0,
                SkippedRecords: request.Records.Count,
                NextCheckpoint: request.Checkpoint,
                Errors: [],
                Diagnostics: new JsonObject { ["usesCloudDataPlane"] = false }));
        }

        public ValueTask<StorageVectorWriteResult> WriteVectorAsync(
            StorageVectorWriteRequest request,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            return ValueTask.FromResult(new StorageVectorWriteResult(
                StorageVectorWriteStatus.Written,
                AdapterKey,
                request.Record.Id,
                WrittenRecords: 1,
                Reason: null,
                Errors: [],
                Diagnostics: new JsonObject { ["usesCloudDataPlane"] = false }));
        }
    }
}
