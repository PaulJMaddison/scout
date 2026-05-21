using System.Net;

namespace KynticAI.Scout.Sdk;

public sealed class ScoutException : Exception
{
    public ScoutException(
        string message,
        HttpStatusCode? statusCode = null,
        string? correlationId = null,
        string? code = null,
        bool retryable = false,
        IReadOnlyList<ScoutErrorDetail>? details = null,
        Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
        CorrelationId = correlationId;
        Code = code;
        Retryable = retryable;
        Details = details ?? Array.Empty<ScoutErrorDetail>();
    }

    public HttpStatusCode? StatusCode { get; }

    public string? CorrelationId { get; }

    public string? Code { get; }

    public bool Retryable { get; }

    public IReadOnlyList<ScoutErrorDetail> Details { get; }
}

public sealed record ScoutErrorDetail(string? Code, string? Target, string Message);
