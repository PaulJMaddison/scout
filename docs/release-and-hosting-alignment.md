# Release And Hosting Alignment

This repo is the public open-core product, marketing/demo site, local demo, and customer data-plane admin console.

## Current Alignment

- Current working branch for this readiness pass: `pjm/v2-next-public-core`
- Intended release branch: `main`, after review and promotion
- Live hosting target: use `main` or a reviewed release tag; do not point public hosting at `pjm/v2-next-public-core` except for a temporary private preview
- Static public demo output: `apps/web/dist-static-demo`
- Customer data-plane deployment output: API/container/static frontend built from the reviewed release branch or tag

Feature branches are allowed for local rehearsal and private previews only. They are not the commercial release source of truth.

## Local Verification

Run:

```powershell
.\scripts\check-release-alignment.ps1
```

The script prints the current branch, upstream, ahead/behind state, latest tag, latest GitHub release when `gh` is available, and whether the working tree is clean. It warns if the branch is not the expected readiness branch or if the hosting plan is unclear.

## GitHub Pages Target

Before public hosting next week, verify GitHub Pages from the repository settings or with the GitHub CLI:

```powershell
gh api repos/:owner/:repo/pages
```

Expected production posture:

- source branch is `main`, or hosting is driven from a reviewed release/tag artefact
- GitHub Pages is not pointing at a private feature branch by accident
- the published directory matches the static demo build artefact selected for the release
- `VITE_DEMO_FALLBACK=false` for customer-facing builds unless the page is explicitly labelled as the backend-free static public demo

## Private Repo Boundary Check

The public repo must not contain paid enterprise implementation code, private cloud control-plane code, real payment credentials, licence signing keys, customer connector endpoints, support bundles, local databases, or customer data.

Before release:

```powershell
git ls-files | Select-String -Pattern 'universalcontextlayer-enterprise|Ucl.Cloud.Api|BEGIN PRIVATE KEY|service_account|support-bundle|\.sqlite|\.db|\.pem|\.pfx'
```

Any hit outside documentation examples must be reviewed before hosting.

## Release Rule

Do not merge, tag, publish, or repoint hosting from this document or script. The remaining live-hosting work next week should be operational configuration against a reviewed branch/tag, not product discovery.
