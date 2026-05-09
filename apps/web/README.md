# Context Layer Web Console

The web console is a React 19 admin application built with Vite, TypeScript, TanStack Router, TanStack Query, React Hook Form, Zod, and Tailwind.

## What it covers

- credential-based login
- role-aware navigation for `tenant_admin` and `sales_rep`
- selector builder with preview, validation, and recompute actions
- semantic schema registry
- customer context viewer with confidence, provenance, and timeline context
- agent playground with grounded package inspection and cited recommendation output
- audit log and operational overview panels
- client-side error boundary and request-id-aware API client

## Environment

Copy [apps/web/.env.example](/C:/UCL/apps/web/.env.example) to `.env`.

Recommended local values:

```env
VITE_API_BASE_URL=http://localhost:5198
VITE_GRAPHQL_ENDPOINT=
VITE_DEMO_FALLBACK=true
```

For same-origin container deployment, the Docker image builds with:

- `VITE_API_BASE_URL=`
- `VITE_GRAPHQL_ENDPOINT=/graphql`
- `VITE_DEMO_FALLBACK=false`

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
