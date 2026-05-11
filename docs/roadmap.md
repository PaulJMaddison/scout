# Roadmap

This roadmap describes the current direction of Universal Context Layer at a high level. It is intended to help contributors understand the shape of the public open source core and the likely boundary to future commercial offerings.

## Repository model

The expected repository split is:

- `universalcontextlayer`
  The public open source core
- `universalcontextlayer-enterprise`
  A future private repository for paid enterprise extensions
- `universalcontextlayer-cloud`
  An optional future repository for managed SaaS and control-plane concerns

## Public open source core

Current and near-term public repo priorities:

- keep the semantic engine public
- keep context facts and snapshots public
- keep GraphQL and REST APIs public
- keep SQLite local demo and PostgreSQL support public
- keep mock connectors public
- keep SQL/file connector examples public only when they are generic, safe, and fictional
- keep extension interfaces public
- keep marketing and documentation public
- strengthen the semantic context model
- improve selector execution, provenance, confidence, and freshness handling
- improve the GraphQL and REST developer experience
- improve SDK usability
- keep local self-hosting and demo flows simple
- provide stable extension contracts for future enterprise modules
- improve documentation, tests, and examples

## Likely future private enterprise areas

These are likely to be developed outside the public repo:

- real enterprise connectors
- SSO/SAML implementations
- Stripe, Paddle, or other billing-provider integrations
- customer-specific deployment templates
- private cloud automation
- credential vault integrations
- enterprise policy engines
- compliance report exporters
- support-backed observability and operational tooling

This list is here to clarify boundary expectations, not to imply that those implementations already exist in the public repository.

## Managed SaaS direction

If a managed SaaS offering is developed later, it will likely focus on:

- hosted operations
- tenant administration
- managed upgrades
- usage metering and operational packaging
- hosted control-plane concerns that do not belong in the open source core

## Roadmap principles

- The open source core should remain useful without paid features.
- Public interfaces are welcome when they make the core cleaner and more extensible.
- Paid implementation code should not be mixed into the public repo by accident.
- Fictional demo data, safe defaults, and honest documentation matter as much as runtime code.
