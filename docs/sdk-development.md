# SDK Development

Universal Context Layer ships two first-class SDKs so consuming products can integrate against stable client interfaces instead of hand-rolling GraphQL and REST requests.

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

- keep npm and NuGet SDK versions aligned to the product release line
- minor releases can add new client groups, methods, or response fields
- major releases are reserved for breaking contract changes

## Packaging

- NuGet: `ContextLayer.Sdk`
- npm: `@universalcontextlayer/sdk`

## Test Coverage

Recommended coverage for both SDKs:

- authentication request formatting
- request tracing header injection
- transient retry handling
- GraphQL error propagation
- problem-details REST error propagation
- tenant-scoped client delegation
- representative user and account context queries
