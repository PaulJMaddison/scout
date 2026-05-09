namespace ContextLayer.Infrastructure.AI;

public sealed class LlmOptions
{
    public const string SectionName = "Llm";

    public string DefaultProvider { get; set; } = "mock";

    public string DefaultModel { get; set; } = "gpt-5.5";

    public int MaxAttempts { get; set; } = 2;

    public decimal LowConfidenceThreshold { get; set; } = 0.75m;

    public int MinimumStrongFacts { get; set; } = 3;
}
