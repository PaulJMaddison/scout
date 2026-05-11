using ContextLayer.Application.Contracts;

namespace ContextLayer.Application.Services;

public interface IOnboardingService
{
    Task<OnboardingResult> SubmitAsync(SubmitOnboardingInput input, CancellationToken cancellationToken);
}
