# 05 Enterprise Import Contract

Date: 2026-06-19

Mode: scoped Enterprise/Fortress implementation and Scout-side WP3 summary. This step adds private import-side contract code in `C:\Kyntic\universalcontextlayer-enterprise` and records the result here in Scout WP3. It does not add private package dependencies to Scout/open-core, does not open LanceDB, does not run native/vector proof, and does not move customer data to Cloud.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\`
- `C:\Kyntic\UCL\docs\work-packages\wp3-runtime-upgrade-implementation\`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`
- `C:\Kyntic\UCL-local-aidocs\RUST_ENGINE_REVIEW_POLICY.md`
- `C:\Kyntic\universalcontextlayer-enterprise\LOCAL_VALIDATION.md`

## Summary

Enterprise/Fortress now has a package-level import-side contract for Scout migration export batches. The new code lives in the private Enterprise repo under `ucl-vector` and mirrors the public Scout export shape without depending on Scout packages.

The contract consumes Scout export batches using the public contract version:

```text
kynticai.scout.storage-portable-export.v1
```

It validates the package shape, tenant/layer mapping, local-only diagnostics, validation report, record metadata, provenance references, and deterministic Fortress anchors. It then prepares a local `PreparedScoutMigrationImportPlan` that can be turned into the existing LanceDB import contract only after a private/local embedding provider supplies dense embeddings.

## Enterprise Files Changed

Created:

- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\src\scout_migration_package.rs`

Updated:

- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\src\lib.rs`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\tests\scout_import_contract_tests.rs`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\README.md`
- `C:\Kyntic\universalcontextlayer-enterprise\docs\scout-lancedb-import-contract.md`
- `C:\Kyntic\universalcontextlayer-enterprise\AGENTS.md`

Scout WP3 files updated:

- `C:\Kyntic\UCL\docs\work-packages\wp3-runtime-upgrade-implementation\05-enterprise-import-contract.md`
- `C:\Kyntic\UCL\docs\work-packages\wp3-runtime-upgrade-implementation\README.md`
- `C:\Kyntic\UCL\docs\work-packages\wp3-runtime-upgrade-implementation\handoff.md`
- `C:\Kyntic\UCL\docs\work-packages\wp3-runtime-upgrade-implementation\status.json`

## Import Contract

New Enterprise/Fortress types:

- `SCOUT_STORAGE_PORTABLE_EXPORT_CONTRACT_VERSION`
- `ScoutPortableExportBatch`
- `ScoutPortableExportRecord`
- `ScoutStorageMigrationValidationReport`
- `PreparedScoutMigrationImportPlan`
- `PreparedScoutMigrationImportRecord`

Validation covers:

- batch ID, non-empty scope, non-empty records, empty Scout export errors, and required `validationReport`;
- `diagnostics.contractVersion == kynticai.scout.storage-portable-export.v1`;
- `diagnostics.usesCloudDataPlane == false`;
- validation report contract version, `isValid`, and checked/exportable counts;
- importable record kinds only, rejecting Cloud/control-plane-only families;
- record payload shape as a JSON object and provenance shape as a non-empty JSON object array;
- record metadata `contractVersion`, `tenantContext`, `fortressAnchor`, timestamps, and `usesCloudDataPlane`;
- `tenantContext.tenantSlug`, `tenantContext.layer`, and `fortressAnchor.layer` must match;
- optional operator-supplied expected layer must match every record;
- duplicate Scout record keys and duplicate Fortress anchors are rejected.

The prepared plan derives deterministic local IDs:

- vector ID: `scout:<layer>:<fortressAnchor.postgres_pk>`;
- idempotency key: `scout-import:<layer>:<fortressAnchor.postgres_pk>`;
- citation IDs: existing `metadata.citationIds` when present, otherwise a local Scout export citation reference;
- provenance IDs: extracted from provenance IDs or source-system/source-record provenance references.

## LanceDB/Fortress Boundary

This step prepares the LanceDB/Fortress boundary but does not write vectors.

The new package contract can build a `ScoutLanceDbImportBatch` only when the caller supplies local embeddings through an injected closure. That keeps embedding generation in the private/customer-owned runtime and prevents fake vectors.

The existing LanceDB-ready contract remains:

```text
2026-06-18.scout-lancedb-import.v1
```

Valid prepared records flow into `ScoutLanceDbImportRecord` and then `WriteRequest::with_embedding()` behind the existing `VectorWriteTarget` seam. The code does not open LanceDB, pgvector, model runtimes, Docker, Cloud, hosted endpoints, or external services.

Payload content from the Scout package is not copied into vector metadata. The prepared vector metadata uses an allowlisted set of local import identifiers and source anchors.

## Tests Run

Enterprise/Fortress:

```text
cargo fmt -p ucl-vector
cargo fmt --check -p ucl-vector
cargo test -p ucl-vector --test scout_import_contract_tests
cargo test -p ucl-vector
cargo test --workspace
```

Result:

- `cargo fmt -p ucl-vector`: passed.
- `cargo fmt --check -p ucl-vector`: passed.
- `cargo test -p ucl-vector --test scout_import_contract_tests`: passed; 14 tests.
- `cargo test -p ucl-vector`: passed; unit tests, import contract tests, write-path tests, and doctest passed.
- `cargo test --workspace`: passed; existing `ucl-pipeline` test warnings about an unused import and unused variable were printed.

## Remaining Implementation Gaps

- No production Enterprise/Fortress importer CLI/API consumes Scout export files yet.
- Local embedding generation is not wired into a resumable importer yet.
- Live LanceDB/native-store proof remains opt-in and unrun for this step.
- pgvector fallback import/write proof remains future work.
- Checkpoint, retry, dead-letter, rollback, relationship-set, attribution-path, outcome-event, and governed JSON handoff wiring remain future implementation.
- Scout operator export CLI/harness work is still separate unless the current Scout WP3 worktree has it pending locally.
- xhigh Rust review remains required before pilot, release, or investor-visible technical proof claims.
