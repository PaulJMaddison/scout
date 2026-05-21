# Anonymised ERP Platform Pattern

This document describes an anonymised implementation pattern from a recent ERP platform engagement. It is not a named case study, formal endorsement, or disclosure of confidential customer architecture.

The pattern illustrates the Scout product story: do not replace the customer's brain or systems of record, build the nervous system that carries trusted context between them.

## Problem

A business had valuable operational data spread across legacy databases, CRM-style records, operational systems, and fragmented business records. A new web platform needed to make that data useful for AI-enabled workflows and business processes, but the source estate was not designed around a clean modern product API.

## Existing Systems

The estate included legacy databases, operational records, customer and account-style entities, workflow records, and business data held across several systems. Those systems already contained useful context, but the meaning was fragmented across tables, services, exports, and business processes.

## Why Replacement Was Not Realistic

Replacing the existing systems first would have slowed the platform work and increased delivery risk. The business needed to use the data it already had while keeping operational systems in place.

The practical route was to add a semantic layer above the existing estate rather than forcing an immediate replatforming programme.

## Scout Approach

The new platform used a semantic data-plane pattern over existing operational data. The layer interpreted source records into business meaning that the new web platform could consume without every feature learning the legacy data model directly.

This is the same architectural pattern KynticAI Scout productises:

- keep systems of record in place
- add a customer-owned data plane beside them
- map raw records into semantic context
- expose context through stable contracts
- preserve provenance and governance

## Raw Records To Semantic Context

Raw records became context by identifying business entities, normalising source fields, mapping source signals into semantic attributes, and carrying evidence about where each fact came from.

Instead of downstream features asking for raw fragments, they could ask for business meaning: customer state, account context, workflow status, operational readiness, risk signals, and recommended next actions.

## New Web Platform Consumption

The new web platform consumed the semantic layer as an integration and interpretation boundary. That made it easier to build AI-enabled workflows and product features because the platform received structured business context rather than scattered source records.

the data plane did not need to own every system. It provided a reusable contract over the systems the business already had.

## Why AI Became More Useful

AI-enabled workflows became more useful because they received business meaning, not just raw records. The system could provide context with evidence, freshness, and governance expectations, which made recommendations easier to inspect and safer to use.

The lesson is simple: AI features are much stronger when a semantic data plane prepares the business facts first.

## Governance Lessons

Important governance lessons from the pattern:

- keep operational data customer-controlled
- avoid sending raw source data to external systems by default
- make provenance visible
- treat identifiers, free-text records, documents, and message content as sensitive
- agree masking and retention rules before broad rollout
- separate demo data from customer data
- keep implementation-specific mappings customer-specific

## What Scout Productises

KynticAI Scout productises the repeatable parts of this pattern:

- semantic attributes
- selector definitions
- source events
- context facts and snapshots
- REST, GraphQL, and SDK access
- provenance, freshness, confidence, masking, and audit metadata
- connector interfaces and public-safe placeholders
- private enterprise connector modules for commercially scoped implementations

## What Remains Customer-Specific

Paid implementation work still needs customer-specific decisions:

- source-system access and credentials
- data categories and lawful basis
- semantic model design
- connector scope
- masking and retention rules
- workflow-specific success criteria
- operational ownership
- support and upgrade process

This pattern supports the paid pilot motion: prove one valuable workflow first, then expand the semantic layer as the customer sees where governed context creates value.
