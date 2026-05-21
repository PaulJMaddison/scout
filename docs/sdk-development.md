# SDK Development

KynticAI Scout includes two local/private SDK scaffolds so consuming products can integrate against stable client interfaces instead of hand-rolling GraphQL and REST requests during pilots.

They are not currently configured for public package publishing. Treat NuGet/npm publishing as a deliberate later release task, with the private product boundary reviewed first.

## Layout

```text
src/KynticAI.Scout.Sdk/
tests/KynticAI.Scout.Sdk.Tests/
packages/typescript/scout-sdk/
```

## Public Surface

Both SDKs expose equivalent capability groups:

- `auth`
- `users`
- `accounts`
- `snapshots`
- `facts`
- `selectors`
- `recompute`
- `packages`
- `audit`
- tenant-scoped clients via `forTenant(...)`

## Local Development

### .NET

```bash
./.dotnet/dotnet.exe test tests/KynticAI.Scout.Sdk.Tests/KynticAI.Scout.Sdk.Tests.csproj
./.dotnet/dotnet.exe pack src/KynticAI.Scout.Sdk/KynticAI.Scout.Sdk.csproj -c Release
```

### TypeScript

```bash
cd packages/typescript/scout-sdk
npm install
npm run build
npm test
npm run pack:dry-run
```

## Versioning

- keep npm and NuGet SDK versions aligned to the private product line
- minor releases can add new client groups, methods, or response fields
- major releases are reserved for breaking contract changes

## Packaging

- NuGet: `KynticAI.Scout.Sdk`
- npm: `@kynticai/scout-sdk`
- current packaging commands are local validation aids, not release publishing steps

## Test Coverage

Recommended coverage for both SDKs:

- authentication request formatting
- request tracing header injection
- transient retry handling
- GraphQL error propagation
- problem-details REST error propagation
- tenant-scoped client delegation
- representative REST v1 user, account, and snapshot context queries
