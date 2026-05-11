using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ContextLayer.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ConnectorCatalogue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "saas_connector_catalogue_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConnectorType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Category = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Availability = table.Column<int>(type: "integer", nullable: false),
                    SupportedDataSourceKindsJson = table.Column<string>(type: "jsonb", nullable: false),
                    CapabilitiesJson = table.Column<string>(type: "jsonb", nullable: false),
                    ConfigurationSchemaJson = table.Column<string>(type: "jsonb", nullable: false),
                    CredentialSchemaJson = table.Column<string>(type: "jsonb", nullable: false),
                    HealthCheckMode = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    IsPlaceholder = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_connector_catalogue_entries", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_saas_connector_catalogue_entries_Availability_SortOrder",
                table: "saas_connector_catalogue_entries",
                columns: new[] { "Availability", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_connector_catalogue_entries_ConnectorType",
                table: "saas_connector_catalogue_entries",
                column: "ConnectorType",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "saas_connector_catalogue_entries");
        }
    }
}
