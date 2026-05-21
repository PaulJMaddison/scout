using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KynticAI.Scout.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SourceSystemEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "source_system_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    SourceSystem = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    EventType = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    ExternalUserId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ExternalAccountId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UserProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                    DataSourceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: false),
                    HeadersJson = table.Column<string>(type: "jsonb", nullable: false),
                    ProcessingSummary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    DeadLetterReason = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    MatchedSelectorCount = table.Column<int>(type: "integer", nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ReceivedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ObservedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeadLetteredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_source_system_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_source_system_events_data_sources_DataSourceId",
                        column: x => x.DataSourceId,
                        principalTable: "data_sources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_source_system_events_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_source_system_events_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_source_system_events_user_profiles_UserProfileId",
                        column: x => x.UserProfileId,
                        principalTable: "user_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_source_system_events_DataSourceId",
                table: "source_system_events",
                column: "DataSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_source_system_events_TenantId_ReceivedAtUtc",
                table: "source_system_events",
                columns: new[] { "TenantId", "ReceivedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_source_system_events_TenantId_SourceSystem_EventId",
                table: "source_system_events",
                columns: new[] { "TenantId", "SourceSystem", "EventId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_source_system_events_TenantId_Status_ReceivedAtUtc",
                table: "source_system_events",
                columns: new[] { "TenantId", "Status", "ReceivedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_source_system_events_UserProfileId",
                table: "source_system_events",
                column: "UserProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_source_system_events_WorkspaceId",
                table: "source_system_events",
                column: "WorkspaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "source_system_events");
        }
    }
}
