# UCL exact-data relationship intelligence proof

Generated on 16 June 2026 for KynticAI Scout.

## Scope

This local proof demonstrates exact-data relationship intelligence using synthetic operational data only. It covers B2B SaaS revenue/customer success, ecommerce conversion, support churn, recruitment, finance retention, and healthcare operations.

These are proof fixtures, not customer production deployments. They do not contain customer data, patient data, candidate records, financial account data, credentials, vendor sandbox output, production SLA evidence, or customer traction claims.

The source fixture is `samples/relationship-intelligence/exact-data-proof.synthetic.json`. The executable proof is `tests/KynticAI.Scout.IntegrationTests/RelationshipIntelligenceProofIntegrationTests.cs`.

B2B SaaS remains the primary demo path. Use `mara.singh@northstar-saas.example` / Northstar Analytics first when demonstrating the wedge because it combines revenue, customer-success, product-usage, support-history, billing-health, similar outcomes, governance, and next-best-action evidence in one commercial workflow.

## Synthetic dataset

The proof dataset includes:

- Accounts and contacts for all six requested domains.
- Registrations represented as `CustomerUser` activation and last-seen records.
- Email engagement events, web conversion events, support tickets, product usage summaries, billing metrics, sales opportunities, and closed won/lost outcomes.
- Per-domain blocker examples, positive signals, expected similar won/lost outcomes, governance/masking examples, and expected next-best action.
- A thin healthcare operations edge case that proves insufficient-data caveats separately from the fully covered healthcare operations proof subject.
- No live customer data, patient data, candidate records, financial account data, credentials, or external service dependencies.

The scale proof generates 1,100 additional synthetic accounts with 1,100 contacts, 1,100 registrations, 2,200 email events, 2,200 web events, 1,100 usage summaries, 1,100 billing metrics, and 1,100 opportunities.

Related private Enterprise fixtures were inspected during this proof pass to check shape alignment: a Scout evidence-adapter golden fixture, synthetic industry-demo summaries, connector safety fixtures, and the Rust pipeline synthetic dataset. Those remain private/in-memory or mock proof artefacts and are not copied here or represented as production deployments.

## Functional proof output

The REST proof calls `/api/v1/intelligence/next-action` and verifies:

- Email to linked evidence: `mara.singh@northstar-saas.example` resolves to a contact, account, email engagement, web conversion, support history, usage, billing, and deterministic relationships with citation ids.
- Similar won/lost cohorts: every focused domain returns a won cohort and a lost cohort with probabilistic relationship evidence.
- Domain proof shapes: each focused domain returns exact linked records, deterministic relationships, positive signals, blocker signals, similar outcomes, governance/masking behaviour, and the expected next-best action.
- Governance masking: read-only access masks direct identifiers in local evidence and keeps cloud-control-plane payloads aggregate-only.
- Stale, conflicting, and insufficient data: caveats are returned for stale recruitment evidence, support-churn conflicts, and the thin healthcare operations edge case.
- Evidence-pack citations: recommended-action citations are asserted to exist in provenance.
- Scale: the service returns bounded evidence from thousands of synthetic records rather than dumping raw records.

## Validation

Commands run:

- `dotnet restore .\KynticAI.Scout.slnx`
- `dotnet build .\KynticAI.Scout.slnx`
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build`
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-build`
- `dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --filter RelationshipIntelligenceProofIntegrationTests`
- `dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --no-build --filter RelationshipIntelligenceProofIntegrationTests`
- `Get-Content -Raw -Path 'samples\relationship-intelligence\exact-data-proof.synthetic.json' | ConvertFrom-Json | Out-Null`
- `git diff --check`

Result:

- Restore: succeeded
- Build: succeeded with 0 warnings and 0 errors
- Unit tests: passed 62
- SDK tests: passed 12
- Focused relationship-intelligence integration proof: passed 7
- JSON fixture parse: succeeded
- Diff whitespace check: succeeded with LF-to-CRLF warnings from existing dirty working-tree files
- Failed: 0
- Skipped: 0
- External services: none
- Docker/PostgreSQL/browser proof: not run
