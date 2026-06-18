# 06 Enterprise LanceDB Import Contract

Date: 2026-06-18

Mode: scoped Enterprise/Fortress contract implementation and documentation. This step adds private Enterprise-side validation/mapping for the Scout upgrade import contract without adding Enterprise dependencies to Scout/open-core, without moving customer data to Cloud, and without running live LanceDB/native-store proof.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`
- `C:\Kyntic\UCL-local-aidocs\RUST_ENGINE_REVIEW_POLICY.md`
- `C:\Kyntic\universalcontextlayer-enterprise\LOCAL_VALIDATION.md`
- WP2 artefacts `01` through `05`, plus the existing `07-cloud-upgrade-entitlement-flow.md`
- Scout/open-core repo: `C:\Kyntic\UCL`
- Enterprise/Fortress repo: `C:\Kyntic\universalcontextlayer-enterprise`

## Enterprise/Fortress Files Changed

Created:

- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\src\scout_import.rs`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\tests\scout_import_contract_tests.rs`
- `C:\Kyntic\universalcontextlayer-enterprise\docs\scout-lancedb-import-contract.md`

Updated:

- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\src\lib.rs`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\Cargo.toml`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\README.md`
- `C:\Kyntic\universalcontextlayer-enterprise\AGENTS.md`

Scout WP2 docs updated:

- `C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\06-enterprise-lancedb-import-contract.md`
- `C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\README.md`
- `C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\handoff.md`
- `C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json`

## LanceDB Import Contract

Enterprise/Fortress now exposes a typed local contract in `ucl-vector`:

```text
2026-06-18.scout-lancedb-import.v1
```

Public types:

- `ScoutLanceDbImportBoundary`
- `ScoutLanceDbImportBatch`
- `ScoutLanceDbImportRecord`
- `SCOUT_LANCEDB_IMPORT_CONTRACT_VERSION`

The contract validates a normalised local import batch derived from Scout export plus local Enterprise/Fortress embedding generation. It does not open LanceDB, pgvector, Docker, Cloud, model runtimes, or external services. Valid records map into existing `WriteRequest::with_embedding()` values behind the private `VectorWriteTarget` seam.

Each LanceDB-ready record carries:

| Field | Requirement |
| --- | --- |
| `id` | Non-empty stable vector ID; unique per batch. |
| `recordKind` | Supported local Scout/Fortress kind; Cloud/control-plane-only kinds are rejected. |
| `entityType` | Non-empty canonical entity type. |
| `postgresPk` | Non-empty deterministic local relational anchor. |
| `layer` | Non-empty tenant/layer scope; must equal batch tenant. |
| `sourceSystem` | Non-empty local source system or adapter. |
| `sourceRecordId` | Non-empty source record anchor. |
| `observedAtUtc` | Source observation timestamp. |
| `embedding` | Dense finite local embedding with configured dimension, currently 384. |
| `metadataJson` | Egress-safe local metadata only. |
| `citationIds` | Non-empty citation ID list. |
| `provenanceIds` | Non-empty provenance ID list. |
| `createdAtUtc` | Source/vector row creation timestamp. |
| `updatedAtUtc` | Must not be before `createdAtUtc`. |
| `idempotencyKey` | Non-empty and unique per batch. |

## Required Scout Export Fields

Scout/open-core remains the public local data-plane exporter. It does not need to export embeddings and must not depend on Enterprise/Fortress packages.

Enterprise/Fortress needs these fields from each Scout portable export record:

| Scout export field | Requirement |
| --- | --- |
| `RecordKind` | Source system event, user signal, selector execution, context fact, provenance metadata, audit event, data item, relationship set, attribution path, or outcome event where supported. |
| `RecordId` | Stable Scout local record ID. |
| `SourceSystem` | Source system key or Scout namespace. |
| `SourceRecordId` | Stable source/event/fact/selector/provenance anchor. |
| `ObservedAtUtc` | Observation or nearest local audit time. |
| `Payload` | Local payload for local-only Enterprise analysis/embedding. It must remain in the customer-owned environment. |
| `Provenance` | Provenance wrapper or array. |
| `Metadata.contractVersion` | Scout portable export contract version. |
| `Metadata.tenantContext.tenantId` | Scout tenant ID. |
| `Metadata.tenantContext.tenantSlug` | Tenant slug. |
| `Metadata.tenantContext.layer` | Must map to the Enterprise vector `layer`. |
| `Metadata.fortressAnchor.entity_type` | Enterprise vector `entityType`. |
| `Metadata.fortressAnchor.postgres_pk` | Deterministic local `postgresPk`. |
| `Metadata.fortressAnchor.layer` | Must match tenant context and import batch tenant. |
| `Metadata.createdAtUtc` | Source row creation timestamp where available. |
| `Metadata.updatedAtUtc` | Source row update timestamp where available. |
| `Metadata.usesCloudDataPlane` | Must be `false`. |

The private importer derives the LanceDB import record from those fields, generates embeddings locally, preserves citation/provenance coverage, and writes through the Enterprise/Fortress vector boundary.

## Validation Rules

- Contract version must match `2026-06-18.scout-lancedb-import.v1`.
- Batch `tenant` must be present.
- `customerOwnedDataPlane` must be true.
- `usesCloudDataPlane`, `cloudControlPlaneOnly`, `containsRawCustomerPayloads`, `containsCredentials`, and `containsPromptsOrGeneratedContent` must be false.
- Every record `layer` must match batch `tenant` exactly.
- Record IDs and idempotency keys must be unique within a batch.
- Embeddings must be dense, finite, and exactly the configured dimension.
- Citation and provenance IDs are required and cannot contain empty values.
- `updatedAtUtc` cannot precede `createdAtUtc`.
- Metadata is recursively scanned and rejects raw payload, prompt, credential, token, secret, vector, and embedding key families.
- Cloud aggregate/control-plane-only record kinds are not importable.

## Data-Boundary Guarantees

- Scout exports stay local and package-independent.
- Enterprise/Fortress private import runs inside the customer-owned environment.
- Cloud is not a staging, backup, vector, search, dead-letter, checkpoint, import, or support-bundle store for customer data.
- Raw customer records, payloads, credentials, vectors, embeddings, relationship sets, attribution paths, outcomes, prompts, generated content, citations, provenance, and derived intelligence remain local.
- Cross-tenant mapping failure stops before vector write mapping.
- Null or fake embeddings are not accepted for LanceDB import. If local embedding generation is unavailable, the importer must fail, skip, or dead-letter locally according to policy.

## Tests Added Updated

Added:

- `engine/crates/ucl-vector/tests/scout_import_contract_tests.rs`

Coverage:

- Valid batch maps to vector `WriteRequest`.
- Cloud data-plane batch is rejected.
- Cross-tenant layer mismatch is rejected.
- Wrong embedding dimension is rejected.
- Non-finite embedding value is rejected.
- Missing citation/provenance is rejected.
- Raw payload metadata is rejected.
- JSON serialise/parse/validate round trip works.

Updated:

- `engine/crates/ucl-vector/src/lib.rs` exports the contract types.
- `engine/crates/ucl-vector/Cargo.toml` registers the focused contract test.
- `engine/crates/ucl-vector/README.md` documents the import contract.

## Commands Run

Enterprise/Fortress:

```text
git status --short
git -C C:\Kyntic\UCL status --short
Get-Content C:\Kyntic\docs\source-of-truth-naming-map.md
Get-Content C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md
Get-Content C:\Kyntic\UCL-local-aidocs\RUST_ENGINE_REVIEW_POLICY.md
Get-Content C:\Kyntic\universalcontextlayer-enterprise\LOCAL_VALIDATION.md
Get-Content C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\*.md
Get-Content C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json
rg -n "Lance|lance|Vector|vector|embedding|postgres_pk|StorageAdapter|ILocalDataPlaneStorageAdapter|Scout|import|export|relationship_set|RelationshipSet|AttributionPath|OutcomeEvent|evidence" engine src tests docs deployment scripts
cargo fmt -p ucl-vector
cargo test -p ucl-vector
cargo fetch --locked
cargo build --workspace
cargo test --workspace
git diff --check
```

Scout/open-core:

```text
dotnet restore .\KynticAI.Scout.slnx
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-restore
dotnet build .\KynticAI.Scout.slnx --no-restore
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-restore
git diff --check
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json | ConvertFrom-Json | Out-Null
```

## Results

- `cargo fmt -p ucl-vector`: passed.
- `cargo test -p ucl-vector`: passed; new contract tests included.
- `cargo fetch --locked`: passed.
- `cargo build --workspace`: passed with existing `ucl-engine` dead-code warnings.
- `cargo test --workspace`: passed with existing `ucl-pipeline` test warnings and ignored explicit model/native-style tests.
- Enterprise `git diff --check`: passed with LF-to-CRLF working-copy warnings only.
- `dotnet restore .\KynticAI.Scout.slnx`: passed; all projects up to date.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-restore`: passed; 86 tests.
- `dotnet build .\KynticAI.Scout.slnx --no-restore`: passed; 0 warnings, 0 errors.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-restore`: passed; 12 tests.
- Scout `git diff --check`: passed with LF-to-CRLF working-copy warnings only.
- Scout WP2 `status.json` parse validation: passed.

Skipped:

- Docker/PostgreSQL proof; `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS` was not set.
- Rust Testcontainers/Ollama proof; `KYNTIC_RUN_EXTERNAL_RUST_TESTS` was not set.
- LanceDB/native-store and production-runtime proof; `KYNTIC_RUN_NATIVE_STORE_TESTS` was not set.
- Browser/Playwright proof; `KYNTIC_RUN_BROWSER_TESTS` was not set.
- Live connector/vendor/customer sandbox proof; no approved sandbox was requested or configured.
- xhigh review was not run in this session because no explicit review-agent delegation was requested; this remains required before pilot/release/investor-visible proof.

## Remaining Gaps

- Production Enterprise/Fortress importer CLI/API is not implemented yet.
- Local embedding generation is not wired into a resumable importer yet.
- Live LanceDB/native-store proof remains opt-in and unrun.
- pgvector fallback import/write proof remains future work.
- Private relationship-set, attribution-path, outcome, checkpoint, retry, and dead-letter stores still need importer wiring.
- Scout does not persist canonical relationship sets, attribution paths, outcome events, exact data items, or vectors as first-class public tables.
- xhigh Rust review remains required before treating this as trusted production/pilot proof.
