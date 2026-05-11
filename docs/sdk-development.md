# SDK Development

Universal Context Layer includes two local/private SDK scaffolds so consuming products can integrate against stable client interfaces instead of hand-rolling GraphQL and REST requests during pilots.

They are not currently configured for public package publishing. Treat NuGet/npm publishing as a deliberate later release task, with the private product boundary reviewed first.

## Layout

```text
src/ContextLayer.Sdk/
tests/ContextLayer.Sdk.Tests/
packages/typescript/contextlayer-sdk/
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
./.dotnet/dotnet.exe test tests/ContextLayer.Sdk.Tests/ContextLayer.Sdk.Tests.csproj
./.dotnet/dotnet.exe pack src/ContextLayer.Sdk/ContextLayer.Sdk.csproj -c Release
```

### TypeScript

```bash
cd packages/typescript/contextlayer-sdk
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

- NuGet: `ContextLayer.Sdk`
- npm: `@universalcontextlayer/sdk`
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
