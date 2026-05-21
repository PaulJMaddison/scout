using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Application.Services;

public interface IOnboardingService
{
    Task<OnboardingResult> SubmitAsync(SubmitOnboardingInput input, CancellationToken cancellationToken);
}
