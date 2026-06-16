# Local Validation

Routine local development must stay on restore, build, and unit-style tests. Do not run Docker, hosted endpoint checks, browser proof, or enterprise connector smoke unless the matching opt-in variable is set.

## Safe Default

```powershell
dotnet restore .\KynticAI.Scout.slnx
dotnet build .\KynticAI.Scout.slnx
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj

cd .\apps\web
npm install
npm run lint
npm run test
npm run build

cd ..\..\packages\typescript\scout-sdk
npm install
npm run test
```

## Optional External/Container/Live Commands

| Proof path | Class | Command | Required opt-in |
|---|---|---|---|
| Web browser/Playwright proof | Opt-in browser | `cd apps\web; npm run test:e2e` | `KYNTIC_RUN_BROWSER_TESTS=1` |
| README screenshot capture | Opt-in browser | `cd apps\web; node .\.capture-readme-screenshots.mjs` | `KYNTIC_RUN_BROWSER_TESTS=1` |
| Docker/PostgreSQL production rehearsal | Opt-in container | `.\scripts\production-rehearsal.ps1 -RunDocker` | `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS=1` |
| Enterprise connector smoke in paid-pilot rehearsal | Opt-in external/live | `.\scripts\paid-pilot-local-rehearsal.ps1` | `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS=1` unless `-SkipEnterpriseConnectorSmoke` is supplied |
| Cross-repo paid-pilot connector proof | Opt-in external/live | `.\scripts\paid-pilot-rehearsal-check.ps1` | `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS=1` unless `-SkipEnterpriseConnectorSmoke` is supplied |

## Required Environment Variables

The safe default path requires no environment variables beyond local SDK/toolchain availability. Browser proof requires `KYNTIC_RUN_BROWSER_TESTS=1`. Docker/PostgreSQL and enterprise connector proof require `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS=1`. Manual hosted/API runs may use `.env.example`, but those values are not required for safe validation.

## Expected Outputs

Safe validation should finish with successful .NET restore/build, passing backend unit and SDK tests, clean frontend lint output, passing Vitest output for `apps\web`, a successful web build, and passing TypeScript SDK tests.

## Known Partial/Blocked Proofs

Playwright proof is blocked until browser dependencies are installed and explicitly opted in. Docker/PostgreSQL rehearsal is blocked without Docker and the external-test gate. Enterprise connector smoke is partial unless the enterprise repo and any approved connector fixtures/endpoints are available; routine paid-pilot checks should pass with connector smoke skipped.
