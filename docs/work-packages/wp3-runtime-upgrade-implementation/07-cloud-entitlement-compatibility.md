# 07 Cloud Entitlement Compatibility

Date: 2026-06-19

Mode: Cloud/control-plane compatibility slice for optional Scout runtime checks. Scout remains runnable without Cloud, and no Scout runtime code was changed in this step.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- Cloud WP1 contract: `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp1-cloud-control-plane\04-licence-entitlement-api.md`
- Scout WP3 runtime-upgrade implementation notes in this folder
- Cloud repo: `C:\Kyntic\universalcontextlayer-cloud`

## Summary

Cloud now emits new signed licence downloads in the shape Scout already recognises locally:

- envelope format: `Scout-LICENCE-v1`
- new licence key prefix: `Scout-`
- preferred download filename: `<licenceKey>.scout-licence.json`

Cloud keeps compatibility with previously issued `UCL-LICENCE-v1` signed envelopes during signature verification. Existing REST routes and legacy numeric `PlanCode` values remain in place.

The entitlement and licence-status responses already expose the additive canonical tier fields that Scout can use for optional runtime checks:

- `effectivePlan`
- `canonicalTier`
- `canonicalTierName`
- `canonicalTierRank`

## Cloud Code Files Changed

- `C:\Kyntic\universalcontextlayer-cloud\src\Ucl.Cloud.Api\SecurityAndServices.cs`
- `C:\Kyntic\universalcontextlayer-cloud\src\Ucl.Cloud.Api\Program.cs`
- `C:\Kyntic\universalcontextlayer-cloud\apps\cloud-portal\src\app\api-client.ts`
- `C:\Kyntic\universalcontextlayer-cloud\tests\Ucl.Cloud.Tests\ControlPlaneServiceTests.cs`
- `C:\Kyntic\universalcontextlayer-cloud\docs\licence-download-to-data-plane.md`

## Endpoint Contracts

Implemented compatibility routes:

```text
GET /api/v1/licences/{licenceKey}/status
GET /api/v1/licences/{licenceKey}/validate
GET /api/v1/accounts/{accountId}/entitlements
GET /api/v1/licences/{licenceKey}/download
POST /api/v1/data-planes/registration-tokens
POST /api/v1/data-planes/register
POST /api/v1/data-planes/heartbeat
POST /api/v1/licensing/heartbeat
POST /api/licensing/heartbeat
```

Tier mapping remains legacy-compatible:

| Canonical tier | Legacy response/write value | Numeric value |
| --- | --- | ---: |
| Scout | `Free`; deprecated `Pro` | `0`; `1` |
| Fortress | `Business`; `Enterprise` | `2`; `3` |
| Elite | `PrivateCloud` compatibility alias | `4` |

Deployment registration accepts only public deployment metadata: registration token, installation name, environment type, deployment region, deployment version, and update channel.

Deployment heartbeat accepts only deployment version, health status, and allowlisted aggregate counters such as `contextLookups`, `selectorExecutions`, `connectorHealthChecks`, and `activeUsers`.

## Example Response

Elite-compatible account entitlement response, using the current numeric enum REST contract:

```json
{
  "accountId": "11111111-1111-1111-1111-111111111111",
  "subscriptionPlan": 2,
  "subscriptionStatus": 1,
  "latestLicenceStatus": 0,
  "entitlements": {
    "plan": 4,
    "maxTenants": 1,
    "maxWorkspaces": 1,
    "maxUsers": 3,
    "maxApiClients": 2,
    "maxConnectors": 2,
    "maxSelectors": 10,
    "maxContextLookups": 1000,
    "maxRecomputations": 100,
    "maxSourceEvents": 1000,
    "maxBlueprintImports": 10,
    "retentionDays": 30,
    "supportTier": "Elite",
    "updateChannel": 0,
    "enterpriseFeatures": [
      "scout-registration",
      "fortress-runtime",
      "elite-operator-pack"
    ]
  },
  "source": "Licence",
  "expiresAt": "2026-07-19T00:00:00+00:00",
  "allowsDownloads": true,
  "effectivePlan": 4,
  "canonicalTier": 2,
  "canonicalTierName": "Elite",
  "canonicalTierRank": 2
}
```

New signed licence download envelope:

```json
{
  "format": "Scout-LICENCE-v1",
  "payload": "{\"licenceKey\":\"Scout-20260619-ABCDEF123456\",\"accountId\":\"11111111-1111-1111-1111-111111111111\",\"issuedTo\":\"Northstar Components Ltd\",\"issuedAt\":\"2026-06-19T00:00:00+00:00\",\"expiresAt\":\"2026-07-19T00:00:00+00:00\",\"entitlements\":{\"plan\":2,\"maxUsers\":20,\"updateChannel\":0,\"enterpriseFeatures\":[]}}",
  "signature": "base64-rsa-signature"
}
```

## Boundary Checks

Allowed Cloud metadata:

- account, subscription, licence, entitlement, download/update, registration, heartbeat, support, and audit metadata;
- signed licence envelope fields and entitlement limits;
- deployment name, region, version, environment type, health status, and update channel;
- aggregate counters from the allowlist;
- control-plane pack identifiers such as `scout-registration`, `fortress-runtime`, and `elite-operator-pack`.

Rejected or avoided by tests:

- raw customer records and raw operational payloads;
- source credentials and connector credentials;
- exact data items, context facts, context snapshots, prompt context packages, prompts, and local logs/databases;
- relationship intelligence, relationship sets, attribution paths, outcome records, recommendations, caveats, weighted signals, citation IDs, embeddings, vectors, and record identifiers.

## Tests Run

Cloud focused verification:

```text
dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --filter "FullyQualifiedName~ControlPlaneServiceTests.Scout_runtime_entitlement_endpoints_expose_canonical_tier_shape_without_customer_data|FullyQualifiedName~ControlPlaneServiceTests.Signed_licence_download_shape_is_scout_runtime_compatible_and_keeps_legacy_envelope_verification|FullyQualifiedName~ControlPlaneServiceTests.Allowed_control_plane_metadata_supports_runtime_registration_heartbeat_and_pack_flags|FullyQualifiedName~ControlPlaneServiceTests.Boundary_allowlists_reject_raw_and_derived_payloads_without_echoing_values"
```

Result: passed; 6 tests.

Broader close-out validation:

```text
dotnet restore .\UclCloudControlPlane.slnx
dotnet build .\UclCloudControlPlane.slnx --no-restore
npm run build
git diff --check
```

Result: passed. The portal build reported the existing Vite large-chunk warning. Cloud `git diff --check` reported LF-to-CRLF working-copy warnings only.

Scout-side documentation validation:

```text
Get-Content -Raw docs\work-packages\wp3-runtime-upgrade-implementation\status.json | ConvertFrom-Json | Out-Null
git diff --check -- docs/work-packages/wp3-runtime-upgrade-implementation/README.md docs/work-packages/wp3-runtime-upgrade-implementation/handoff.md docs/work-packages/wp3-runtime-upgrade-implementation/status.json docs/work-packages/wp3-runtime-upgrade-implementation/07-cloud-entitlement-compatibility.md
```

Result: passed. Scoped Scout `git diff --check` reported LF-to-CRLF working-copy warnings only.

Full local Cloud test command:

```text
dotnet test .\UclCloudControlPlane.slnx --no-build
```

Result: failed because existing `Ucl.Cloud.Tests.AnalyticsPixelTests.Marketing_helper_uses_send_beacon_session_storage_and_no_third_party_scripts` found `googletagmanager`; 610 passed, 1 failed.

## Remaining Notes

- Scout open-core runtime still does not require Cloud.
- Dedicated licence-only suspend/reactivate and atomic Scout/Fortress/Elite tier movement remain Cloud target additions, not implemented in this slice.
- REST enum values remain numeric for compatibility.
- No Docker/PostgreSQL, hosted endpoint, browser, Stripe, SMTP, object-storage, LanceDB/native-store, pgvector, model-runtime, live connector, or production key-custody proof was run in this compatibility slice.
