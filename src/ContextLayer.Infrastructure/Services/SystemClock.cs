using ContextLayer.Application.Abstractions;

namespace ContextLayer.Infrastructure.Services;

public sealed class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
