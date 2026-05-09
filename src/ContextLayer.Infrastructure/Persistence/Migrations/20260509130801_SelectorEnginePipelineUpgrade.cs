using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ContextLayer.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SelectorEnginePipelineUpgrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExecutionMode",
                table: "selector_executions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PipelineTraceJson",
                table: "selector_executions",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RawSourceDataJson",
                table: "selector_executions",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ValidationErrorsJson",
                table: "selector_executions",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "FreshnessWindowMinutes",
                table: "selector_definitions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "selector_definitions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ScheduleIntervalMinutes",
                table: "selector_definitions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ValidationSchemaJson",
                table: "selector_definitions",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "FreshUntilUtc",
                table: "context_facts",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExecutionMode",
                table: "selector_executions");

            migrationBuilder.DropColumn(
                name: "PipelineTraceJson",
                table: "selector_executions");

            migrationBuilder.DropColumn(
                name: "RawSourceDataJson",
                table: "selector_executions");

            migrationBuilder.DropColumn(
                name: "ValidationErrorsJson",
                table: "selector_executions");

            migrationBuilder.DropColumn(
                name: "FreshnessWindowMinutes",
                table: "selector_definitions");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "selector_definitions");

            migrationBuilder.DropColumn(
                name: "ScheduleIntervalMinutes",
                table: "selector_definitions");

            migrationBuilder.DropColumn(
                name: "ValidationSchemaJson",
                table: "selector_definitions");

            migrationBuilder.DropColumn(
                name: "FreshUntilUtc",
                table: "context_facts");
        }
    }
}
