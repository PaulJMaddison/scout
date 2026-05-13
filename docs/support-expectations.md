# Support Expectations

This is the support model for a first supported paid pilot. Response targets are placeholders until agreed in a customer contract or statement of work.

## Channels

- named commercial/support email or ticket route
- agreed emergency escalation contact for pilot blockers
- cloud support portal only where the private cloud control plane is part of the pilot

Do not use public issues for customer secrets, logs, connector credentials, or raw operational data.

## Severity Definitions

- `SEV1`: production pilot unavailable, data-plane registration/licence blocks all agreed usage, or suspected security incident
- `SEV2`: major feature unavailable, connector proof blocked, or customer-facing workflow materially degraded
- `SEV3`: non-blocking defect, documentation issue, or workaround available
- `SEV4`: question, enhancement, commercial clarification, or planned change

Response targets must be agreed as placeholders before the pilot starts.

## What Customers Can Send

- redacted screenshots
- error codes and correlation IDs
- version numbers
- redacted configuration summaries
- health endpoint results
- redacted support bundles
- selector names and semantic mapping descriptions

## What Customers Must Not Send By Default

- raw operational rows
- local databases or dumps
- connector credentials
- API keys, tokens, private keys, licence signing keys
- message bodies, documents, attachments, prompt packages
- unredacted logs or support bundles

## Escalation And Bug Fix Delivery

Escalate incidents to the named incident owner. Bug fixes should be delivered through the agreed package/update channel and applied first to a rehearsal environment where practical.

## Offboarding

Offboarding should revoke licences, registration tokens, data-plane API keys, package feed access, and support portal access. Agree export/delete expectations for cloud metadata and local customer data-plane records before the pilot starts.
