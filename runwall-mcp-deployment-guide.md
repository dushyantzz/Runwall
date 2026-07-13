# Runwall MCP Deployment & Integration Guide

Prepared for use in your Antigravity environment.

## Goal

Turn Runwall into an MCP service that is:

1. reachable from hosted agent platforms such as Claude,
2. exposed over HTTPS,
3. easy to plug into multiple MCP clients,
4. aligned with the current MCP direction,
5. compatible with your current architecture where the marketing site is on Vercel and the backend is on AWS.

---

## 1) What is happening right now

Your current public docs pattern, based on the screenshot you shared, is:

```json
{
  "mcpServers": {
    "runwall": {
      "url": "https://runwall.onrender.com/sse",
      "headers": {
        "Authorization": "Bearer <your-api-key>"
      }
    }
  }
}
```

That pattern is understandable for some local or legacy MCP clients, but it is too narrow for a product intended to work across multiple agent systems.

The main issue you hit on AWS is that Claude remote MCP expects a **public HTTPS URL**, not a raw HTTP endpoint. Anthropic’s current MCP connector docs state that the MCP server URL **must start with `https://`**. Anthropic also notes that remote connectors are reached from **Anthropic’s cloud infrastructure**, not from the user’s local machine, so the endpoint must be publicly reachable from the internet.  
Source: https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector  
Source: https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp

---

## 2) Key protocol facts that should drive the design

### 2.1 Remote MCP should be HTTPS-first

For Claude’s current connector and API connector support, the remote MCP server must be exposed over HTTPS.  
Source: https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector

### 2.2 The MCP spec now favors Streamable HTTP

The current MCP specification defines two standard transports: **stdio** and **Streamable HTTP**. It also explicitly marks the older **HTTP+SSE** transport as deprecated for backward compatibility only.  
Source: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports

### 2.3 OAuth is the forward-compatible auth model

The MCP authorization spec is based on OAuth 2.1. It says HTTP-based MCP authorization should follow the spec, recommends metadata discovery, and strongly recommends dynamic client registration for better interoperability.  
Source: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization

### 2.4 Hosted connectors are cloud-to-cloud, not laptop-to-server

Anthropic’s support docs say custom connectors connect from Anthropic’s cloud infrastructure. That means your MCP server must be publicly reachable and compatible with server-to-server auth and networking.  
Source: https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp

---

## 3) What Runwall is today

Your site at `https://runwall.vercel.app/` presents Runwall as an **agent-native execution governance platform** with policy engine, identity gateway, risk scoring, taint tracking, approvals, and sandboxing for safe agent operation. That positioning is strong for an MCP integration product because it naturally fits as a governance gateway between agent clients and downstream tools.  
Source: https://runwall.vercel.app/

This implies the best product framing is:

> Runwall is a governance-aware MCP gateway / policy enforcement layer for agent tool execution.

That is better than documenting it as only a single `/sse` endpoint with a bearer header.

---

## 4) Every viable way to solve HTTP -> HTTPS for the AWS backend

Below are the practical deployment choices.

### Option A — Best production architecture: custom subdomain + AWS backend + HTTPS

**Recommended public endpoint**

```text
https://mcp.runwall.com/mcp
```

**How it works**
- keep the marketing site on Vercel,
- expose a dedicated subdomain such as `mcp.runwall.com` for the MCP server,
- point that subdomain to AWS,
- terminate TLS either on your AWS load balancer or on the server itself,
- serve the MCP endpoint from `/mcp`.

**Why this is the best choice**
- clean product identity,
- stable URL for customers,
- easy to document,
- works well with OAuth,
- avoids teaching users to trust raw IPs,
- future-proof for MCP ecosystem adoption.

**TLS choices under this option**

#### A1. AWS ALB + ACM certificate
- Application Load Balancer handles HTTPS.
- AWS Certificate Manager can provide public certificates at no additional certificate charge **when used with ACM-integrated services** like Elastic Load Balancing.
- ALB then forwards traffic to your app on HTTP or HTTPS internally.

Sources:  
https://aws.amazon.com/certificate-manager/faqs/  
https://docs.aws.amazon.com/elasticloadbalancing/latest/application/https-listener-certificates.html  
https://docs.aws.amazon.com/acm/latest/userguide/acm-public-certificates.html

**Pros**
- highly standard AWS pattern,
- certificate renewal handled for you,
- clean separation of TLS from app process.

**Cons**
- ALB is not free,
- slightly more infra setup.

#### A2. Nginx/Caddy on EC2 + Let’s Encrypt domain certificate
- Point `mcp.runwall.com` to the instance.
- Put Nginx or Caddy in front of the app.
- Use Let’s Encrypt for free TLS.

Let’s Encrypt certificates are free.  
Source: https://letsencrypt.org/docs/faq/

**Pros**
- cheapest standard production route,
- no ALB required,
- works well for startups and MVP-to-production transition.

**Cons**
- you manage reverse proxy on the box,
- renewal automation is your responsibility, though easy with Caddy or certbot.

### Option B — Cloudflare in front of AWS

**How it works**
- put a custom domain or subdomain behind Cloudflare,
- use Cloudflare free edge SSL/TLS,
- enable `Always Use HTTPS`,
- optionally install Cloudflare Origin CA or a public cert on the origin.

Cloudflare offers free TLS at the edge and supports `Always Use HTTPS` on the free plan. Cloudflare Origin CA encrypts traffic between Cloudflare and your origin when using proxied DNS records.  
Sources:  
https://www.cloudflare.com/products/ssl/  
https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/  
https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/

**Pros**
- easy public HTTPS,
- good DNS and edge control,
- can hide origin IP,
- useful if you want WAF/CDN behavior.

**Cons**
- still better with a real domain,
- another layer to operate,
- if you later implement strict OAuth and callback logic, be careful with proxy and header forwarding.

### Option C — Use Vercel as the public front door and proxy to AWS

This is possible in some shapes because Vercel rewrites can proxy requests to external origins and act like a reverse proxy.  
Source: https://vercel.com/docs/routing/rewrites

You also already have HTTPS on `runwall.vercel.app` because Vercel automatically provisions SSL for Vercel-hosted domains and custom domains added to a project.  
Source: https://vercel.com/docs/domains/working-with-ssl

This means you **could** expose something like:

```text
https://runwall.vercel.app/mcp -> proxied to AWS
```

or on a custom domain:

```text
https://api.runwall.com/mcp -> proxied to AWS via Vercel
```

**But there are important caveats:**

1. Vercel reserves the `/.well-known` path and says it cannot be redirected or rewritten.  
   Source: https://vercel.com/docs/domains/working-with-ssl  
   Source: https://vercel.com/docs/routing/rewrites

2. That matters because MCP OAuth metadata discovery may want:

```text
https://your-host/.well-known/oauth-authorization-server
```

If Vercel is only proxying and you need that `/.well-known` path on the same host, the reserved-path limitation becomes a real design constraint.

3. Vercel supports streaming responses, but Vercel Functions have duration limits and operational constraints. Request processing time includes streamed responses, so long-lived or special transport behavior should be tested carefully if you try to host the MCP server itself on Vercel Functions.  
   Sources:  
   https://vercel.com/docs/functions/streaming-functions  
   https://vercel.com/docs/functions/limitations

**Verdict**
- Vercel is good for the **marketing website**.
- Vercel can be okay as a **light reverse-proxy front door**.
- Vercel is not the cleanest primary home for a serious MCP gateway if you need same-host OAuth metadata discovery and predictable transport behavior.

### Option D — Keep using raw AWS public IP with a certificate

Historically, public certificates for IPs were awkward. As of 2026, Let’s Encrypt now supports **IP address certificates**, but they must be **short-lived** and are valid for about **160 hours (~6 days)**.  
Source: https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability

**Pros**
- can work without buying a domain,
- free certificate issuance.

**Cons**
- operationally annoying,
- 6-day renewal cycle,
- poor product ergonomics,
- raw IP URLs look unprofessional,
- harder for customer trust and OAuth flows.

**Verdict**
Use only as a temporary bridge, not as the long-term Runwall integration surface.

---

## 5) How Vercel fits your current setup

Since your website is currently deployed at `https://runwall.vercel.app/`, the clean architecture is:

### Recommended split

- **Website / docs / marketing**: Vercel
- **MCP gateway / auth / policy runtime**: AWS
- **Public MCP hostname**: custom subdomain such as `mcp.runwall.com`

If your domain is managed by Vercel, Vercel docs say you can point a subdomain to an external service by adding DNS records.  
Source: https://vercel.com/kb/guide/pointing-subdomains-to-external-services

That gives you a strong model:

```text
runwall.com           -> website on Vercel
www.runwall.com       -> website on Vercel
mcp.runwall.com       -> AWS MCP gateway
auth.runwall.com      -> AWS auth service if separated
```

This is better than trying to make `runwall.vercel.app` be everything.

---

## 6) How you should provide Runwall as an MCP product

## Recommended product packaging

You should expose **two integration modes**.

### Mode 1 — Hosted remote MCP endpoint

This is for Claude web/API, other hosted agents, and server-side agent platforms.

**Primary URL**

```text
https://mcp.runwall.com/mcp
```

**Transport**
- primary: Streamable HTTP
- compatibility: legacy SSE only if you must

The current MCP spec says Streamable HTTP is the standard remote transport and HTTP+SSE is deprecated for backward compatibility only.  
Source: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports

### Mode 2 — Local stdio wrapper

This is for desktop/IDE/local MCP clients that prefer launching a command.

You should publish a tiny local adapter package, for example:

```json
{
  "mcpServers": {
    "runwall": {
      "command": "npx",
      "args": ["-y", "@runwall/mcp"],
      "env": {
        "RUNWALL_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

That wrapper can connect internally to your hosted Runwall backend, but it makes installation easier for tools that prefer stdio.

**Why this matters**
- MCP officially supports stdio and Streamable HTTP.
- Different clients still prefer different install models.
- Supporting both increases adoption dramatically.

Source: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports

---

## 7) Transport recommendation for Runwall

## What to do

### Primary transport
Implement **Streamable HTTP** on:

```text
POST /mcp
GET  /mcp
```

The MCP spec says a Streamable HTTP server must provide a single MCP endpoint that supports both POST and GET, with optional SSE usage for server-to-client streaming behavior.  
Source: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports

### Compatibility transport
If you already support SSE, keep something like:

```text
GET /sse
POST /messages
```

or your existing layout temporarily for older clients.

### Product guidance
Do **not** make `/sse` the main thing you show on the docs homepage.

Instead document Runwall like this:

```text
Base URL: https://mcp.runwall.com/mcp
Transport: Streamable HTTP
Auth: OAuth 2.1 or API token
```

---

## 8) Authentication recommendation for Runwall

## Best approach

### Primary auth: OAuth 2.1

The MCP authorization spec recommends OAuth 2.1 patterns for protected remote servers, and Anthropic’s connector workflow commonly expects secure sign-in/authorization flows.  
Sources:  
https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization  
https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp

### Fallback auth: API key / bearer token

Keep bearer tokens for:
- testing,
- server-to-server integrations,
- self-hosted wrappers,
- initial MVP adoption.

### Metadata and endpoints to publish

If using OAuth, publish:

```text
/.well-known/oauth-authorization-server
/authorize
/token
/register   (recommended if you support dynamic client registration)
```

The MCP spec says clients must try authorization server metadata discovery first, then use fallback paths if metadata is unavailable.  
Source: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization

### Important Vercel warning

If you planned to proxy all of this through Vercel, remember that Vercel reserves `/.well-known` and says it cannot be rewritten. If you need OAuth metadata on the same hostname, it is cleaner to let the MCP hostname point directly to AWS instead of using Vercel rewrites.  
Sources:  
https://vercel.com/docs/domains/working-with-ssl  
https://vercel.com/docs/routing/rewrites

---

## 9) What your docs should look like instead of the current screenshot-only approach

## Current style

```json
{
  "mcpServers": {
    "runwall": {
      "url": "https://runwall.onrender.com/sse",
      "headers": {
        "Authorization": "Bearer <your-api-key>"
      }
    }
  }
}
```

## Better public docs structure

### A. Quickstart

```text
Runwall MCP endpoint
https://mcp.runwall.com/mcp

Transport
Streamable HTTP

Authentication
OAuth 2.1 or API token
```

### B. Claude API example

Anthropic’s current API docs use an MCP server definition plus an MCP toolset. The URL must be HTTPS and an authorization token can be provided for authenticated servers.  
Source: https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector

Example:

```json
{
  "mcp_servers": [
    {
      "type": "url",
      "name": "runwall",
      "url": "https://mcp.runwall.com/mcp",
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

### C. Generic local MCP client example

```json
{
  "mcpServers": {
    "runwall": {
      "command": "npx",
      "args": ["-y", "@runwall/mcp"],
      "env": {
        "RUNWALL_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### D. Legacy compatibility example

If you keep SSE temporarily:

```json
{
  "mcpServers": {
    "runwall": {
      "url": "https://mcp.runwall.com/sse",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

But document that this is **legacy compatibility mode**, not the preferred integration path.

---

## 10) Recommended final architecture for Runwall

## Preferred architecture

```text
Users / Agent Platforms
        |
        v
  https://mcp.runwall.com
        |
        v
 Runwall MCP Gateway on AWS
 - Streamable HTTP /mcp
 - OAuth endpoints
 - API key support
 - Policy engine
 - risk scoring
 - taint tracking
 - approval hooks
 - sandbox orchestration
        |
        v
 Downstream tools / APIs / internal systems
```

## Website architecture

```text
https://runwall.com or https://runwall.vercel.app
- landing page
- docs
- pricing
- dashboard entry

Hosted on Vercel
```

## Optional split auth service

If you want cleaner auth boundaries:

```text
https://auth.runwall.com
- OAuth authorize
- token issuance
- client registration
```

That is not required, but can be helpful later.

---

## 11) What I recommend you actually build now

## Phase 1 — Fastest serious production path

1. Buy or attach a real domain if you do not already have one.
2. Keep the website on Vercel.
3. Create subdomain `mcp.runwall.com`.
4. Point `mcp.runwall.com` directly to AWS.
5. Put TLS on AWS using one of:
   - ALB + ACM, or
   - Caddy/Nginx + Let’s Encrypt.
6. Serve your MCP endpoint on `/mcp`.
7. Keep `/sse` only as temporary compatibility.
8. Document API-key auth first if you need speed.
9. Implement OAuth 2.1 next.
10. Publish both remote and stdio install paths.

## Phase 2 — Interoperability hardening

1. Implement OAuth metadata discovery.
2. Add dynamic client registration if feasible.
3. Normalize tool descriptions for agent selection quality.
4. Add stable versioning in paths or headers.
5. Add tenant-aware API keys / scopes.
6. Add customer-specific policy bundles.

## Phase 3 — Product polish

1. self-serve connector setup docs,
2. CLI installer,
3. SDK or wrapper package,
4. examples for Claude, OpenAI-compatible agent frameworks, desktop clients, and local developer setups.

---

## 12) Decision table

| Choice | Works for Claude remote MCP | Free cert possible | Good long-term | Notes |
|---|---:|---:|---:|---|
| Raw AWS HTTP IP | No | No | No | Claude expects HTTPS |
| AWS IP + Let’s Encrypt IP cert | Yes | Yes | Weak | 6-day certs, temporary only |
| Domain + EC2 reverse proxy + Let’s Encrypt | Yes | Yes | Yes | best low-cost path |
| Domain + ALB + ACM | Yes | Cert yes, infra no | Yes | clean AWS-native setup |
| Domain + Cloudflare + AWS origin | Yes | Yes | Yes | good edge option |
| Vercel-only proxy front door | Maybe | Yes | Mixed | `.well-known` rewrite limitation matters |

---

## 13) Final recommendation

## The best answer for Runwall

Because your website is already on Vercel, the cleanest setup is:

- keep the website on Vercel,
- add a real domain,
- use `mcp.runwall.com` as the MCP hostname,
- point that subdomain directly to AWS,
- terminate TLS on AWS,
- expose **Streamable HTTP** at `/mcp`,
- support OAuth 2.1 and API-key fallback,
- publish both **remote hosted** and **local stdio** integration modes.

## The one thing not to do

Do not make the long-term product interface a raw public IP or an `/sse`-only install snippet. That works as a narrow implementation detail, but it is not the strongest product interface for a serious governance gateway.

---

## 14) Suggested public-facing Runwall copy

You can use this directly in docs:

### Runwall MCP Endpoint

Runwall exposes a secure remote MCP endpoint for hosted agent systems and a local stdio wrapper for desktop and IDE-based clients.

**Hosted endpoint**

```text
https://mcp.runwall.com/mcp
```

**Transport**
- Preferred: Streamable HTTP
- Legacy compatibility: SSE

**Authentication**
- OAuth 2.1
- API token fallback

**What Runwall adds**
- policy enforcement,
- identity-aware execution,
- risk scoring,
- taint lineage,
- approval workflows,
- controlled sandboxing.

---

## 15) Sources

- Anthropic MCP connector: https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector
- Anthropic custom connectors support doc: https://support.anthropic.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp
- MCP transports spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
- MCP authorization spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
- MCP remote servers guide: https://modelcontextprotocol.io/docs/develop/connect-remote-servers
- Runwall site: https://runwall.vercel.app/
- Vercel SSL: https://vercel.com/docs/domains/working-with-ssl
- Vercel rewrites / reverse proxy: https://vercel.com/docs/routing/rewrites
- Vercel streaming functions: https://vercel.com/docs/functions/streaming-functions
- Vercel function limitations: https://vercel.com/docs/functions/limitations
- Vercel pointing subdomains to external services: https://vercel.com/kb/guide/pointing-subdomains-to-external-services
- AWS ACM public certificates: https://docs.aws.amazon.com/acm/latest/userguide/acm-public-certificates.html
- AWS ACM FAQ: https://aws.amazon.com/certificate-manager/faqs/
- AWS ALB HTTPS certificates: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/https-listener-certificates.html
- Cloudflare SSL: https://www.cloudflare.com/products/ssl/
- Cloudflare Always Use HTTPS: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/
- Cloudflare Origin CA: https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/
- Let’s Encrypt FAQ: https://letsencrypt.org/docs/faq/
- Let’s Encrypt IP certificates: https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability
