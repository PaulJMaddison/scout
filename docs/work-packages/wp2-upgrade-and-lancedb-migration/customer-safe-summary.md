# WP2 Customer-Safe Summary

Date: 2026-06-19

This summary is suitable for careful customer-facing explanation. It avoids implementation internals that are not needed for a buyer or operator to understand the upgrade boundary.

## What Customers Get

Customers can start with KynticAI Scout as a customer-owned local data plane for ingestion, local APIs, connector abstractions, selector execution, context facts, provenance, audit, governance, and public fallback intelligence.

For paid upgrades, Enterprise/Fortress adds private local capability for richer relationship-set analysis, attribution paths, vector-backed local retrieval, governed JSON handoff, private runtime packages, and customer-specific hardening. Elite adds operator-assisted strategic support on top of Fortress where agreed.

## How Scout Data Remains Local

Scout data remains in the customer's environment by default.

Local Scout records, connector payloads, exact data items, context facts, provenance, audit data, credentials, migration exports, vectors, embeddings, relationship intelligence, prompts, generated content, checkpoints, dead letters, and support bundles are not sent to Cloud as part of the upgrade path.

The upgrade design keeps storage migration, embedding generation, vector writes, relationship analysis, and verification inside the customer-owned environment.

## How Upgrade Works

1. The customer requests or agrees a Fortress or Elite upgrade.
2. Cloud confirms the commercial entitlement and provides licence/package/update metadata.
3. The customer runs local preflight checks, including backups, version checks, disk/storage checks, and local prerequisites.
4. Enterprise/Fortress is installed into the customer-controlled environment beside Scout.
5. Scout local export/dry-run validation confirms what can be migrated from current Scout storage.
6. Enterprise/Fortress imports locally, generates embeddings locally where required, and builds local vector and relationship stores.
7. Routing/provider configuration switches locally only after verification passes.
8. Rollback keeps Scout recoverable and does not rely on Cloud deleting or restoring customer data.

## What Cloud Controls

Cloud controls commercial and operational metadata only:

- account and subscription state;
- licence and entitlement state;
- private artefact and update metadata;
- download authorisation;
- data-plane registration metadata;
- deployment version, health, update channel, and heartbeat status;
- support case, audit, and reconciliation metadata;
- explicitly allowlisted aggregate usage counters.

Cloud does not act as a migration bridge, vector index, backup store, data lake, dead-letter store, or support-bundle store for customer data by default.

## What Data Never Leaves The Customer Environment By Default

- Raw customer operational data.
- Source records, exact data items, context facts, context snapshots, and selector outputs.
- Connector credentials, source credentials, tokens, keys, connection strings, and service-account files.
- Scout export files, local migration checkpoints, dead letters, local databases, and raw logs.
- LanceDB files, pgvector rows, vectors, embeddings, nearest-neighbour results, and relationship-set indexes.
- Relationship sets, attribution paths, outcomes, recommendations, caveats, weighted signals, citation IDs, and customer-specific derived intelligence.
- Prompts, prompt context packages, generated customer content, generated task explanations, and local LLM traces.
- Support bundles unless the customer explicitly creates a reviewed and redacted artefact for support.

## Remaining Manual Steps

Some steps remain operator-assisted or not yet productised:

- The Scout operator export CLI wrapper is specified but not implemented yet.
- The private Enterprise/Fortress importer CLI/API is not implemented yet.
- Live LanceDB/native-store, pgvector, and local model-runtime proof remain opt-in validation tasks.
- A quick deterministic fresh-install API smoke still needs a quieter harness than the current demo startup path.
- Production signed binary delivery, customer-specific connector validation, and formal support/security review remain separate readiness tasks.

Customer-safe conclusion: WP2 confirms the intended local-first upgrade boundary and the first contract pieces, but a real customer upgrade should still be treated as an operator-assisted project until the remaining tooling and live-store proof are complete.
