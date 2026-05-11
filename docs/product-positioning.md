# Product positioning

Universal Context Layer turns existing business data into trusted semantic context that any AI tool, workflow, application, report, copilot, or agent can use.

UCL is context infrastructure for AI-enabled business systems. It is not another AI app, and it does not need to own a customer's model, agent, copilot, or orchestration layer. It sits beside CRM, ERP, support desk, warehouse, product database, billing system, spreadsheets, legacy databases, and internal applications, then creates a reusable semantic layer above them.

## Core message

- UCL is not another AI app.
- UCL is the layer that makes a company's own apps, reports, AI systems, and workflows more useful.
- Customers can bring their own AI tools, models, agents, copilots, internal products, and automation platforms.
- UCL creates semantic facts with confidence, freshness, provenance, masking, and auditability.
- UCL exposes context through GraphQL, REST, SDKs, governed context packages, and future delivery channels such as webhooks.
- UCL helps downstream systems understand customers, accounts, opportunities, products, support risks, usage signals, billing status, and business intent.
- Intelligent Sales Support is the first demo use case, not the whole product.
- The broader category is context infrastructure for AI-enabled business systems.
- Customer data can remain in the customer-owned data plane; an optional hosted control plane should manage account, licence, download, support, update, and optional aggregate usage metadata only.

## Why this matters

AI and automation often fail because they are connected directly to raw operational records. A model may see account ids, stale exports, support ticket fragments, product event rows, and billing tables without knowing which signals are reliable, current, masked, or commercially meaningful.

UCL creates the missing interpretation layer. Selectors map raw source data into canonical business facts such as renewal risk, expansion potential, preferred channel, onboarding health, budget readiness, product fit, and recommended sales motion. Those facts can then be reused by many downstream systems instead of being rebuilt for every workflow.

## Buyer framing

For CEOs and commercial leaders, UCL makes existing data more useful without requiring a broad replacement programme first. The business can improve support, onboarding, customer success, reporting, and AI-assisted workflows while keeping current systems in place.

For product leaders, UCL provides a shared source of customer meaning. Product teams can build better experiences because they receive semantic context rather than brittle joins across CRM, support, billing, usage, and warehouse systems.

For CTOs and architects, UCL reduces point-to-point integration pressure. Source systems are integrated once, governed selectors create the semantic contract, and downstream consumers use GraphQL, REST, SDKs, or context packages.

For integration teams, UCL gives a practical route from mixed operational systems to reusable context. It keeps provenance, confidence, freshness, masking, and audit history attached to the facts that products consume.

## Control-plane and data-plane framing

The self-hosted data plane is where customer operational data belongs. It manages connectors, selector execution, semantic attributes, context snapshots, context facts, provenance, audit logs, local users, roles, API keys, GraphQL, REST, SDK access, and webhook/event ingestion.

The hosted control plane is an optional commercial seam. It can manage accounts, licences, plans, downloads, documentation, support access, update channels, and optional aggregate usage reporting. It should not require raw source records, connector credentials, context facts, prompt context packages, or tenant audit logs to leave the customer environment.

## Demo framing

The AI sales playground should always be introduced as an example consumer: Intelligent Sales Support. It shows how a sales workflow improves when a model receives a governed context package with citations and guardrails.

That demo is intentionally concrete, but it should not imply that UCL is only a sales assistant or that the customer must adopt UCL's own AI stack. The same context layer can serve internal copilots, CRM AI features, support automation, customer success tooling, product onboarding, marketing personalisation, reporting, workflow automation, and third party agents.

## Open core and enterprise boundary

The public repository should remain a useful open source core: selector execution, semantic context facts, provenance, audit primitives, GraphQL and REST APIs, SDKs, local demo mode, backend-only mode, extension contracts, and documentation.

Paid or private repositories may contain enterprise connectors, hosted SaaS control plane implementation, billing-provider integration, SSO, advanced governance, managed deployment assets, private cloud packs, and customer-specific implementation code. Public docs can describe these extension points, but should not claim that private implementations already ship in the open source repo.
