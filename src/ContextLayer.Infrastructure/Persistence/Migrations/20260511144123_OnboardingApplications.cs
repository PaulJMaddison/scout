using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ContextLayer.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OnboardingApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "saas_onboarding_applications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: true),
                    AdminOperatorAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    OrganisationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TenantSlug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PrimaryWorkspaceName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AdminEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    AdminDisplayName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IntendedUseCase = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    SourceSystemsJson = table.Column<string>(type: "jsonb", nullable: false),
                    DataCategoriesJson = table.Column<string>(type: "jsonb", nullable: false),
                    AiUseCasesJson = table.Column<string>(type: "jsonb", nullable: false),
                    PiiSensitivityLevel = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    PreferredDeploymentMode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Status = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NextStepsJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saas_onboarding_applications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saas_onboarding_applications_operator_accounts_AdminOperato~",
                        column: x => x.AdminOperatorAccountId,
                        principalTable: "operator_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_saas_onboarding_applications_saas_workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "saas_workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_saas_onboarding_applications_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_saas_onboarding_applications_AdminOperatorAccountId",
                table: "saas_onboarding_applications",
                column: "AdminOperatorAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_onboarding_applications_TenantId",
                table: "saas_onboarding_applications",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_saas_onboarding_applications_TenantSlug",
                table: "saas_onboarding_applications",
                column: "TenantSlug");

            migrationBuilder.CreateIndex(
                name: "IX_saas_onboarding_applications_WorkspaceId",
                table: "saas_onboarding_applications",
                column: "WorkspaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "saas_onboarding_applications");
        }
    }
}
