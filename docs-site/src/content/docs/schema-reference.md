---
title: Schema Reference
description: Public Scout database schema inventory and source-of-truth notes.
---

This page inventories the public Scout persistence model from the EF Core
contexts and current model snapshots. The public docs keep this page as the
human-readable entry point and treat EF Core configuration as the exact
source of truth for column types, indexes, and relationships.

The authoritative sources are:

- `src/KynticAI.Scout.Infrastructure/Persistence/KynticAI.ScoutDbContext.cs`
- `src/KynticAI.Scout.Infrastructure/Persistence/CustomerOpsDbContext.cs`
- `src/KynticAI.Scout.Infrastructure/Persistence/Migrations/ScoutDbContextModelSnapshot.cs`
- `src/KynticAI.Scout.Infrastructure/Persistence/CustomerOpsMigrations/CustomerOpsDbContextModelSnapshot.cs`

## Scout Database

The Scout database stores the semantic data plane, operator/admin records,
API clients, connector metadata, context packages, audit records, and
public-safe SaaS foundation records.

| Table | Primary purpose |
|---|---|
| `tenants` | Tenant identity and slug. |
| `user_profiles` | Subject records used for user context lookups. |
| `operator_accounts` | Human operator accounts. |
| `data_sources` | Registered source-system definitions. |
| `semantic_attribute_definitions` | Canonical semantic attributes and data types. |
| `selector_definitions` | Selector rules that map source data to semantic facts. |
| `selector_executions` | Selector execution history and correlation. |
| `context_snapshots` | Point-in-time context profiles. |
| `context_facts` | Individual semantic facts with confidence and provenance links. |
| `prompt_templates` | Public-safe templates used by demo context package flows. |
| `agent_runs` | Example agent-run records for the demo surface. |
| `audit_events` | Audit log for context, auth, and administrative actions. |
| `recompute_jobs` | Queued context recomputation work. |
| `provenance_metadata` | Source and observation metadata for facts and executions. |
| `connector_credentials` | Protected connector credential references. |
| `source_system_events` | Provider-neutral source change events. |
| `user_signals` | Source-derived user signals. |
| `saas_workspaces` | Workspace metadata for API clients and admin surfaces. |
| `saas_workspace_members` | Operator workspace membership metadata. |
| `saas_tenant_subscriptions` | Local subscription state. |
| `saas_billing_plans` | Plan metadata used by local usage checks. |
| `saas_billing_plan_limits` | Usage limits associated with local plan metadata. |
| `saas_api_clients` | Machine-to-machine API clients. |
| `saas_webhook_signing_secrets` | Webhook signing secret metadata and status. |
| `saas_connector_installations` | Connector installation metadata. |
| `saas_connector_catalogue_entries` | Public connector catalogue entries and boundaries. |
| `saas_context_packages` | Generated context package metadata. |
| `saas_billing_usage_records` | Usage-metering records. |
| `saas_onboarding_states` | Local onboarding step state. |
| `saas_onboarding_applications` | Onboarding application records. |
| `saas_blueprint_imports` | Blueprint import history and validation metadata. |
| `saas_pii_rules` | Public-safe PII policy metadata. |
| `saas_audit_policies` | Public-safe audit policy metadata. |

### Core Data-Plane Tables

| Table | Key columns | Notes |
|---|---|---|
| `tenants` | `id`, `slug`, `name`, `is_active`, timestamps | `slug` is unique. |
| `user_profiles` | `tenant_id`, `external_user_id`, `full_name`, `email`, `company_name`, `job_title`, `segment`, `last_seen_at_utc` | Unique per tenant and external user ID. |
| `data_sources` | `tenant_id`, `name`, `kind`, `status`, `connection_config_json`, `last_successful_sync_at_utc` | `connection_config_json` stores public connector configuration, not raw secrets. |
| `semantic_attribute_definitions` | `tenant_id`, `key`, `display_name`, `description`, `data_type`, `example_value_json`, `is_system` | `key` is unique per tenant. |
| `selector_definitions` | `tenant_id`, `data_source_id`, `target_attribute_definition_id`, `mapping_kind`, `expression_json`, `validation_schema_json`, `default_confidence`, `freshness_window_minutes`, `priority` | Selectors remain drafts until published. |
| `selector_executions` | `selector_definition_id`, `user_profile_id`, `correlation_id`, `status`, `execution_mode`, `result_value_json`, `result_confidence`, `raw_source_data_json`, `pipeline_trace_json` | Execution history for preview, recompute, and scheduled paths. |
| `context_snapshots` | `tenant_id`, `user_profile_id`, `snapshot_version`, `summary`, `overall_confidence`, `is_stale`, `generated_at_utc` | Versioned context profile for a subject. |
| `context_facts` | `context_snapshot_id`, `semantic_attribute_definition_id`, `source_selector_definition_id`, `attribute_key`, `value_json`, `value_type`, `confidence`, `observed_at_utc`, `fresh_until_utc`, `provenance_json` | Unique by snapshot and attribute key. |
| `audit_events` | `tenant_id`, `actor`, `action`, `entity_type`, `entity_id`, `correlation_id`, `metadata_json`, `before_json`, `after_json`, `created_at_utc` | Tenant and time indexed for review. |
| `source_system_events` | `tenant_id`, `workspace_id`, `event_id`, `source_system`, `event_type`, `external_user_id`, `external_account_id`, `payload_json`, `status`, `correlation_id`, timestamps | Unique by tenant, source system, and event ID. |

## Customer Operations Demo Database

The customer operations database is a separate demo/source database used to
prove that Scout can read operational data without making that data part of
the semantic schema itself.

| Table | Primary purpose |
|---|---|
| `customer_ops_tenants` | Demo source tenant identity. |
| `accounts` | Demo account/company records. |
| `contacts` | Demo contact records. |
| `users` | Demo product user records. |
| `products` | Demo product catalogue entries. |
| `plans` | Demo product plan records. |
| `subscriptions` | Demo subscription records. |
| `opportunities` | Demo sales opportunities. |
| `sales_activities` | Demo sales activity records. |
| `email_engagement_events` | Demo email engagement events. |
| `support_tickets` | Demo support tickets. |
| `product_usage_summaries` | Demo product-usage rollups. |
| `billing_metrics` | Demo billing metrics. |
| `web_conversion_events` | Demo web conversion events. |
| `customer_contact_signals` | Demo contact signals. |
| `customer_email_signals` | Demo email signals. |
| `customer_context_rollups` | Demo rollups used by sample selectors. |

## Exact Column Reference

For exact column lengths, nullability, precision, index shape, and delete
behaviour, use the EF Core configuration classes and model snapshots listed
at the top of this page. The docs intentionally avoid hand-copying every
generated migration detail because stale column references are worse than a
concise, source-linked schema overview.

## Migration Notes

- SQLite local mode is for evaluation and demos.
- PostgreSQL is the production-style self-hosting target.
- EF Core migrations are the source of truth for schema evolution.
- Demo source tables and Scout semantic tables should remain conceptually
  separate even when both are hosted by the same local process.

See [Self-Hosting](/self-hosting/) for migration and production-style
database notes.
