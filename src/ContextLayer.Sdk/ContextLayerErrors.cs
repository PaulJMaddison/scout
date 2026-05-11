using System.Net;

namespace ContextLayer.Sdk;

public sealed class ContextLayerException : Exception
{
    public ContextLayerException(
        string message,
        HttpStatusCode? statusCode = null,
        string? correlationId = null,
        string? code = null,
        bool retryable = false,
        IReadOnlyList<ContextLayerErrorDetail>? details = null,
        Exception? innerException = null)
        : base(message, innerException)
    {
        StatusCode = statusCode;
        CorrelationId = correlationId;
        Code = code;
        Retryable = retryable;
        Details = details ?? Array.Empty<ContextLayerErrorDetail>();
    }

    public HttpStatusCode? StatusCode { get; }

    public string? CorrelationId { get; }

    public string? Code { get; }

    public bool Retryable { get; }

    public IReadOnlyList<ContextLayerErrorDetail> Details { get; }
}

public sealed record ContextLayerErrorDetail(string? Code, string? Target, string Message);
