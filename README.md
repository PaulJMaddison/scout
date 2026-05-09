# Context Layer

Context Layer is a commercial demo of a universal semantic middleware layer for AI-enabled sales workflows.

Release: `1.0.0`  
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
- a five-step walkthrough for business and technical decision-makers
- a cross-system event timeline that shows how raw operational signals become semantic meaning
- Bootstrap Studio showing how tools like Codex or Claude can analyse source systems, generate a `ContextLayerBlueprint`, and import governed selectors, attributes, data sources, and prompt templates
- a data source view that reinforces the operational system boundary
- a selector builder showing how raw fields become semantic attributes
- a schema registry for the canonical business vocabulary
- a customer context viewer where `User 123` becomes a 360 commercial profile
- an AI playground that generates a grounded outreach strategy, personalized email, and follow-up recommendations
- an audit log showing that reads, recomputes, and AI-visible data access are traceable
- a responsive admin experience verified across laptop, desktop, and mobile viewports

## Screenshot Gallery

These screenshots are captured from the current `v1.0.0` UI running locally in the default SQLite demo mode. They use the seeded `demo` tenant and the Northstar Logistics `User 123` walkthrough.

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

## Fresh Laptop Quick Start

The default demo path is designed for a clean Windows or macOS/Linux laptop. You do not need Docker, PostgreSQL, a global .NET SDK, or a global Node.js install for the standard local demo.

The setup scripts will download repo-local runtimes when needed:

- `.dotnet/` for the .NET 10 SDK
- `.node/` for Node.js and npm
- `.demo-data/` for the two SQLite demo databases
- `.demo-runtime/` for process IDs, logs, and temporary bootstrap files

Those folders are ignored by Git and can be recreated at any time.

### 1. Clone the repository

```powershell
git clone https://github.com/PaulJMaddison/universalcontextlayer.git
cd universalcontextlayer
```

```bash
git clone https://github.com/PaulJMaddison/universalcontextlayer.git
cd universalcontextlayer
```

### 2. Set up and seed the demo

### Windows

```powershell
./scripts/setup-demo.ps1
```

### macOS / Linux

```bash
sh ./scripts/setup-demo.sh
```

The setup command:

1. checks for compatible local tooling
2. downloads repo-local .NET 10 and Node.js if needed
3. creates `.env` and `apps/web/.env.local` if missing
4. creates the local SQLite database directory
5. provisions the operational source database
6. provisions the semantic context database
7. seeds the commercial demo data
8. restores backend tools and dependencies
9. installs frontend dependencies
10. prints URLs, credentials, and sample users

### 3. Start the product

```powershell
./scripts/start-demo.ps1
```

```bash
sh ./scripts/start-demo.sh
```

The start command:

- reseeds the demo if needed
- starts the ASP.NET Core API on `http://127.0.0.1:5198`
- verifies the health endpoint
- verifies login with the seeded admin account
- verifies GraphQL can resolve `User 123`
- starts the Vite web app on `http://127.0.0.1:5173`

### 4. Open the browser

Open:

- [http://127.0.0.1:5173](http://127.0.0.1:5173)

Or use the helper:

```powershell
./scripts/open-demo-browser.ps1
```

Demo login:

- `demo` / `admin@contextlayer.local` / `DemoAdmin123!`
- `demo` / `rep@contextlayer.local` / `DemoSales123!`

## Local Database Modes

### Default local mode

By default, the scripts use two local SQLite databases so the demo downloads and runs on almost any laptop without requiring Docker or a database server:

- `.demo-data/customer_ops_demo.db`
- `.demo-data/context_layer_demo.db`

The product behavior stays the same: operational data remains separate from semantic context data, and the context layer still reads from the operational store and writes governed semantic facts into its own database.

### Optional PostgreSQL package mode

If you want the full Docker-backed package for demos or observability, you can still opt into PostgreSQL explicitly:

```powershell
./scripts/setup-demo.ps1 -UseDocker
./scripts/start-demo.ps1 -UseDocker
```

```bash
sh ./scripts/setup-demo.sh --use-docker
sh ./scripts/start-demo.sh --use-docker
```

That mode provisions:

- `customer_ops_db`
- `context_layer_db`

and brings up the optional observability services as part of the Docker stack.

Use Docker/PostgreSQL when you want to show the same product shape against named PostgreSQL databases. Use the default SQLite path when you want the least friction on a fresh demo laptop.

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

1. Open `Executive Demo` or `/demo`
   Lead with the story: operational systems remain in place, Context Layer creates semantic meaning, AI consumes the grounded package.
2. Step through `Legacy Signals`, `Semantic Timeline`, `AI Interaction Timeline`, and `Rollout and ROI`
   Use these pages as the narrative spine for decision-makers who need to understand business value, technical rollout, and governance.
3. Open `Customer Context` for `User 123`
   Show the readable summary, semantic facts, confidence badges, snapshot history, and the UCL interpretation timeline.
4. Open `Bootstrap Studio`
   Show how Codex or Claude can analyse customer schemas, CRM samples, KPI notes, and support exports to produce a governed import blueprint.
5. Open `Selector Builder`
   Preview `Preferred Channel from Contact Preference` to show how admin-authored logic turns raw source data into a canonical attribute.
6. Open `Agent Playground`
   Generate the grounded outreach strategy and show the cited facts driving the recommendation.
7. Open `Audit Log`
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

## Paid Enterprise Options

The core product in this repository is MIT-licensed and open source. Paid enterprise options are intended for teams that want commercial support, managed deployment, or faster rollout into production environments.

- `Managed SaaS`
  Fully managed hosting for teams that want the semantic layer live quickly without owning the infrastructure, upgrade path, monitoring, backup posture, and day-to-day operations.
- `Private cloud / single-tenant deployment`
  Enterprise deployment in a customer-controlled cloud or VPC with stronger isolation, regional hosting choices, identity integration, and governance controls.
- `On-prem / hybrid deployment`
  A commercial option for companies with legacy databases, regulated workloads, or network constraints that make a shared hosted model impractical.
- `Connector and selector accelerator`
  Paid delivery for custom connectors, source mappings, selector packs, semantic schema design, and production-ready context models for a specific customer estate.
- `AI rollout advisory`
  Workshops and implementation support covering prompt orchestration, governance, business KPI alignment, and how to wire the semantic layer into real product workflows.
- `Enterprise support and SLA`
  Named support, onboarding, troubleshooting help, release guidance, and response expectations for business-critical deployments.

### Commercial Contact

- `Email:` [paul.maddison.delimeg@gmail.com](mailto:paul.maddison.delimeg@gmail.com)
- `Phone:` [+44 7742 031553](tel:+447742031553)

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
- `-KeepVolumes` or `--keep-volumes` to preserve Docker volumes and local `.demo-data` database files

What reset removes by default:

- running API and web demo processes tracked in `.demo-runtime`
- local SQLite database files in `.demo-data`
- Docker containers and volumes when Docker is available

Then it runs setup again and reseeds the demo.

## Testing

The setup scripts install repo-local .NET and Node where needed. On a fresh Windows machine, run setup first, then use the repo-local .NET binary for backend tests:

```powershell
./scripts/setup-demo.ps1
./.dotnet/dotnet.exe test tests/ContextLayer.UnitTests/ContextLayer.UnitTests.csproj --no-restore
./.dotnet/dotnet.exe test tests/ContextLayer.IntegrationTests/ContextLayer.IntegrationTests.csproj --no-restore
```

Frontend checks can then be run from the repository root. If Node.js was installed repo-locally by the setup script, add it to the current terminal first:

```powershell
$nodePath = ./scripts/ensure-node.ps1 -RepoRoot $PWD
$env:PATH = "$nodePath;$env:PATH"
npm run lint --prefix apps/web
npm test --prefix apps/web
npm run test:e2e --prefix apps/web
npm run build --prefix apps/web
```

On macOS/Linux:

```bash
NODE_PATH_DIR="$(sh ./scripts/ensure-node.sh "$PWD")"
export PATH="$NODE_PATH_DIR:$PATH"
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
- responsive layout coverage for login, core admin routes, and mobile walkthrough surfaces

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
