# Buyer FAQ

This page answers common KynticAI Scout questions from CEOs, CTOs, product leaders, and enterprise architects.

## CEOs

### What does Scout do in one sentence?

KynticAI Scout turns exact authorised customer data into governed data items, relationships, attribution paths, and local JSON that customer-owned AI tools, workflows, apps, reports, local LLMs, and agents can use.

### Why should we care now?

Most companies already have valuable operational data, but it is trapped across CRM, ERP, SQL, support, billing, files, emails, product telemetry, and older systems. Scout helps prove one high-value workflow without waiting for a replatforming programme.

### Are we buying an AI tool?

No. We do not build the brain. We build the customer-owned data plane. Customers can bring their own local/open-source AI stack, workflow engine, reporting layer, or internal apps. Scout supplies governed exact items, relationships, attribution paths, and context; private extensions can add advanced relationship analysis when included.

### What can we buy now?

The sellable offer today is a supported paid pilot: discovery, customer data-plane setup, selected source paths or safe exports, selector mappings, context facts, provenance review, one downstream consumer, executive playback, and technical handover.

## CTOs

### Where does customer data live?

Operational data, connector credentials, customer-specific mappings, exact linked records, relationships, attribution paths, selectors, facts, snapshots, local evidence packages, and audit logs stay in the customer-controlled data plane by default. Optional Cloud/control-plane services should receive commercial metadata only by default.

For the sales walkthrough, exact authorised data includes normalised email address, CRM contact/account, account registration/profile, sales activity, opportunities, email replies, meetings booked, web conversion and pricing-page events, support tickets, product usage summaries, billing health, and prior won/lost outcome signals.

### Do we need to replace systems?

No. Scout sits beside systems of record and exposes a semantic layer above them. The point is to make existing data useful through a stable context contract.

### What API surfaces exist?

The open core exposes GraphQL, REST v1, TypeScript SDK usage, C# SDK usage, machine-to-machine auth, selector preview/validation, recompute requests, audit/provenance lookup, and governed context/evidence package retrieval. See [Public API Contract](public-api-contract.md).

### Is this production SaaS?

Not in this public repo. The repo is open core and can support local demos, backend-only work, self-hosted foundations, and implementation-led pilots. Full self-serve hosted SaaS, hosted billing, production licence portals, and managed control-plane operations remain private/future work.

## Product Leaders

### What workflow should we prove first?

Pick one workflow where existing data already affects a decision but is hard to reuse safely. Examples include B2B SaaS sales next-best action, ecommerce abandoned basket recovery, support churn prevention, healthcare operations using synthetic/non-clinical examples, recruitment candidate matching, finance/customer retention without regulated advice claims, onboarding state, or product-led expansion.

### How does this help an AI feature?

The AI or workflow receives scoped facts with confidence, freshness, evidence, exact-record citations, similar-pattern references, relationships, attribution paths, masking decisions, and guardrails instead of a heap of raw records. Scout can retrieve a governed context package or next-action relationship JSON without calling an AI model itself. Private extensions can compare similar relationship sets and return governed JSON for an LLM explanation.

### What does success look like?

One downstream consumer can make a better, more explainable recommendation because it uses governed evidence rather than direct joins, copied exports, or unsupported prompt claims. Use honest language such as "increase conversion probability", "recommend the next-best action", or "surface patterns linked to successful outcomes".

## Enterprise Architects

### What is the architecture pattern?

Scout has a customer data plane beside source systems and an optional Cloud/control-plane relationship for commercial metadata. The data plane owns source access, exact linked records, relationships, attribution paths, selectors, facts, snapshots, local JSON packages, APIs, provenance, audit, masking, and local configuration.

### How do we handle vendor connectors?

The public repo includes generic SQL, REST, CSV, mock connectors, catalogue metadata, extension points, `BasicRelationshipEngine` fallback signals, and proof-mode private-extension handoff artefacts. Real paid vendor connector implementations, advanced private analysis, and customer-specific mappings belong in private scope and should be commercially agreed per customer.

### What should not be promised yet?

Do not promise a complete self-serve SaaS product, live hosted billing, production SSO/SCIM/SAML, vendor-certified connector packs, managed enterprise operations, or complete workspace-scoped context isolation from the public repo alone.

### What should be shown in a sales call?

Show the local demo first, then the backend API flow. Walk through fragmented operational data, selector mapping, exact linked records, relationships, attribution-path evidence, context facts, provenance, governed next-action JSON, and a downstream workflow decision. Close by explaining the paid pilot scope and open-core boundary.
