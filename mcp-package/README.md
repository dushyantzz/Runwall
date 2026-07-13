# @runwall/mcp

**Governance-aware MCP gateway for AI agents.**

Runwall adds policy enforcement, identity-aware execution, risk scoring, approval workflows, and sandboxing to your AI agent tool calls — without changing your tools.

## Quick Start

### For Claude Desktop / VS Code / Cursor (local stdio)

Add to your `claude_desktop_config.json` (or equivalent MCP config):

```json
{
  "mcpServers": {
    "runwall": {
      "command": "npx",
      "args": ["-y", "@runwall/mcp"],
      "env": {
        "RUNWALL_API_KEY": "your-api-key"
      }
    }
  }
}
```

### For Claude API / Hosted Agents (remote HTTPS)

```json
{
  "mcp_servers": [
    {
      "type": "url",
      "name": "runwall",
      "url": "https://mcp.runwall.dev/mcp",
      "authorization_token": "YOUR_ACCESS_TOKEN"
    }
  ],
  "tools": [
    {
      "type": "mcp_toolset",
      "mcp_server_name": "runwall"
    }
  ]
}
```

### Legacy SSE (backward compatibility)

```json
{
  "mcpServers": {
    "runwall": {
      "url": "https://mcp.runwall.dev/sse",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `RUNWALL_API_KEY` | ✅ | Your Runwall API key |
| `RUNWALL_URL` | ❌ | Custom endpoint (defaults to `https://mcp.runwall.dev/mcp`) |

## What Runwall Adds

- **Policy Engine** — Intent-aware execution policies
- **Identity Gateway** — Per-agent, per-tenant access control
- **Risk Scoring** — Real-time risk assessment on tool calls
- **Taint Tracking** — Data lineage and contamination tracking
- **Approval Workflows** — Human-in-the-loop for high-risk operations
- **Sandboxing** — Isolated execution environments
- **Audit Trail** — Complete execution evidence replay

## Transport

- **Primary**: Streamable HTTP at `/mcp`
- **Legacy**: SSE at `/sse` (deprecated, backward compatible)

## Links

- [Website](https://runwall.vercel.app)
- [Documentation](https://runwall.vercel.app/docs)
- [GitHub](https://github.com/dushyantzz/secure-mcp-server-framework)

## License

MIT
