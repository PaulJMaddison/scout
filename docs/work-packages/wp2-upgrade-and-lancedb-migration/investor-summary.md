# WP2 Investor Summary

Date: 2026-06-19

This summary is investor-safe and claim-limited. It describes what has been evidenced in WP2 without claiming production SaaS readiness, live customer traction, vendor-certified connector support, or a completed production LanceDB migration.

## Safe Claim

WP2 establishes a documented and partially implemented upgrade path from KynticAI Scout to the paid Enterprise/Fortress and Elite tiers.

The evidence shows:

- Scout is the public/open-core, customer-owned data-plane product.
- Enterprise/Fortress is the private paid extension path for canonical relationship-set analysis, attribution paths, vector storage, local embeddings, governed JSON handoff, and private runtime capability.
- Elite is the operator-assisted strategic tier above Fortress.
- Cloud is the commercial/control-plane layer for accounts, subscriptions, licences, entitlements, private artefact metadata, downloads/update checks, data-plane registration, heartbeat, support, audit, and aggregate-only usage metadata.
- Cloud does not receive customer data-plane payloads by default.

## What WP2 Proves

- The Scout connector ingestion route has been aligned to the current local API where a stale route was found.
- Scout has a local storage adapter/export boundary for current relational records and dry-run validation.
- Enterprise/Fortress has a typed local LanceDB import validation/mapping contract in `ucl-vector`.
- Cloud has a documented Scout to Fortress/Elite onboarding flow that keeps Cloud as metadata-only control plane.
- Focused tests validate the Scout storage/export contract, Scout source-system ingestion route, Enterprise/Fortress import contract, and Cloud metadata-only onboarding boundary.

## What WP2 Does Not Claim

WP2 does not claim:

- complete self-serve production SaaS readiness;
- live customer upgrade completion;
- production signed binary delivery;
- vendor-certified connector coverage;
- live LanceDB/native-store proof;
- pgvector fallback proof;
- production Enterprise/Fortress importer CLI/API;
- a complete deterministic end-to-end migration from Scout export through live vector write and governed JSON handoff;
- legal, security, support, billing, or operational production readiness.

## Scout To Enterprise/Fortress Upgrade Explanation

1. A customer starts with KynticAI Scout running as a customer-owned local data plane.
2. Cloud authorises a paid upgrade by resolving account, subscription, licence, entitlement, private artefact metadata, update channel, registration metadata, and support state.
3. The customer installs Enterprise/Fortress in the customer-controlled environment.
4. Scout exports local data-plane records through a local adapter/export contract.
5. Enterprise/Fortress imports locally, generates embeddings locally, writes vectors locally, and builds relationship-set and attribution-path capability locally.
6. Elite can add operator-assisted review and approved local/private packs, without changing the default rule that customer data remains in the customer-owned data plane.

## Cloud Data Boundary

Cloud does not receive customer data by default.

Cloud may receive commercial/control-plane metadata such as account, subscription, licence, entitlement, download/update, deployment version, health status, support, audit, and explicitly allowlisted aggregate counters.

Cloud must not receive raw operational records, Scout exports, exact data items, context facts, connector payloads, credentials, vectors, embeddings, relationship sets, attribution paths, outcomes, prompts, generated customer content, citation IDs, weighted signals, migration checkpoints, dead letters, local databases, or support bundles by default.

## Investor-Safe Conclusion

WP2 is a credible local-first upgrade-path evidence pack. It is ready to commit as evidence and technical groundwork. It should not be presented as proof that the full production upgrade, production SaaS operation, or live customer rollout is complete.
