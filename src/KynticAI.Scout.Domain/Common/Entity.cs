namespace KynticAI.Scout.Domain.Common;

public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
}

public abstract class TenantEntity : Entity
{
    public Guid TenantId { get; protected set; }
}

public abstract class CustomerOpsTenantEntity : AuditedEntity
{
    public Guid CustomerOpsTenantId { get; protected set; }
}

public abstract class AuditedEntity : Entity
{
    public DateTime CreatedAtUtc { get; protected set; }

    public DateTime UpdatedAtUtc { get; protected set; }

    protected void SetAuditTimestamps(DateTime utcNow)
    {
        if (CreatedAtUtc == default)
        {
            CreatedAtUtc = utcNow;
        }

        UpdatedAtUtc = utcNow;
    }
}

public abstract class AuditedTenantEntity : AuditedEntity
{
    public Guid TenantId { get; protected set; }
}
