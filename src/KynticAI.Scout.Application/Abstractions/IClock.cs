namespace KynticAI.Scout.Application.Abstractions;

public interface IClock
{
    DateTime UtcNow { get; }
}
