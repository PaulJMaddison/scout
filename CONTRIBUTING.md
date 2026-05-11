# Contributing

Thanks for your interest in improving Universal Context Layer.

## Open core boundary

This repository is the public open source core of Universal Context Layer. Contributions here should strengthen the core platform, developer experience, documentation, demo flows, SDKs, and public extension points.

Please do not add paid enterprise implementation code to this repository. In particular, the public repo should not contain:

- proprietary connector implementations for commercial systems
- enterprise SSO or customer-specific identity integrations
- private cloud or on-prem deployment packs intended for paid distribution
- advanced governance, compliance, or support tooling that is meant to live in a private commercial repo
- customer-specific mappings, prompts, schemas, datasets, or secrets

It is fine for the public repo to define stable extension interfaces for future enterprise modules. It is not fine to quietly ship the paid implementations here.

## Getting started

1. Read the [README](README.md) for the product overview and local setup.
2. Run the demo bootstrap:
   - Windows: `./scripts/setup-demo.ps1`
   - macOS/Linux: `sh ./scripts/setup-demo.sh`
3. Start the stack:
   - Windows: `./scripts/start-demo.ps1`
   - macOS/Linux: `sh ./scripts/start-demo.sh`

## Development workflow

- Keep changes focused and explain the business reason as well as the code change.
- Prefer adding tests for new backend behavior and meaningful UI verification for frontend changes.
- If you touch setup, seed, or demo flows, verify the happy path end to end.
- Prefer improving public extension points over adding hard-coded enterprise behaviour.
- If you are unsure whether a feature belongs in the public repo, treat it as a boundary question first and document the decision in your pull request.

## What belongs in the public repo

Good contribution areas include:

- core semantic context modelling
- selector execution and provenance handling
- GraphQL, REST, SDK, and CLI developer experience
- local self-hosting and demo usability
- mock connectors, generic connector contracts, and safe default implementations
- public documentation, samples, and tests

## What should stay outside the public repo

These normally belong in a future private enterprise repo, a future managed SaaS codebase, or professional services materials:

- premium commercial connector implementations
- customer-specific deployment artefacts
- enterprise auth provider implementations
- advanced policy packs or compliance report packs
- entitlement, billing, or commercial packaging logic

See [docs/open-core-boundary.md](docs/open-core-boundary.md) and [docs/enterprise-extension-points.md](docs/enterprise-extension-points.md) for the detailed boundary.

## Quality checks

- Backend: `dotnet test ContextLayer.slnx`
- Frontend lint: `npm run lint` from `apps/web`
- Frontend tests: `npm test` from `apps/web`
- Frontend build: `npm run build` from `apps/web`

## Pull requests

- Use clear commit messages.
- Describe the user or business scenario the change improves.
- Call out any new environment variables, scripts, or data migrations.
- Call out any new extension interfaces and explain whether they are intended for OSS use, future enterprise use, or both.
- Avoid PRs that mix boundary cleanup, product messaging changes, and unrelated functional refactors in one change set.

## Conduct

By participating in this project, you agree to follow the guidelines in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
