using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Application.Validation;

namespace KynticAI.Scout.UnitTests;

public sealed class UclDataItemAttributionContractTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly string[] RequiredDataItemTypes =
    [
        "customer",
        "email_address",
        "browser_cookie",
        "web_event",
        "email_enquiry",
        "product_browse_search",
        "account_registration",
        "sales_opportunity",
        "support_event",
        "purchase_subscription_billing_aggregate"
    ];

    [Fact]
    public void SourceAndLocalExport_FixturesStoreExactLocalDataItems()
    {
        var sourceItems = LoadArray<DataItem>(
            "samples/ucl-data-item-attribution/v1/synthetic-source-data-items.json",
            "dataItems");
        var localExportItems = LoadArray<DataItem>(
            "samples/ucl-data-item-attribution/v1/local-exact-item-export.json",
            "dataItems");

        var sourceValidation = UclDataItemAttributionV1Validator.ValidateDataItems(sourceItems);
        var exportValidation = UclDataItemAttributionV1Validator.ValidateDataItems(localExportItems);

        Assert.True(sourceValidation.IsValid, string.Join(Environment.NewLine, sourceValidation.Errors));
        Assert.True(exportValidation.IsValid, string.Join(Environment.NewLine, exportValidation.Errors));
        Assert.Equal(RequiredDataItemTypes.Order(StringComparer.Ordinal), sourceItems.Select(x => x.DataItemType).Order(StringComparer.Ordinal));

        var sourceById = sourceItems.ToDictionary(x => x.DataItemId, StringComparer.Ordinal);
        Assert.Equal(sourceById.Count, localExportItems.Count);
        foreach (var exported in localExportItems)
        {
            var source = sourceById[exported.DataItemId];
            Assert.Equal(source.DataItemType, exported.DataItemType);
            Assert.True(
                JsonNode.DeepEquals(JsonNode.Parse(source.ExactPayload.GetRawText()), JsonNode.Parse(exported.ExactPayload.GetRawText())),
                $"Exact payload changed for {exported.DataItemId}.");
        }

        var enquiry = sourceById["item-email-enquiry-001"];
        Assert.Equal("testname@test.com", enquiry.ExactPayload.GetProperty("fromEmail").GetString());
    }

    [Fact]
    public void Identities_LinkSameEmailCookieAndAccountAcrossItems()
    {
        var dataItems = LoadArray<DataItem>(
            "samples/ucl-data-item-attribution/v1/synthetic-source-data-items.json",
            "dataItems");
        var relationshipSets = LoadArray<RelationshipSet>(
            "samples/ucl-data-item-attribution/v1/relationship-sets.json",
            "relationshipSets");

        var validation = UclDataItemAttributionV1Validator.ValidateRelationshipSets(relationshipSets, dataItems);
        Assert.True(validation.IsValid, string.Join(Environment.NewLine, validation.Errors));

        var emailLinkedItems = ItemsLinkedByIdentity(dataItems, "email", "testname@test.com");
        Assert.Contains("item-customer-testname", emailLinkedItems);
        Assert.Contains("item-email-address-testname", emailLinkedItems);
        Assert.Contains("item-email-enquiry-001", emailLinkedItems);

        var cookieLinkedItems = ItemsLinkedByIdentity(dataItems, "cookie", "cookie-page-a-testname");
        Assert.Contains("item-browser-cookie-testname", cookieLinkedItems);
        Assert.Contains("item-web-event-page-a-search-001", cookieLinkedItems);
        Assert.Contains("item-product-b-interest-001", cookieLinkedItems);

        var convertedAccountLinkedItems = ItemsLinkedByIdentity(dataItems, "account", "acct-historical-converted");
        Assert.Contains("item-account-registration-converted", convertedAccountLinkedItems);
        Assert.Contains("item-billing-aggregate-converted", convertedAccountLinkedItems);

        var allEdges = relationshipSets.SelectMany(x => x.Edges).ToList();
        Assert.Contains(allEdges, x => x.RelationshipType == "SameEmail" && x.IdentityValue == "testname@test.com");
        Assert.Contains(allEdges, x => x.RelationshipType == "SameCookie" && x.IdentityValue == "cookie-page-a-testname");
        Assert.Contains(allEdges, x => x.RelationshipType == "SameAccount" && x.IdentityValue == "acct-historical-converted");
    }

    [Fact]
    public void AttributionPaths_PreserveEventOrderAndExposePossibleActions()
    {
        var attributionPaths = LoadArray<AttributionPath>(
            "samples/ucl-data-item-attribution/v1/attribution-paths.json",
            "attributionPaths");

        foreach (var path in attributionPaths)
        {
            Assert.Equal(path.Events.OrderBy(x => x.Sequence).Select(x => x.EventId), path.Events.Select(x => x.EventId));
            Assert.Equal(path.Events.OrderBy(x => x.OccurredAtUtc).Select(x => x.EventId), path.Events.Select(x => x.EventId));
        }

        var current = Assert.Single(attributionPaths, x => x.PathId == "path-current-testname-product-b");
        Assert.Equal(
            ["email_enquiry", "page_a_search", "product_b_interest"],
            current.Events.Select(x => x.EventType).ToArray());
        Assert.Equal(
            ["follow-up email", "registration invite", "sales outreach"],
            current.PossibleNextActions);
    }

    [Fact]
    public void RelationshipSets_AreGeneratedWithFallbackOnlyScopeAndHistoricalOutcomes()
    {
        var dataItems = LoadArray<DataItem>(
            "samples/ucl-data-item-attribution/v1/synthetic-source-data-items.json",
            "dataItems");
        var relationshipSets = LoadArray<RelationshipSet>(
            "samples/ucl-data-item-attribution/v1/relationship-sets.json",
            "relationshipSets");

        var validation = UclDataItemAttributionV1Validator.ValidateRelationshipSets(relationshipSets, dataItems);
        Assert.True(validation.IsValid, string.Join(Environment.NewLine, validation.Errors));
        Assert.Equal(3, relationshipSets.Count);
        Assert.All(relationshipSets, relationshipSet => Assert.Equal("basic-public-fallback-only", relationshipSet.AnalysisScope));
        Assert.All(relationshipSets, relationshipSet => Assert.NotEmpty(relationshipSet.AttributionPaths));

        var outcomes = relationshipSets.SelectMany(x => x.HistoricalOutcomes).ToList();
        Assert.Contains(outcomes, x => x.OutcomeType == "converted" && x.Converted);
        Assert.Contains(outcomes, x => x.OutcomeType == "not_converted" && !x.Converted);
        Assert.Equal(2, outcomes.Count);
    }

    [Fact]
    public void EnterpriseRelationshipAnalysisInput_IsValidAndContainsOnlyPublicFallbackLabels()
    {
        var input = LoadObject<EnterpriseRelationshipAnalysisInput>(
            "samples/ucl-data-item-attribution/v1/enterprise-relationship-analysis-input.json");

        var validation = UclDataItemAttributionV1Validator.ValidateEnterpriseInput(input);
        Assert.True(validation.IsValid, string.Join(Environment.NewLine, validation.Errors));
        Assert.Equal("customer-owned-data-plane", input.DataPlane);
        Assert.Equal("basic-public-fallback-only", input.PublicFallbackAnalysisScope);
        Assert.False(input.CloudControlPlaneRequired);
        Assert.False(input.EnterpriseOnlyInternalsIncluded);
        Assert.Equal(10, input.DataItems.Count);
        Assert.Equal(3, input.RelationshipSets.Count);
        Assert.Contains("rankedRelationshipSets", input.RequiredEnterpriseOutputs);
        Assert.Contains("attributionPathComparisons", input.RequiredEnterpriseOutputs);
        Assert.Contains("bestNextActionOptions", input.RequiredEnterpriseOutputs);
    }

    [Fact]
    public void CloudAggregateControlPlanePayload_ContainsOnlySafeAggregateMetadata()
    {
        var payloadJson = ReadText("samples/ucl-data-item-attribution/v1/cloud-aggregate-control-plane-payload.json");
        var validation = UclDataItemAttributionV1Validator.ValidateCloudPayloadJson(payloadJson);
        var payload = JsonSerializer.Deserialize<CloudAggregateControlPlanePayload>(payloadJson, JsonOptions);

        Assert.True(validation.IsValid, string.Join(Environment.NewLine, validation.Errors));
        Assert.NotNull(payload);
        Assert.Equal(10, payload.Counters.DataItemCount);
        Assert.Equal(3, payload.Counters.RelationshipSetCount);
        Assert.Equal(3, payload.Counters.AttributionPathCount);
        Assert.Equal(2, payload.Counters.HistoricalOutcomeCount);
        Assert.Equal(3, payload.Counters.PossibleActionCount);
        Assert.True(payload.DataBoundary.RawDataRetainedInCustomerDataPlane);
        Assert.False(payload.DataBoundary.ContainsRawCustomerData);
        Assert.False(payload.DataBoundary.ContainsDataItems);
        Assert.False(payload.DataBoundary.ContainsExactPayloads);
        Assert.False(payload.DataBoundary.ContainsIdentities);
        Assert.False(payload.DataBoundary.ContainsRelationshipEdges);
        Assert.False(payload.DataBoundary.ContainsAttributionPaths);
        Assert.False(payload.DataBoundary.ContainsOutcomeEvents);
        Assert.False(payload.DataBoundary.ContainsEnterpriseAnalysisInput);
        Assert.DoesNotContain("testname@test.com", payloadJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cookie-page-a-testname", payloadJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"dataItems\"", payloadJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"exactPayload\"", payloadJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"relationshipSets\"", payloadJson, StringComparison.OrdinalIgnoreCase);

        var unsafePayload = """
            {
              "payloadKind": "ucl.cloud-aggregate-control-plane-payload",
              "payloadVersion": "ucl.cloud-aggregate-control-plane-payload.v1",
              "tenantSlug": "demo",
              "feature": "relationship-item-attribution",
              "eventName": "ucl.relationship-items.generated",
              "status": "succeeded",
              "generatedAtUtc": "2026-06-14T09:15:00Z",
              "counters": {
                "dataItemCount": 1,
                "relationshipSetCount": 0,
                "attributionPathCount": 0,
                "historicalOutcomeCount": 0,
                "possibleActionCount": 0
              },
              "dataBoundary": {
                "rawDataRetainedInCustomerDataPlane": true,
                "containsRawCustomerData": false,
                "containsDataItems": false,
                "containsExactPayloads": false,
                "containsIdentities": false,
                "containsRelationshipEdges": false,
                "containsAttributionPaths": false,
                "containsOutcomeEvents": false,
                "containsEnterpriseAnalysisInput": false
              },
              "dataItems": [{ "dataItemId": "item-email-enquiry-001", "email": "testname@test.com" }]
            }
            """;
        var unsafeValidation = UclDataItemAttributionV1Validator.ValidateCloudPayloadJson(unsafePayload);
        Assert.False(unsafeValidation.IsValid);
    }

    [Fact]
    public void SchemaFiles_DefineRequestedDtoNames()
    {
        var dataItemSchema = JsonNode.Parse(ReadText("schema/ucl-data-item-v1.schema.json"))!.AsObject();
        var relationshipSetSchema = JsonNode.Parse(ReadText("schema/ucl-relationship-set-v1.schema.json"))!.AsObject();
        var enterpriseSchema = JsonNode.Parse(ReadText("schema/ucl-enterprise-relationship-analysis-input-v1.schema.json"))!.AsObject();
        var cloudSchema = JsonNode.Parse(ReadText("schema/ucl-cloud-aggregate-control-plane-payload-v1.schema.json"))!.AsObject();

        Assert.Equal("DataItem", dataItemSchema["title"]!.GetValue<string>());
        Assert.Equal("DataItemIdentity", dataItemSchema["$defs"]!["dataItemIdentity"]!["title"]!.GetValue<string>());
        Assert.Equal("RelationshipSet", relationshipSetSchema["title"]!.GetValue<string>());
        Assert.Equal("RelationshipEdge", relationshipSetSchema["$defs"]!["relationshipEdge"]!["title"]!.GetValue<string>());
        Assert.Equal("AttributionEvent", relationshipSetSchema["$defs"]!["attributionEvent"]!["title"]!.GetValue<string>());
        Assert.Equal("AttributionPath", relationshipSetSchema["$defs"]!["attributionPath"]!["title"]!.GetValue<string>());
        Assert.Equal("OutcomeEvent", relationshipSetSchema["$defs"]!["outcomeEvent"]!["title"]!.GetValue<string>());
        Assert.Equal("EnterpriseRelationshipAnalysisInput", enterpriseSchema["title"]!.GetValue<string>());
        Assert.Equal("CloudAggregateControlPlanePayload", cloudSchema["title"]!.GetValue<string>());
    }

    private static HashSet<string> ItemsLinkedByIdentity(
        IReadOnlyList<DataItem> dataItems,
        string identityType,
        string normalizedValue)
        => dataItems
            .Where(item => item.Identities.Any(identity =>
                string.Equals(identity.IdentityType, identityType, StringComparison.Ordinal)
                && string.Equals(identity.NormalizedValue, normalizedValue, StringComparison.Ordinal)))
            .Select(item => item.DataItemId)
            .ToHashSet(StringComparer.Ordinal);

    private static IReadOnlyList<T> LoadArray<T>(string relativePath, string propertyName)
    {
        var root = JsonNode.Parse(ReadText(relativePath))!.AsObject();
        return JsonSerializer.Deserialize<List<T>>(root[propertyName]!.ToJsonString(), JsonOptions)
            ?? throw new InvalidOperationException($"Could not deserialize {propertyName} from {relativePath}.");
    }

    private static T LoadObject<T>(string relativePath)
        => JsonSerializer.Deserialize<T>(ReadText(relativePath), JsonOptions)
            ?? throw new InvalidOperationException($"Could not deserialize {relativePath}.");

    private static string ReadText(string relativePath)
        => File.ReadAllText(Path.Combine(FindRepositoryRoot(), relativePath));

    private static string FindRepositoryRoot()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "KynticAI.Scout.slnx")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not find repository root.");
    }
}
