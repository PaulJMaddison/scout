using FluentValidation;
using HotChocolate;
using HotChocolate.Execution;

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
            InvalidOperationException invalidOperationException => error
                .WithMessage(invalidOperationException.Message)
                .WithCode("INVALID_OPERATION"),
            _ => error
        };
    }
}
