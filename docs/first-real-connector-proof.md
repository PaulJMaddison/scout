# First Real Connector Proof

This proof uses the open-core generic SQL connector. It does not add Salesforce, HubSpot, or other vendor-specific paid connector code to the public repository.

## Selected Path

Selected connector: `sqlTable`, resolved by the SQL Database Connector.

Reason: a generic SQL/PostgreSQL path is commercially useful for first pilots because many customers can provide a read-only PostgreSQL database, warehouse table, replica, or approved extract table before a paid vendor connector is agreed.

The implementation supports:

- `mode=currentDatabase` for local proof and tests
- `mode=customerOpsDatabase` for the customer operations database configured with UCL
- `mode=connectionString` for an external PostgreSQL connection string supplied through configuration or protected credentials

## Source Data In

The integration proof creates a source table:

```sql
create table customer_metrics (
    external_user_id text not null,
    observed_at_utc text not null,
    preferred_channel text not null
);
```

Sample row:

```sql
insert into customer_metrics (external_user_id, observed_at_utc, preferred_channel)
values ('123', '2026-05-09T11:45:00.0000000Z', 'email');
```

Production-style sample SQL is provided in [generic-sql-customer-context-rollups.sql](../samples/connectors/generic-sql-customer-context-rollups.sql).

## Connector Configuration

Sample configuration is provided in [generic-sql-connector-config.json](../samples/connectors/generic-sql-connector-config.json).

Important fields:

- `connectorType`: `sqlTable`
- `mode`: `customerOpsDatabase` or `connectionString`
- `tableName`: approved source table or view
- `userIdColumn`: subject key used by UCL
- `tenantSlugColumn`: tenant boundary column when present
- `observedAtColumn`: freshness timestamp
- `columns`: approved fields to read

External PostgreSQL credentials must be supplied from the customer-approved secret store. Do not commit connection strings or passwords.

## Selector Mapping

The integration test maps:

```json
{
  "rule": {
    "valuePath": "preferred_channel"
  }
}
```

The selector targets semantic attribute `preferredChannel` and produces an enum context fact. The validation schema requires `preferred_channel` to be present.

## Confidence, Freshness, And Provenance

The selector is configured with:

- default confidence: `0.95`
- freshness window: `60` minutes
- observed timestamp: read from `observed_at_utc`
- provenance: connector type, selector identity, source metadata, validation result, and pipeline trace

The test verifies that provenance contains `sqlTable` and that provenance metadata is written for both `selector-execution` and `context-fact`.

## Context Fact Output

Expected fact shape:

```json
{
  "attributeKey": "preferredChannel",
  "valueJson": "\"email\"",
  "confidence": 0.95,
  "provenanceJson": "{... sqlTable ...}",
  "freshUntilUtc": "2026-05-09T12:45:00Z"
}
```

## Context Snapshot Output

The recompute processor creates a context snapshot for external user `123` with:

- `snapshotVersion`: `1`
- one fact for `preferredChannel`
- non-stale status while within the freshness window
- recompute audit event `context.recompute.completed`

## API Lookup Response

The integration test calls the same application service used by the REST and GraphQL endpoints:

```csharp
GetUserContextAsync(new UserContextLookupInput("demo", "123"), cancellationToken)
```

REST lookup path:

```text
GET /api/rest/tenants/demo/users/123/context
```

GraphQL lookup path:

```graphql
query {
  userContext(input: { tenantSlug: "demo", externalUserId: "123" }) {
    tenantSlug
    externalUserId
    snapshotVersion
    facts {
      attributeKey
      valueJson
      confidence
      provenanceJson
    }
  }
}
```

Authentication is still required for the real API routes.

## Audit And Provenance Trail

The proof verifies:

- source data was read by the SQL connector
- selector preview produced a candidate fact
- selector execution stored raw source data and pipeline trace
- recompute created a context snapshot
- provenance metadata was written for selector execution and context fact
- audit event `context.recompute.completed` was written

## Verification

Run:

```powershell
dotnet test .\tests\ContextLayer.IntegrationTests\ContextLayer.IntegrationTests.csproj --filter "FullyQualifiedName~SqlTableConnector_ReadsCurrentDatabaseRow_AndProducesContextSnapshot"
```

This uses SQLite for the test database so it can run without local Docker/PostgreSQL. The same connector code opens external PostgreSQL through Npgsql when `mode=connectionString` is configured.
