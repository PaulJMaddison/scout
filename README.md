# Context Layer

Context Layer is a commercial demo of a universal semantic middleware layer for AI-enabled sales workflows.

Release: `0.1.1`  
License: [MIT](LICENSE)  
Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)  
Security: [SECURITY.md](SECURITY.md)

It is built to make one point obvious in a few clicks:

- companies already have valuable customer data spread across legacy CRM, usage, billing, support, and web systems
- most teams cannot replatform those systems before they want to ship AI features
- raw IDs and disconnected tables are a poor interface for AI
- a reusable semantic context layer turns fragmented operational signals into grounded business meaning
- AI features become more useful because they receive structured profiles with confidence, freshness, and provenance instead of vague identifiers

It is meant to work for commercial and technical decision-makers alike:

- business leaders can see the revenue and workflow impact
- CTOs can see the integration, governance, and rollout story
- platform teams can see how legacy systems stay in place while AI gets a cleaner contract

## Why This Demo Matters

This repo deliberately separates two databases:

- `customer_ops_db`
  This is the operational source-of-truth estate. It holds accounts, contacts, users, subscriptions, products, plans, opportunities, sales activity, email engagement, support tickets, product usage summaries, billing metrics, and web conversion events.
- `context_layer_db`
  This is the semantic context platform. It holds tenants, data sources, selector definitions, selector execution history, semantic attribute definitions, context snapshots, context facts, prompt templates, agent runs, audit events, recompute jobs, and provenance metadata.

The application reads from `customer_ops_db`, applies admin-defined selector logic, and writes canonical semantic facts into `context_layer_db`.

That is the commercial value of the middleware:

- the customer keeps existing operational systems
- the semantic contract becomes reusable across product features
- AI gets grounded, explainable inputs instead of brittle point-to-point joins

## What You Can Show In The Demo

- an executive-friendly landing experience at `/demo`
- a cross-system event timeline that shows how raw operational signals become semantic meaning
- an AI-assisted onboarding section showing how tools like Codex or Claude can draft the discovery report, semantic blueprint, and selector candidates that feed UCL
- a data source view that reinforces the operational system boundary
- a selector builder showing how raw fields become semantic attributes
- a schema registry for the canonical business vocabulary
- a customer context viewer where `User 123` becomes a 360 commercial profile
- an AI playground that generates a grounded outreach strategy, personalized email, and follow-up recommendations
- an audit log showing that reads, recomputes, and AI-visible data access are traceable

## Screenshot Gallery

| Executive demo | Overview |
| --- | --- |
| ![Executive demo landing](docs/images/demo-mode-landing.png) | ![Overview dashboard](docs/images/dashboard-overview.png) |

| Data sources | Selector builder |
| --- | --- |
| ![Data source management](docs/images/data-sources.png) | ![Selector builder preview](docs/images/selector-builder.png) |

| Schema registry | Customer context viewer |
| --- | --- |
| ![Semantic schema registry](docs/images/semantic-schema-registry.png) | ![Customer context viewer](docs/images/customer-context-viewer.png) |

| UCL event timeline | AI-assisted onboarding |
| --- | --- |
| ![Cross-system context timeline](docs/images/ucl-timeline.png) | ![AI-assisted onboarding blueprint](docs/images/ai-bootstrap-onboarding.png) |

| AI playground | Audit log |
| --- | --- |
| ![AI sales playground](docs/images/ai-playground.png) | ![Audit log](docs/images/audit-log-or-provenance.png) |

## Architecture At A Glance

- Frontend
  React 19, Vite, TypeScript, TanStack Router, TanStack Query, React Hook Form, Zod, Tailwind
- Backend
  ASP.NET Core .NET 10, Hot Chocolate GraphQL, EF Core, FluentValidation, OpenTelemetry
- Data layer
  Dual-database architecture with operational source data separated from semantic context data
- AI orchestration
  Grounded context packages, structured JSON outputs, citation requirements, confidence handling, provenance, audit logging

## Seeded Commercial Story

The bootstrap seeds a realistic B2B SaaS sales environment with:

- 2 tenants
- 30 accounts
- 80 contacts and product users
- 50 opportunities
- 200 sales activities
- 560 product usage rows
- 100 support tickets
- 100+ email engagement events
- 120 billing records
- 120 conversion and lifecycle events

Five accounts are deeply fleshed out:

- `Northstar Logistics`
- `Harbor Health Systems`
- `Atlas Legal Cloud`
- `Meridian Industrial Robotics`
- `Cedar Financial Group`

The strongest walkthrough record is:

- `demo` tenant
- `User 123`
- `Avery Stone`
- `Northstar Logistics`

That record resolves into semantic attributes such as:

- `conversionProbability`
- `preferredChannel`
- `planInterest`
- `engagementLevel`
- `churnRisk`
- `expansionPotential`
- `budgetReadiness`
- `decisionMakerLikelihood`
- `productFit`
- `recommendedSalesMotion`

The data is internally consistent on purpose. For example:

- high product usage and feature adoption increase expansion potential
- repeated pricing-page visits increase enterprise plan interest
- strong email engagement reinforces preferred outreach channel
- open support issues can weaken confidence or increase review flags
- billing and opportunity signals affect budget readiness and urgency

## Local Startup

### Windows

```powershell
./scripts/setup-demo.ps1
./scripts/start-demo.ps1
```

### macOS / Linux

```bash
sh ./scripts/setup-demo.sh
sh ./scripts/start-demo.sh
```

The setup scripts are idempotent where possible. They:

1. verify Docker, .NET, Node, and npm
2. copy `.env.example` to `.env` when needed
3. copy `apps/web/.env.example` to `apps/web/.env.local` when needed
4. choose the best local database path
5. provision the two demo databases
6. apply migrations or create the local fallback databases
7. seed operational and semantic demo data
8. restore backend tools and dependencies
9. install frontend dependencies
10. print the live URLs and credentials

### PostgreSQL vs local fallback

When Docker is available, the scripts provision PostgreSQL and create:

- `customer_ops_db`
- `context_layer_db`

When Docker is not available, the demo still keeps the same commercial split using two local databases:

- `.demo-data/customer_ops_demo.db`
- `.demo-data/context_layer_demo.db`

The product behavior stays the same: operational data remains separate from semantic context data.

## Verified Local URLs

- Web app: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API base: [http://127.0.0.1:5198](http://127.0.0.1:5198)
- GraphQL endpoint: [http://127.0.0.1:5198/graphql](http://127.0.0.1:5198/graphql)
- Health endpoint: [http://127.0.0.1:5198/health](http://127.0.0.1:5198/health)

Optional observability services are available when the Docker stack is active:

- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Tempo: `http://localhost:3200`

## Demo Credentials

- `demo` / `admin@contextlayer.local` / `DemoAdmin123!`
- `demo` / `rep@contextlayer.local` / `DemoSales123!`
- `summit` / `admin@summit.contextlayer.local` / `SummitAdmin123!`
- `summit` / `rep@summit.contextlayer.local` / `SummitSales123!`

## Best Demo Records

- `demo` / `123` / `Avery Stone` / `Northstar Logistics`
- `demo` / `126` / `Priya Nwosu` / `Harbor Health Systems`
- `demo` / `129` / `Marcus Bell` / `Atlas Legal Cloud`
- `summit` / `132` / `Elena Petrov` / `Meridian Industrial Robotics`
- `summit` / `135` / `Calvin Reese` / `Cedar Financial Group`

## Recommended Walkthrough

Start with the seeded admin account.

1. Open `/demo`
   Lead with the story: operational systems remain in place, Context Layer creates semantic meaning, AI consumes the grounded package. Use the cross-system timeline, the ROI panel, and the AI-assisted onboarding section on this page as the narrative anchor.
2. Open `Customer Context` for `User 123`
   Show the readable summary, semantic facts, confidence badges, snapshot history, and the UCL interpretation timeline.
3. Open `Selector Builder`
   Preview `Preferred Channel from Contact Preference` to show how admin-authored logic turns raw source data into a canonical attribute.
4. Open `Agent Playground`
   Generate the grounded outreach strategy and show the cited facts driving the recommendation.
5. Open `Audit Log`
   Close with governance: reads, recomputes, and AI activity are traceable.

## How The Product Works End To End

1. Operational data lands in `customer_ops_db`.
2. Data sources expose those signals to the selector engine.
3. Selectors apply direct field mappings, thresholds, weighted scoring, formulas, enum normalization, and conflict resolution.
4. Selector executions persist raw payloads, validation results, confidence, freshness, and provenance.
5. Canonical context facts are written into `context_layer_db`.
6. Context snapshots assemble those facts into reusable business profiles.
7. The AI orchestration layer builds a grounded context package for the selected user and sales objective.
8. The model returns structured JSON for:
   - outreach strategy
   - personalized email draft
   - follow-up recommendations
9. The UI shows exactly why the recommendation exists, including citations and low-confidence warnings.

## Open Source Use

This repository is released under the [MIT License](LICENSE). That means other teams can use, study, modify, and extend the project freely, including for commercial evaluation and internal product development.

If you build on top of Context Layer, please keep the license notice intact and document any meaningful architectural changes for future contributors.

## Example GraphQL Queries

More examples live in [samples/graphql/demo-queries.graphql](samples/graphql/demo-queries.graphql).

### User context lookup

```graphql
query DemoContextViewer {
  userContext(input: { tenantSlug: "demo", externalUserId: "123" }) {
    fullName
    companyName
    summary
    overallConfidence
    sourceSummary {
      accountName
      activePlanName
      pricingPageVisits30d
    }
    facts {
      attributeKey
      confidence
      explanation
    }
  }
}
```

### Grounded AI context package

```graphql
query DemoSalesContextPackage {
  salesContextPackage(
    input: {
      tenantSlug: "demo"
      externalUserId: "123"
      salesObjective: "Book a 20-minute discovery call for enterprise rollout next week."
    }
  ) {
    summary
    overallConfidence
    humanReviewRecommended
    facts {
      citationId
      displayName
      confidence
      explanation
    }
  }
}
```

## Restart And Reset

### Restart

```powershell
./scripts/start-demo.ps1
```

```bash
sh ./scripts/start-demo.sh
```

### Reset and reseed

```powershell
./scripts/reset-demo.ps1
```

```bash
sh ./scripts/reset-demo.sh
```

Useful reset options:

- `-SkipRecreate` or `--skip-recreate` to stop without reseeding
- `-KeepVolumes` or `--keep-volumes` to preserve database volumes when Docker is active

## Testing

Backend:

```powershell
dotnet test ContextLayer.slnx
```

Frontend:

```powershell
npm run lint --prefix apps/web
npm test --prefix apps/web
npm run test:e2e --prefix apps/web
npm run build --prefix apps/web
```

The automated coverage includes:

- backend unit tests for selector logic and AI output validation
- integration tests for dual-database connectivity, selector execution, context snapshot generation, GraphQL context lookup, and grounded AI output
- frontend component tests
- frontend end-to-end flows for selector preview and outreach recommendation generation

## Honest Demo Note

The seeded AI experience currently uses a deterministic mock structured provider so the demo is stable, grounded, and repeatable on any local machine. The orchestration layer, prompt templates, JSON schema validation, provenance, retry behavior, and audit trail are all real. A live external provider can be swapped in without changing the product surface.

## Commercial Architecture Note

The GraphQL-based semantic context layer is a strong fit for AI-enabled sales workflows because it gives downstream product features one stable contract over changing operational systems.

In a real customer environment, many source systems can feed one context platform:

- CRM
- support
- billing
- product telemetry
- warehouse tables
- marketing automation

GraphQL becomes the ideal delivery interface because it lets each workflow request exactly the context shape it needs without forcing every AI feature to understand every legacy schema. The selectors and semantic attributes can evolve independently of the operational systems, while masking, provenance, confidence, and audit stay centralized in one layer.

## ADR

The short architecture decision record is in [docs/adr/0001-graphql-semantic-context-layer.md](docs/adr/0001-graphql-semantic-context-layer.md).
