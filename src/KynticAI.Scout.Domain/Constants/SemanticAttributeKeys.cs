namespace KynticAI.Scout.Domain.Constants;

public static class SemanticAttributeKeys
{
    public const string ConversionProbability = "conversionProbability";
    public const string PreferredChannel = "preferredChannel";
    public const string PlanInterest = "planInterest";
    public const string ChurnRisk = "churnRisk";
    public const string EngagementLevel = "engagementLevel";
    public const string ExpansionPotential = "expansionPotential";
    public const string BudgetReadiness = "budgetReadiness";
    public const string DecisionMakerLikelihood = "decisionMakerLikelihood";
    public const string ProductFit = "productFit";
    public const string RecommendedSalesMotion = "recommendedSalesMotion";
    public const string StakeholderSeniority = "stakeholderSeniority";
    public const string SalesUrgency = "salesUrgency";
    public const string RecentFeatureAdoption = "recentFeatureAdoption";

    public static readonly IReadOnlySet<string> Reserved = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ConversionProbability,
        PreferredChannel,
        PlanInterest,
        ChurnRisk,
        EngagementLevel,
        ExpansionPotential,
        BudgetReadiness,
        DecisionMakerLikelihood,
        ProductFit,
        RecommendedSalesMotion,
        StakeholderSeniority,
        SalesUrgency,
        RecentFeatureAdoption
    };
}
