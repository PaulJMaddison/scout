using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KynticAI.Scout.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DualDatabaseCommercialDemoUpgrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "operator_accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LastLoginAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_operator_accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_operator_accounts_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "provenance_metadata",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SelectorExecutionId = table.Column<Guid>(type: "uuid", nullable: true),
                    ContextFactId = table.Column<Guid>(type: "uuid", nullable: true),
                    Kind = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SourceRecordKey = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    MetadataJson = table.Column<string>(type: "jsonb", nullable: false),
                    ObservedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_provenance_metadata", x => x.Id);
                    table.ForeignKey(
                        name: "FK_provenance_metadata_context_facts_ContextFactId",
                        column: x => x.ContextFactId,
                        principalTable: "context_facts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_provenance_metadata_selector_executions_SelectorExecutionId",
                        column: x => x.SelectorExecutionId,
                        principalTable: "selector_executions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "recompute_jobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    TriggeredBy = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SelectorExecutionCount = table.Column<int>(type: "integer", nullable: false),
                    Summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    MetadataJson = table.Column<string>(type: "jsonb", nullable: false),
                    RequestedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recompute_jobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_recompute_jobs_user_profiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "user_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_operator_accounts_TenantId_Email",
                table: "operator_accounts",
                columns: new[] { "TenantId", "Email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_provenance_metadata_ContextFactId",
                table: "provenance_metadata",
                column: "ContextFactId");

            migrationBuilder.CreateIndex(
                name: "IX_provenance_metadata_SelectorExecutionId",
                table: "provenance_metadata",
                column: "SelectorExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_provenance_metadata_TenantId_Kind_ObservedAtUtc",
                table: "provenance_metadata",
                columns: new[] { "TenantId", "Kind", "ObservedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_recompute_jobs_TenantId_CorrelationId",
                table: "recompute_jobs",
                columns: new[] { "TenantId", "CorrelationId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_recompute_jobs_UserProfileId",
                table: "recompute_jobs",
                column: "UserProfileId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "operator_accounts");

            migrationBuilder.DropTable(
                name: "provenance_metadata");

            migrationBuilder.DropTable(
                name: "recompute_jobs");
        }
    }
}
