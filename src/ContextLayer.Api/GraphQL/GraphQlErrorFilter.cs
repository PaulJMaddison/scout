using FluentValidation;
using HotChocolate;
using HotChocolate.Execution;
using ContextLayer.Application.Services;

namespace ContextLayer.Api.GraphQL;

public sealed class GraphQlErrorFilter : IErrorFilter
{
    public IError OnError(IError error)
    {
        return error.Exception switch
        {
            ValidationException validationException => error
                .WithMessage(string.Join("; ", validationException.Errors.Select(x => x.ErrorMessage)))
                .WithCode("VALIDATION_ERROR"),
            PlanLimitExceededException limitExceededException => error
                .WithMessage(limitExceededException.Message)
                .WithCode("BILLING_LIMIT_EXCEEDED")
                .SetExtension("tenantSlug", limitExceededException.TenantSlug)
                .SetExtension("plan", limitExceededException.Plan.ToString())
                .SetExtension("metric", limitExceededException.Metric.ToString())
                .SetExtension("limit", limitExceededException.Limit)
                .SetExtension("currentUsage", limitExceededException.CurrentUsage)
                .SetExtension("requestedQuantity", limitExceededException.RequestedQuantity),
            InvalidOperationException invalidOperationException => error
                .WithMessage(invalidOperationException.Message)
                .WithCode("INVALID_OPERATION"),
            _ => error
        };
    }
}
