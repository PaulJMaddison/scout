using System.Data;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using ContextLayer.Application.Abstractions;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;

namespace ContextLayer.Infrastructure.Selectors;

internal sealed class SelectorExecutionEngine(
    IEnumerable<ISelectorSourceConnector> connectors,
    IClock clock)
    : ISelectorExecutionEngine
{
    public Task<IReadOnlyList<SelectorPipelineOutcome>> ExecuteSelectorsAsync(
        IReadOnlyList<SelectorRuntimeContext> runtimeContexts,
        UserProfile userProfile,
        SelectorExecutionMode mode,
        CancellationToken cancellationToken)
        => ExecuteBatchAsync(runtimeContexts, userProfile, mode, cancellationToken);

    public async Task<SelectorPipelineOutcome> ExecuteAsync(
        SelectorRuntimeContext runtimeContext,
        UserProfile userProfile,
        SelectorExecutionMode mode,
        CancellationToken cancellationToken)
    {
        var modeName = mode.ToString();
        var selector = runtimeContext.Selector;
        try
        {
            var dataSource = runtimeContext.DataSource;
            var connectionConfig = ParseJsonObject(dataSource.ConnectionConfigJson, "ConnectionConfigJson");
            var connectorType = connectionConfig["connectorType"]?.GetValue<string>() ?? "mockSignal";
            var connector = connectors.FirstOrDefault(item => string.Equals(item.ConnectorType, connectorType, StringComparison.OrdinalIgnoreCase))
                ?? throw new InvalidOperationException($"No source connector is registered for connector type '{connectorType}'.");

            var fetchResult = await connector.FetchAsync(selector, userProfile, dataSource, connectionConfig, cancellationToken);
            var normalized = (JsonObject)fetchResult.Payload.DeepClone();
            var transformTrace = ApplyTransforms(normalized, ParseJsonObject(selector.ExpressionJson, "ExpressionJson"));
            var validationErrors = ValidateSchema(normalized, ParseJsonObject(selector.ValidationSchemaJson, "ValidationSchemaJson"));
            if (validationErrors.Count > 0)
            {
                var failedTrace = BuildTrace(selector, connectorType, fetchResult, normalized, validationErrors, transformTrace, null, null, null);
                return new SelectorPipelineOutcome(
                    modeName,
                    false,
                    selector.Name,
                    fetchResult.RawSourceDataJson,
                    normalized.ToJsonString(),
                    validationErrors,
                    null,
                    failedTrace.ToJsonString());
            }

            var ruleResult = EvaluateRule(selector, normalized);
            var confidence = ScoreConfidence(selector, ParseJsonObject(selector.ExpressionJson, "ExpressionJson"), fetchResult.ObservedAtUtc);
            var freshUntilUtc = fetchResult.ObservedAtUtc.AddMinutes(selector.FreshnessWindowMinutes);
            var explanation = RenderTemplate(selector.ExplanationTemplate, ruleResult.TemplateTokens);
            var candidate = new SelectorCandidateFact(
                selector.Id,
                runtimeContext.TargetAttributeDefinition.Id,
                runtimeContext.TargetAttributeDefinition.Key,
                ruleResult.ValueJson,
                ruleResult.ValueType,
                confidence,
                fetchResult.ObservedAtUtc,
                freshUntilUtc,
                explanation,
                BuildProvenance(selector, connectorType, fetchResult, validationErrors, transformTrace, ruleResult, confidence),
                fetchResult.RawSourceDataJson,
                normalized.ToJsonString(),
                JsonSerializer.Serialize(validationErrors),
                BuildTrace(selector, connectorType, fetchResult, normalized, validationErrors, transformTrace, ruleResult, explanation, confidence).ToJsonString(),
                selector.Priority);

            return new SelectorPipelineOutcome(
                modeName,
                true,
                selector.Name,
                fetchResult.RawSourceDataJson,
                normalized.ToJsonString(),
                validationErrors,
                candidate,
                candidate.PipelineTraceJson);
        }
        catch (Exception ex)
        {
            var errors = new[] { ex.Message };
            var trace = new JsonObject
            {
                ["selectorName"] = selector.Name,
                ["status"] = "failed",
                ["error"] = ex.Message
            };
            return new SelectorPipelineOutcome(
                modeName,
                false,
                selector.Name,
                "{}",
                "{}",
                errors,
                null,
                trace.ToJsonString());
        }
    }

    public async Task<SelectorPipelineOutcome> ValidateAsync(
        SelectorRuntimeContext runtimeContext,
        UserProfile? userProfile,
        CancellationToken cancellationToken)
    {
        var selector = runtimeContext.Selector;
        _ = ParseJsonObject(selector.ExpressionJson, "ExpressionJson");
        _ = ParseJsonObject(selector.ValidationSchemaJson, "ValidationSchemaJson");

        if (userProfile is null)
        {
            return new SelectorPipelineOutcome(
                SelectorExecutionMode.DryRun.ToString(),
                true,
                selector.Name,
                "{}",
                "{}",
                Array.Empty<string>(),
                null,
                JsonSerializer.Serialize(new
                {
                    selector = selector.Name,
                    status = "validated-config-only"
                }));
        }

        return await ExecuteAsync(runtimeContext, userProfile, SelectorExecutionMode.DryRun, cancellationToken);
    }

    private async Task<IReadOnlyList<SelectorPipelineOutcome>> ExecuteBatchAsync(
        IReadOnlyList<SelectorRuntimeContext> runtimeContexts,
        UserProfile userProfile,
        SelectorExecutionMode mode,
        CancellationToken cancellationToken)
    {
        var outcomes = new List<SelectorPipelineOutcome>(runtimeContexts.Count);
        foreach (var runtimeContext in runtimeContexts)
        {
            outcomes.Add(await ExecuteAsync(runtimeContext, userProfile, mode, cancellationToken));
        }

        return outcomes;
    }

    private IReadOnlyList<JsonObject> ApplyTransforms(JsonObject normalizedPayload, JsonObject expression)
    {
        var traces = new List<JsonObject>();
        var transforms = expression["transforms"]?.AsArray();
        if (transforms is null)
        {
            return traces;
        }

        foreach (var node in transforms)
        {
            if (node is not JsonObject transform)
            {
                continue;
            }

            var path = transform["path"]?.GetValue<string>()
                ?? throw new InvalidOperationException("Each transform requires a path.");
            var type = transform["type"]?.GetValue<string>()
                ?? throw new InvalidOperationException("Each transform requires a type.");
            var currentValue = GetPath(normalizedPayload, path)
                ?? throw new InvalidOperationException($"Transform path '{path}' was not found in the normalized payload.");
            var updatedValue = type.Trim().ToLowerInvariant() switch
            {
                "trim" => JsonValue.Create(currentValue.GetValue<string>().Trim()),
                "lower" => JsonValue.Create(currentValue.GetValue<string>().ToLowerInvariant()),
                "upper" => JsonValue.Create(currentValue.GetValue<string>().ToUpperInvariant()),
                "tonumber" => JsonValue.Create(decimal.Parse(currentValue.ToJsonString().Trim('"'), NumberStyles.Any, CultureInfo.InvariantCulture)),
                _ => throw new InvalidOperationException($"Transform type '{type}' is not supported.")
            };

            SetPath(normalizedPayload, path, updatedValue);
            traces.Add(new JsonObject
            {
                ["path"] = path,
                ["type"] = type,
                ["value"] = updatedValue?.DeepClone()
            });
        }

        return traces;
    }

    private static IReadOnlyList<string> ValidateSchema(JsonObject payload, JsonObject schema)
    {
        var errors = new List<string>();
        if (schema.Count == 0)
        {
            return errors;
        }

        foreach (var requiredPath in schema["requiredPaths"]?.AsArray().Select(node => node?.GetValue<string>() ?? string.Empty) ?? Array.Empty<string>())
        {
            if (string.IsNullOrWhiteSpace(requiredPath))
            {
                continue;
            }

            if (GetPath(payload, requiredPath) is null)
            {
                errors.Add($"Required path '{requiredPath}' was not present in the payload.");
            }
        }

        if (schema["expectedTypes"] is JsonObject expectedTypes)
        {
            foreach (var kvp in expectedTypes)
            {
                if (kvp.Value is null)
                {
                    continue;
                }

                var value = GetPath(payload, kvp.Key);
                if (value is null)
                {
                    continue;
                }

                var expectedType = kvp.Value.GetValue<string>().Trim().ToLowerInvariant();
                var actualType = value switch
                {
                    JsonArray => "array",
                    JsonObject => "object",
                    JsonValue jsonValue when TryReadBoolean(jsonValue, out _) => "boolean",
                    JsonValue jsonValue when TryReadDecimal(jsonValue, out _) => "number",
                    JsonValue => "string",
                    _ => "unknown"
                };

                if (!string.Equals(expectedType, actualType, StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add($"Path '{kvp.Key}' expected type '{expectedType}' but received '{actualType}'.");
                }
            }
        }

        return errors;
    }

    private RuleEvaluationResult EvaluateRule(SelectorDefinition selector, JsonObject normalizedPayload)
    {
        var expression = ParseJsonObject(selector.ExpressionJson, "ExpressionJson");
        var rule = expression["rule"] as JsonObject ?? expression;
        return selector.MappingKind switch
        {
            SelectorMappingKind.DirectFieldMapping => EvaluateDirectFieldMapping(rule, normalizedPayload),
            SelectorMappingKind.StringToEnumMapping => EvaluateStringToEnumMapping(rule, normalizedPayload),
            SelectorMappingKind.ThresholdClassification => EvaluateThresholdClassification(rule, normalizedPayload),
            SelectorMappingKind.WeightedScoring => EvaluateWeightedScoring(rule, normalizedPayload),
            SelectorMappingKind.FormulaMetric => EvaluateFormulaMetric(rule, normalizedPayload),
            _ => throw new InvalidOperationException($"Selector mapping kind '{selector.MappingKind}' is not supported.")
        };
    }

    private RuleEvaluationResult EvaluateDirectFieldMapping(JsonObject rule, JsonObject payload)
    {
        var path = rule["valuePath"]?.GetValue<string>()
            ?? throw new InvalidOperationException("Direct field mapping requires valuePath.");
        var value = GetPath(payload, path)
            ?? throw new InvalidOperationException($"Value path '{path}' was not found.");
        var valueJson = value.ToJsonString();
        return new RuleEvaluationResult(
            valueJson,
            InferValueType(value),
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["sourceValue"] = RenderValue(value),
                [SanitizeToken(path)] = RenderValue(value)
            },
            JsonSerializer.Serialize(new
            {
                type = "directFieldMapping",
                path,
                value = JsonNode.Parse(valueJson)
            }));
    }

    private RuleEvaluationResult EvaluateStringToEnumMapping(JsonObject rule, JsonObject payload)
    {
        var path = rule["valuePath"]?.GetValue<string>()
            ?? throw new InvalidOperationException("String-to-enum mapping requires valuePath.");
        var sourceValue = GetPath(payload, path)?.GetValue<string>()
            ?? throw new InvalidOperationException($"Value path '{path}' did not contain a string.");
        var map = rule["map"] as JsonObject
            ?? throw new InvalidOperationException("String-to-enum mapping requires a map object.");
        var mappedValue = map.FirstOrDefault(item => string.Equals(item.Key, sourceValue, StringComparison.OrdinalIgnoreCase)).Value?.GetValue<string>()
            ?? rule["default"]?.GetValue<string>()
            ?? throw new InvalidOperationException($"No enum mapping exists for '{sourceValue}'.");
        return new RuleEvaluationResult(
            JsonSerializer.Serialize(mappedValue),
            FactValueType.Enum,
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["sourceValue"] = sourceValue,
                ["mappedValue"] = mappedValue,
                [SanitizeToken(path)] = sourceValue
            },
            JsonSerializer.Serialize(new
            {
                type = "stringToEnumMapping",
                path,
                sourceValue,
                mappedValue
            }));
    }

    private RuleEvaluationResult EvaluateThresholdClassification(JsonObject rule, JsonObject payload)
    {
        var path = rule["valuePath"]?.GetValue<string>()
            ?? throw new InvalidOperationException("Threshold classification requires valuePath.");
        var sourceValue = GetRequiredNumber(payload, path);
        var thresholds = rule["thresholds"]?.AsArray()
            ?? throw new InvalidOperationException("Threshold classification requires a thresholds array.");

        string? label = null;
        foreach (var node in thresholds.Select(item => item as JsonObject).Where(static item => item is not null))
        {
            var minimum = node!["min"]?.GetValue<decimal?>();
            var maximum = node["max"]?.GetValue<decimal?>();
            var meetsMin = minimum is null || sourceValue >= minimum.Value;
            var meetsMax = maximum is null || sourceValue < maximum.Value;
            if (meetsMin && meetsMax)
            {
                label = node["label"]?.GetValue<string>();
                if (!string.IsNullOrWhiteSpace(label))
                {
                    break;
                }
            }
        }

        if (string.IsNullOrWhiteSpace(label))
        {
            throw new InvalidOperationException($"No threshold classification matched value '{sourceValue}'.");
        }

        return new RuleEvaluationResult(
            JsonSerializer.Serialize(label),
            FactValueType.Enum,
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [SanitizeToken(path)] = sourceValue.ToString(CultureInfo.InvariantCulture),
                ["classifiedValue"] = label
            },
            JsonSerializer.Serialize(new
            {
                type = "thresholdClassification",
                path,
                sourceValue,
                label
            }));
    }

    private RuleEvaluationResult EvaluateWeightedScoring(JsonObject rule, JsonObject payload)
    {
        var components = rule["components"]?.AsArray()
            ?? throw new InvalidOperationException("Weighted scoring requires a components array.");
        var componentBreakdown = new List<object>();
        decimal total = 0m;
        var tokens = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var node in components.Select(item => item as JsonObject).Where(static item => item is not null))
        {
            var evaluation = EvaluateComponent(node!, payload);
            var weight = node!["weight"]?.GetValue<decimal?>() ?? 1m;
            var contribution = evaluation.Score * weight;
            total += contribution;
            componentBreakdown.Add(new
            {
                evaluation.Path,
                evaluation.Score,
                weight,
                contribution,
                evaluation.SourceValue
            });
            tokens[SanitizeToken(evaluation.Path)] = evaluation.SourceValue;
        }

        var minimum = rule["minimum"]?.GetValue<decimal?>() ?? 0m;
        var maximum = rule["maximum"]?.GetValue<decimal?>() ?? 100m;
        total = Math.Clamp(total, minimum, maximum);
        tokens["weightedScore"] = total.ToString(CultureInfo.InvariantCulture);
        return new RuleEvaluationResult(
            JsonSerializer.Serialize(total),
            FactValueType.Number,
            tokens,
            JsonSerializer.Serialize(new
            {
                type = "weightedScoring",
                total,
                components = componentBreakdown
            }));
    }

    private RuleEvaluationResult EvaluateFormulaMetric(JsonObject rule, JsonObject payload)
    {
        var expression = rule["expression"]?.GetValue<string>()
            ?? throw new InvalidOperationException("Formula metric requires expression.");
        var variables = rule["variables"]?.AsArray()
            ?? throw new InvalidOperationException("Formula metric requires variables.");
        var tokens = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var variableValues = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        var breakdown = new List<object>();

        foreach (var variableNode in variables.Select(item => item as JsonObject).Where(static item => item is not null))
        {
            var name = variableNode!["name"]?.GetValue<string>()
                ?? throw new InvalidOperationException("Formula metric variable requires name.");
            var evaluation = EvaluateComponent(variableNode!, payload);
            variableValues[name] = evaluation.Score;
            tokens[name] = evaluation.Score.ToString(CultureInfo.InvariantCulture);
            breakdown.Add(new
            {
                name,
                evaluation.Path,
                evaluation.Score,
                evaluation.SourceValue
            });
        }

        var resolvedExpression = expression;
        foreach (var variable in variableValues)
        {
            resolvedExpression = ReplaceWholeWord(resolvedExpression, variable.Key, variable.Value.ToString(CultureInfo.InvariantCulture));
        }

        var dataTable = new DataTable
        {
            Locale = CultureInfo.InvariantCulture
        };
        var computed = Convert.ToDecimal(dataTable.Compute(resolvedExpression, string.Empty), CultureInfo.InvariantCulture);
        tokens["formulaValue"] = computed.ToString(CultureInfo.InvariantCulture);
        return new RuleEvaluationResult(
            JsonSerializer.Serialize(computed),
            FactValueType.Number,
            tokens,
            JsonSerializer.Serialize(new
            {
                type = "formulaMetric",
                expression,
                resolvedExpression,
                computed,
                variables = breakdown
            }));
    }

    private decimal ScoreConfidence(SelectorDefinition selector, JsonObject expression, DateTime observedAtUtc)
    {
        var config = expression["confidence"] as JsonObject;
        var baseConfidence = config?["base"]?.GetValue<decimal?>() ?? selector.DefaultConfidence;
        var minimum = config?["minimum"]?.GetValue<decimal?>() ?? 0.25m;
        var stalePenaltyPerHour = config?["stalePenaltyPerHour"]?.GetValue<decimal?>() ?? 0m;
        var ageHours = Math.Max(0d, (clock.UtcNow - observedAtUtc).TotalHours);
        var confidence = baseConfidence - (decimal)ageHours * stalePenaltyPerHour;
        return Math.Round(Math.Max(minimum, Math.Min(1m, confidence)), 4);
    }

    private static JsonObject BuildTrace(
        SelectorDefinition selector,
        string connectorType,
        SourceFetchResult fetchResult,
        JsonObject normalizedPayload,
        IReadOnlyList<string> validationErrors,
        IReadOnlyList<JsonObject> transformTrace,
        RuleEvaluationResult? ruleResult,
        string? explanation,
        decimal? confidence)
    {
        return new JsonObject
        {
            ["selector"] = JsonSerializer.SerializeToNode(new
            {
                selector.Id,
                selector.Name,
                selector.Version,
                selector.MappingKind,
                selector.Priority,
                selector.FreshnessWindowMinutes,
                selector.ScheduleIntervalMinutes
            }),
            ["connectorType"] = connectorType,
            ["rawSourceObservedAtUtc"] = fetchResult.ObservedAtUtc,
            ["normalizedPayload"] = JsonNode.Parse(normalizedPayload.ToJsonString()),
            ["validationErrors"] = JsonSerializer.SerializeToNode(validationErrors),
            ["transforms"] = JsonSerializer.SerializeToNode(transformTrace),
            ["ruleTrace"] = ruleResult is null ? null : JsonNode.Parse(ruleResult.RuleTraceJson),
            ["explanation"] = explanation,
            ["confidence"] = confidence
        };
    }

    private static string BuildProvenance(
        SelectorDefinition selector,
        string connectorType,
        SourceFetchResult fetchResult,
        IReadOnlyList<string> validationErrors,
        IReadOnlyList<JsonObject> transformTrace,
        RuleEvaluationResult ruleResult,
        decimal confidence)
    {
        return JsonSerializer.Serialize(new
        {
            selector = new
            {
                selector.Id,
                selector.Name,
                selector.Version,
                selector.MappingKind,
                selector.Priority
            },
            connectorType,
            source = JsonSerializer.Deserialize<object>(fetchResult.ProvenanceJson),
            validationErrors,
            transforms = transformTrace.Select(trace => JsonSerializer.Deserialize<object>(trace.ToJsonString())),
            rule = JsonSerializer.Deserialize<object>(ruleResult.RuleTraceJson),
            confidence
        });
    }

    private static string RenderTemplate(string template, IReadOnlyDictionary<string, string> tokens)
    {
        var result = new StringBuilder(template);
        foreach (var token in tokens)
        {
            result.Replace("{{" + token.Key + "}}", token.Value);
        }

        return result.ToString();
    }

    private static JsonObject ParseJsonObject(string json, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new JsonObject();
        }

        var node = JsonNode.Parse(json);
        return node as JsonObject
            ?? throw new InvalidOperationException($"{fieldName} must contain a JSON object.");
    }

    private static JsonNode? GetPath(JsonNode? node, string path)
    {
        if (node is null)
        {
            return null;
        }

        JsonNode? current = node;
        foreach (var segment in path.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            current = current switch
            {
                JsonObject jsonObject when jsonObject.TryGetPropertyValue(segment, out var child) => child,
                _ => null
            };

            if (current is null)
            {
                return null;
            }
        }

        return current;
    }

    private static void SetPath(JsonObject root, string path, JsonNode? value)
    {
        var segments = path.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        JsonObject current = root;
        for (var index = 0; index < segments.Length - 1; index++)
        {
            if (current[segments[index]] is not JsonObject child)
            {
                child = new JsonObject();
                current[segments[index]] = child;
            }

            current = child;
        }

        current[segments[^1]] = value;
    }

    private static decimal GetRequiredNumber(JsonObject payload, string path)
    {
        var value = GetPath(payload, path)
            ?? throw new InvalidOperationException($"Value path '{path}' was not found.");
        return value switch
        {
            JsonValue jsonValue when TryReadDecimal(jsonValue, out var numericValue) => numericValue,
            _ => throw new InvalidOperationException($"Value path '{path}' did not contain a numeric value.")
        };
    }

    private static FactValueType InferValueType(JsonNode node)
    {
        return node switch
        {
            JsonArray => FactValueType.Json,
            JsonObject => FactValueType.Json,
            JsonValue jsonValue when TryReadBoolean(jsonValue, out _) => FactValueType.Boolean,
            JsonValue jsonValue when TryReadDecimal(jsonValue, out _) => FactValueType.Number,
            _ => FactValueType.String
        };
    }

    private static string RenderValue(JsonNode node)
        => node switch
        {
            JsonValue jsonValue when TryReadBoolean(jsonValue, out var boolValue) => boolValue ? "true" : "false",
            JsonValue jsonValue when TryReadDecimal(jsonValue, out var decimalValue) => decimalValue.ToString(CultureInfo.InvariantCulture),
            JsonValue => node.GetValue<string>(),
            _ => node.ToJsonString()
        };

    private static bool TryReadDecimal(JsonValue jsonValue, out decimal value)
    {
        if (jsonValue.TryGetValue<decimal>(out value))
        {
            return true;
        }

        if (jsonValue.TryGetValue<string>(out var stringValue) &&
            decimal.TryParse(stringValue, NumberStyles.Any, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        value = default;
        return false;
    }

    private static bool TryReadBoolean(JsonValue jsonValue, out bool value)
    {
        if (jsonValue.TryGetValue<bool>(out value))
        {
            return true;
        }

        if (jsonValue.TryGetValue<string>(out var stringValue) &&
            bool.TryParse(stringValue, out value))
        {
            return true;
        }

        value = default;
        return false;
    }

    private static string SanitizeToken(string path)
        => path.Replace(".", string.Empty, StringComparison.Ordinal).Replace("_", string.Empty, StringComparison.Ordinal);

    private static string ReplaceWholeWord(string input, string word, string replacement)
    {
        var builder = new StringBuilder(input);
        var index = 0;
        while ((index = builder.ToString().IndexOf(word, index, StringComparison.Ordinal)) >= 0)
        {
            var startBoundary = index == 0 || !char.IsLetterOrDigit(builder[index - 1]);
            var endIndex = index + word.Length;
            var endBoundary = endIndex == builder.Length || !char.IsLetterOrDigit(builder[endIndex]);
            if (startBoundary && endBoundary)
            {
                builder.Remove(index, word.Length);
                builder.Insert(index, replacement);
                index += replacement.Length;
            }
            else
            {
                index += word.Length;
            }
        }

        return builder.ToString();
    }

    private static ComponentEvaluation EvaluateComponent(JsonObject component, JsonObject payload)
    {
        var path = component["sourcePath"]?.GetValue<string>()
            ?? component["path"]?.GetValue<string>()
            ?? throw new InvalidOperationException("Rule component requires sourcePath.");
        var node = GetPath(payload, path)
            ?? throw new InvalidOperationException($"Source path '{path}' was not found.");
        var sourceValue = RenderValue(node);
        decimal score;

        if (component["map"] is JsonObject map)
        {
            score = map.FirstOrDefault(item => string.Equals(item.Key, sourceValue, StringComparison.OrdinalIgnoreCase)).Value?.GetValue<decimal?>()
                ?? component["defaultValue"]?.GetValue<decimal?>()
                ?? throw new InvalidOperationException($"No mapped score exists for '{sourceValue}'.");
        }
        else if (component["expected"] is not null)
        {
            var expected = component["expected"]!.GetValue<string>();
            var matches = string.Equals(sourceValue, expected, StringComparison.OrdinalIgnoreCase);
            score = matches
                ? component["trueValue"]?.GetValue<decimal?>() ?? 1m
                : component["falseValue"]?.GetValue<decimal?>() ?? 0m;
        }
        else if (component["threshold"] is not null)
        {
            var threshold = component["threshold"]!.GetValue<decimal>();
            var numericValue = GetRequiredNumber(payload, path);
            score = numericValue >= threshold
                ? component["trueValue"]?.GetValue<decimal?>() ?? 1m
                : component["falseValue"]?.GetValue<decimal?>() ?? 0m;
            sourceValue = numericValue.ToString(CultureInfo.InvariantCulture);
        }
        else if (TryReadDecimal((JsonValue)node, out var numericNode))
        {
            score = component["multiplier"]?.GetValue<decimal?>() is { } multiplier
                ? numericNode * multiplier
                : numericNode;
            sourceValue = numericNode.ToString(CultureInfo.InvariantCulture);
        }
        else
        {
            throw new InvalidOperationException($"Component at path '{path}' could not be evaluated.");
        }

        return new ComponentEvaluation(path, sourceValue, score);
    }

    private sealed record ComponentEvaluation(string Path, string SourceValue, decimal Score);

    private sealed record RuleEvaluationResult(
        string ValueJson,
        FactValueType ValueType,
        IReadOnlyDictionary<string, string> TemplateTokens,
        string RuleTraceJson);
}
