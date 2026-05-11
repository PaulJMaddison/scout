using ContextLayer.Domain.Saas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ContextLayer.Infrastructure.Persistence;

internal sealed class WorkspaceConfiguration : IEntityTypeConfiguration<Workspace>
{
    public void Configure(EntityTypeBuilder<Workspace> builder)
    {
        builder.ToTable("saas_workspaces");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Slug }).IsUnique();
        builder.HasIndex(x => new { x.TenantId, x.IsDefault });
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Workspaces)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class WorkspaceMemberConfiguration : IEntityTypeConfiguration<WorkspaceMember>
{
    public void Configure(EntityTypeBuilder<WorkspaceMember> builder)
    {
        builder.ToTable("saas_workspace_members");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.TenantId, x.WorkspaceId, x.OperatorAccountId }).IsUnique();
        builder.HasOne(x => x.Workspace)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.OperatorAccount)
            .WithMany(x => x.WorkspaceMemberships)
            .HasForeignKey(x => x.OperatorAccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class TenantSubscriptionConfiguration : IEntityTypeConfiguration<TenantSubscription>
{
    public void Configure(EntityTypeBuilder<TenantSubscription> builder)
    {
        builder.ToTable("saas_tenant_subscriptions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.BillingCustomerReference).HasMaxLength(200).IsRequired();
        builder.Property(x => x.EntitlementsJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Status });
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Subscriptions)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class BillingPlanConfiguration : IEntityTypeConfiguration<BillingPlan>
{
    public void Configure(EntityTypeBuilder<BillingPlan> builder)
    {
        builder.ToTable("saas_billing_plans");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DisplayName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.BillingProviderPlanReference).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Plan).IsUnique();
        builder.HasIndex(x => new { x.IsPublic, x.SortOrder });
    }
}

internal sealed class BillingPlanLimitConfiguration : IEntityTypeConfiguration<BillingPlanLimit>
{
    public void Configure(EntityTypeBuilder<BillingPlanLimit> builder)
    {
        builder.ToTable("saas_billing_plan_limits");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Window).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Enforcement).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(1_000).IsRequired();
        builder.HasIndex(x => new { x.BillingPlanId, x.Metric }).IsUnique();
        builder.HasOne(x => x.BillingPlan)
            .WithMany(x => x.Limits)
            .HasForeignKey(x => x.BillingPlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ApiClientConfiguration : IEntityTypeConfiguration<ApiClient>
{
    public void Configure(EntityTypeBuilder<ApiClient> builder)
    {
        builder.ToTable("saas_api_clients");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ClientId).HasMaxLength(120).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.SecretHash).HasMaxLength(1_000).IsRequired();
        builder.Property(x => x.ScopesJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => x.ClientId).IsUnique();
        builder.HasIndex(x => new { x.TenantId, x.Status });
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.ApiClients)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Workspace)
            .WithMany()
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class ConnectorInstallationConfiguration : IEntityTypeConfiguration<ConnectorInstallation>
{
    public void Configure(EntityTypeBuilder<ConnectorInstallation> builder)
    {
        builder.ToTable("saas_connector_installations");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ConnectorType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.CapabilitiesJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.HealthJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.WorkspaceId, x.DataSourceId }).IsUnique();
        builder.HasOne(x => x.Workspace)
            .WithMany()
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.DataSource)
            .WithMany(x => x.ConnectorInstallations)
            .HasForeignKey(x => x.DataSourceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ConnectorCatalogueEntryConfiguration : IEntityTypeConfiguration<ConnectorCatalogueEntry>
{
    public void Configure(EntityTypeBuilder<ConnectorCatalogueEntry> builder)
    {
        builder.ToTable("saas_connector_catalogue_entries");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ConnectorType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(120).IsRequired();
        builder.Property(x => x.SupportedDataSourceKindsJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.CapabilitiesJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ConfigurationSchemaJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.CredentialSchemaJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.HealthCheckMode).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.ConnectorType).IsUnique();
        builder.HasIndex(x => new { x.Availability, x.SortOrder });
    }
}

internal sealed class ContextPackageConfiguration : IEntityTypeConfiguration<ContextPackage>
{
    public void Configure(EntityTypeBuilder<ContextPackage> builder)
    {
        builder.ToTable("saas_context_packages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PackageKey).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Audience).HasMaxLength(120).IsRequired();
        builder.Property(x => x.ManifestJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.DeliveryChannelsJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.PackageKey }).IsUnique();
        builder.HasIndex(x => new { x.WorkspaceId, x.GeneratedAtUtc });
        builder.HasOne(x => x.Workspace)
            .WithMany()
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.ContextSnapshot)
            .WithMany(x => x.ContextPackages)
            .HasForeignKey(x => x.ContextSnapshotId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class BillingUsageRecordConfiguration : IEntityTypeConfiguration<BillingUsageRecord>
{
    public void Configure(EntityTypeBuilder<BillingUsageRecord> builder)
    {
        builder.ToTable("saas_billing_usage_records");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Source).HasMaxLength(120).IsRequired();
        builder.Property(x => x.DimensionsJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Metric, x.WindowStartUtc });
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.BillingUsageRecords)
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Workspace)
            .WithMany()
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class OnboardingStateConfiguration : IEntityTypeConfiguration<OnboardingState>
{
    public void Configure(EntityTypeBuilder<OnboardingState> builder)
    {
        builder.ToTable("saas_onboarding_states");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.StepKey).HasMaxLength(120).IsRequired();
        builder.Property(x => x.StateJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.WorkspaceId, x.StepKey }).IsUnique();
        builder.HasOne(x => x.Workspace)
            .WithMany()
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class OnboardingApplicationConfiguration : IEntityTypeConfiguration<OnboardingApplication>
{
    public void Configure(EntityTypeBuilder<OnboardingApplication> builder)
    {
        builder.ToTable("saas_onboarding_applications");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OrganisationName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.TenantSlug).HasMaxLength(100).IsRequired();
        builder.Property(x => x.PrimaryWorkspaceName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.AdminEmail).HasMaxLength(320).IsRequired();
        builder.Property(x => x.AdminDisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.IntendedUseCase).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.SourceSystemsJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.DataCategoriesJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.AiUseCasesJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.PiiSensitivityLevel).HasMaxLength(80).IsRequired();
        builder.Property(x => x.PreferredDeploymentMode).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(80).IsRequired();
        builder.Property(x => x.NextStepsJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => x.TenantSlug);
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.Workspace)
            .WithMany()
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(x => x.AdminOperatorAccount)
            .WithMany()
            .HasForeignKey(x => x.AdminOperatorAccountId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class BlueprintImportConfiguration : IEntityTypeConfiguration<BlueprintImport>
{
    public void Configure(EntityTypeBuilder<BlueprintImport> builder)
    {
        builder.ToTable("saas_blueprint_imports");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.BlueprintJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ContentHash).HasMaxLength(128).IsRequired();
        builder.Property(x => x.UploadedBy).HasMaxLength(320).IsRequired();
        builder.Property(x => x.ValidationIssuesJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.PreviewJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.ImportSummaryJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.CreatedAtUtc });
        builder.HasIndex(x => new { x.TenantId, x.ContentHash });
        builder.HasOne(x => x.Workspace)
            .WithMany()
            .HasForeignKey(x => x.WorkspaceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class PiiRuleConfiguration : IEntityTypeConfiguration<PiiRule>
{
    public void Configure(EntityTypeBuilder<PiiRule> builder)
    {
        builder.ToTable("saas_pii_rules");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(160).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.RuleJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Key }).IsUnique();
        builder.HasOne(x => x.BlueprintImport)
            .WithMany()
            .HasForeignKey(x => x.BlueprintImportId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class AuditPolicyConfiguration : IEntityTypeConfiguration<AuditPolicy>
{
    public void Configure(EntityTypeBuilder<AuditPolicy> builder)
    {
        builder.ToTable("saas_audit_policies");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Key).HasMaxLength(160).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2_000).IsRequired();
        builder.Property(x => x.PolicyJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.TenantId, x.Key }).IsUnique();
        builder.HasOne(x => x.BlueprintImport)
            .WithMany()
            .HasForeignKey(x => x.BlueprintImportId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
