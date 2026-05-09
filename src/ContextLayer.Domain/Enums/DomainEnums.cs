namespace ContextLayer.Domain.Enums;

public enum DataSourceKind
{
    Crm = 1,
    SqlMetric = 2,
    EventStream = 3,
    ProductUsage = 4
}

public enum DataSourceStatus
{
    Active = 1,
    Disabled = 2
}

public enum SelectorStatus
{
    Draft = 1,
    Published = 2,
    Disabled = 3
}

public enum SelectorMappingKind
{
    DirectFieldMapping = 1,
    WeightedScoring = 2,
    ThresholdClassification = 3,
    StringToEnumMapping = 4,
    FormulaMetric = 5,
    RawField = DirectFieldMapping,
    ComputedMetric = FormulaMetric
}

public enum SelectorExecutionStatus
{
    Pending = 1,
    Running = 2,
    Succeeded = 3,
    Failed = 4
}

public enum SelectorExecutionMode
{
    Live = 1,
    Preview = 2,
    DryRun = 3,
    Scheduled = 4
}

public enum SemanticDataType
{
    Percentage = 1,
    Text = 2,
    Enum = 3,
    EnumSet = 4,
    Number = 5,
    Boolean = 6,
    Json = 7
}

public enum FactValueType
{
    String = 1,
    Number = 2,
    Boolean = 3,
    Json = 4,
    Enum = 5,
    EnumSet = 6
}

public enum AgentRunStatus
{
    Pending = 1,
    Running = 2,
    Completed = 3,
    Failed = 4
}

public enum OperatorRole
{
    TenantAdmin = 1,
    SalesRep = 2
}

public enum RecomputeJobStatus
{
    Pending = 1,
    Running = 2,
    Completed = 3,
    Failed = 4
}
