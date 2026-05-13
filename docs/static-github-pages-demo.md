# Static GitHub Pages Demo

The static GitHub Pages demo is a backend-free Universal Context Layer brochure, sales, and marketing site. It uses fixed TypeScript fixtures to show how existing business data becomes semantic context for AI, applications, reports, and workflows.

The demo leads with the product narrative: we do not build the brain, we build the nervous system. UCL sits beside customer systems and exposes governed context to the customer's own tools.

It is deliberately separate from the full product experience. The public repository still contains the functional React application, backend, APIs, SDKs, selectors, seeded demo, and local setup path that teams can download and run to use the product.

Live demo URL: [https://pauljmaddison.github.io/universalcontextlayer/](https://pauljmaddison.github.io/universalcontextlayer/)

## How it differs from the full local app

The full local app can authenticate users, call the API, run selectors, recompute snapshots, use databases, and exercise the seeded backend demo. It is the product experience.

The static demo does none of that. It is a published snapshot for GitHub Pages, buyer education, sales conversations, and marketing. It uses the same professional brand direction and visual language as the React site, but it does not run Docker, SQLite, PostgreSQL, background workers, setup scripts, or live connector code.

## How to build

From `apps/web`:

```powershell
npm install
npm run build:static-demo
```

The build output is written to `apps/web/dist-static-demo`.

By default the build uses the GitHub Pages base path `/universalcontextlayer/`. To publish under another repository or domain path, set `VITE_PAGES_BASE`:

```powershell
$env:VITE_PAGES_BASE='/my-repo/'
npm run build:static-demo
```

For a custom domain at the site root, use:

```powershell
$env:VITE_PAGES_BASE='/'
npm run build:static-demo
```

## How to preview locally

From `apps/web`:

```powershell
npm run preview:static-demo
```

Vite previews the generated static files, normally at `http://127.0.0.1:4174/universalcontextlayer/`.

## Captured verification screenshots

The current static demo has been captured at laptop and mobile widths:

![Static demo laptop screenshot](images/static-demo-laptop.png)

![Static demo mobile screenshot](images/static-demo-mobile.png)

## How to publish manually to GitHub Pages

This repository intentionally does not need a paid CI setup or a GitHub Actions workflow for the static demo.

One manual publishing option:

1. Build the demo with `npm run build:static-demo`.
2. Copy the contents of `apps/web/dist-static-demo` to the branch or folder your repository uses for GitHub Pages.
3. In GitHub repository settings, configure Pages to publish from that branch or folder.
4. Keep the base path aligned with the repository path, for example `/universalcontextlayer/`.

The build also creates `index.html` and `404.html` from the static demo shell so GitHub Pages has a root document and a fallback page.

The build also emits `.nojekyll` so GitHub Pages serves the Vite asset folder without Jekyll processing.

## What data is included

The fixture data includes:

- a fictional featured account, `Northstar Logistics`
- a fictional featured person, `User 123 / Avery Stone`
- raw operational signals from CRM, product usage, support, billing, email engagement, and web events
- a SQL/customer record signal showing that legacy database rollups can contribute context without replatforming
- semantic attributes such as `conversionProbability`, `preferredChannel`, `planInterest`, `engagementLevel`, `churnRisk`, `expansionPotential`, `budgetReadiness`, `decisionMakerLikelihood`, `productFit`, and `recommendedSalesMotion`
- context facts with value, type, confidence, timestamp, provenance, freshness, explanation, and source selector
- a context snapshot with tenant, workspace, freshness, governance, and source-system metadata
- selector definitions for direct mapping, enum mapping, weighted scoring, threshold classification, formula-derived metrics, and composite classification
- an AI-safe context package that explicitly says UCL does not need to call an AI model
- a static downstream workflow decision, business outcome, outreach strategy, personalised email, follow-up recommendations, citations, confidence notes, and hallucination guardrails
- audit and provenance timeline entries
- an interaction timeline showing raw signal, semantic interpretation, AI advice, action, and result
- ROI and commercial proof points covering pilot scope, integration reuse, governance proof, and legacy preservation

## What is fictional

All customer names, people, domains, events, scores, recommendations, and email copy in the static demo are fictional. The demo uses example-style domains and masked contact details. It must not be treated as live customer data or a named case study.

## What it proves

The static demo proves the product story can be understood without local setup:

- existing business systems can stay in place
- selectors can turn raw operational signals into governed semantic facts
- the customer data plane owns source access, selectors, facts, snapshots, provenance, and audit by default
- context facts can carry confidence, provenance, freshness, masking, and explanations
- downstream AI, workflow, product, and reporting consumers can receive grounded context packages instead of raw records
- GraphQL, REST, SDK, and context package contracts can explain how another system consumes the context
- a paid pilot can prove one useful workflow before wider enterprise connector work
- the open-core and paid-pilot boundary can be explained clearly

## What it does not prove

The static demo does not prove backend availability, database migrations, connector execution, authentication, tenant isolation, production operations, or SaaS readiness. Those remain part of the full local app, integration tests, deployment runbooks, and paid-pilot implementation work.
