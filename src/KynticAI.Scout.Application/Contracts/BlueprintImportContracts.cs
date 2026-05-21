namespace KynticAI.Scout.Application.Contracts;

public sealed record UploadBlueprintInput(
    string TenantSlug,
    string? WorkspaceSlug,
    string? Name,
    string BlueprintJson);

public sealed record BlueprintImportInput(
    string TenantSlug,
    Guid? ImportId,
    string? BlueprintJson);

public sealed record BlueprintValidationIssueResult(
    string Path,
    string Message,
    string Severity,
    long? Line,
    long? BytePositionInLine);

public sealed record BlueprintChangeResult(
    string EntityType,
    string Name,
    string Action,
    string Path);

public sealed record BlueprintImportSummaryResult(
    int DataSources,
    int SemanticAttributes,
    int Selectors,
    int PromptTemplates,
    int PiiRules,
    int AuditPolicies);

public sealed record BlueprintImportResult(
    Guid? ImportId,
    string Status,
    bool IsValid,
    string BlueprintName,
    string BlueprintSchemaJson,
    IReadOnlyList<BlueprintValidationIssueResult> Issues,
    IReadOnlyList<BlueprintChangeResult> Preview,
    IReadOnlyList<string> CreatedDataSources,
    IReadOnlyList<string> CreatedSemanticAttributes,
    IReadOnlyList<string> CreatedSelectors,
    IReadOnlyList<string> CreatedPromptTemplates,
    IReadOnlyList<string> CreatedPiiRules,
    IReadOnlyList<string> CreatedAuditPolicies,
    BlueprintImportSummaryResult Summary);
