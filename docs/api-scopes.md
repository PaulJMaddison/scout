# API Scope Contract

Canonical API scopes use colon names:

- `context:read`
- `context:write`
- `selectors:read`
- `selectors:write`
- `events:ingest`
- `audit:read`
- `admin:manage`
- `blueprints:write`
- `billing:read`

`context:write` is an official scope for write operations that change context or request recomputation. SDK examples should request only the scopes needed by the workflow. Older dot-form scopes such as `context.read`, `context.write`, `events.write`, `audit.read`, `admin.manage`, `blueprints.write`, and `billing.read` are compatibility aliases only.
