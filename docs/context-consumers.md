# Context Consumers

KynticAI Scout creates governed semantic context that other systems consume. It does not require customers to use Scout's AI, replace their systems of record, or move raw operational data into a hosted control plane by default.

Common consumers include:

- AI tools, agents, and copilots that need scoped facts with confidence, freshness, masking, and provenance
- workflow automation that should react to semantic state rather than raw events alone
- internal applications that need account, user, product, support, billing, and lifecycle meaning
- reporting tools that benefit from shared definitions and traceable source evidence
- customer-facing product experiences that need trusted context without duplicating integration logic

The public repo includes REST, GraphQL, SDK scaffolds, context snapshots, semantic facts, provenance, audit foundations, and demo consumers. Paid/private repos may add enterprise connector packs or hosted control-plane services, but those are not required for the open-core data plane to demonstrate the consumer contract.

Blueprint import accepts user-created JSON and does not call external AI APIs.
