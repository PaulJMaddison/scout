using KynticAI.Scout.Application.Abstractions;

namespace KynticAI.Scout.Infrastructure.Services;

public sealed class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
