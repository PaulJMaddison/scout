using ContextLayer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ContextLayer.Infrastructure.Persistence;

internal sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
    }
}

internal sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("user_profiles");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExternalUserId).HasMaxLength(200).IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(320).IsRequired();
        builder.Property(x => x.CompanyName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.JobTitle).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Segment).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.ExternalUserId }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.UserProfiles)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class OperatorAccountConfiguration : IEntityTypeConfiguration<OperatorAccount>
{
    public void Configure(EntityTypeBuilder<OperatorAccount> builder)
    {
        builder.ToTable("operator_accounts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Email).HasMaxLength(320).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.PasswordHash).HasMaxLength(1000).IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.OperatorAccounts)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class DataSourceConfiguration : IEntityTypeConfiguration<DataSource>
{
    public void Configure(EntityTypeBuilder<DataSource> builder)
    {
        builder.ToTable("data_sources");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.ConnectionConfigJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.DataSources)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SemanticAttributeDefinitionConfiguration : IEntityTypeConfiguration<SemanticAttributeDefinition>
{
    public void Configure(EntityTypeBuilder<SemanticAttributeDefinition> builder)
    {
        builder.ToTable("semantic_attribute_definitions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.ExampleValueJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Key }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.SemanticAttributes)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SelectorDefinitionConfiguration : IEntityTypeConfiguration<SelectorDefinition>
{
    public void Configure(EntityTypeBuilder<SelectorDefinition> builder)
    {
        builder.ToTable("selector_definitions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.ExpressionJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ExplanationTemplate).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.ValidationSchemaJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.DefaultConfidence).HasPrecision(5, 4);
        builder.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.SelectorDefinitions)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.DataSource)
            .WithMany(x => x.SelectorDefinitions)
            .HasForeignKey(x => x.DataSourceId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.TargetAttributeDefinition)
            .WithMany(x => x.SelectorDefinitions)
            .HasForeignKey(x => x.TargetAttributeDefinitionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SelectorExecutionConfiguration : IEntityTypeConfiguration<SelectorExecution>
{
    public void Configure(EntityTypeBuilder<SelectorExecution> builder)
    {
        builder.ToTable("selector_executions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CorrelationId).HasMaxLength(64).IsRequired();
        builder.Property(x => x.TriggeredBy).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ErrorMessage).HasMaxLength(4_000);
        builder.Property(x => x.ResultValueJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ResultExplanation).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.ResultProvenanceJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.RawSourceDataJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ValidationErrorsJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.PipelineTraceJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ResultConfidence).HasPrecision(5, 4);
        builder.HasIndex(x => new { x.TenantId, x.CorrelationId });
        builder.HasOne(x => x.SelectorDefinition)
            .WithMany(x => x.Executions)
            .HasForeignKey(x => x.SelectorDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.UserProfile)
            .WithMany()
            .HasForeignKey(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ContextSnapshotConfiguration : IEntityTypeConfiguration<ContextSnapshot>
{
    public void Configure(EntityTypeBuilder<ContextSnapshot> builder)
    {
        builder.ToTable("context_snapshots");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Summary).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.OverallConfidence).HasPrecision(5, 4);
        builder.HasIndex(x => new { x.TenantId, x.UserProfileId, x.GeneratedAtUtc });
        builder.HasOne(x => x.UserProfile)
            .WithMany(x => x.ContextSnapshots)
            .HasForeignKey(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ContextFactConfiguration : IEntityTypeConfiguration<ContextFact>
{
    public void Configure(EntityTypeBuilder<ContextFact> builder)
    {
        builder.ToTable("context_facts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AttributeKey).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ValueJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.Confidence).HasPrecision(5, 4);
        builder.Property(x => x.Explanation).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.ProvenanceJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.ContextSnapshotId, x.AttributeKey }).IsUnique();
        builder.HasOne(x => x.ContextSnapshot)
            .WithMany(x => x.Facts)
            .HasForeignKey(x => x.ContextSnapshotId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.SemanticAttributeDefinition)
            .WithMany()
            .HasForeignKey(x => x.SemanticAttributeDefinitionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.SourceSelectorDefinition)
            .WithMany()
            .HasForeignKey(x => x.SourceSelectorDefinitionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class PromptTemplateConfiguration : IEntityTypeConfiguration<PromptTemplate>
{
    public void Configure(EntityTypeBuilder<PromptTemplate> builder)
    {
        builder.ToTable("prompt_templates");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.SystemPrompt).HasMaxLength(8_000).IsRequired();
        builder.Property(x => x.DeveloperPrompt).HasMaxLength(8_000).IsRequired();
        builder.Property(x => x.UserPromptTemplate).HasMaxLength(8_000).IsRequired();
        builder.Property(x => x.OutputSchemaJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.GuardrailsJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.PromptTemplates)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class AgentRunConfiguration : IEntityTypeConfiguration<AgentRun>
{
    public void Configure(EntityTypeBuilder<AgentRun> builder)
    {
        builder.ToTable("agent_runs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ProviderName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ModelName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.SalesObjective).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.InputJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.OutputJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ProvenanceJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.Confidence).HasPrecision(5, 4);
        builder.Property(x => x.FailureReason).HasMaxLength(4_000);
        builder.HasOne(x => x.UserProfile)
            .WithMany()
            .HasForeignKey(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.PromptTemplate)
            .WithMany(x => x.AgentRuns)
            .HasForeignKey(x => x.PromptTemplateId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ContextSnapshot)
            .WithMany(x => x.AgentRuns)
            .HasForeignKey(x => x.ContextSnapshotId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class AuditEventConfiguration : IEntityTypeConfiguration<AuditEvent>
{
    public void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        builder.ToTable("audit_events");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Actor).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Action).HasMaxLength(200).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(200).IsRequired();
        builder.Property(x => x.EntityId).HasMaxLength(200).IsRequired();
        builder.Property(x => x.CorrelationId).HasMaxLength(64).IsRequired();
        builder.Property(x => x.MetadataJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.BeforeJson).HasColumnType("jsonb");
        builder.Property(x => x.AfterJson).HasColumnType("jsonb");
        builder.HasIndex(x => new { x.TenantId, x.CreatedAtUtc });
    }
}

internal sealed class RecomputeJobConfiguration : IEntityTypeConfiguration<RecomputeJob>
{
    public void Configure(EntityTypeBuilder<RecomputeJob> builder)
    {
        builder.ToTable("recompute_jobs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CorrelationId).HasMaxLength(64).IsRequired();
        builder.Property(x => x.TriggeredBy).HasMaxLength(320).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.MetadataJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.FailureReason).HasMaxLength(4_000);
        builder.HasIndex(x => new { x.TenantId, x.CorrelationId }).IsUnique();
        builder.HasOne(x => x.UserProfile)
            .WithMany()
            .HasForeignKey(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ProvenanceMetadataConfiguration : IEntityTypeConfiguration<ProvenanceMetadata>
{
    public void Configure(EntityTypeBuilder<ProvenanceMetadata> builder)
    {
        builder.ToTable("provenance_metadata");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Kind).HasMaxLength(120).IsRequired();
        builder.Property(x => x.SourceSystem).HasMaxLength(200).IsRequired();
        builder.Property(x => x.SourceRecordKey).HasMaxLength(400).IsRequired();
        builder.Property(x => x.MetadataJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Kind, x.ObservedAtUtc });
        builder.HasOne(x => x.SelectorExecution)
            .WithMany()
            .HasForeignKey(x => x.SelectorExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.ContextFact)
            .WithMany()
            .HasForeignKey(x => x.ContextFactId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ConnectorCredentialConfiguration : IEntityTypeConfiguration<ConnectorCredential>
{
    public void Configure(EntityTypeBuilder<ConnectorCredential> builder)
    {
        builder.ToTable("connector_credentials");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ConnectorType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.SecretKey).HasMaxLength(200).IsRequired();
        builder.Property(x => x.SecretReference).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ProtectedValue).HasMaxLength(8_000).IsRequired();
        builder.HasIndex(x => x.SecretReference).IsUnique();
        builder.HasIndex(x => new { x.TenantId, x.DataSourceId, x.SecretKey }).IsUnique();
        builder.HasOne(x => x.DataSource)
            .WithMany()
            .HasForeignKey(x => x.DataSourceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SourceSystemEventConfiguration : IEntityTypeConfiguration<SourceSystemEvent>
{
    public void Configure(EntityTypeBuilder<SourceSystemEvent> builder)
    {
        builder.ToTable("source_system_events");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EventId).HasMaxLength(160).IsRequired();
        builder.Property(x => x.SourceSystem).HasMaxLength(120).IsRequired();
        builder.Property(x => x.EventType).HasMaxLength(160).IsRequired();
        builder.Property(x => x.ExternalUserId).HasMaxLength(200);
        builder.Property(x => x.ExternalAccountId).HasMaxLength(200);
        builder.Property(x => x.PayloadJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.HeadersJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ProcessingSummary).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.ErrorMessage).HasMaxLength(4_000);
        builder.Property(x => x.DeadLetterReason).HasMaxLength(4_000);
        builder.Property(x => x.CorrelationId).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.SourceSystem, x.EventId }).IsUnique();
        builder.HasIndex(x => new { x.TenantId, x.ReceivedAtUtc });
        builder.HasIndex(x => new { x.TenantId, x.Status, x.ReceivedAtUtc });
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.UserProfile)
            .WithMany()
            .HasForeignKey(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.DataSource)
            .WithMany()
            .HasForeignKey(x => x.DataSourceId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.Workspace)
            .WithMany()
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class UserSignalConfiguration : IEntityTypeConfiguration<UserSignal>
{
    public void Configure(EntityTypeBuilder<UserSignal> builder)
    {
        builder.ToTable("user_signals");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ValueJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ProvenanceJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.UserProfileId, x.Key, x.ObservedAtUtc });
        builder.HasOne(x => x.UserProfile)
            .WithMany(x => x.Signals)
            .HasForeignKey(x => x.UserProfileId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.DataSource)
            .WithMany()
            .HasForeignKey(x => x.DataSourceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
