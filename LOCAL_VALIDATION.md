# Local Validation

Routine local development must stay on restore, build, and unit-style tests. Do not run Docker, hosted endpoint checks, browser proof, or enterprise connector smoke unless the matching opt-in variable is set.

## Safe Default

```powershell
dotnet restore .\KynticAI.Scout.slnx
dotnet build .\KynticAI.Scout.slnx
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj

cd .\apps\web
npm run lint
npm run test
npm run build

cd ..\..\packages\typescript\scout-sdk
npm run test
```

## Explicit Proof Paths

| Proof path | Command | Required opt-in |
|---|---|---|
| Web browser/Playwright proof | `cd apps\web; npm run test:e2e` | `KYNTIC_RUN_BROWSER_TESTS=1` |
| README screenshot capture | `cd apps\web; node .\.capture-readme-screenshots.mjs` | `KYNTIC_RUN_BROWSER_TESTS=1` |
| Docker/PostgreSQL production rehearsal | `.\scripts\production-rehearsal.ps1 -RunDocker` | `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS=1` |
| Enterprise connector smoke in paid-pilot rehearsal | `.\scripts\paid-pilot-local-rehearsal.ps1` | `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS=1` unless `-SkipEnterpriseConnectorSmoke` is supplied |
| Cross-repo paid-pilot connector proof | `.\scripts\paid-pilot-rehearsal-check.ps1` | `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS=1` unless `-SkipEnterpriseConnectorSmoke` is supplied |
