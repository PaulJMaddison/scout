# Contributing

Thanks for your interest in improving Universal Context Layer.

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

## Quality checks

- Backend: `dotnet test ContextLayer.slnx`
- Frontend lint: `npm run lint` from `apps/web`
- Frontend tests: `npm test` from `apps/web`
- Frontend build: `npm run build` from `apps/web`

## Pull requests

- Use clear commit messages.
- Describe the user or business scenario the change improves.
- Call out any new environment variables, scripts, or data migrations.

## Conduct

By participating in this project, you agree to follow the guidelines in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
