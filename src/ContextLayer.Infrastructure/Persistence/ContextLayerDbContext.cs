using ContextLayer.Application.Abstractions;
using ContextLayer.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContextLayer.Infrastructure.Persistence;

public sealed class ContextLayerDbContext(DbContextOptions<ContextLayerDbContext> options)
    : DbContext(options), IContextLayerDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    public DbSet<OperatorAccount> OperatorAccounts => Set<OperatorAccount>();

    public DbSet<DataSource> DataSources => Set<DataSource>();

    public DbSet<SemanticAttributeDefinition> SemanticAttributeDefinitions => Set<SemanticAttributeDefinition>();

    public DbSet<SelectorDefinition> SelectorDefinitions => Set<SelectorDefinition>();

    public DbSet<SelectorExecution> SelectorExecutions => Set<SelectorExecution>();

    public DbSet<ContextSnapshot> ContextSnapshots => Set<ContextSnapshot>();

    public DbSet<ContextFact> ContextFacts => Set<ContextFact>();

    public DbSet<PromptTemplate> PromptTemplates => Set<PromptTemplate>();

    public DbSet<AgentRun> AgentRuns => Set<AgentRun>();

    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    public DbSet<RecomputeJob> RecomputeJobs => Set<RecomputeJob>();

    public DbSet<ProvenanceMetadata> ProvenanceMetadata => Set<ProvenanceMetadata>();

    public DbSet<UserSignal> UserSignals => Set<UserSignal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(ContextLayerDbContext).Assembly,
            type => type.Namespace == typeof(ContextLayerDbContext).Namespace);
    }
}
