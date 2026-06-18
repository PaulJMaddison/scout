using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Application.Validation;

public static class UclDataItemAttributionV1Validator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly HashSet<string> CloudRootAllowList = new(StringComparer.Ordinal)
    {
        "payloadKind",
        "payloadVersion",
        "tenantSlug",
        "feature",
        "eventName",
        "status",
        "generatedAtUtc",
        "counters",
        "dataBoundary"
    };

    private static readonly HashSet<string> CloudCounterAllowList = new(StringComparer.Ordinal)
    {
        "dataItemCount",
        "relationshipSetCount",
        "attributionPathCount",
        "historicalOutcomeCount",
        "possibleActionCount"
    };

    private static readonly HashSet<string> CloudBoundaryAllowList = new(StringComparer.Ordinal)
    {
        "rawDataRetainedInCustomerDataPlane",
        "containsRawCustomerData",
        "containsDataItems",
        "containsExactPayloads",
        "containsIdentities",
        "containsRelationshipEdges",
        "containsAttributionPaths",
        "containsOutcomeEvents",
        "containsEnterpriseAnalysisInput"
    };

    private static readonly HashSet<string> CloudForbiddenPropertyNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "dataItems",
        "dataItem",
        "exactPayload",
        "identities",
        "identityValue",
        "normalizedValue",
        "sourceRecordId",
        "relationshipEdges",
        "edges",
        "attributionPaths",
        "events",
        "outcomes",
        "relationshipSets",
        "enterpriseRelationshipAnalysisInput",
        "email",
        "emailAddress",
        "cookie",
        "browserCookie",
        "account",
        "customer",
        "product",
        "supportEvent",
        "salesOpportunity",
        "sourcePayload"
    };

    public static UclContractValidationResult ValidateDataItems(IReadOnlyList<DataItem> dataItems)
    {
        var errors = new List<string>();
        if (dataItems.Count == 0)
        {
            errors.Add("dataItems must contain at least one DataItem.");
        }

        var itemIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var item in dataItems)
        {
            if (item.ItemKind != UclDataItemAttributionContractVersions.DataItemKind)
            {
                errors.Add($"{item.DataItemId}.itemKind must be ucl.data-item.");
            }

            if (item.ItemVersion != UclDataItemAttributionContractVersions.DataItemV1)
            {
                errors.Add($"{item.DataItemId}.itemVersion must be ucl.data-item.v1.");
            }

            if (item.DataPlane != UclDataItemAttributionContractVersions.CustomerOwnedDataPlane)
            {
                errors.Add($"{item.DataItemId}.dataPlane must be customer-owned-data-plane.");
            }

            RequireNonEmpty(item.DataItemId, $"{nameof(item.DataItemId)}", errors);
            RequireNonEmpty(item.DataItemType, $"{item.DataItemId}.dataItemType", errors);
            RequireNonEmpty(item.SourceMode, $"{item.DataItemId}.sourceMode", errors);
            RequireNonEmpty(item.SourceSystem, $"{item.DataItemId}.sourceSystem", errors);
            RequireNonEmpty(item.SourceRecordId, $"{item.DataItemId}.sourceRecordId", errors);

            if (!itemIds.Add(item.DataItemId))
            {
                errors.Add($"dataItemId {item.DataItemId} is duplicated.");
            }

            if (item.ExactPayload.ValueKind != JsonValueKind.Object)
            {
                errors.Add($"{item.DataItemId}.exactPayload must be an object.");
            }

            if (item.Identities.Count == 0)
            {
                errors.Add($"{item.DataItemId}.identities must contain at least one DataItemIdentity.");
            }

            foreach (var identity in item.Identities)
            {
                RequireNonEmpty(identity.IdentityType, $"{item.DataItemId}.identities.identityType", errors);
                RequireNonEmpty(identity.IdentityValue, $"{item.DataItemId}.identities.identityValue", errors);
                RequireNonEmpty(identity.NormalizedValue, $"{item.DataItemId}.identities.normalizedValue", errors);
                RequireNonEmpty(identity.LinkScope, $"{item.DataItemId}.identities.linkScope", errors);
            }
        }

        return Result(errors);
    }

    public static UclContractValidationResult ValidateRelationshipSets(
        IReadOnlyList<RelationshipSet> relationshipSets,
        IReadOnlyList<DataItem> dataItems)
    {
        var errors = new List<string>();
        var dataItemIds = dataItems.Select(x => x.DataItemId).ToHashSet(StringComparer.Ordinal);
        if (relationshipSets.Count == 0)
        {
            errors.Add("relationshipSets must contain at least one RelationshipSet.");
        }

        foreach (var relationshipSet in relationshipSets)
        {
            if (relationshipSet.SetKind != UclDataItemAttributionContractVersions.RelationshipSetKind)
            {
                errors.Add($"{relationshipSet.RelationshipSetId}.setKind must be ucl.relationship-set.");
            }

            if (relationshipSet.SetVersion != UclDataItemAttributionContractVersions.RelationshipSetV1)
            {
                errors.Add($"{relationshipSet.RelationshipSetId}.setVersion must be ucl.relationship-set.v1.");
            }

            if (relationshipSet.AnalysisScope != UclDataItemAttributionContractVersions.BasicFallbackOnlyScope)
            {
                errors.Add($"{relationshipSet.RelationshipSetId}.analysisScope must be basic-public-fallback-only.");
            }

            RequireKnownItem(dataItemIds, relationshipSet.SubjectDataItemId, $"{relationshipSet.RelationshipSetId}.subjectDataItemId", errors);

            foreach (var edge in relationshipSet.Edges)
            {
                RequireNonEmpty(edge.EdgeId, $"{relationshipSet.RelationshipSetId}.edges.edgeId", errors);
                RequireNonEmpty(edge.RelationshipType, $"{edge.EdgeId}.relationshipType", errors);
                RequireNonEmpty(edge.LinkKind, $"{edge.EdgeId}.linkKind", errors);
                RequireKnownItem(dataItemIds, edge.SourceDataItemId, $"{edge.EdgeId}.sourceDataItemId", errors);
                RequireKnownItem(dataItemIds, edge.TargetDataItemId, $"{edge.EdgeId}.targetDataItemId", errors);
                RequireNonEmpty(edge.IdentityType, $"{edge.EdgeId}.identityType", errors);
                RequireNonEmpty(edge.IdentityValue, $"{edge.EdgeId}.identityValue", errors);
                RequireRange(edge.Confidence, 0m, 1m, $"{edge.EdgeId}.confidence", errors);
                foreach (var citationId in edge.CitationDataItemIds)
                {
                    RequireKnownItem(dataItemIds, citationId, $"{edge.EdgeId}.citationDataItemIds", errors);
                }
            }

            foreach (var path in relationshipSet.AttributionPaths)
            {
                ValidatePath(path, dataItemIds, errors);
            }

            foreach (var outcome in relationshipSet.HistoricalOutcomes)
            {
                ValidateOutcome(outcome, dataItemIds, errors);
            }
        }

        return Result(errors);
    }

    public static UclContractValidationResult ValidateEnterpriseInput(EnterpriseRelationshipAnalysisInput input)
    {
        var errors = new List<string>();
        if (input.InputKind != UclDataItemAttributionContractVersions.EnterpriseRelationshipAnalysisInputKind)
        {
            errors.Add("inputKind must be ucl.enterprise-relationship-analysis-input.");
        }

        if (input.InputVersion != UclDataItemAttributionContractVersions.EnterpriseRelationshipAnalysisInputV1)
        {
            errors.Add("inputVersion must be ucl.enterprise-relationship-analysis-input.v1.");
        }

        if (input.DataPlane != UclDataItemAttributionContractVersions.CustomerOwnedDataPlane)
        {
            errors.Add("dataPlane must be customer-owned-data-plane.");
        }

        if (input.PublicFallbackAnalysisScope != UclDataItemAttributionContractVersions.BasicFallbackOnlyScope)
        {
            errors.Add("publicFallbackAnalysisScope must be basic-public-fallback-only.");
        }

        if (input.CloudControlPlaneRequired)
        {
            errors.Add("cloudControlPlaneRequired must be false.");
        }

        if (input.EnterpriseOnlyInternalsIncluded)
        {
            errors.Add("enterpriseOnlyInternalsIncluded must be false.");
        }

        var dataItemsValidation = ValidateDataItems(input.DataItems);
        errors.AddRange(dataItemsValidation.Errors);
        var relationshipSetsValidation = ValidateRelationshipSets(input.RelationshipSets, input.DataItems);
        errors.AddRange(relationshipSetsValidation.Errors);

        var requiredOutputs = input.RequiredEnterpriseOutputs.ToHashSet(StringComparer.Ordinal);
        foreach (var output in new[] { "rankedRelationshipSets", "attributionPathComparisons", "bestNextActionOptions" })
        {
            if (!requiredOutputs.Contains(output))
            {
                errors.Add($"requiredEnterpriseOutputs must include {output}.");
            }
        }

        return Result(errors);
    }

    public static UclContractValidationResult ValidateCloudPayload(CloudAggregateControlPlanePayload payload)
        => ValidateCloudPayloadJson(JsonSerializer.Serialize(payload, JsonOptions));

    public static UclContractValidationResult ValidateCloudPayloadJson(string payloadJson)
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
            if (!CloudRootAllowList.Contains(property.Key))
            {
                errors.Add($"root property '{property.Key}' is not allowed in CloudAggregateControlPlanePayload.");
            }
        }

        RequireString(root, "payloadKind", UclDataItemAttributionContractVersions.CloudAggregateControlPlanePayloadKind, errors);
        RequireString(root, "payloadVersion", UclDataItemAttributionContractVersions.CloudAggregateControlPlanePayloadV1, errors);
        RequireNonEmptyString(root, "tenantSlug", errors);
        RequireNonEmptyString(root, "feature", errors);
        RequireNonEmptyString(root, "eventName", errors);
        RequireNonEmptyString(root, "status", errors);
        RequireDateTime(root, "generatedAtUtc", errors);
        ValidateIntegerObject(root["counters"], "counters", CloudCounterAllowList, errors);
        ValidateCloudBoundary(root["dataBoundary"], errors);
        RejectForbiddenCloudPropertyNames(root, "$", errors);

        return Result(errors);
    }

    private static void ValidatePath(AttributionPath path, HashSet<string> dataItemIds, List<string> errors)
    {
        RequireNonEmpty(path.PathId, "attributionPath.pathId", errors);
        RequireNonEmpty(path.SubjectIdentityType, $"{path.PathId}.subjectIdentityType", errors);
        RequireNonEmpty(path.SubjectIdentityValue, $"{path.PathId}.subjectIdentityValue", errors);
        RequireNonEmpty(path.Objective, $"{path.PathId}.objective", errors);
        if (path.Events.Count == 0)
        {
            errors.Add($"{path.PathId}.events must contain at least one AttributionEvent.");
        }

        var lastSequence = 0;
        DateTime? lastObservedAt = null;
        foreach (var item in path.Events)
        {
            RequireNonEmpty(item.EventId, $"{path.PathId}.events.eventId", errors);
            RequireKnownItem(dataItemIds, item.DataItemId, $"{item.EventId}.dataItemId", errors);
            RequireNonEmpty(item.EventType, $"{item.EventId}.eventType", errors);
            RequireNonEmpty(item.Label, $"{item.EventId}.label", errors);
            if (item.Sequence <= lastSequence)
            {
                errors.Add($"{path.PathId}.events must have strictly increasing sequence values.");
            }

            if (lastObservedAt is not null && item.OccurredAtUtc < lastObservedAt.Value)
            {
                errors.Add($"{path.PathId}.events must preserve observed event order.");
            }

            lastSequence = item.Sequence;
            lastObservedAt = item.OccurredAtUtc;
        }

        if (path.Outcome is not null)
        {
            ValidateOutcome(path.Outcome, dataItemIds, errors);
        }
    }

    private static void ValidateOutcome(OutcomeEvent outcome, HashSet<string> dataItemIds, List<string> errors)
    {
        RequireNonEmpty(outcome.OutcomeEventId, "outcomeEvent.outcomeEventId", errors);
        RequireKnownItem(dataItemIds, outcome.DataItemId, $"{outcome.OutcomeEventId}.dataItemId", errors);
        RequireNonEmpty(outcome.OutcomeType, $"{outcome.OutcomeEventId}.outcomeType", errors);
        foreach (var citationId in outcome.CitationDataItemIds)
        {
            RequireKnownItem(dataItemIds, citationId, $"{outcome.OutcomeEventId}.citationDataItemIds", errors);
        }
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

    private static void ValidateCloudBoundary(JsonNode? node, List<string> errors)
    {
        if (node is not JsonObject obj)
        {
            errors.Add("dataBoundary must be an object.");
            return;
        }

        foreach (var property in obj)
        {
            if (!CloudBoundaryAllowList.Contains(property.Key))
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
                errors.Add($"dataBoundary.{property.Key} must be false for Cloud aggregate control-plane payloads.");
            }
        }

        foreach (var required in CloudBoundaryAllowList)
        {
            if (!obj.ContainsKey(required))
            {
                errors.Add($"dataBoundary.{required} is required.");
            }
        }
    }

    private static void RejectForbiddenCloudPropertyNames(JsonNode? node, string path, List<string> errors)
    {
        if (node is JsonObject obj)
        {
            foreach (var property in obj)
            {
                var propertyPath = $"{path}.{property.Key}";
                if (!IsAllowedCloudBoundaryFlag(path, property.Key) && CloudForbiddenPropertyNames.Contains(property.Key))
                {
                    errors.Add($"{propertyPath} is forbidden in Cloud aggregate control-plane payloads.");
                }

                RejectForbiddenCloudPropertyNames(property.Value, propertyPath, errors);
            }
        }
        else if (node is JsonArray array)
        {
            for (var index = 0; index < array.Count; index++)
            {
                RejectForbiddenCloudPropertyNames(array[index], $"{path}[{index}]", errors);
            }
        }
    }

    private static bool IsAllowedCloudBoundaryFlag(string path, string propertyName)
        => path == "$.dataBoundary" && CloudBoundaryAllowList.Contains(propertyName);

    private static void RequireKnownItem(HashSet<string> dataItemIds, string dataItemId, string path, List<string> errors)
    {
        RequireNonEmpty(dataItemId, path, errors);
        if (!dataItemIds.Contains(dataItemId))
        {
            errors.Add($"{path} references unknown data item {dataItemId}.");
        }
    }

    private static void RequireNonEmpty(string value, string path, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add($"{path} must be a non-empty string.");
        }
    }

    private static void RequireRange(decimal value, decimal minimum, decimal maximum, string path, List<string> errors)
    {
        if (value < minimum || value > maximum)
        {
            errors.Add($"{path} must be between {minimum} and {maximum}.");
        }
    }

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

    private static UclContractValidationResult Result(List<string> errors)
        => errors.Count == 0
            ? UclContractValidationResult.Valid
            : UclContractValidationResult.Invalid(errors);
}
