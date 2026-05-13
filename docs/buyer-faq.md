# Buyer FAQ

This page answers common Universal Context Layer questions from CEOs, CTOs, product leaders, and enterprise architects.

## CEOs

### What does UCL do in one sentence?

Universal Context Layer turns existing business data into trusted semantic context that customer-owned AI tools, workflows, apps, reports, and agents can use.

### Why should we care now?

Most companies already have valuable operational data, but it is trapped across CRM, ERP, SQL, support, billing, files, emails, product telemetry, and older systems. UCL helps prove one high-value workflow without waiting for a replatforming programme.

### Are we buying an AI tool?

No. We do not build the brain. We build the nervous system. Customers can bring their own AI stack, workflow engine, reporting layer, or internal apps. UCL supplies governed business context.

### What can we buy now?

The sellable offer today is a supported paid pilot: discovery, customer data-plane setup, selected source paths or safe exports, selector mappings, context facts, provenance review, one downstream consumer, executive playback, and technical handover.

## CTOs

### Where does customer data live?

Operational data, connector credentials, selectors, facts, snapshots, packages, and audit logs stay in the customer-controlled data plane by default. Optional hosted control-plane services should receive commercial metadata only by default.

### Do we need to replace systems?

No. UCL sits beside systems of record and exposes a semantic layer above them. The point is to make existing data useful through a stable context contract.

### What API surfaces exist?

The open core exposes GraphQL, REST v1, TypeScript SDK usage, C# SDK usage, machine-to-machine auth, selector preview/validation, recompute requests, audit/provenance lookup, and AI-safe context package retrieval. See [Public API Contract](public-api-contract.md).

### Is this production SaaS?

Not in this public repo. The repo is open core and can support local demos, backend-only work, self-hosted foundations, and implementation-led pilots. Full self-serve hosted SaaS, hosted billing, production licence portals, and managed control-plane operations remain private/future work.

## Product Leaders

### What workflow should we prove first?

Pick one workflow where existing data already affects a decision but is hard to reuse safely. Examples include renewal risk, support prioritisation, energy pricing context, procurement readiness, sales next-best action, onboarding state, or product-led expansion.

### How does this help an AI feature?

The AI or workflow receives scoped facts with confidence, freshness, evidence, and guardrails instead of a heap of raw records. UCL can retrieve an AI-safe context package without calling an AI model itself.

### What does success look like?

One downstream consumer can make a better, more explainable decision because it uses governed semantic context rather than direct joins, copied exports, or unsupported prompt claims.

## Enterprise Architects

### What is the architecture pattern?

UCL has a customer data plane beside source systems and an optional hosted/control-plane relationship for commercial metadata. The data plane owns source access, selectors, facts, snapshots, APIs, provenance, audit, masking, and local configuration.

### How do we handle vendor connectors?

The public repo includes generic SQL, REST, CSV, mock connectors, catalogue metadata, and extension points. Real paid vendor connector implementations belong in private enterprise scope and should be commercially agreed per customer.

### What should not be promised yet?

Do not promise a complete self-serve SaaS product, live hosted billing, production SSO/SCIM/SAML, vendor-certified connector packs, managed enterprise operations, or complete workspace-scoped context isolation from the public repo alone.

### What should be shown in a sales call?

Show the static GitHub Pages demo first, then the local demo or backend API flow. Walk through fragmented operational data, selector mapping, context facts, provenance, AI-safe package retrieval, and a downstream workflow decision. Close by explaining the paid pilot scope and open-core boundary.
