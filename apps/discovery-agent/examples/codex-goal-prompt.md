# Codex Goal Prompt Injection Example

Run:

```bash
npx --package ./apps/discovery-agent discovery-agent --path . --tier 3
```

Paste the returned `recommended_next_agent_prompt` and the surrounding JSON handover into the next Codex goal prompt. The handover is generated from local files only and should be reviewed before sharing outside the machine where the audit ran.
