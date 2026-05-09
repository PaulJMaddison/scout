namespace ContextLayer.Application.Abstractions;

public interface IClock
{
    DateTime UtcNow { get; }
}
