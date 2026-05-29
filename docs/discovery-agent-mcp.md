# Discovery Agent MCP Server

The KynticAI Discovery Agent lives in `apps/discovery-agent`. It is the canonical OSS-022 implementation for local codebase audits, handover generation, and MCP access.

The older `packages/typescript/scout-discovery-mcp` package remains as a connector-metadata utility. New agent handover work should use `apps/discovery-agent`.

## Local-Only Boundary

- Runs on Node.js 20+.
- Does not require Rust, Docker, admin rights, or a running Scout API.
- Does not upload code, prompts, metadata, or audit output to external services.
- Skips secret-bearing files such as `.env`, private keys, local licence files, dependency folders, and build output.

## CLI

```bash
cd apps/discovery-agent
npm install
npm run build
node dist/index.js --path ../.. --tier 1
```

The local `npx` package path from this repository is:

```bash
npx --package ./apps/discovery-agent discovery-agent --path . --tier 1
```

The default output is a JSON handover document suitable for Codex goal prompt injection. Use `--audit-only` to return the raw audit result, or `--format markdown` to return a Markdown handover.

## MCP Tools

| Tool | Input | Description |
|---|---|---|
| `audit_codebase` | `{ "path": string, "tier": 1 \| 2 \| 3 }` | Runs a local tiered audit and returns structured JSON. |
| `generate_handover` | `{ "path": string }` | Produces Markdown and JSON handover output. |
| `run_three_tier_audit` | `{ "path": string }` | Runs Tier 1, Tier 2, and Tier 3 in one pass. |
| `check_status` | `{}` | Returns the in-memory status for the running MCP process. |

## Audit Tiers

| Tier | Coverage |
|---|---|
| Tier 1 | File tree, package inventory, entry points, language and stack detection. |
| Tier 2 | Tier 1 plus API endpoints, type signatures, schema objects, and business logic patterns. |
| Tier 3 | Tier 2 plus data-flow inference, security surface, coupling hot spots, and tech-debt scoring. |

## MCP Client Configuration

Add this to `.claude/mcp.json` from a checkout that includes `apps/discovery-agent`:

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

For local development from this checkout:

```json
{
  "mcpServers": {
    "kyntic-discovery-agent": {
      "command": "node",
      "args": ["C:/Kyntic/UCL/apps/discovery-agent/dist/index.js", "--mcp"]
    }
  }
}
```

## VS Code Usage

There is no VS Code extension project in this repo. Use the CLI from the VS Code terminal or a workspace task:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "KynticAI Discovery Agent Tier 1",
      "type": "shell",
      "command": "npx --package ./apps/discovery-agent discovery-agent --path . --tier 1"
    }
  ]
}
```

## Output Shape

`generate_handover` and the default CLI mode produce:

```json
{
  "project_name": "example",
  "audit_date": "2026-05-29T00:00:00.000Z",
  "tech_stack": { "languages": [], "frameworks": [], "databases": [], "packageManagers": [] },
  "entry_points": [],
  "api_surface": [],
  "key_entities": [],
  "data_stores": [],
  "security_surface": [],
  "recommended_next_agent_prompt": "..."
}
```
