using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Application.Validation;

public sealed record UclContractValidationResult(bool IsValid, IReadOnlyList<string> Errors)
{
    public static UclContractValidationResult Valid { get; } = new(true, []);

    public static UclContractValidationResult Invalid(IReadOnlyList<string> errors) => new(false, errors);
}

public static class UclEvidencePackV1Validator
{
    public static UclContractValidationResult Validate(UclEvidencePackV1 package)
    {
        var errors = new List<string>();
        if (package.PackageKind != UclEvidencePackContractVersions.EvidencePackKind)
        {
            errors.Add("packageKind must be ucl.evidence-pack.");
        }

        if (package.PackageVersion != UclEvidencePackContractVersions.EvidencePackV1)
        {
            errors.Add("packageVersion must be ucl.evidence-pack.v1.");
        }

        if (package.DataPlane != UclEvidencePackContractVersions.CustomerOwnedDataPlane)
        {
            errors.Add("dataPlane must be customer-owned-data-plane.");
        }

        if (!package.Governance.RawDataRetainedInCustomerDataPlane)
        {
            errors.Add("governance.rawDataRetainedInCustomerDataPlane must be true.");
        }

        var provenanceIds = package.Provenance
            .Select(x => x.CitationId)
            .Where(static x => !string.IsNullOrWhiteSpace(x))
            .ToHashSet(StringComparer.Ordinal);

        if (provenanceIds.Count != package.Provenance.Count)
        {
            errors.Add("provenance citation IDs must be present and unique.");
        }

        foreach (var record in package.ExactLinkedRecords.Records)
        {
            if (!provenanceIds.Contains(record.CitationId))
            {
                errors.Add($"exactLinkedRecords record {record.RecordType}/{record.RecordId} uses citation {record.CitationId} without matching provenance.");
                continue;
            }

            if (!package.Provenance.Any(x =>
                    x.CitationId == record.CitationId
                    && x.SourceEntityType == record.RecordType
                    && x.SourceEntityId == record.RecordId))
            {
                errors.Add($"exactLinkedRecords record {record.RecordType}/{record.RecordId} citation {record.CitationId} does not match provenance source.");
            }
        }

        foreach (var citationId in CollectReferencedCitationIds(package).Where(static x => !string.IsNullOrWhiteSpace(x)))
        {
            if (!provenanceIds.Contains(citationId))
            {
                errors.Add($"citation {citationId} is referenced by derived intelligence but is missing from provenance.");
            }
        }

        return errors.Count == 0
            ? UclContractValidationResult.Valid
            : UclContractValidationResult.Invalid(errors);
    }

    private static IEnumerable<string> CollectReferencedCitationIds(UclEvidencePackV1 package)
    {
        foreach (var record in package.ExactLinkedRecords.Records)
        {
            yield return record.CitationId;
        }

        foreach (var relationship in package.Relationships)
        {
            foreach (var citationId in relationship.CitationIds)
            {
                yield return citationId;
            }
        }

        foreach (var pattern in package.SimilarWonLostPatterns)
        {
            foreach (var citationId in pattern.CitationIds)
            {
                yield return citationId;
            }
        }

        foreach (var signal in package.WeightedSignals)
        {
            foreach (var citationId in signal.CitationIds)
            {
                yield return citationId;
            }
        }

        foreach (var citationId in package.RecommendedAction.CitationIds)
        {
            yield return citationId;
        }

        if (package.DraftResponse is not null)
        {
            foreach (var citationId in package.DraftResponse.CitationIds)
            {
                yield return citationId;
            }
        }
    }
}

public static class UclCloudAggregateUsageV1Validator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly HashSet<string> RootAllowList = new(StringComparer.Ordinal)
    {
        "payloadKind",
        "payloadVersion",
        "packageVersion",
        "tenantSlug",
        "feature",
        "eventName",
        "status",
        "generatedAtUtc",
        "featureUsageCounters",
        "controlPlaneCounters",
        "dataBoundary"
    };

    private static readonly HashSet<string> FeatureCounterAllowList = new(StringComparer.Ordinal)
    {
        "nextActionGenerateRequests",
        "dataPlanePackageBuilds"
    };

    private static readonly HashSet<string> ControlPlaneCounterAllowList = new(StringComparer.Ordinal)
    {
        "appliedRuleCount",
        "maskedFieldCount",
        "deniedFieldCount"
    };

    private static readonly HashSet<string> DataBoundaryAllowList = new(StringComparer.Ordinal)
    {
        "rawDataRetainedInCustomerDataPlane",
        "containsRawCustomerData",
        "containsRecords",
        "containsFacts",
        "containsContextFacts",
        "containsSnapshots",
        "containsContextSnapshots",
        "containsEvidencePacks",
        "containsPrompts",
        "containsGeneratedContent",
        "containsRecommendations",
        "containsCitations",
        "containsCitationIds",
        "containsRelationshipTypes",
        "containsWeightedSignals",
        "containsCaveats",
        "containsPerEntityRelationshipMetadata",
        "containsDerivedRelationshipIntelligence",
        "containsPerCustomerDerivedIntelligence"
    };

    private static readonly HashSet<string> ForbiddenPropertyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "records",
        "rawRecords",
        "sourceRecords",
        "facts",
        "contextFacts",
        "snapshots",
        "contextSnapshots",
        "evidencePack",
        "evidencePacks",
        "localEvidencePack",
        "localDerivedEvidencePackageJson",
        "prompt",
        "prompts",
        "generatedContent",
        "recommendation",
        "recommendations",
        "recommendedAction",
        "recommendedNextAction",
        "citation",
        "citations",
        "citationId",
        "citationIds",
        "relationship",
        "relationships",
        "relationshipType",
        "relationshipTypes",
        "weightedSignal",
        "weightedSignals",
        "caveat",
        "caveats",
        "confidence",
        "subject",
        "subjectIdentifier",
        "hashedSubjectIdentifier",
        "subjectHash",
        "objective",
        "purpose",
        "purposeCategory",
        "purposeHash",
        "actorRole",
        "sourcePayload",
        "sourceEntityId",
        "recordId",
        "externalAccountId",
        "accountName",
        "accountDomain",
        "email",
        "relationshipMetadata",
        "perEntityRelationshipMetadata",
        "derivedRelationshipIntelligence",
        "perCustomerDerivedIntelligence"
    };

    public static UclContractValidationResult Validate(UclCloudAggregateUsageV1 payload)
        => ValidateJson(JsonSerializer.Serialize(payload, JsonOptions));

    public static UclContractValidationResult ValidateJson(string payloadJson)
    {
        var errors = new List<string>();
        JsonObject? root;
        try
        {
            root = JsonNode.Parse(payloadJson) as JsonObject;
        }
        catch (JsonException ex)
        {
            return UclContractValidationResult.Invalid([$"payload is not valid JSON: {ex.Message}"]);
        }

        if (root is null)
        {
            return UclContractValidationResult.Invalid(["payload root must be a JSON object."]);
        }

        foreach (var property in root)
        {
            if (!RootAllowList.Contains(property.Key))
            {
                errors.Add($"root property '{property.Key}' is not allowed in UclCloudAggregateUsageV1.");
            }
        }

        RequireString(root, "payloadKind", UclEvidencePackContractVersions.CloudAggregateUsageKind, errors);
        RequireString(root, "payloadVersion", UclEvidencePackContractVersions.CloudAggregateUsageV1, errors);
        RequireString(root, "packageVersion", UclEvidencePackContractVersions.EvidencePackV1, errors);
        RequireNonEmptyString(root, "tenantSlug", errors);
        RequireNonEmptyString(root, "feature", errors);
        RequireNonEmptyString(root, "eventName", errors);
        RequireNonEmptyString(root, "status", errors);
        RequireDateTime(root, "generatedAtUtc", errors);

        ValidateIntegerObject(root["featureUsageCounters"], "featureUsageCounters", FeatureCounterAllowList, errors);
        ValidateIntegerObject(root["controlPlaneCounters"], "controlPlaneCounters", ControlPlaneCounterAllowList, errors);
        ValidateDataBoundary(root["dataBoundary"], errors);
        RejectForbiddenPropertyNames(root, "$", errors);

        return errors.Count == 0
            ? UclContractValidationResult.Valid
            : UclContractValidationResult.Invalid(errors);
    }

    private static void ValidateIntegerObject(
        JsonNode? node,
        string path,
        HashSet<string> allowList,
        List<string> errors)
    {
        if (node is not JsonObject obj)
        {
            errors.Add($"{path} must be an object.");
            return;
        }

        foreach (var property in obj)
        {
            if (!allowList.Contains(property.Key))
            {
                errors.Add($"{path}.{property.Key} is not allowed.");
                continue;
            }

            if (!TryGetInt32(property.Value, out var value) || value < 0)
            {
                errors.Add($"{path}.{property.Key} must be a non-negative integer.");
            }
        }

        foreach (var required in allowList)
        {
            if (!obj.ContainsKey(required))
            {
                errors.Add($"{path}.{required} is required.");
            }
        }
    }

    private static void ValidateDataBoundary(JsonNode? node, List<string> errors)
    {
        if (node is not JsonObject obj)
        {
            errors.Add("dataBoundary must be an object.");
            return;
        }

        foreach (var property in obj)
        {
            if (!DataBoundaryAllowList.Contains(property.Key))
            {
                errors.Add($"dataBoundary.{property.Key} is not allowed.");
                continue;
            }

            if (!TryGetBoolean(property.Value, out var value))
            {
                errors.Add($"dataBoundary.{property.Key} must be boolean.");
                continue;
            }

            if (property.Key == "rawDataRetainedInCustomerDataPlane")
            {
                if (!value)
                {
                    errors.Add("dataBoundary.rawDataRetainedInCustomerDataPlane must be true.");
                }
            }
            else if (value)
            {
                errors.Add($"dataBoundary.{property.Key} must be false for Cloud aggregate usage payloads.");
            }
        }

        foreach (var required in DataBoundaryAllowList)
        {
            if (!obj.ContainsKey(required))
            {
                errors.Add($"dataBoundary.{required} is required.");
            }
        }
    }

    private static void RejectForbiddenPropertyNames(JsonNode? node, string path, List<string> errors)
    {
        if (node is JsonObject obj)
        {
            foreach (var property in obj)
            {
                var propertyPath = $"{path}.{property.Key}";
                if (!IsAllowedDataBoundaryFlag(path, property.Key) && ForbiddenPropertyNames.Contains(property.Key))
                {
                    errors.Add($"{propertyPath} is forbidden in Cloud aggregate usage payloads.");
                }

                RejectForbiddenPropertyNames(property.Value, propertyPath, errors);
            }
        }
        else if (node is JsonArray array)
        {
            for (var index = 0; index < array.Count; index++)
            {
                RejectForbiddenPropertyNames(array[index], $"{path}[{index}]", errors);
            }
        }
    }

    private static bool IsAllowedDataBoundaryFlag(string path, string propertyName)
        => path == "$.dataBoundary" && DataBoundaryAllowList.Contains(propertyName);

    private static void RequireString(JsonObject root, string propertyName, string expectedValue, List<string> errors)
    {
        if (!TryGetString(root[propertyName], out var value) || value != expectedValue)
        {
            errors.Add($"{propertyName} must be '{expectedValue}'.");
        }
    }

    private static void RequireNonEmptyString(JsonObject root, string propertyName, List<string> errors)
    {
        if (!TryGetString(root[propertyName], out var value) || string.IsNullOrWhiteSpace(value))
        {
            errors.Add($"{propertyName} must be a non-empty string.");
        }
    }

    private static void RequireDateTime(JsonObject root, string propertyName, List<string> errors)
    {
        if (!TryGetString(root[propertyName], out var value) || !DateTime.TryParse(value, out _))
        {
            errors.Add($"{propertyName} must be an ISO 8601 timestamp.");
        }
    }

    private static bool TryGetString(JsonNode? node, out string value)
    {
        if (node is JsonValue jsonValue && jsonValue.TryGetValue(out string? candidate) && candidate is not null)
        {
            value = candidate;
            return true;
        }

        value = string.Empty;
        return false;
    }

    private static bool TryGetInt32(JsonNode? node, out int value)
    {
        if (node is JsonValue jsonValue && jsonValue.TryGetValue(out int candidate))
        {
            value = candidate;
            return true;
        }

        value = 0;
        return false;
    }

    private static bool TryGetBoolean(JsonNode? node, out bool value)
    {
        if (node is JsonValue jsonValue && jsonValue.TryGetValue(out bool candidate))
        {
            value = candidate;
            return true;
        }

        value = false;
        return false;
    }
}
