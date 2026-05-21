using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KynticAI.Scout.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    Actor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Action = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EntityId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    MetadataJson = table.Column<string>(type: "jsonb", nullable: false),
                    BeforeJson = table.Column<string>(type: "jsonb", nullable: true),
                    AfterJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "data_sources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ConnectionConfigJson = table.Column<string>(type: "jsonb", nullable: false),
                    LastSuccessfulSyncAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_data_sources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_data_sources_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "prompt_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    SystemPrompt = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    UserPromptTemplate = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    OutputSchemaJson = table.Column<string>(type: "jsonb", nullable: false),
                    GuardrailsJson = table.Column<string>(type: "jsonb", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_prompt_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_prompt_templates_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "semantic_attribute_definitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    DataType = table.Column<int>(type: "integer", nullable: false),
                    ExampleValueJson = table.Column<string>(type: "jsonb", nullable: false),
                    IsSystem = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_semantic_attribute_definitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_semantic_attribute_definitions_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalUserId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    CompanyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    JobTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Segment = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastSeenAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_profiles_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "selector_definitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DataSourceId = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetAttributeDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    MappingKind = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    ExpressionJson = table.Column<string>(type: "jsonb", nullable: false),
                    ExplanationTemplate = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    DefaultConfidence = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    PublishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_selector_definitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_selector_definitions_data_sources_DataSourceId",
                        column: x => x.DataSourceId,
                        principalTable: "data_sources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_selector_definitions_semantic_attribute_definitions_TargetA~",
                        column: x => x.TargetAttributeDefinitionId,
                        principalTable: "semantic_attribute_definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_selector_definitions_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "context_snapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    SnapshotVersion = table.Column<int>(type: "integer", nullable: false),
                    Summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    OverallConfidence = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    IsStale = table.Column<bool>(type: "boolean", nullable: false),
                    GeneratedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_context_snapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_context_snapshots_user_profiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "user_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_signals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataSourceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ValueJson = table.Column<string>(type: "jsonb", nullable: false),
                    ValueType = table.Column<int>(type: "integer", nullable: false),
                    ObservedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProvenanceJson = table.Column<string>(type: "jsonb", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_signals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_signals_data_sources_DataSourceId",
                        column: x => x.DataSourceId,
                        principalTable: "data_sources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_signals_user_profiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "user_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "selector_executions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SelectorDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    TriggeredBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RequestedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    ResultValueJson = table.Column<string>(type: "jsonb", nullable: false),
                    ResultValueType = table.Column<int>(type: "integer", nullable: false),
                    ResultConfidence = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    ResultObservedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResultExplanation = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ResultProvenanceJson = table.Column<string>(type: "jsonb", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_selector_executions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_selector_executions_selector_definitions_SelectorDefinition~",
                        column: x => x.SelectorDefinitionId,
                        principalTable: "selector_definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_selector_executions_user_profiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "user_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "agent_runs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    PromptTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContextSnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ModelName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    InputJson = table.Column<string>(type: "jsonb", nullable: false),
                    OutputJson = table.Column<string>(type: "jsonb", nullable: false),
                    ProvenanceJson = table.Column<string>(type: "jsonb", nullable: false),
                    Confidence = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    RequestedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_agent_runs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_agent_runs_context_snapshots_ContextSnapshotId",
                        column: x => x.ContextSnapshotId,
                        principalTable: "context_snapshots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_agent_runs_prompt_templates_PromptTemplateId",
                        column: x => x.PromptTemplateId,
                        principalTable: "prompt_templates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_agent_runs_user_profiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "user_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "context_facts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContextSnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                    SemanticAttributeDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceSelectorDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    AttributeKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ValueJson = table.Column<string>(type: "jsonb", nullable: false),
                    ValueType = table.Column<int>(type: "integer", nullable: false),
                    Confidence = table.Column<decimal>(type: "numeric(5,4)", precision: 5, scale: 4, nullable: false),
                    ObservedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Explanation = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ProvenanceJson = table.Column<string>(type: "jsonb", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_context_facts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_context_facts_context_snapshots_ContextSnapshotId",
                        column: x => x.ContextSnapshotId,
                        principalTable: "context_snapshots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_context_facts_selector_definitions_SourceSelectorDefinition~",
                        column: x => x.SourceSelectorDefinitionId,
                        principalTable: "selector_definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_context_facts_semantic_attribute_definitions_SemanticAttrib~",
                        column: x => x.SemanticAttributeDefinitionId,
                        principalTable: "semantic_attribute_definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_agent_runs_ContextSnapshotId",
                table: "agent_runs",
                column: "ContextSnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_agent_runs_PromptTemplateId",
                table: "agent_runs",
                column: "PromptTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_agent_runs_UserProfileId",
                table: "agent_runs",
                column: "UserProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_TenantId_CreatedAtUtc",
                table: "audit_events",
                columns: new[] { "TenantId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_context_facts_ContextSnapshotId_AttributeKey",
                table: "context_facts",
                columns: new[] { "ContextSnapshotId", "AttributeKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_context_facts_SemanticAttributeDefinitionId",
                table: "context_facts",
                column: "SemanticAttributeDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_context_facts_SourceSelectorDefinitionId",
                table: "context_facts",
                column: "SourceSelectorDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_context_snapshots_TenantId_UserProfileId_GeneratedAtUtc",
                table: "context_snapshots",
                columns: new[] { "TenantId", "UserProfileId", "GeneratedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_context_snapshots_UserProfileId",
                table: "context_snapshots",
                column: "UserProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_data_sources_TenantId_Name",
                table: "data_sources",
                columns: new[] { "TenantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_prompt_templates_TenantId_Name",
                table: "prompt_templates",
                columns: new[] { "TenantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_selector_definitions_DataSourceId",
                table: "selector_definitions",
                column: "DataSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_selector_definitions_TargetAttributeDefinitionId",
                table: "selector_definitions",
                column: "TargetAttributeDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_selector_definitions_TenantId_Name",
                table: "selector_definitions",
                columns: new[] { "TenantId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_selector_executions_SelectorDefinitionId",
                table: "selector_executions",
                column: "SelectorDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_selector_executions_TenantId_CorrelationId",
                table: "selector_executions",
                columns: new[] { "TenantId", "CorrelationId" });

            migrationBuilder.CreateIndex(
                name: "IX_selector_executions_UserProfileId",
                table: "selector_executions",
                column: "UserProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_semantic_attribute_definitions_TenantId_Key",
                table: "semantic_attribute_definitions",
                columns: new[] { "TenantId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenants_Slug",
                table: "tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_profiles_TenantId_ExternalUserId",
                table: "user_profiles",
                columns: new[] { "TenantId", "ExternalUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_signals_DataSourceId",
                table: "user_signals",
                column: "DataSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_user_signals_TenantId_UserProfileId_Key_ObservedAtUtc",
                table: "user_signals",
                columns: new[] { "TenantId", "UserProfileId", "Key", "ObservedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_user_signals_UserProfileId",
                table: "user_signals",
                column: "UserProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "agent_runs");

            migrationBuilder.DropTable(
                name: "audit_events");

            migrationBuilder.DropTable(
                name: "context_facts");

            migrationBuilder.DropTable(
                name: "selector_executions");

            migrationBuilder.DropTable(
                name: "user_signals");

            migrationBuilder.DropTable(
                name: "prompt_templates");

            migrationBuilder.DropTable(
                name: "context_snapshots");

            migrationBuilder.DropTable(
                name: "selector_definitions");

            migrationBuilder.DropTable(
                name: "user_profiles");

            migrationBuilder.DropTable(
                name: "data_sources");

            migrationBuilder.DropTable(
                name: "semantic_attribute_definitions");

            migrationBuilder.DropTable(
                name: "tenants");
        }
    }
}
