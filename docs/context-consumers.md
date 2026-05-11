# Context consumers

UCL creates the context. Your systems consume it.

The context layer is useful because many systems can share the same semantic facts instead of each product, report, agent, or workflow reinterpreting source data on its own. A consumer can be an AI system, but it does not have to be.

## Common consumers

- Internal copilots can answer employee questions using governed customer and account context.
- CRM AI features can enrich account views, prioritise opportunities, or explain recommended actions.
- Support automation can combine ticket severity with account value, renewal risk, product usage, and customer status.
- Customer success tools can show onboarding health, adoption signals, expansion fit, and renewal risk.
- Product onboarding can tailor next steps based on role, product usage, blockers, plan interest, and support history.
- Marketing personalisation can use shared semantic attributes instead of fragile campaign-specific joins.
- Reporting and decision systems can consume trusted facts with freshness and provenance metadata.
- Workflow automation can trigger actions when semantic state changes, not only when raw events arrive.
- Third party AI agents can receive scoped context packages with allowed facts, citations, masking decisions, and audit visibility.
- Internal business applications can use GraphQL, REST, or SDKs to display business meaning without embedding upstream schema logic.

## Consumer contract

Consumers should receive context in a shape that is stable and explainable:

- subject identity, such as customer, account, opportunity, product, or user
- semantic facts, such as churn risk, expansion potential, plan interest, support drag, usage maturity, or billing status
- confidence score
- freshness state and expiry
- provenance linking the fact back to source systems, records, and selectors
- masking status for sensitive fields
- audit trail for reads, recomputes, and package generation
- optional context package manifest for a specific use case or audience

## Technical access patterns

The current public repo includes GraphQL, REST, TypeScript SDK, .NET SDK, backend-only mode, and context package generation for the sales support demo. It also includes a customer-owned data-plane posture: context reads, recomputes, provenance, API keys, and source events can stay inside the customer environment.

Use GraphQL when a product needs flexible context reads. Use REST for common service integrations and machine-to-machine workflows. Use SDKs when application teams want typed client code. Use governed context packages when an AI system or automation needs a scoped set of allowed facts with evidence and guardrails.

The hosted control-plane seam is not part of the consumer contract. Consumers should query the local/self-hosted data plane unless the customer explicitly chooses a future managed deployment.

## Example consumer: Intelligent Sales Support

The current demo consumer builds a context package for a selected user and sales objective. It then generates an outreach strategy, email draft, and follow-up plan that cite the facts behind the advice.

This is a useful proof point because the value is easy to see live. It is not the only architecture. The same facts could support support triage, onboarding, customer success, reporting, workflow automation, or an internal copilot.
