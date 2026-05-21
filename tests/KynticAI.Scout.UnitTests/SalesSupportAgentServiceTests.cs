using System.Text.Json;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Domain.Enums;
using KynticAI.Scout.Infrastructure.AI;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace KynticAI.Scout.UnitTests;

public sealed class SalesSupportAgentServiceTests
{
    [Fact]
    public void BuildContextPackage_FlagsWeakSignals_AndAssignsCitationIds()
    {
        var utcNow = new DateTime(2026, 05, 09, 12, 00, 00, DateTimeKind.Utc);
        var service = CreateService(new StubStructuredLlmClient("{}"), new LlmOptions
        {
            DefaultProvider = "mock",
            DefaultModel = "gpt-5.5",
            MaxAttempts = 2,
            LowConfidenceThreshold = 0.75m,
            MinimumStrongFacts = 2
        });

        var tenant = Tenant.Create("demo", "Demo", utcNow);
        var userProfile = UserProfile.Create(tenant.Id, "123", "Avery Stone", "avery@example.com", "Northstar", "VP RevOps", "enterprise", utcNow, utcNow);
        var snapshot = ContextSnapshot.Create(
            tenant.Id,
            userProfile.Id,
            1,
            "Sales-ready profile.",
            0.79m,
            utcNow.AddMinutes(-30));

        snapshot.Facts.Add(ContextFact.Create(
            tenant.Id,
            snapshot.Id,
            Guid.NewGuid(),
            Guid.NewGuid(),
            "preferredChannel",
            "\"email\"",
            FactValueType.Enum,
            0.93m,
            utcNow.AddMinutes(-20),
            utcNow.AddMinutes(40),
            "Email is the preferred channel.",
            """[{"source":"crm"}]""",
            utcNow));
        snapshot.Facts.Add(ContextFact.Create(
            tenant.Id,
            snapshot.Id,
            Guid.NewGuid(),
            Guid.NewGuid(),
            "conversionProbability",
            "85",
            FactValueType.Number,
            0.64m,
            utcNow.AddMinutes(-19),
            utcNow.AddMinutes(41),
            "Conversion probability is informative but low confidence.",
            """[{"source":"warehouse"}]""",
            utcNow));
        snapshot.Facts.Add(ContextFact.Create(
            tenant.Id,
            snapshot.Id,
            Guid.NewGuid(),
            Guid.NewGuid(),
            "engagementLevel",
            "\"high\"",
            FactValueType.Enum,
            0.88m,
            utcNow.AddHours(-2),
            utcNow.AddMinutes(-10),
            "Engagement was high, but the signal has gone stale.",
            """[{"source":"product"}]""",
            utcNow));

        var result = service.BuildContextPackage(
            tenant,
            userProfile,
            snapshot,
            "Book a discovery call.",
            utcNow);

        Assert.Equal(3, result.Facts.Count);
        Assert.Equal(["FACT-01", "FACT-02", "FACT-03"], result.Facts.Select(fact => fact.CitationId).ToArray());
        Assert.True(result.HumanReviewRecommended);
        Assert.Contains(result.WeakSignalMessages, message => message.Contains("low confidence", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.WeakSignalMessages, message => message.Contains("stale", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.MissingInformation, item => item.Contains("planInterest", StringComparison.Ordinal));
        Assert.Contains("\"humanReviewRecommended\":true", result.ContextPackageJson, StringComparison.Ordinal);
        Assert.DoesNotContain("\"externalUserId\"", result.ContextPackageJson, StringComparison.Ordinal);
        Assert.Contains("\"privacy\"", result.ContextPackageJson, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GenerateAsync_RetriesAfterInvalidJson_AndSucceedsOnSecondAttempt()
    {
        var utcNow = new DateTime(2026, 05, 09, 12, 00, 00, DateTimeKind.Utc);
        var promptTemplate = PromptTemplate.Create(
            Guid.NewGuid(),
            "Intelligent Sales Support v1",
            "Grounded sales orchestration prompt.",
            "Only use grounded facts.",
            "Cite facts and avoid inventing details.",
            "Create a grounded plan for {{user.fullName}} at {{user.companyName}}.",
            """{"type":"object"}""",
            """["Cite facts."]""",
            utcNow);

        var contextPackage = CreateStrongContextPackage(utcNow);
        var service = CreateService(new SequencedStructuredLlmClient(
            "mock",
            "not-json",
            """
            {
              "salesObjective": "Book a discovery call for enterprise rollout.",
              "outreachStrategy": {
                "summary": "Lead with enterprise readiness and current product momentum.",
                "recommendedChannel": "email",
                "timingRecommendation": "Send within 24 hours.",
                "keyTalkingPoints": [
                  {
                    "text": "Use enterprise intent and recent activity as the opening hook.",
                    "citations": ["FACT-03", "FACT-04"],
                    "confidence": 0.91
                  }
                ],
                "risks": [
                  {
                    "text": "Keep churn risk in view before escalating the ask.",
                    "citations": ["FACT-02"],
                    "confidence": 0.78
                  }
                ],
                "confidence": 0.89,
                "humanReviewRecommended": false,
                "humanReviewReason": ""
              },
              "personalizedEmailDraft": {
                "subjectLine": "Northstar: next step for enterprise rollout",
                "previewText": "Grounded outreach for Avery Stone.",
                "body": "Hi Avery,\\n\\nYour recent usage and enterprise interest suggest this is a good moment to align on rollout priorities.\\n\\nWould a 20-minute session next week help?\\n\\nBest,\\nScout Sales",
                "callToAction": "Propose a 20-minute session next week.",
                "supportingClaims": [
                  {
                    "text": "The account prefers email and shows high recent engagement.",
                    "citations": ["FACT-05", "FACT-04"],
                    "confidence": 0.9
                  }
                ],
                "confidence": 0.9,
                "humanReviewRecommended": false,
                "humanReviewReason": ""
              },
              "followUpRecommendations": {
                "recommendations": [
                  {
                    "action": "Send the first email touch.",
                    "timing": "Within 24 hours.",
                    "rationale": "Email is the preferred channel and the user is actively engaged.",
                    "citations": ["FACT-05", "FACT-04"],
                    "confidence": 0.9
                  }
                ],
                "lowConfidenceSignals": [],
                "missingInformation": [],
                "confidence": 0.88,
                "humanReviewRecommended": false,
                "humanReviewReason": ""
              },
              "missingInformation": [],
              "humanReviewRecommended": false,
              "humanReviewReason": "",
              "overallConfidence": 0.89
            }
            """),
            new LlmOptions
            {
                DefaultProvider = "mock",
                DefaultModel = "gpt-5.5",
                MaxAttempts = 2,
                LowConfidenceThreshold = 0.75m,
                MinimumStrongFacts = 3
            });

        var promptEnvelope = service.BuildPromptEnvelope(promptTemplate, contextPackage, "gpt-5.5", "mock");
        var artifact = await service.GenerateAsync(
            promptTemplate,
            contextPackage,
            promptEnvelope,
            "mock",
            CancellationToken.None);

        Assert.Null(artifact.FailureReason);
        Assert.Equal("mock", artifact.ProviderName);
        Assert.Equal("gpt-5.5", artifact.ModelName);
        Assert.Equal(2, artifact.AttemptCount);
        Assert.Equal("[]", artifact.ValidationErrorsJson);
        Assert.Contains("outreachStrategy", artifact.OutputJson, StringComparison.Ordinal);
        Assert.Contains("\"citationId\":\"FACT-04\"", artifact.ProvenanceJson, StringComparison.Ordinal);
    }

    private static SalesSupportAgentService CreateService(IStructuredLlmClient client, LlmOptions options)
    {
        var registry = new StructuredLlmClientRegistry([client], Options.Create(options));
        return new SalesSupportAgentService(registry, Options.Create(options), NullLogger<SalesSupportAgentService>.Instance);
    }

    private static SalesContextPackageResult CreateStrongContextPackage(DateTime utcNow)
    {
        var facts = new[]
        {
            new GroundedContextFactResult("FACT-01", Guid.NewGuid(), "conversionProbability", "Conversion Probability", "85", FactValueType.Number, 0.93m, utcNow.AddMinutes(-20), utcNow.AddMinutes(40), true, false, "Conversion probability is high.", """[{"source":"crm"}]"""),
            new GroundedContextFactResult("FACT-02", Guid.NewGuid(), "churnRisk", "Churn Risk", "12", FactValueType.Number, 0.88m, utcNow.AddMinutes(-19), utcNow.AddMinutes(41), true, false, "Churn risk is currently manageable.", """[{"source":"warehouse"}]"""),
            new GroundedContextFactResult("FACT-03", Guid.NewGuid(), "planInterest", "Plan Interest", "\"enterprise\"", FactValueType.Enum, 0.91m, utcNow.AddMinutes(-18), utcNow.AddMinutes(42), true, false, "Enterprise plan interest is explicit.", """[{"source":"crm"}]"""),
            new GroundedContextFactResult("FACT-04", Guid.NewGuid(), "engagementLevel", "Engagement Level", "\"high\"", FactValueType.Enum, 0.9m, utcNow.AddMinutes(-17), utcNow.AddMinutes(43), true, false, "Recent activity is high.", """[{"source":"product"}]"""),
            new GroundedContextFactResult("FACT-05", Guid.NewGuid(), "preferredChannel", "Preferred Channel", "\"email\"", FactValueType.Enum, 0.95m, utcNow.AddMinutes(-16), utcNow.AddMinutes(44), true, false, "Email is the preferred channel.", """[{"source":"crm"}]""")
        };

        var contextPackagePayload = new
        {
            packageVersion = "2026-05-09",
            salesObjective = "Book a discovery call for enterprise rollout.",
            privacy = new
            {
                classification = "internal-sales-context"
            },
            subject = new
            {
                fullName = "Avery Stone",
                companyName = "Northstar",
                jobTitle = "VP RevOps",
                segment = "enterprise"
            },
            snapshot = new
            {
                snapshotId = Guid.NewGuid(),
                summary = "Strong enterprise buying intent with active usage.",
                overallConfidence = 0.91m,
                generatedAtUtc = utcNow.AddMinutes(-10),
                isStale = false
            },
            humanReviewRecommended = false,
            missingInformation = Array.Empty<string>(),
            weakSignalMessages = Array.Empty<string>(),
            facts = facts.Select(fact => new
            {
                citationId = fact.CitationId,
                factId = fact.FactId,
                attributeKey = fact.AttributeKey,
                displayName = fact.DisplayName,
                value = JsonSerializer.Deserialize<JsonElement>(fact.ValueJson),
                valueJson = fact.ValueJson,
                valueType = fact.ValueType.ToString().ToUpperInvariant(),
                confidence = fact.Confidence,
                observedAtUtc = fact.ObservedAtUtc,
                freshUntilUtc = fact.FreshUntilUtc,
                isFresh = fact.IsFresh,
                isLowConfidence = fact.IsLowConfidence,
                explanation = fact.Explanation,
                provenance = JsonSerializer.Deserialize<JsonElement>(fact.ProvenanceJson)
            })
        };

        return new SalesContextPackageResult(
            Guid.NewGuid(),
            "demo",
            "123",
            "Avery Stone",
            "Northstar",
            "VP RevOps",
            "enterprise",
            "Book a discovery call for enterprise rollout.",
            "Strong enterprise buying intent with active usage.",
            0.91m,
            utcNow.AddMinutes(-10),
            false,
            false,
            [],
            [],
            facts,
            JsonSerializer.Serialize(contextPackagePayload));
    }

    private sealed class StubStructuredLlmClient(string outputJson) : IStructuredLlmClient
    {
        public string ProviderName => "mock";

        public Task<StructuredLlmResponse> GenerateStructuredJsonAsync(StructuredLlmRequest request, CancellationToken cancellationToken)
            => Task.FromResult(new StructuredLlmResponse(ProviderName, outputJson));
    }

    private sealed class SequencedStructuredLlmClient(string providerName, params string[] outputs) : IStructuredLlmClient
    {
        private readonly Queue<string> outputs = new(outputs);

        public string ProviderName { get; } = providerName;

        public Task<StructuredLlmResponse> GenerateStructuredJsonAsync(StructuredLlmRequest request, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var output = outputs.Count > 0 ? outputs.Dequeue() : "{}";
            return Task.FromResult(new StructuredLlmResponse(ProviderName, output));
        }
    }
}
