# Machine-To-Machine Identity

Production M2M identity should be scoped, rotated, auditable, and tenant/workspace aware. A real customer IdP validation remains a next-week task when a customer identity provider is available.

## Client Credentials

Use named API clients per integration:

- downstream context reader
- selector/context writer
- source event ingestion
- audit reader
- admin automation

Store clear client secrets only once at creation. Persist only hashes where the application supports it.

## Scopes

Canonical scopes are documented in `docs/api-scopes.md`:

- `context:read`
- `context:write`
- `selectors:read`
- `selectors:write`
- `events:ingest`
- `audit:read`
- `admin:manage`
- `blueprints:write`
- `billing:read`

Grant only the minimum scopes required by the integration.

## Tenant And Workspace Scoping

Tokens must carry tenant/workspace context where a workflow is not globally administrative. Cross-tenant reads, selector changes, event ingestion, audit reads, and webhook operations must fail closed.

## Machine Token Flow

1. Client authenticates with its client ID and secret/API key.
2. The token endpoint validates the secret hash, tenant, workspace, status, expiry, and scopes.
3. The API issues a short-lived access token.
4. The client calls REST/GraphQL endpoints with the bearer token.
5. Audit events record the client, scope, tenant, workspace, action, and correlation ID.

## Webhook Signing

Source event ingestion should use a separate signing secret per provider/source. Rotate webhook signing secrets independently from M2M client secrets. Include timestamp and body in the signature input and reject stale timestamps.

## Rotation And Revocation

- set an owner and review date for every client
- rotate secrets on a schedule and after staff/vendor changes
- revoke unused clients immediately
- rotate any secret that appears in logs, screenshots, support cases, chat, or git history

## Real IdP Validation Next Week

Validate customer IdP options only with customer-approved metadata:

- issuer and JWKS discovery
- audience and scope mapping
- token lifetime and refresh rules
- client assertion or client secret policy
- revocation route
- audit claim mapping
