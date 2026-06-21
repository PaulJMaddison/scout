# Discovery MCP Scout Final Cloud Review - 2026-06-21

Mode: Scout-side Codex Cloud verification for the KynticAI Discovery MCP product. Verification was run on 2026-06-21 at approximately 02:03-02:05 UTC. No packages were published, no live vendor systems were called, and no real customer data was used.

## Commands run

- `git status --short`
- `cd apps/discovery-agent && npm install`
- `cd apps/discovery-agent && npm run build`
- `cd apps/discovery-agent && npm run test`
- `node apps/discovery-agent/dist/index.js --path . --tier 3 --audit-only`
- `cd packages/typescript/scout-discovery-mcp && npm install`
- `cd packages/typescript/scout-discovery-mcp && npm run build`
- `cd packages/typescript/scout-discovery-mcp && npm run test`
- `cd packages/typescript/scout-connector-validator && npm run build`
- `cd packages/typescript/scout-connector-validator && npm run test`
- `node packages/typescript/scout-connector-validator/dist/cli.js packages/typescript/scout-connector-validator/data/prospect-crm-metadata.json packages/typescript/scout-connector-validator/data/prospect-web-analytics.json packages/typescript/scout-connector-validator/data/prospect-conversion-events.json --check-duplicates`
- `node apps/discovery-agent/dist/kyntic-discovery-mcp.js --metadata apps/discovery-agent/examples/synthetic-approved-metadata.json --signature`
- `git diff --check`

## Test results

- Initial working tree check: `git status --short` showed only the pre-existing untracked `.codex-cloud/` toolchain directory before edits; no tracked source changes were present.
- Discovery Agent install: passed. `npm install` completed; npm reported two high-severity audit advisories and the environment warning `Unknown env config "http-proxy"`.
- Discovery Agent build: passed. The nested `scout-discovery-mcp`, `scout-connector-validator`, and `scout-metadata-audit` prebuilds also passed.
- Discovery Agent tests: passed. `3` files, `16` tests.
- Tier 3 Scout repo audit: passed. The audit returned project `KynticAI.Scout`, tier `3`, audit timestamp `2026-06-21T02:03:31.855Z`, `3161` files, `457` directories, `689` scanned files, and `2472` skipped files. The scan completed without network or vendor calls; the untracked `.codex-cloud/` toolchain directory was visible to the file-tree audit because it exists in the Cloud workspace.
- Scout Discovery MCP install: passed. `npm install` completed; npm reported two high-severity audit advisories and the environment warning `Unknown env config "http-proxy"`.
- Scout Discovery MCP build: passed, including nested validator and metadata-audit builds.
- Scout Discovery MCP tests: passed. `3` files, `118` tests.
- Scout Connector Validator build: passed.
- Scout Connector Validator tests: passed. `2` files, `110` tests.
- Discovery Signature CLI smoke: passed and printed a valid metadata-only signature.
- `git diff --check`: passed with no whitespace errors.

## Manifest validation results

The new metadata-only prospect fixtures validate through the built connector-validator CLI with duplicate checking enabled:

- `prospectCrmMetadata`: pass
- `prospectWebAnalytics`: pass
- `prospectConversionEvents`: pass

CLI result: each prospect manifest printed `[PASS]`, followed by `3 manifest(s) checked. All valid.`

The fixtures are synthetic, provider-neutral, and metadata-only. They do not contain credentials, tokens, connection strings, local paths, raw records, source rows, prompt packages, analytics payloads, or customer data.

## Discovery Signature summary

The built Discovery MCP CLI generated a valid `kynticai.discovery-signature.v1` object from `apps/discovery-agent/examples/synthetic-approved-metadata.json` during this Cloud run.

Observed signature summary:

- `schemaVersion`: `kynticai.discovery-signature.v1`
- `companyType`: `B2B software company`
- `targetWorkflow`: `Revenue conversion review for a synthetic demo`
- `sourceSystemFamilies`: `CRM`, `Product usage`, `Support desk`, `Website analytics`
- `conversionPoints`: `demo_request`, `pricing_view`, `trial_signup`
- `approvedForSyntheticDemoBuild.approved`: `true`
- `approvalReference`: `LOCAL-SMOKE-001`

The generated signature contains metadata summaries only.

## Consent gate result

Consent-gated handoff is disabled by default and covered by `apps/discovery-agent/tests/buyer-wrapper.test.ts`.

Verified behaviours:

- Handoff remains disabled when `allowHandoff` and consent are absent.
- Handoff requires explicit consent, an approved HTTPS endpoint, and approved config.
- When enabled in the test with explicit approval/config, the submitted request body is exactly the canonical Discovery Signature object.
- The handoff body does not wrap or add approval metadata outside the signature payload.

## Forbidden payload rejection summary

Discovery Signature validation rejects the full forbidden-payload checklist:

- credentials
- tokens
- connection strings
- raw records
- long payload blobs
- local paths, with diagnostics sanitised to `[REDACTED_PATH]`
- source rows
- prompt packages
- analytics payloads

The rejection path is covered by `apps/discovery-agent/tests/buyer-wrapper.test.ts`, including a dedicated checklist test. The MCP hardening tests also assert safe public outputs, deterministic ordering, path/secret redaction, and absence of enterprise/private terms from public MCP tool outputs.

## Boundary result

No private implementation internals, private connector implementations, vector-store integrations, embedded model runtime, customer data, or live vendor calls were added for this review. Public Scout still contains documented extension contracts and placeholder metadata by design; the Discovery MCP public outputs remain metadata-only and are tested not to expose private implementation terms.

## Residual blockers

None for the requested Scout-side build/test/smoke gates.

Non-blocking follow-ups:

- `npm install` in `apps/discovery-agent` and `packages/typescript/scout-discovery-mcp` reports two high-severity npm audit advisories. The requested build/test/smoke verification passes; dependency-audit remediation was not part of this scoped review.
- The Cloud workspace contains an untracked `.codex-cloud/` local toolchain directory. It was not added to git and is not part of the proof artefact.
