using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KynticAI.Scout.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SaaSControlPlaneArchitecture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "connector_credentials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DataSourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConnectorType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SecretKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SecretReference = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ProtectedValue = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_connector_credentials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_connector_credentials_data_sources_DataSourceId",
                        column: x => x.DataSourceId,
                        principalTable: "data_sources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saas_tenant_subscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Plan = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    BillingCustomerReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EntitlementsJson = table.Column<string>(type: "jsonb", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TrialEndsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentPeriodEndsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_tenant_subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_tenant_subscriptions_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saas_workspaces",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_workspaces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_workspaces_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saas_api_clients",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClientId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SecretHash = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ScopesJson = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LastUsedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_api_clients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_api_clients_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_saas_api_clients_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saas_billing_usage_records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Metric = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<long>(type: "bigint", nullable: false),
                    WindowStartUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WindowEndUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Source = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DimensionsJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_billing_usage_records", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_billing_usage_records_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_saas_billing_usage_records_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saas_connector_installations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataSourceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConnectorType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CapabilitiesJson = table.Column<string>(type: "jsonb", nullable: false),
                    HealthJson = table.Column<string>(type: "jsonb", nullable: false),
                    LastCheckedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_connector_installations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_connector_installations_data_sources_DataSourceId",
                        column: x => x.DataSourceId,
                        principalTable: "data_sources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_saas_connector_installations_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saas_context_packages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContextSnapshotId = table.Column<Guid>(type: "uuid", nullable: false),
                    PackageKey = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Audience = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ManifestJson = table.Column<string>(type: "jsonb", nullable: false),
                    DeliveryChannelsJson = table.Column<string>(type: "jsonb", nullable: false),
                    GeneratedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_context_packages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_context_packages_context_snapshots_ContextSnapshotId",
                        column: x => x.ContextSnapshotId,
                        principalTable: "context_snapshots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_saas_context_packages_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saas_onboarding_states",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    StepKey = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StateJson = table.Column<string>(type: "jsonb", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_onboarding_states", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_onboarding_states_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saas_workspace_members",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    OperatorAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    InvitedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AcceptedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_workspace_members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_workspace_members_operator_accounts_OperatorAccountId",
                        column: x => x.OperatorAccountId,
                        principalTable: "operator_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_saas_workspace_members_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_connector_credentials_DataSourceId",
                table: "connector_credentials",
                column: "DataSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_connector_credentials_SecretReference",
                table: "connector_credentials",
                column: "SecretReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_connector_credentials_TenantId_DataSourceId_SecretKey",
                table: "connector_credentials",
                columns: new[] { "TenantId", "DataSourceId", "SecretKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saas_api_clients_ClientId",
                table: "saas_api_clients",
                column: "ClientId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saas_api_clients_TenantId_Status",
                table: "saas_api_clients",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_api_clients_WorkspaceId",
                table: "saas_api_clients",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_billing_usage_records_TenantId_Metric_WindowStartUtc",
                table: "saas_billing_usage_records",
                columns: new[] { "TenantId", "Metric", "WindowStartUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_billing_usage_records_WorkspaceId",
                table: "saas_billing_usage_records",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_connector_installations_DataSourceId",
                table: "saas_connector_installations",
                column: "DataSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_connector_installations_TenantId_WorkspaceId_DataSourc~",
                table: "saas_connector_installations",
                columns: new[] { "TenantId", "WorkspaceId", "DataSourceId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saas_connector_installations_WorkspaceId",
                table: "saas_connector_installations",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_context_packages_ContextSnapshotId",
                table: "saas_context_packages",
                column: "ContextSnapshotId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_context_packages_TenantId_PackageKey",
                table: "saas_context_packages",
                columns: new[] { "TenantId", "PackageKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saas_context_packages_WorkspaceId_GeneratedAtUtc",
                table: "saas_context_packages",
                columns: new[] { "WorkspaceId", "GeneratedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_onboarding_states_TenantId_WorkspaceId_StepKey",
                table: "saas_onboarding_states",
                columns: new[] { "TenantId", "WorkspaceId", "StepKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saas_onboarding_states_WorkspaceId",
                table: "saas_onboarding_states",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_tenant_subscriptions_TenantId_Status",
                table: "saas_tenant_subscriptions",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_workspace_members_OperatorAccountId",
                table: "saas_workspace_members",
                column: "OperatorAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_workspace_members_TenantId_WorkspaceId_OperatorAccount~",
                table: "saas_workspace_members",
                columns: new[] { "TenantId", "WorkspaceId", "OperatorAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saas_workspace_members_WorkspaceId",
                table: "saas_workspace_members",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_workspaces_TenantId_IsDefault",
                table: "saas_workspaces",
                columns: new[] { "TenantId", "IsDefault" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_workspaces_TenantId_Slug",
                table: "saas_workspaces",
                columns: new[] { "TenantId", "Slug" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "connector_credentials");

            migrationBuilder.DropTable(
                name: "saas_api_clients");

            migrationBuilder.DropTable(
                name: "saas_billing_usage_records");

            migrationBuilder.DropTable(
                name: "saas_connector_installations");

            migrationBuilder.DropTable(
                name: "saas_context_packages");

            migrationBuilder.DropTable(
                name: "saas_onboarding_states");

            migrationBuilder.DropTable(
                name: "saas_tenant_subscriptions");

            migrationBuilder.DropTable(
                name: "saas_workspace_members");

            migrationBuilder.DropTable(
                name: "saas_workspaces");
        }
    }
}
