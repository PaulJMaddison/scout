# Connector Marketplace Skeleton

Universal Context Layer exposes a connector catalogue so buyers can see the integration roadmap while the public repository remains safe and open-core.

## Public Repo Boundary

Included executable connectors:

- SQL Database
- REST API
- CSV upload
- Mock CRM
- Mock Billing
- Mock Support
- Existing generic mock connector aliases used by the seeded demo

Catalogue-only placeholders:

- Salesforce
- HubSpot
- Dynamics
- Snowflake
- BigQuery
- Zendesk
- NetSuite
- Microsoft 365 / Outlook
- Gmail / Google Workspace
- Slack
- Microsoft Teams
- Outlook Calendar
- Google Calendar
- Segment
- Amplitude
- Mixpanel
- PostHog
- Jira
- Linear
- Confluence
- Notion
- SharePoint
- Google Drive

The placeholder entries are metadata only. They intentionally do not register connector plugins, authenticate to vendor APIs, sync vendor records, ingest message or document bodies, ingest attachments, ingest analytics payloads, or store vendor-specific credentials in the public repo. Real implementations live in private paid enterprise packages.

## Backend Model

Catalogue rows live in `saas_connector_catalogue_entries`. Each row stores:

- connector type and display metadata
- category
- availability: `OpenCore`, `Enterprise`, `SaaSManaged`, or `ComingSoon`
- supported data-source kinds
- capabilities
- configuration schema JSON
- credential schema JSON
- health-check mode
- placeholder flag

The seed runs during application bootstrap so local demo, backend-only mode, and hosted mode all expose the same catalogue metadata.

## Extension Points

Runtime connector implementations use `IConnectorPlugin`. Safe open-core plugins can validate configuration, run health checks, fetch records, and return normalized payloads.

Credential handling stays behind `IConnectorCredentialStore`. Configuration schemas can describe secrets, but runtime implementations should persist secret values as protected references and should not store plaintext credentials in connector configuration.

Health checks stay behind `IConnectorPlugin.CheckHealthAsync`. Placeholder marketplace entries describe future health-check behavior but are not registered as executable plugins.

## API Surface

REST:

```http
GET /api/v1/connectors/catalogue?page=1&pageSize=100
GET /api/v1/connectors/catalogue?availability=OpenCore
GET /api/v1/connectors/catalogue?q=salesforce
```

GraphQL:

```graphql
query ConnectorCatalogue {
  connectorCatalogue {
    connectorType
    displayName
    availability
    isIncludedInOpenCore
    requiresCommercialAgreement
    isPlaceholder
    configurationSchemaJson
    credentialSchemaJson
  }
}
```

Frontend:

- `/connectors` shows the catalogue, filters by availability, and clearly labels enterprise/vendor entries as placeholders.
