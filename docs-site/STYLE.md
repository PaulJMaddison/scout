# KynticAI Scout Docs Style

## Scope

These docs are technical documentation for KynticAI Scout, the public
open-source data-plane foundation. They are not sales pages, pricing copy,
release automation, or deployment automation.

## Voice

- Use British English.
- Use `KynticAI` for the public brand and `KynticAI Scout` for the product
  tier.
- Prefer precise technical nouns over promotional language.
- Say what the public repo actually contains.
- When generated reference material does not exist, link to the
  authoritative source file and say the reference is source-backed.

## Public Boundary

Do not document:

- private enterprise internals
- proprietary engine internals
- private implementation details
- private connector code
- other private KynticAI products or proprietary roadmap material
- customer-specific schemas, credentials, or planning notes
- GitHub Pages, CI/CD, release workflows, deployment workflows, or hosting
  scripts from this docs skeleton

## Metadata

The Starlight config adds global OpenGraph, Twitter Card, SoftwareApplication
JSON-LD, and Article JSON-LD metadata. Page-level descriptions should still
be accurate and technical because Starlight uses them for generated metadata.

## Placeholders

Do not add task-note-only sections, unverified integrations, or
future-looking product claims. If a reference is intentionally partial, say
what is covered, name the source of truth, and avoid presenting the gap as
complete.
