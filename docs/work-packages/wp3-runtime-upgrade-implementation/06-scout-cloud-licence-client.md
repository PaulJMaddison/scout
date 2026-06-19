# 06 Scout Cloud Licence Client

Date: 2026-06-19

Mode: scoped Scout/open-core implementation for optional Cloud commercial/control-plane checks. Scout still runs without Cloud, no customer data-plane upload path was added, and no private Enterprise/Fortress implementation was imported into the public repo.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\`
- `C:\Kyntic\UCL\docs\work-packages\wp3-runtime-upgrade-implementation\`
- `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp1-cloud-control-plane\04-licence-entitlement-api.md`
- `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp1-cloud-control-plane\06-scout-ucl-contract-notes.md`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`

## Summary

Scout now has an optional `IControlPlaneEntitlementClient` implementation for Cloud licence/status checks. The default remains disabled:

```text
ControlPlane__Enabled=false
```

When enabled and called by future paid/private gates, the client checks the Cloud licence status endpoint:

```text
GET /api/v1/licences/{licenceKey}/status
```

The client reads only licence/control-plane metadata, maps Cloud canonical tier fields to Scout/Fortress/Elite ranks, and returns a typed entitlement decision that can gate Fortress-only or Elite-only capabilities. It does not run during open-core startup and does not make Cloud a required dependency for local Scout use.

## Code Files Changed

Created:

- `src/KynticAI.Scout.Application/Contracts/ControlPlaneEntitlementContracts.cs`
- `src/KynticAI.Scout.Application/Services/IControlPlaneEntitlementClient.cs`
- `src/KynticAI.Scout.Infrastructure/Services/CloudControlPlaneEntitlementClient.cs`
- `tests/KynticAI.Scout.UnitTests/CloudControlPlaneEntitlementClientTests.cs`

Updated:

- `src/KynticAI.Scout.Infrastructure/Configuration/RuntimeOptions.cs`
- `src/KynticAI.Scout.Infrastructure/DependencyInjection.cs`
- `src/KynticAI.Scout.Api/appsettings.json`
- `src/KynticAI.Scout.Api/appsettings.Production.json`

## Public Contracts

New application contracts:

- `ControlPlaneCommercialTier`: `Scout`, `Fortress`, `Elite`.
- `ControlPlaneCapabilityKeys`: `scout-open-core`, `fortress-runtime`, `relationship-set-engine`, `elite-operator-pack`.
- `ControlPlaneDeploymentMetadata`: optional safe deployment/control-plane metadata.
- `ControlPlaneEntitlementCheckRequest`: capability key, required tier, optional licence key, optional deployment metadata.
- `ControlPlaneEntitlementDecision`: typed allow/deny/not-checked result with effective tier, Cloud contact status, grace flag, offline grace days, fingerprinted licence key, enterprise feature names, entitlement limits, and warnings.

The decision object never returns the raw licence key. It returns a short SHA-256 fingerprint only.

## Config And Env Variables

Configuration keys:

| Key | Default | Purpose |
| --- | --- | --- |
| `ControlPlane:Enabled` | `false` | Enables optional Cloud checks when a caller uses `IControlPlaneEntitlementClient`. |
| `ControlPlane:BaseUrl` | empty | Cloud control-plane base URL. Required only when Cloud checks are enabled. |
| `ControlPlane:CustomerAccountId` | empty | Optional account/control-plane metadata header. |
| `ControlPlane:DataPlaneInstallationId` | empty | Optional registered data-plane installation metadata header. |
| `ControlPlane:DeploymentName` | empty | Optional public deployment name metadata header. |
| `ControlPlane:DeploymentVersion` | empty | Optional deployment version metadata header. |
| `ControlPlane:DeploymentRegion` | empty | Optional deployment region metadata header. |
| `ControlPlane:EnvironmentType` | `SelfHostedCommunity` | Optional deployment environment type metadata header. |
| `ControlPlane:UpdateChannel` | `stable` | Optional update-channel metadata header and local status display. |
| `ControlPlane:UsageReportingEnabled` | `false` | Existing aggregate usage flag; this client does not send usage counters. |
| `ControlPlane:OfflineGracePeriodDays` | `30` | Local grace display used when Cloud returns grace or is unavailable. |
| `ControlPlane:TimeoutSeconds` | `10` | HTTP timeout for Cloud status checks, clamped to 1-60 seconds. |
| `Licence:FilePath` | `.demo-data/scout-demo.licence.json` | Local signed licence file; used to find the licence key only when the caller does not pass one. |
| `Licence:PublicKeyPem` | empty | Existing local signed-envelope verification key for `ILicenceService`; not sent to Cloud. |

Environment variable form uses double underscores, for example:

```text
ControlPlane__Enabled=true
ControlPlane__BaseUrl=https://cloud.example.invalid
ControlPlane__DataPlaneInstallationId=<installation-id>
ControlPlane__DeploymentVersion=2.8.0
Licence__FilePath=C:\Scout\.local\licences\pilot.scout-licence.json
```

## Metadata Sent To Cloud

When enabled and called, Scout sends:

- raw licence key in the Cloud licence-status route path;
- optional account ID;
- optional data-plane installation ID;
- optional deployment name;
- optional deployment version;
- optional deployment region;
- optional environment type;
- optional update channel.

The HTTP request is a `GET` with no body. The client also accepts caller-supplied `ControlPlaneDeploymentMetadata` so a future private runtime gate can pass only allowlisted deployment/control-plane values.

## Metadata Explicitly Not Sent

The client does not send:

- raw customer operational records or source payloads;
- exact data items, context facts, context snapshots, prompt context packages, or local evidence packs;
- relationship intelligence, relationship sets, attribution paths, outcome records, recommendations, caveats, weighted signals, citation IDs, embeddings, vectors, or record IDs;
- connector credentials, source credentials, private keys, tokens other than the licence key used for status lookup, connection strings, webhook secrets, or API keys;
- local databases, local logs, audit event bodies, migration exports, checkpoints, dead letters, support bundles, or failed payloads;
- aggregate usage counters in this client. Aggregate reporting remains separate and disabled by default.

Cloud response bodies are parsed into allowlisted entitlement fields. Invalid or rejected Cloud response bodies are not echoed into warnings.

## Offline And Grace Behaviour

Cloud contract support used in this slice:

- licence status `Active` and `Grace` are accepted when `isValid=true`;
- numeric Cloud `LicenceStatus` values are mapped as `0=Active`, `1=Grace`, `2=Expired`, `3=Revoked`, `4=Suspended`, `5=Invalid`;
- `canonicalTierRank` and `canonicalTierName` determine Scout/Fortress/Elite capability decisions when present;
- legacy `PlanCode` values still map as `Free`/`Pro` to Scout, `Business`/`Enterprise` to Fortress, and `PrivateCloud` to Elite.

If Cloud is disabled, Scout open-core checks are allowed locally and paid/private capability checks return `NotChecked`/not allowed through this client. If Cloud is enabled but unavailable, paid capability checks fail closed through this client and return `CloudUnavailable` with the configured offline grace days so a separately reviewed local signed-licence policy can decide whether to continue inside grace.

## Tests Added Or Updated

Added `CloudControlPlaneEntitlementClientTests` covering:

- disabled Cloud checks do not call Cloud and keep Scout open-core local;
- active Fortress Cloud response allows a Fortress capability;
- only safe metadata headers are sent and no request body is sent;
- Fortress entitlement does not allow an Elite-only capability;
- Grace status is accepted when tier rank satisfies the request;
- Cloud unavailability fails closed for paid capabilities;
- Cloud rejection does not block Scout open-core capability;
- missing request licence key can be read from a local signed envelope without echoing the raw key in the decision.

## Commands Run

```text
dotnet build .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-restore
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build --filter FullyQualifiedName~CloudControlPlaneEntitlementClientTests
dotnet restore .\KynticAI.Scout.slnx
dotnet build .\KynticAI.Scout.slnx --no-restore
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-build
Get-Content -Raw docs\work-packages\wp3-runtime-upgrade-implementation\status.json | ConvertFrom-Json | Out-Null
Get-Content -Raw src\KynticAI.Scout.Api\appsettings.json | ConvertFrom-Json | Out-Null
Get-Content -Raw src\KynticAI.Scout.Api\appsettings.Production.json | ConvertFrom-Json | Out-Null
git diff --check
```

## Results

- Unit test project build: passed; 0 warnings; 0 errors.
- Focused mocked Cloud tests: passed; 7 tests.
- Restore: passed; all projects up to date.
- Full solution build: passed; 0 warnings; 0 errors.
- Unit tests: passed; 102 tests.
- SDK tests: passed; 13 tests.
- WP3 `status.json` parse validation: passed.
- `appsettings.json` and `appsettings.Production.json` parse validation: passed.
- `git diff --check`: passed; LF-to-CRLF working-copy warnings only.
- No live Cloud endpoint, hosted endpoint, Docker/PostgreSQL, browser/Playwright, LanceDB/native-store, pgvector, model-runtime, vendor sandbox, package publication, release, deployment, or xhigh review proof was run.

## Remaining Notes

- The client is an optional typed boundary. It is not yet wired into a private Enterprise/Fortress runtime because those paid modules are outside the public Scout repo.
- Dedicated Cloud licence suspend/reactivate, atomic commercial-tier movement, and optional offline grace-token endpoints remain Cloud target additions.
- Production signed binary delivery and production key custody remain Cloud/environment work.
