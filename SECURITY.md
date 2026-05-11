# Security Policy

## Reporting a vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Instead:

- use GitHub private vulnerability reporting for this repository when available
- or contact the maintainer privately through GitHub

Include:

- a clear description of the issue
- reproduction steps or a proof of concept
- affected area or files
- any suggested mitigations if you have them

## Public repository safety

This is a public repository. Please do not submit:

- real secrets, API keys, certificates, tokens, or passwords
- `.env` files, local databases, logs, generated licences, private signing keys, generated tokens, support bundles, or vendor credentials
- customer data, customer schemas, or customer-specific integration details
- internal-only commercial documents, pricing notes, or private roadmap material
- paid enterprise implementation code that is intended to remain outside the open source core
- private cloud/control-plane implementation code that is intended to remain outside the open source core

If you discover that sensitive material has been committed by mistake, report it privately as quickly as possible rather than opening a public issue.

## Supported versions

The latest published release branch or default branch should be considered the supported line for security fixes unless noted otherwise in the repository.

## Dependency supply-chain hygiene

Use `npm ci` with the committed lockfile for frontend installs, especially during active npm supply-chain incidents. Do not replace lockfile installs with floating `npm install` updates during a live advisory unless the update is part of a reviewed security patch.

For the May 2026 TanStack scoped-package advisory, the released web app pins the TanStack packages to known-installed versions and the lockfile must not contain `@tanstack/setup`, `router_init.js`, or git-resolved TanStack optional dependencies.
