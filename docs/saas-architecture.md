# SaaS And Self-Hosted Architecture

KynticAI Scout is now structured so the local open source demo can keep working while the backend can support self-hosted data-plane deployments and future hosted control-plane services.

## Product shape

The hosted product lets a company:

- create a tenant and one or more workspaces
- invite operators into workspaces
- connect existing business systems through generic connector contracts
- define semantic attributes and selector mappings
- generate trusted context snapshots and context packages
- expose context through GraphQL, REST, SDKs, and future webhook deliveries
- audit access, recomputes, selector previews, and consumer-visible package generation
- meter usage for hosted billing without embedding billing-provider code in the open repo

## Runtime modes

Configuration is intentionally explicit:

- `LocalDemo`
  Runs the React demo and ASP.NET Core API against local SQLite databases under `.demo-data/`. Demo seed data is fictional and safe.
- `BackendOnly`
  Runs the API without requiring the React demo. This is useful for SDKs, REST, GraphQL, and service-client testing.
- `SaaS`
  Enables hosted-control-plane-compatible feature flags and expects PostgreSQL connection strings. In the public repo this is a production posture for the open-core backend, not a complete paid hosted SaaS implementation.

Relevant options:

- `Platform:Mode`
- `Platform:EnableGraphQl`
- `Platform:EnableRest`
- `Platform:EnableOpenApi`
- `FeatureFlags:DemoExperience`
- `FeatureFlags:OpenCoreApis`
- `FeatureFlags:SaaSControlPlane`
- `FeatureFlags:HostedBillingUsage`
- `FeatureFlags:Webhooks`
- `FeatureFlags:EnterpriseConnectorExtensions`
- `SaaS:PublicBaseUrl`
- `SaaS:RequireWorkspaceScope`
- `SaaS:PersistApiClients`
- `ControlPlane:Enabled`
- `ControlPlane:BaseUrl`
- `ControlPlane:UpdateChannel`
- `ControlPlane:UsageReportingEnabled`
- `Licence:Mode`
- `Licence:FilePath`
- `Licence:OfflineGracePeriodDays`

The `/api/platform/config` endpoint returns the effective mode, enabled feature flags, and enabled API surfaces.

## Bounded contexts

### Tenancy

`Tenant` remains the top-level isolation boundary. Hosted deployments must enforce tenant-scoped access at the API, service, and database query layers.

### Workspaces

`Workspace` and `WorkspaceMember` add the next isolation layer inside a tenant. This supports team-by-team source systems, semantic mappings, onboarding state, API clients, usage reporting, and context package audiences.

### Users

`OperatorAccount` represents human operators. `UserProfile` remains the business subject receiving semantic context. `WorkspaceMember` links operators to workspaces.

### Subscriptions

`TenantSubscription` records plan, status, billing customer reference, period dates, and entitlement JSON. The public repo stores only generic metadata and does not ship billing-provider code.

### API clients

`ApiClient` stores tenant/workspace-scoped service clients with hashed secrets and JSON scopes. The token endpoint still supports configuration-based machine clients for local and test scenarios, and now prefers persisted API clients when present.

### Connectors

`DataSource`, `ConnectorCredential`, and `ConnectorInstallation` separate connector lifecycle from selector execution. The public repo includes generic SQL, REST, and mock connectors only. Paid enterprise connectors should implement the public contracts from a private package.

### Selector definitions

`SemanticAttributeDefinition`, `SelectorDefinition`, and `SelectorExecution` remain open-core primitives. They are tenant-scoped today and can be workspace-scoped later without changing the selector execution contract.

### Context packages

`ContextSnapshot` and `ContextFact` remain the canonical semantic record. `ContextPackage` adds SaaS package metadata: audience, manifest, delivery channels, status, generated time, and expiry. This is the seam for GraphQL, REST, SDK, and future webhook delivery.

### Audit events

`AuditEvent`, `ProvenanceMetadata`, and recompute jobs keep traceability in the open core. Hosted deployments can add private audit exporters through `IAuditExporter`.

### Billing usage

`BillingUsageRecord` stores tenant/workspace-scoped usage events such as selector executions, context package generation, API requests, webhook delivery, and connector syncs. It is intentionally provider-neutral.

### Onboarding

`OnboardingState` tracks workspace setup progress. The local demo seeds completed steps for source connection, semantic mapping, and context package generation while leaving webhook setup incomplete.

## Database model

The SaaS control plane adds these tables to `scout_context_db`:

- `saas_workspaces`
- `saas_workspace_members`
- `saas_tenant_subscriptions`
- `saas_api_clients`
- `saas_connector_installations`
- `saas_context_packages`
- `saas_billing_usage_records`
- `saas_onboarding_states`

The migration also includes `connector_credentials` where needed by hosted connector registration. SQLite local demo mode uses `EnsureCreated`; PostgreSQL hosted mode uses EF Core migrations.

## API surface

The open-core API remains:

- Hot Chocolate GraphQL at `/graphql`
- REST at `/api/rest`
- OpenAPI at `/swagger`
- SDK-compatible context endpoints

SaaS readiness is observable through:

- GraphQL query `saasArchitectureOverview(tenantSlug: "demo")`
- REST endpoint `/api/rest/tenants/{tenantSlug}/saas/overview`
- Runtime endpoint `/api/platform/config`

## Open-core boundary

This repository ships:

- semantic engine and selector execution
- context facts and snapshots
- GraphQL and REST APIs
- SQLite local demo
- PostgreSQL support
- mock connectors
- safe generic SQL/file/REST connector examples
- extension interfaces
- marketing and documentation
- domain models and migrations for SaaS/control-plane foundation metadata
- generic connector contracts and safe implementations
- extension interfaces for private modules
- fictional local seed data
- documentation for hosted architecture

This repository does not ship:

- real enterprise connector implementations
- SSO/SAML implementations
- Stripe, Paddle, or other billing-provider integrations
- customer-specific deployment templates
- private cloud automation
- credential vault integrations
- enterprise policy engines
- compliance report exporters
- customer-specific schemas, mappings, prompts, or secrets

Those belong in future private packages that depend on the public open-core contracts.

For the detailed boundary checklist, see [open-core-boundary.md](open-core-boundary.md).
