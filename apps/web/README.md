# KynticAI Scout Web Console

The web console shows how KynticAI Scout turns existing business data into reusable context for apps, workflows, analytics, copilots, and agents.

It is a React 19 admin application built with Vite, TypeScript, TanStack Router, TanStack Query, React Hook Form, Zod, and Tailwind.

## What it covers

- credential-based login
- role-aware navigation for `tenant_admin` and `sales_rep`
- selector builder with preview, validation, and recompute actions
- semantic schema registry
- customer context viewer with confidence, provenance, and timeline context
- example Intelligent Sales Support consumer with grounded package inspection and cited recommendation output
- audit log and operational overview panels
- client-side error boundary and request-id-aware API client

## Environment

Copy [.env.example](./.env.example) to `.env.local`.

Recommended local values:

```env
VITE_API_BASE_URL=http://localhost:5198
VITE_GRAPHQL_ENDPOINT=
VITE_PILOT_LEAD_ENDPOINT=
VITE_PILOT_CONTACT_EMAIL=paul@kyticai.com
VITE_DEMO_FALLBACK=true
```

For same-origin container deployment, the Docker image builds with:

- `VITE_API_BASE_URL=`
- `VITE_GRAPHQL_ENDPOINT=/graphql`
- `VITE_DEMO_FALLBACK=false`

For hosted static-site deployment, build with the public API origin:

```env
VITE_API_BASE_URL=https://<api-domain>
VITE_GRAPHQL_ENDPOINT=https://<api-domain>/graphql
VITE_PILOT_LEAD_ENDPOINT=https://<cloud-api-domain>/api/v1/crm/leads
VITE_PILOT_CONTACT_EMAIL=paul@kyticai.com
VITE_DEMO_FALLBACK=false
```

`VITE_PILOT_LEAD_ENDPOINT` should point at the cloud/control-plane mini CRM endpoint for paid-ad traffic. If it is empty, the pilot form falls back to a prefilled email.

## Commands

```powershell
npm install
npm run dev
npm run lint
npm test
npm run test:e2e
npm run build
```

## Testing

- `vitest` covers key components and role-gated UI
- `playwright` covers end-to-end flows for selector creation and outreach generation
