# 07 Cloud Upgrade Entitlement Flow

Date: 2026-06-18

Mode: Cloud/control-plane documentation plus docs guard test. No Scout runtime, storage, connector, LanceDB, pgvector, migration, or API code was changed in this step.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- Scout WP2 artefacts in `C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration`
- Cloud WP1 artefacts in `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp1-cloud-control-plane`
- Cloud/control-plane repo: `C:\Kyntic\universalcontextlayer-cloud`

## Cloud Files Changed

Created:

- `C:\Kyntic\universalcontextlayer-cloud\docs\scout-to-fortress-elite-upgrade-onboarding.md`
- `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp2-cloud-upgrade-onboarding\README.md`
- `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp2-cloud-upgrade-onboarding\01-cloud-upgrade-entitlement-flow.md`
- `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp2-cloud-upgrade-onboarding\handoff.md`
- `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp2-cloud-upgrade-onboarding\status.json`

Updated:

- `C:\Kyntic\universalcontextlayer-cloud\README.md`
- `C:\Kyntic\universalcontextlayer-cloud\docs\licensing-flow.md`
- `C:\Kyntic\universalcontextlayer-cloud\docs\package-entitlement-flow.md`
- `C:\Kyntic\universalcontextlayer-cloud\tests\Ucl.Cloud.Tests\CommercialReadinessDeliverablesTests.cs`
- `C:\Kyntic\UCL-local-aidocs\SESSION_LOG.md`

## Upgrade States

The Cloud-side upgrade flow now defines these derived operational states:

| State | Cloud record source |
| --- | --- |
| `ScoutOnly` | Account, optional Scout-compatible subscription/licence, optional data-plane registration. |
| `SignupCaptured` | Pilot lead, opportunity, account/contact metadata, support case, audit. |
| `CommercialReview` | Subscription intent, support case, tenant notes, audit. |
| `SubscriptionConfirmed` | Active/trial subscription linked to canonical Fortress or Elite tier. |
| `LicenceIssued` | Active signed licence with Fortress or Elite-compatible entitlements. |
| `ArtefactEntitled` | Entitled download artefact metadata and update-channel metadata. |
| `LocalOnboardingReady` | Support case checklist plus licence/package metadata delivered to the customer. |
| `DeploymentRegistered` | Data-plane installation ID and machine API key issued through short-lived registration-token exchange. |
| `DeploymentMetadataLinked` | Fortress instance metadata linked to licence and optional data-plane installation. |
| `HeartbeatHealthy` | Licensing heartbeat, deployment heartbeat, and aggregate usage metadata accepted. |
| `OnboardingComplete` | Support/reconciliation/audit show no critical upgrade blockers. |
| `Blocked` | Payment, licence, artefact, registration, heartbeat, local preflight, or deployment metadata blocker. |
| `DowngradedOrSuspended` | Account/subscription/licence state removes or suspends private entitlements. |

These states are not a new Cloud public API contract yet. They are derived from existing Cloud metadata until a dedicated persisted onboarding entity or read model is implemented.

## Entitlement Changes

Scout to Fortress:

- Cloud moves the subscription to canonical `Fortress` intent while preserving legacy write compatibility through `Business` or `Enterprise`.
- Cloud issues a Fortress-compatible signed licence.
- Entitlement responses expose canonical tier metadata beside legacy plan fields.
- Fortress private artefacts and update metadata become visible only after active/trial subscription or active/grace licence checks pass.

Scout or Fortress to Elite:

- Cloud moves the subscription to canonical `Elite` intent while current compatibility uses `PrivateCloud`.
- Cloud issues or replaces an Elite-compatible signed licence.
- Elite artefacts may include approved model/operator packs as metadata only.
- Raw outcome records, prompts, generated customer content, relationship intelligence, vectors, embeddings, and citation-level data remain local.

Downgrade or suspension:

- Private artefact/update access is denied when the account, subscription, or licence is suspended, cancelled, expired, revoked, invalid, or no longer tier-compatible.
- Cloud preserves account history and audit. It does not delete, import, or host customer data-plane records.

## Download And Update-Channel Changes

- Fortress artefacts remain Cloud metadata with `EntitledPlans` including `Business` and/or `Enterprise`.
- Elite artefacts use `PrivateCloud` until canonical write contracts replace legacy `PlanCode[]` payloads.
- Entitlement checks use canonical rank semantics: Fortress aliases satisfy Fortress artefacts, Elite satisfies Elite and lower tiers, and Scout aliases do not satisfy private runtime artefacts.
- Update channels remain `Stable`, `Preview`, `EnterpriseLTS`, and `SecurityOnly`.
- Production signed binary delivery remains blocked until private object-storage credentials, object policy, object existence proof, and signed URL fetch proof are available.

## Customer Onboarding Steps

1. Capture upgrade request in Cloud as lead, opportunity, account/support metadata, or tenant note.
2. Confirm target tier: Fortress or Elite.
3. Confirm account, contacts, roles, support owner, deployment model, update channel, and payment/subscription state.
4. Set or confirm subscription through manual override or billing-provider path.
5. Issue signed licence.
6. Publish or select private artefact and update-channel metadata.
7. Provide signed licence and entitled package metadata to the customer.
8. Customer runs local Scout/Fortress preflight, backup, install, storage migration, LanceDB/pgvector/model checks, and verification in the customer environment.
9. Create a short-lived data-plane registration token.
10. Customer deployment exchanges the token for a data-plane installation ID and machine API key.
11. Operator creates or links Fortress/Elite deployment metadata to the licence and optional data-plane installation.
12. Cloud accepts licensing and deployment heartbeats with safe metadata and aggregate counters only.
13. Operator tracks onboarding through support case, tenant notes, reconciliation, and audit until complete or blocked.

## Data-Boundary Guarantees

Cloud may receive:

- account, tenant, contact, role, subscription, licence, entitlement, download/update, support, audit, and reconciliation metadata;
- data-plane installation ID, public deployment name, deployment version, environment type, region, update channel, health status, and heartbeat timestamps;
- allowed aggregate counters such as context lookup count, selector execution count, connector health-check count, active user count, workspace count, API client count, storage estimates, update/download/licence/support counts, and anomaly count;
- hashed licence keys, object-reference metadata, and allowlisted safe config/update metadata.

Cloud must not receive:

- raw customer data;
- Scout export files;
- LanceDB files or vector files;
- derived intelligence;
- relationship sets;
- attribution paths;
- prompts;
- generated customer content;
- citation IDs;
- weighted signals;
- vectors or embeddings;
- connector credentials or source credentials;
- source records, exact data items, context facts, context snapshots, local evidence packs, local migration checkpoints, local dead letters, local databases, raw logs, or support bundles by default.

## Tests Added Or Updated

Updated:

- `C:\Kyntic\universalcontextlayer-cloud\tests\Ucl.Cloud.Tests\CommercialReadinessDeliverablesTests.cs`

Coverage added:

- The Cloud upgrade onboarding document must exist.
- The document must include the upgrade states, entitlement/download/update behaviours, allowed aggregate metadata, customer-environment local migration boundary, and forbidden customer-data families.

No Scout tests were added or changed in this step because the Scout repo changes are work-package documentation only.

## Commands Run

Cloud validation:

```text
dotnet restore .\UclCloudControlPlane.slnx
dotnet build .\UclCloudControlPlane.slnx --no-restore
dotnet test .\UclCloudControlPlane.slnx --no-build
dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --no-build --filter FullyQualifiedName~CommercialReadinessDeliverablesTests
git diff --check
Get-Content -Raw docs\work-packages\wp2-cloud-upgrade-onboarding\status.json | ConvertFrom-Json | Out-Null
```

Scout WP2 validation:

```text
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json | ConvertFrom-Json | Out-Null
git diff --check
```

Session-log validation:

```text
git diff --check
```

## Results

- `dotnet restore .\UclCloudControlPlane.slnx`: passed; all projects up to date.
- `dotnet build .\UclCloudControlPlane.slnx --no-restore`: passed; 0 warnings; 0 errors.
- `dotnet test .\UclCloudControlPlane.slnx --no-build`: failed with 545 passed and 1 failed. Failure was `AnalyticsPixelTests.Marketing_helper_uses_send_beacon_session_storage_and_no_third_party_scripts`, which found existing `googletagmanager` marketing code. This failure is outside the Cloud upgrade/onboarding files changed in this slice.
- `dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --no-build --filter FullyQualifiedName~CommercialReadinessDeliverablesTests`: passed; 13 tests.
- Cloud `git diff --check`: passed; printed only LF-to-CRLF working-copy warnings.
- Cloud WP2 `status.json` validation: passed.
- Scout WP2 `status.json` validation: passed.
- Scout `git diff --check`: passed; printed only LF-to-CRLF working-copy warnings.
- `C:\Kyntic\UCL-local-aidocs` `git diff --check`: passed; printed only LF-to-CRLF working-copy warnings.

Skipped:

- Cloud portal build was not run because no portal files changed.
- Scout .NET tests were not run because this step changed Scout work-package documentation only.
- Docker/PostgreSQL, hosted endpoint, Stripe, SMTP, object-storage, browser, LanceDB/native-store, pgvector, model-runtime, live connector, and production key-custody proof were not run.

## Remaining Gaps

- Cloud has no dedicated persisted upgrade onboarding entity or state-machine endpoint yet.
- Cloud has no atomic Scout/Fortress/Elite commercial-tier move endpoint yet.
- Dedicated licence suspend/reactivate endpoints remain target additions.
- Portal forms still submit legacy numeric `PlanCode` values.
- Download artefacts still store legacy `PlanCode[] EntitledPlans`.
- Production signed binary delivery requires private object-storage proof.
- Live billing, production secrets, key custody, backup/restore evidence, portal auth hardening, and legal/commercial review remain outside this slice.
- Local Scout-to-Fortress migration, LanceDB/native-store proof, pgvector proof, vector backfill, relationship-set indexing, and governed JSON verification remain customer data-plane work.
