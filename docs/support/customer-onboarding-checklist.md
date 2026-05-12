# Customer Onboarding Checklist

Use this checklist before a first paid pilot starts.

## Commercial And Governance

- signed pilot SOW or written approval to proceed
- named customer business owner
- named customer technical owner
- named security/privacy contact
- agreed workflow and buyer outcome
- agreed pilot timeline and playback date
- solicitor review route for final documents

## Data Plane

- deployment environment selected
- PostgreSQL connection strings supplied through secret store
- demo fallback disabled for customer-facing use
- seed demo data disabled unless explicitly requested for a demo environment
- ASP.NET Data Protection key ring path mounted and backed up
- backup and restore owner named
- log and OpenTelemetry destination agreed

## Source Systems

- source systems listed and approved
- access method agreed
- least-privilege credentials created
- data categories classified
- masking and retention expectations agreed
- customer confirms no unapproved sensitive data is included

## Semantic Context

- semantic attributes agreed
- selector mappings reviewed
- confidence and freshness expectations agreed
- provenance format reviewed
- downstream REST, GraphQL, or SDK consumer named

## Support And Offboarding

- support channel agreed
- severity definitions accepted for pilot use
- incident contacts listed
- support bundle approval owner named
- credential revocation route agreed
- export/delete expectations recorded
- licence and usage assumptions recorded
