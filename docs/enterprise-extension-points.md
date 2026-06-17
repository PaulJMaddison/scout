# Enterprise extension points

KynticAI Scout exposes a set of public extension points so that future private enterprise modules can plug into the open source core without forking it.

This document describes those extension points and the boundary around them.

For the full public/private product boundary, see [open-core-boundary.md](open-core-boundary.md).

Commercial enterprise implementations include the canonical Rust relationship/weighting/traversal engine; real Salesforce, HubSpot, Dynamics, Snowflake, BigQuery, Zendesk, NetSuite, Microsoft 365 / Outlook, Gmail / Google Workspace, Slack, Microsoft Teams, Outlook Calendar, Google Calendar, Segment, Amplitude, Mixpanel, PostHog, Jira, Linear, Confluence, Notion, SharePoint, and Google Drive connectors; SSO/SAML; SCIM; credential vault integrations; advanced governance; compliance exports; private deployment packs; and SLA tooling. Those implementations are paid/private and are not included in this public repo.

## Principles

- The public repo defines contracts, DTOs, DI hooks, and safe defaults.
- Enterprise packages can implement those contracts in a separate private repo, expected to be called `scout-enterprise`.
- The public repo must not contain paid implementations for canonical Rust relationship weighting/traversal, commercial connectors, enterprise auth, billing, credential vaults, enterprise policy engines, compliance exporters, or commercial deployment packs.
- Public code can describe the contract. Private code should own the enterprise implementation.

## Current extension points

The public repo currently defines these interfaces in [src/KynticAI.Scout.Application/Abstractions/EnterpriseExtensionInterfaces.cs](../src/KynticAI.Scout.Application/Abstractions/EnterpriseExtensionInterfaces.cs):

- `IContextSourceConnector`
- `IConnectorConfigurationValidator`
- `ICredentialProvider`
- `ISecretResolver`
- `IPolicyEvaluator`
- `IPiiMaskingProvider`
- `IAuditExporter`
- `IContextPackageExporter`
- `IEnterpriseAuthProvider`
- `ISelectorApprovalWorkflow`
- `IEnvironmentPromotionService`
- `IUsageMeteringSink`

Related DTOs and error contracts live in [src/KynticAI.Scout.Application/Abstractions/EnterpriseExtensionContracts.cs](../src/KynticAI.Scout.Application/Abstractions/EnterpriseExtensionContracts.cs).

Safe default and mock implementations live in [src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionDefaults.cs](../src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionDefaults.cs).

## What the public repo provides

The open source core provides:

- interface definitions
- request and response DTOs
- tenant-scoped contracts
- structured error models
- DI registration helpers
- mock or no-op implementations suitable for local development and testing
- provider-neutral metadata models where needed to keep the public core coherent

The public repo should keep the semantic engine, exact linked records, context facts and snapshots, governed evidence packs, GraphQL and REST APIs, SQLite demo, PostgreSQL support, mock connectors, safe generic SQL/file examples, extension interfaces, in-repo demo/admin copy, and documentation.

## What a private enterprise repo should provide later

Enterprise packages may later provide:

- Canonical Rust relationship weighting/traversal, outcome-pattern scoring, and private relationship-engine hardening
- real enterprise connectors, including email, chat, calendar, analytics, issue, project, document, and knowledge-system adapters
- SSO/SAML implementations
- Stripe, Paddle, or other billing-provider integrations
- customer-specific deployment templates
- private cloud automation
- credential vault integrations
- enterprise policy engines and governance packs
- compliance report exporters
- promotion workflows and private deployment packs
- usage metering sinks tied to commercial packaging or hosted entitlements

Those private packages should consume public contracts from `scout` rather than copying public source files into the enterprise repo.

## Do not implement publicly

These features may have public interfaces, DTOs, docs, or no-op defaults, but their real implementations should not be committed to this repository:

1. Real enterprise connectors.
2. Rust relationship-weighting modules.
3. SSO/SAML.
4. Stripe/Paddle billing.
5. Customer specific deployment templates.
6. Private cloud automation.
7. Credential vault integrations.
8. Enterprise policy engine.
9. Compliance report exporters.

## DI model

The public repo exposes DI helpers in [src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionServiceCollectionExtensions.cs](../src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionServiceCollectionExtensions.cs).

Example:

```csharp
services.AddContextSourceConnector<MyEnterpriseConnector>();
services.AddEnterpriseAuthProvider<MyEnterpriseAuthProvider>();
services.AddPolicyEvaluator<MyEnterprisePolicyEvaluator>();
```

The public infrastructure registers safe defaults so the open source core still behaves predictably without enterprise packages.

## Contributor guidance

If you add a new extension point:

- keep the contract generic
- keep DTOs tenant-scoped where appropriate
- define a clear structured error model
- provide a safe open source default or mock
- add documentation for how a private package would register the implementation

Do not add vendor-specific or customer-specific enterprise implementations to this repository.
