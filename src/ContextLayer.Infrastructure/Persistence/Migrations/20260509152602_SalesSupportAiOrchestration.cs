using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ContextLayer.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SalesSupportAiOrchestration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeveloperPrompt",
                table: "prompt_templates",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "AttemptCount",
                table: "agent_runs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "agent_runs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SalesObjective",
                table: "agent_runs",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeveloperPrompt",
                table: "prompt_templates");

            migrationBuilder.DropColumn(
                name: "AttemptCount",
                table: "agent_runs");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "agent_runs");

            migrationBuilder.DropColumn(
                name: "SalesObjective",
                table: "agent_runs");
        }
    }
}
