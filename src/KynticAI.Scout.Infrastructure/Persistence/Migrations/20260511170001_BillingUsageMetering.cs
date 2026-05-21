using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KynticAI.Scout.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BillingUsageMetering : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "saas_billing_plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Plan = table.Column<int>(type: "integer", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    BillingProviderPlanReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_billing_plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "saas_billing_plan_limits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BillingPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Metric = table.Column<int>(type: "integer", nullable: false),
                    Limit = table.Column<long>(type: "bigint", nullable: true),
                    Window = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Enforcement = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_billing_plan_limits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_billing_plan_limits_saas_billing_plans_BillingPlanId",
                        column: x => x.BillingPlanId,
                        principalTable: "saas_billing_plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_saas_billing_plan_limits_BillingPlanId_Metric",
                table: "saas_billing_plan_limits",
                columns: new[] { "BillingPlanId", "Metric" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_saas_billing_plans_IsPublic_SortOrder",
                table: "saas_billing_plans",
                columns: new[] { "IsPublic", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_saas_billing_plans_Plan",
                table: "saas_billing_plans",
                column: "Plan",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "saas_billing_plan_limits");

            migrationBuilder.DropTable(
                name: "saas_billing_plans");
        }
    }
}
