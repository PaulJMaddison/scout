using System.Text.Json;
using KynticAI.Scout.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace KynticAI.Scout.Infrastructure.AI;

public sealed class MockStructuredLlmClient(ILogger<MockStructuredLlmClient> logger) : IStructuredLlmClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public string ProviderName => "mock";

    public Task<StructuredLlmResponse> GenerateStructuredJsonAsync(StructuredLlmRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var contextPackage = JsonSerializer.Deserialize<MockContextPackage>(request.ContextPackageJson, JsonOptions)
            ?? throw new InvalidOperationException("Mock provider could not deserialize the context package.");

        logger.LogInformation(
            "Generating mock structured LLM response for objective '{Objective}' using {Model}.",
            contextPackage.SalesObjective,
            request.ModelName);

        var preferredChannel = GetFactValue(contextPackage.Facts, "preferredChannel", "email");
        var planInterest = GetFactValue(contextPackage.Facts, "planInterest", "enterprise");
        var conversionProbability = GetFactNumber(contextPackage.Facts, "conversionProbability", 0m);
        var engagementLevel = GetFactValue(contextPackage.Facts, "engagementLevel", "medium");
        var churnRisk = GetFactNumber(contextPackage.Facts, "churnRisk", 0m);

        var conversionCitation = FindCitation(contextPackage.Facts, "conversionProbability");
        var channelCitation = FindCitation(contextPackage.Facts, "preferredChannel");
        var planCitation = FindCitation(contextPackage.Facts, "planInterest");
        var engagementCitation = FindCitation(contextPackage.Facts, "engagementLevel");
        var churnCitation = FindCitation(contextPackage.Facts, "churnRisk");

        var humanReviewReason = contextPackage.HumanReviewRecommended
            ? string.Join(" ", contextPackage.WeakSignalMessages.DefaultIfEmpty("Available signals are not strong enough to automate without review."))
            : string.Empty;

        var output = new
        {
            salesObjective = contextPackage.SalesObjective,
            outreachStrategy = new
            {
                summary = $"{contextPackage.Subject.FullName} should receive a {preferredChannel}-first outreach sequence focused on {planInterest} readiness and current product momentum.",
                recommendedChannel = preferredChannel,
                timingRecommendation = engagementLevel == "high"
                    ? "Reach out within 24 hours while engagement is still elevated."
                    : "Reach out within the next three business days and verify interest before escalating.",
                keyTalkingPoints = new object[]
                {
                    new
                    {
                        text = $"Lead with the {conversionProbability:0}% conversion probability and the current {planInterest} plan interest to anchor the conversation in commercial intent.",
                        citations = conversionCitation is null || planCitation is null ? Array.Empty<string>() : new[] { conversionCitation, planCitation },
                        confidence = contextPackage.OverallConfidence
                    },
                    new
                    {
                        text = $"Use {preferredChannel} as the primary channel because that is the strongest recorded preference.",
                        citations = channelCitation is null ? Array.Empty<string>() : new[] { channelCitation },
                        confidence = contextPackage.OverallConfidence
                    },
                    new
                    {
                        text = $"Reference the current {engagementLevel} engagement level to position the outreach around active product usage rather than a cold pitch.",
                        citations = engagementCitation is null ? Array.Empty<string>() : new[] { engagementCitation },
                        confidence = contextPackage.OverallConfidence
                    }
                },
                risks = new object[]
                {
                    new
                    {
                        text = $"Monitor churn risk at {churnRisk:0}% so the conversation stays focused on customer value and not just expansion pressure.",
                        citations = churnCitation is null ? Array.Empty<string>() : new[] { churnCitation },
                        confidence = Math.Max(0.55m, contextPackage.OverallConfidence - 0.05m)
                    }
                },
                confidence = contextPackage.OverallConfidence,
                humanReviewRecommended = contextPackage.HumanReviewRecommended,
                humanReviewReason
            },
            personalizedEmailDraft = new
            {
                subjectLine = $"{contextPackage.Subject.CompanyName}: next step for {planInterest} rollout",
                previewText = $"Grounded outreach built from fresh context for {contextPackage.Subject.FullName}.",
                body =
                    $"Hi {contextPackage.Subject.FullName},\n\n" +
                    $"I’m reaching out because your recent context suggests strong momentum toward {planInterest} planning, and your team’s current engagement pattern looks like a good fit for a focused working session.\n\n" +
                    $"If helping {contextPackage.Subject.CompanyName} move toward {contextPackage.SalesObjective.ToLowerInvariant()} is still a priority, I’d suggest a short conversation to align on the next milestone and what success should look like operationally.\n\n" +
                    "Would a 20-minute working session next week be useful?\n\n" +
                    "Best,\nScout Sales",
                callToAction = "Propose a 20-minute working session next week.",
                supportingClaims = new object[]
                {
                    new
                    {
                        text = $"The profile currently shows {planInterest} interest and {engagementLevel} recent engagement.",
                        citations = new[] { planCitation, engagementCitation }.Where(x => !string.IsNullOrWhiteSpace(x)).ToArray(),
                        confidence = contextPackage.OverallConfidence
                    },
                    new
                    {
                        text = $"Email should be the first touch because it is the explicit preferred channel on record.",
                        citations = channelCitation is null ? Array.Empty<string>() : new[] { channelCitation },
                        confidence = contextPackage.OverallConfidence
                    }
                },
                confidence = contextPackage.OverallConfidence,
                humanReviewRecommended = contextPackage.HumanReviewRecommended,
                humanReviewReason
            },
            followUpRecommendations = new
            {
                recommendations = new object[]
                {
                    new
                    {
                        action = "Send the first email touch.",
                        timing = preferredChannel == "email" ? "Within 24 hours." : "Within the next business day.",
                        rationale = $"The preferred channel is {preferredChannel} and the latest engagement signal is {engagementLevel}.",
                        citations = new[] { channelCitation, engagementCitation }.Where(x => !string.IsNullOrWhiteSpace(x)).ToArray(),
                        confidence = contextPackage.OverallConfidence
                    },
                    new
                    {
                        action = "If there is no reply, follow up with a commercial proof point.",
                        timing = "Three business days after the first outreach.",
                        rationale = $"Use the {conversionProbability:0}% conversion signal and {planInterest} plan interest to keep the sequence grounded in value.",
                        citations = new[] { conversionCitation, planCitation }.Where(x => !string.IsNullOrWhiteSpace(x)).ToArray(),
                        confidence = Math.Max(0.55m, contextPackage.OverallConfidence - 0.03m)
                    },
                    new
                    {
                        action = "Ask an account owner to review before escalation if the context remains weak.",
                        timing = "Before any executive escalation.",
                        rationale = contextPackage.HumanReviewRecommended
                            ? humanReviewReason
                            : $"Churn risk is currently {churnRisk:0}% and should stay in view as outreach progresses.",
                        citations = churnCitation is null ? Array.Empty<string>() : new[] { churnCitation },
                        confidence = Math.Max(0.55m, contextPackage.OverallConfidence - 0.08m)
                    }
                },
                lowConfidenceSignals = contextPackage.WeakSignalMessages,
                missingInformation = contextPackage.MissingInformation,
                confidence = contextPackage.OverallConfidence,
                humanReviewRecommended = contextPackage.HumanReviewRecommended,
                humanReviewReason
            },
            missingInformation = contextPackage.MissingInformation,
            humanReviewRecommended = contextPackage.HumanReviewRecommended,
            humanReviewReason,
            overallConfidence = contextPackage.OverallConfidence
        };

        return Task.FromResult(new StructuredLlmResponse(
            ProviderName,
            JsonSerializer.Serialize(output, JsonOptions)));
    }

    private static string? FindCitation(IReadOnlyList<MockContextFact> facts, string attributeKey)
        => facts.FirstOrDefault(fact => string.Equals(fact.AttributeKey, attributeKey, StringComparison.OrdinalIgnoreCase))?.CitationId;

    private static decimal GetFactNumber(IReadOnlyList<MockContextFact> facts, string attributeKey, decimal fallback)
    {
        var value = facts.FirstOrDefault(fact => string.Equals(fact.AttributeKey, attributeKey, StringComparison.OrdinalIgnoreCase))?.Value;
        if (value is JsonElement element && element.ValueKind is JsonValueKind.Number && element.TryGetDecimal(out var numeric))
        {
            return numeric;
        }

        return value switch
        {
            decimal decimalValue => decimalValue,
            double doubleValue => Convert.ToDecimal(doubleValue),
            float floatValue => Convert.ToDecimal(floatValue),
            int intValue => intValue,
            long longValue => longValue,
            _ => fallback
        };
    }

    private static string GetFactValue(IReadOnlyList<MockContextFact> facts, string attributeKey, string fallback)
    {
        var value = facts.FirstOrDefault(fact => string.Equals(fact.AttributeKey, attributeKey, StringComparison.OrdinalIgnoreCase))?.Value;
        return value switch
        {
            JsonElement element when element.ValueKind == JsonValueKind.String => element.GetString() ?? fallback,
            JsonElement element when element.ValueKind == JsonValueKind.Number && element.TryGetDecimal(out var numeric) => numeric.ToString("0"),
            string stringValue => stringValue,
            null => fallback,
            _ => value.ToString() ?? fallback
        };
    }

    private sealed class MockContextPackage
    {
        public string SalesObjective { get; set; } = string.Empty;

        public MockSubject Subject { get; set; } = new();

        public decimal OverallConfidence { get; set; }

        public bool HumanReviewRecommended { get; set; }

        public List<string> MissingInformation { get; set; } = new();

        public List<string> WeakSignalMessages { get; set; } = new();

        public List<MockContextFact> Facts { get; set; } = new();
    }

    private sealed class MockSubject
    {
        public string FullName { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;
    }

    private sealed class MockContextFact
    {
        public string CitationId { get; set; } = string.Empty;

        public string AttributeKey { get; set; } = string.Empty;

        public object? Value { get; set; }
    }
}
