# WP3 Customer-Safe Summary

Date: 2026-06-19

## Summary

WP3 improves the Scout upgrade path while keeping the customer data boundary intact.

Scout can now accept source-system events through a registered connector route, store them locally, and produce a local migration export package. The package can be checked by the private Enterprise/Fortress import contract before any future paid-runtime import work.

Cloud is optional for this path. It is used only for licence, entitlement, deployment, and safe aggregate control-plane metadata. It is not used to store raw customer records or derived relationship intelligence.

## What Works Now

- Existing Scout event ingestion remains compatible.
- Registered connectors can use a dedicated local event route.
- Local Scout export can run as a dry run or write a package to a local folder.
- Export validation records package shape, counts, excluded secret fields, and Cloud data-plane status.
- The default Scout storage provider remains local.
- Optional Cloud entitlement checks are disabled by default.
- Cloud-facing compatibility tests cover safe licence/status/heartbeat metadata.

## Data Safety

The WP3 implementation keeps these out of Cloud by default:

- Raw operational records.
- Source payloads.
- Exact data items.
- Context facts and snapshots.
- Relationship sets and attribution paths.
- Recommendations, weighted signals, citations, embeddings, and vectors.
- Connector credentials, source credentials, API key material, webhook secrets, local databases, logs, checkpoints, and export packages.

The export package also excludes known secret-bearing fields such as connector credentials, data-source connection config, source-event headers, key-ring files, `.env` files, private keys, certificates, and Cloud staging paths.

## Still Manual Or Future Work

- Running the export is still an operator task.
- A production Enterprise/Fortress importer CLI/API is not complete yet.
- Live vendor connector certification is not claimed.
- Live Cloud endpoint proof is not claimed.
- Production SaaS operations, billing, support, backup/restore, and deployment readiness are not complete.

## Practical Customer Message

Scout now has a safer, clearer local migration/export foundation for moving from open-core data-plane use toward a paid Enterprise/Fortress runtime. It is suitable as technical evidence for the upgrade path, not as a promise of turnkey production migration without operator review.
