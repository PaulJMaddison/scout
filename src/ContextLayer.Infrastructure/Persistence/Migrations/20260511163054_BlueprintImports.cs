using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ContextLayer.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BlueprintImports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "saas_blueprint_imports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BlueprintJson = table.Column<string>(type: "jsonb", nullable: false),
                    ContentHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    UploadedBy = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    ValidationIssuesJson = table.Column<string>(type: "jsonb", nullable: false),
                    PreviewJson = table.Column<string>(type: "jsonb", nullable: false),
                    ImportSummaryJson = table.Column<string>(type: "jsonb", nullable: false),
                    UploadedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ValidatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_blueprint_imports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_blueprint_imports_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "saas_audit_policies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BlueprintImportId = table.Column<Guid>(type: "uuid", nullable: true),
                    Key = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    PolicyJson = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_audit_policies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_audit_policies_saas_blueprint_imports_BlueprintImportId",
                        column: x => x.BlueprintImportId,
                        principalTable: "saas_blueprint_imports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "saas_pii_rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BlueprintImportId = table.Column<Guid>(type: "uuid", nullable: true),
                    Key = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    RuleJson = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_pii_rules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_pii_rules_saas_blueprint_imports_BlueprintImportId",
                        column: x => x.BlueprintImportId,
                        principalTable: "saas_blueprint_imports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_saas_audit_policies_BlueprintImportId",
                table: "saas_audit_policies",
                column: "BlueprintImportId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_audit_policies_TenantId_Key",
                table: "saas_audit_policies",
                columns: new[] { "TenantId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saas_blueprint_imports_TenantId_ContentHash",
                table: "saas_blueprint_imports",
                columns: new[] { "TenantId", "ContentHash" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_blueprint_imports_TenantId_CreatedAtUtc",
                table: "saas_blueprint_imports",
                columns: new[] { "TenantId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_blueprint_imports_WorkspaceId",
                table: "saas_blueprint_imports",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_pii_rules_BlueprintImportId",
                table: "saas_pii_rules",
                column: "BlueprintImportId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_pii_rules_TenantId_Key",
                table: "saas_pii_rules",
                columns: new[] { "TenantId", "Key" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "saas_audit_policies");

            migrationBuilder.DropTable(
                name: "saas_pii_rules");

            migrationBuilder.DropTable(
                name: "saas_blueprint_imports");
        }
    }
}
