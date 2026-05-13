# Observability

Observability for the public data plane must make health, readiness, audit, connector behaviour, and support evidence visible without leaking raw customer data.

## Health And Readiness

Monitor:

- `/health/live`
- `/health/ready`
- `/health`
- `/api/v1/health`

Readiness should fail when required databases, migrations, Data Protection keys, or critical dependencies are not ready.

## Structured Logs

Use structured JSON logs in production-style deployments. Include:

- timestamp
- level
- service name and version
- tenant/workspace ID where safe
- correlation ID
- route/action
- outcome
- duration

Do not log secrets, connection strings, access tokens, API keys, connector credentials, source rows, prompt packages, message bodies, documents, attachments, or raw context snapshots.

## Correlation IDs

Carry a correlation ID from ingress through selector execution, connector calls, audit events, support cases, and downstream context reads. Include it in customer-visible errors where safe.

## Audit Events

Alert or review audit events for:

- login and token failures
- API client create/revoke/rotate
- selector changes
- connector configuration changes
- context reads and recomputes
- permission denials
- webhook signature failures
- support bundle creation

## OpenTelemetry

Use OpenTelemetry where available for request traces, EF Core timings, background jobs, selector execution, and connector calls. Redact labels. Metric labels must not contain customer names, emails, source IDs, secrets, or raw facts.

## Alert On

- readiness failure
- sustained 5xx responses
- authentication failure spikes
- permission denial spikes
- selector/recompute queue failures
- connector health failures
- data freshness breaches
- backup failure or missing restore rehearsal

## Support Bundles

Support bundles must be redacted locally before sharing. They may include version, config summary, health, audit metadata, connector health metadata, and migration status. They must exclude raw source data, secrets, keys, logs with payloads, local databases, and unredacted PII by default.
