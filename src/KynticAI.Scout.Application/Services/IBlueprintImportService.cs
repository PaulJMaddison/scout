using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Application.Services;

public interface IBlueprintImportService
{
    Task<BlueprintImportResult> UploadAsync(UploadBlueprintInput input, CancellationToken cancellationToken);

    Task<BlueprintImportResult> ValidateAsync(BlueprintImportInput input, CancellationToken cancellationToken);

    Task<BlueprintImportResult> PreviewAsync(BlueprintImportInput input, CancellationToken cancellationToken);

    Task<BlueprintImportResult> ImportAsync(BlueprintImportInput input, CancellationToken cancellationToken);
}
