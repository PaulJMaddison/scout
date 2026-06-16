using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Application.Services;

public interface INextActionIntelligenceService
{
    Task<NextActionResult?> GenerateNextActionAsync(NextActionInput input, CancellationToken cancellationToken);
}
