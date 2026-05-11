using ContextLayer.Application.Contracts;

namespace ContextLayer.Application.Services;

public interface ILicenceService
{
    Task<LicenceStatusResult> GetStatusAsync(CancellationToken cancellationToken);
}

public interface ILicenceKeyGenerator
{
    string GenerateFingerprint(string licenceKey);
}

public interface ILicenceValidator
{
    LicenceValidationResult Validate(LocalLicenceDocument document, DateTime utcNow);
}

public sealed record LicenceValidationResult(
    bool IsValid,
    bool IsExpired,
    IReadOnlyList<string> Warnings);
