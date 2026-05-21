# Incident Response Outline

This is a practical pilot outline, not legal advice or a contractual incident response plan. Final notification obligations require solicitor and security review.

## Incident Scope

Potential incidents include unauthorised access, secret exposure, unexpected raw data export, connector credential misuse, data-plane outage, failed restore, audit log integrity issue, or support bundle mishandling.

## Notification Process

1. Identify and contain the issue.
2. Notify the named customer and supplier incident contacts through the agreed channel.
3. Assign severity and incident owner.
4. Preserve logs, audit entries, configuration, and relevant timestamps.
5. Avoid exporting raw operational data unless the customer explicitly approves.
6. Provide updates at the agreed cadence.
7. Document root cause, impact, remediation, and prevention.

## Severity

- Severity 1: confirmed or strongly suspected unauthorised access to production customer data, exposed secrets, or critical data-plane compromise.
- Severity 2: significant data-plane outage, failed restore, or high-risk misconfiguration without confirmed data exposure.
- Severity 3: contained defect, non-critical audit/logging issue, or recoverable connector failure.
- Severity 4: low-risk question, documentation issue, or improvement request.

## Evidence And Audit Logs

Collect only what is needed:

- timestamped event summary
- relevant Scout audit events
- health check output
- deployment version
- redacted configuration
- selected logs with secrets removed

Do not include raw source records, API keys, passwords, connection strings, key rings, private licence signing keys, or local database files by default.

## Recovery

Recovery steps may include disabling a connector, rotating credentials, revoking API clients, restoring from backup, rolling back a deployment, replaying selector recompute, validating context snapshots, and confirming downstream consumers are using fresh context.

## Closure

Closure should record impact, corrective actions, customer approvals, remaining risk, credential rotation status, backup/restore status, and any contractual or regulatory follow-up requiring solicitor review.
