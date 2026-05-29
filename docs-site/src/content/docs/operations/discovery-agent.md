---
title: Discovery Agent
description: Local-only codebase audits, MCP tools, and handover generation for KynticAI Scout.
---

The Discovery Agent lives in `apps/discovery-agent`. It provides a Node.js 20+
CLI and MCP server for local codebase audits and Codex-ready handovers.

It runs entirely on the local machine. It does not upload code, require Rust,
call a KynticAI API, or require admin rights.

## CLI

```bash
cd apps/discovery-agent
npm install
npm run build
node dist/index.js --path ../.. --tier 1
```

Local `npx` package path from the repository root:

```bash
npx --package ./apps/discovery-agent discovery-agent --path . --tier 1
```

## MCP Tools

| Tool | Purpose |
|---|---|
| `audit_codebase` | Runs Tier 1, 2, or 3 and returns structured JSON. |
| `generate_handover` | Returns Markdown and JSON handover output. |
| `run_three_tier_audit` | Runs all tiers in one pass. |
| `check_status` | Reads the current in-memory audit state. |

## Audit Tiers

| Tier | Coverage |
|---|---|
| Tier 1 | File tree, package inventory, entry points, language and stack detection. |
| Tier 2 | API endpoints, types, schema objects, and business logic patterns. |
| Tier 3 | Data flow, security surface, coupling, and tech-debt scoring. |

## MCP Config

```json
{
  "mcpServers": {
    "kyntic-discovery-agent": {
      "command": "npx",
      "args": ["--package", "./apps/discovery-agent", "discovery-agent", "--mcp"]
    }
  }
}
```
