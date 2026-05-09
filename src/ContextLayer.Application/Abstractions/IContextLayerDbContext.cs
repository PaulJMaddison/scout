using ContextLayer.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ContextLayer.Application.Abstractions;

public interface IContextLayerDbContext
{
    DbSet<Tenant> Tenants { get; }

    DbSet<UserProfile> UserProfiles { get; }

    DbSet<DataSource> DataSources { get; }

    DbSet<SemanticAttributeDefinition> SemanticAttributeDefinitions { get; }

    DbSet<SelectorDefinition> SelectorDefinitions { get; }

    DbSet<SelectorExecution> SelectorExecutions { get; }

    DbSet<ContextSnapshot> ContextSnapshots { get; }

    DbSet<ContextFact> ContextFacts { get; }

    DbSet<PromptTemplate> PromptTemplates { get; }

    DbSet<AgentRun> AgentRuns { get; }

    DbSet<AuditEvent> AuditEvents { get; }

    DbSet<RecomputeJob> RecomputeJobs { get; }

    DbSet<ProvenanceMetadata> ProvenanceMetadata { get; }

    DbSet<UserSignal> UserSignals { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
