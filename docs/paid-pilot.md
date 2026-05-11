# Paid Pilot

Universal Context Layer can be sold today as a supported paid pilot for teams that want to turn existing business data into trusted semantic context without replacing their current systems.

The strongest first commercial motion is not a hands-off SaaS signup. It is an implementation-led pilot where the customer runs the UCL data plane in their own environment, keeps operational data local, and receives hands-on support to prove one valuable workflow.

## Who It Is For

This pilot is for teams that already have useful data spread across CRM, support, product usage, billing, warehouse, spreadsheets, or legacy SQL systems, but cannot easily expose that data to AI tools, workflow automation, reporting, or internal products in a trusted way.

Good first buyers include:

- CTOs who need an integration layer before rolling out AI-enabled systems
- product leaders adding AI or automation to an existing product
- revenue leaders who need account intelligence without replacing CRM
- customer success or support leaders who need clearer customer context
- data and integration teams who want reusable semantic contracts instead of point-to-point joins

## What The Pilot Delivers

The recommended pilot delivers:

- a self-hosted UCL data-plane deployment in the customer's environment
- one tenant and one primary workspace configured for the pilot
- one to three connected source systems or safe exported source datasets
- a first semantic schema for the chosen workflow
- selector definitions that map raw source data into canonical context facts
- context snapshots with confidence, freshness, provenance, masking, and auditability
- REST, GraphQL, or SDK access for one downstream consumer
- an executive walkthrough showing the before and after business value
- technical handover documentation for the customer's team

The customer can bring their own AI tools, agents, apps, reports, or workflow engine. UCL creates the governed context those systems consume.

## Recommended Timeline

Most first pilots should run for two to six weeks, depending on source-system access and the number of downstream consumers.

1. Week 0 to 1: discovery, data access, architecture review, and success criteria.
2. Week 1 to 2: customer data-plane setup, source onboarding, and first semantic schema.
3. Week 2 to 4: selector implementation, provenance review, masking review, and first consumer integration.
4. Week 4 to 6: operational hardening, stakeholder playback, handover, and rollout recommendation.

## Commercial Scope

The paid pilot should be scoped as a services-backed platform pilot, not a self-serve subscription.

Commercial scope normally includes:

- fixed pilot duration
- named business workflow
- named technical sponsor
- limited number of source systems or exported datasets
- limited number of downstream consumers
- agreed support channel and response expectations
- written handover and next-step recommendation

Commercial scope normally excludes:

- unlimited connector delivery
- unmanaged production support
- formal compliance certification
- customer-specific long-term hosting operations
- live payment-provider billing
- full hosted SaaS account management

Use pricing ranges or placeholders until pricing is approved. Example public language: "scoped engagement", "from a fixed pilot fee", or "contact for pilot pricing".

## Technical Scope

Technical scope should be explicit before work starts:

- deployment mode and environment ownership
- PostgreSQL or approved production-style database
- source systems and access method
- credential handling and customer secret store
- data categories and PII expectations
- tenant and workspace structure
- semantic attributes and selectors
- downstream consumer API path
- audit, masking, provenance, and retention expectations
- support bundle and log redaction boundaries

## What The Customer Provides

- business owner and technical owner
- source-system access or safe exported datasets
- sandbox or non-production access where possible
- approved secret storage route
- sample records that can be used without breaching confidentiality
- data protection and security requirements
- target workflow and success criteria
- access to the downstream consumer team

## What We Provide

- architecture and workflow discovery
- UCL data-plane setup guidance
- semantic schema and selector implementation support
- connector configuration support for generic SQL, REST, CSV, or commercially scoped private connectors
- provenance, confidence, freshness, and masking review
- API or SDK integration support for one first consumer
- production-readiness checklist review
- executive playback and technical handover

## Recommended Pilot Workflow

1. Discovery workshop

   Map the business workflow, source systems, key entities, data quality risks, privacy constraints, and expected commercial outcome.

2. Data-plane setup

   Deploy UCL locally, in the customer's cloud, or in a private environment. Disable demo fallback, configure production secrets, and use PostgreSQL for production-style pilots.

3. Source onboarding

   Connect generic SQL, REST, CSV, or safe exported datasets first. Paid enterprise connectors can be added from the private enterprise repo when commercially agreed.

4. Semantic model design

   Define the first attributes, such as conversion probability, churn risk, product fit, budget readiness, support risk, onboarding status, renewal risk, or recommended next action.

5. Selector implementation

   Create selectors, preview transformations, validate confidence and freshness scoring, and confirm provenance is readable by business users.

6. Downstream integration

   Expose context to one consumer through REST, GraphQL, the TypeScript SDK, the .NET SDK, or a context package export.

7. Business review

   Show how existing data became reusable context and how the downstream workflow improved because it had business meaning rather than raw records.

## What Is Not Included By Default

The public open-core repo does not include:

- live Stripe, Paddle, or payment-provider billing
- hosted SaaS account management
- a production licence portal
- real paid vendor connector implementations
- SSO, SAML, SCIM, or enterprise identity implementation
- customer-specific deployment automation
- formal compliance certification

Those belong in private enterprise or cloud/control-plane work and should be scoped separately.

## First Pilot Success Criteria

A pilot is successful when:

- the customer can explain what the UCL data plane does
- source systems remain in place
- at least one business entity resolves into a useful semantic profile
- every context fact has provenance, confidence, freshness, and audit history
- a downstream system can consume the context without joining raw source tables itself
- the customer can identify at least one workflow that becomes more valuable with governed context

## Example Pilot Packages

Use these as packaging guides rather than hard public pricing.

### Discovery Workshop

Best for a buyer who understands the problem but has not selected the first workflow.

- one to two workshops
- source-system and workflow mapping
- privacy and governance review
- pilot recommendation
- indicative implementation plan

Pricing language: scoped workshop fee.

### Starter Pilot

Best for proving the architectural pattern quickly.

- two to four week implementation
- one workflow
- one environment
- up to three source systems or exported datasets
- one downstream consumer
- one executive playback
- one technical handover

Pricing language: fixed pilot fee or from a defined pilot range.

### Production Pilot

Best for teams that want a production-style customer data plane with stronger operational readiness.

- four to six week implementation
- PostgreSQL
- production secrets checklist
- backup and restore review
- API-client and scope review
- masking and audit review
- one or two downstream consumers
- go-forward support model

Pricing language: scoped production pilot, priced after discovery.

### Enterprise Rollout Design

Best after a successful pilot or for larger estates.

- workspace and tenant design
- private connector scope
- governance and retention design
- support and operational ownership model
- private enterprise module plan
- future cloud/control-plane alignment

Pricing language: enterprise design engagement.

Convert to ongoing support, enterprise connectors, private cloud, or managed operations once the customer has seen the value.
