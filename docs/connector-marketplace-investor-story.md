# Connector Marketplace Investor Story

Status: local evidence pack. This is not a public connector marketplace launch, an npm publication claim, an n8n marketplace claim, a vendor-certified connector claim, or customer sandbox proof.

## Honest Marketplace Position

KynticAI Scout proves the public data-plane path: approved source data enters a connector contract, selectors map it into semantic facts, context snapshots make those facts reusable, and REST or GraphQL consumers can retrieve the result with provenance.

The public "marketplace" story today is therefore a status matrix and replay pack, not a store. It is safe to say that Scout has open-core connector contracts, generic connector proofs, authoring tools, and a local n8n event-sink package. It is not safe to say that a public marketplace is live or that vendor connectors have been published.

## Status Matrix

| Surface | Status | Evidence | Replay path | Caveat |
|---|---|---|---|---|
| Generic SQL / PostgreSQL path | Implemented | [First Real Connector Proof](first-real-connector-proof.md) documents source row -> selector -> fact -> snapshot -> API-shaped lookup. | `dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --filter "FullyQualifiedName~SqlTableConnector_ReadsCurrentDatabaseRow_AndProducesContextSnapshot"` | Generic open-core proof only. It is not a customer SQL Server, warehouse, or vendor-certified proof. |
| Generic REST connector path | Implemented | [Connector Plugin Model](connector-plugin-model.md) describes `restApi`, aliases, config, credentials, health checks, and fetch contracts. | `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter "FullyQualifiedName~ConnectorPluginModelTests"` | Generic protocol shape only. No vendor OAuth client or production sync is included. |
| CSV upload, mock, in-memory inventory, template | Implemented | [Connector Authoring Guide](connector-authoring.md), [Connector Manifest Validator](connector-manifest-validator.md), and [Connector Test Harness](connector-test-harness.md). | Run package tests in `packages/typescript/scout-connector-validator` and `packages/typescript/scout-connector-test-harness`. | Public authoring and fictional/demo paths only. No customer extracts or managed file ingestion. |
| Source-system event ingestion | Implemented | Public event endpoint and connector event shape let n8n, legacy apps, or ETL jobs emit provider-neutral events. | REST/event tests plus n8n package validation below. | Event contracts are useful even without a vendor connector. They are not a claim that every upstream system has a native connector. |
| n8n event sink | Partial | [KynticAI n8n Node](n8n-node.md) describes local package build, tests, redaction, fixtures, and dry-run package validation. | `cd packages\typescript\n8n-node; npm run validate:local` | No npm publication, no n8n marketplace submission, no release automation, and no public marketplace listing. |
| Vendor-labelled connector entries | Planned / placeholder | [Connector Catalogue](connector-marketplace.md) labels paid/private or planned entries separately from open-core examples. | No product proof command exists for a public vendor marketplace entry. | Do not claim Salesforce, HubSpot, Dynamics, SharePoint, Gmail, Outlook, Zendesk, NetSuite, or other vendor connectors are published from Scout. |

## Implemented vs Partial vs Planned

Implemented in open core:

- Generic SQL / PostgreSQL-style connector proof.
- Generic REST connector contract.
- CSV upload, mock, in-memory inventory, and template connectors for local/demo authoring.
- Connector catalogue labels that distinguish open-core examples, paid/private entries, planned entries, and placeholders.
- Manifest validator and connector test harness packages.
- Source-system event ingestion contract.

Partial:

- n8n package slice: local package readiness exists, but publication and marketplace submission are deliberately absent.
- Customer/vendor connectors: public metadata can describe the category, but runtime vendor integrations belong in private Enterprise delivery and must be scoped.

Planned or placeholder:

- Public marketplace publication.
- Vendor-specific public listings.
- Customer-specific connector packages.
- Any claim that a vendor connector is certified, generally available, or published.

Blocked until separate proof exists:

- npm package publication.
- n8n marketplace acceptance.
- Customer-approved sandbox validation.
- Vendor certification, if required by a vendor.
- Customer logo, customer quote, or production deployment evidence.

## Replayable Proof Links

| Proof | Command | What it proves | What it does not prove |
|---|---|---|---|
| SQL source-to-context proof | `dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --filter "FullyQualifiedName~SqlTableConnector_ReadsCurrentDatabaseRow_AndProducesContextSnapshot"` | Source data can become a selector output, context fact, context snapshot, and API-shaped response with provenance. | Live customer database access, vendor certification, production scale, or customer acceptance. |
| Connector plugin/catalogue boundary | `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter "FullyQualifiedName~ConnectorPluginModelTests"` | Public catalogue labels and plugin boundaries keep open-core examples separate from paid/private placeholders. | Enterprise vendor connector runtime. |
| n8n local package validation | `cd packages\typescript\n8n-node; npm run validate:local` | Build, focused tests, redaction fixtures, and `npm pack --dry-run` for the local node package. | Published npm package, n8n marketplace listing, or workflow-gallery adoption. |
| Manifest validator | `cd packages\typescript\scout-connector-validator; npm test` | Public manifest schema checks and unsafe-field rejection. | Runtime connector execution. |
| Connector test harness | `cd packages\typescript\scout-connector-test-harness; npm test` | Local authoring harness for manifest, metadata, mappings, fake fetch, and unsafe fields. | Live provider or customer sandbox proof. |

## n8n / Scout Story

The n8n node is best described as a write-only event bridge:

1. An n8n workflow receives or creates a JSON item.
2. The local KynticAI node maps that item to a provider-neutral source-system event.
3. The node redacts sensitive keys and validates tenant/source/event fields.
4. Scout ingests the event through the public API.
5. Selectors can recompute context facts from approved source events.

This is commercially useful because n8n can sit near many operational systems, but the honest claim is "local package slice ready for validation", not "published n8n marketplace connector".

## Demo Flow: Connector Data To Useful Output

1. Source data in: show a fictional SQL row, a safe n8n workflow item, or a mock REST response.
2. Connector boundary: show the connector config and the approved fields.
3. Selector mapping: map one source field to a semantic attribute such as `preferredChannel` or `churnRisk`.
4. Context fact: show value, confidence, freshness, and provenance.
5. Context snapshot: show the reusable account/user/workflow context package.
6. Output: show a support brief, sales triage note, operations summary, or investor evidence note that cites which facts were used.

Keep demo language practical: this proves how data becomes governed context and useful output. It does not prove live customer ROI, live vendor coverage, or marketplace distribution.
