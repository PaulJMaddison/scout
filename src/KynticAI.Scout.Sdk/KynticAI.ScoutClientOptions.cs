namespace KynticAI.Scout.Sdk;

public sealed class ScoutClientOptions
{
    public required string BaseUrl { get; init; }

    public string? GraphQlEndpoint { get; init; }

    public string? AccessToken { get; init; }

    public Func<CancellationToken, Task<string?>>? AccessTokenProvider { get; init; }

    public IDictionary<string, string>? DefaultHeaders { get; init; }

    public int MaxRetries { get; init; } = 2;

    public TimeSpan RetryBaseDelay { get; init; } = TimeSpan.FromMilliseconds(200);

    public string RequestIdHeaderName { get; init; } = "X-Request-Id";

    public string UserAgent { get; init; } = "KynticAI.Scout.Sdk/2.0.0";
}
