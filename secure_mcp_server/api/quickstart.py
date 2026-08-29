"""
Quickstart HTML page generator for Runwall MCP Public Gateway.
Served at GET / with modern, responsive dark mode design.
"""

import json
from secure_mcp_server.plan_limits import PLAN_LIMITS


def generate_quickstart_html() -> str:
    """Generates a modern, sleek Quickstart HTML landing page for mcp.runwall.in."""
    free_rpm = PLAN_LIMITS["free"]["requests_per_minute"]
    free_daily = PLAN_LIMITS["free"]["max_tool_calls_per_day"]
    free_keys = PLAN_LIMITS["free"]["max_api_keys"]

    pro_rpm = PLAN_LIMITS["pro"]["requests_per_minute"]
    pro_daily = f"{PLAN_LIMITS['pro']['max_tool_calls_per_day']:,}"
    pro_keys = PLAN_LIMITS["pro"]["max_api_keys"]

    return f"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Runwall MCP Gateway — Secure AI Agent Execution Protocol</title>
  <meta name="description" content="Runwall MCP Public Gateway. Zero-Trust policy enforcement, semantic risk scoring, and real-time execution governance for AI agents.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg-main: #090d16;
      --bg-card: rgba(17, 24, 39, 0.75);
      --bg-code: #030712;
      --border-color: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(99, 102, 241, 0.3);
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.25);
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --text-muted: #6b7280;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      background-color: var(--bg-main);
      color: var(--text-primary);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
      overflow-x: hidden;
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.1) 0px, transparent 50%);
    }}
    .container {{
      max-width: 1080px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }}
    header {{
      text-align: center;
      margin-bottom: 48px;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      font-size: 0.825rem;
      font-weight: 600;
      margin-bottom: 20px;
      letter-spacing: 0.02em;
    }}
    .badge-dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--success);
      box-shadow: 0 0 10px var(--success);
    }}
    h1 {{
      font-size: 2.75rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .subtitle {{
      font-size: 1.15rem;
      color: var(--text-secondary);
      max-width: 720px;
      margin: 0 auto;
      font-weight: 400;
    }}
    
    /* Hard Warning Box */
    .auth-callout {{
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(17, 24, 39, 0.6) 100%);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 16px;
      padding: 20px 24px;
      margin: 32px 0;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }}
    .auth-callout-icon {{
      font-size: 1.5rem;
      line-height: 1;
    }}
    .auth-callout-title {{
      font-size: 1rem;
      font-weight: 700;
      color: #fca5a5;
      margin-bottom: 4px;
    }}
    .auth-callout-desc {{
      font-size: 0.925rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }}
    
    /* Grid */
    .grid-2 {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }}
    .card {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 28px;
      backdrop-filter: blur(12px);
      transition: border-color 0.2s, transform 0.2s;
    }}
    .card:hover {{
      border-color: var(--border-accent);
      transform: translateY(-2px);
    }}
    .card-title {{
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }}
    .card-desc {{
      color: var(--text-secondary);
      font-size: 0.925rem;
      margin-bottom: 20px;
    }}

    /* Code Blocks */
    .code-wrapper {{
      position: relative;
      background: var(--bg-code);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      overflow: hidden;
      margin-top: 12px;
    }}
    .code-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }}
    .copy-btn {{
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-secondary);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 600;
      transition: all 0.2s;
    }}
    .copy-btn:hover {{
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }}
    pre {{
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #e2e8f0;
      overflow-x: auto;
      line-height: 1.5;
    }}

    /* Tier Comparison Table */
    .tiers-section {{
      margin: 48px 0;
    }}
    .tiers-title {{
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 20px;
      text-align: center;
    }}
    .tier-cards {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }}
    .tier-card {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      position: relative;
    }}
    .tier-card.featured {{
      border-color: var(--accent);
      box-shadow: 0 0 30px var(--accent-glow);
    }}
    .tier-tag {{
      position: absolute;
      top: -12px;
      right: 20px;
      background: var(--accent);
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }}
    .tier-name {{
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 4px;
    }}
    .tier-price {{
      font-size: 1.75rem;
      font-weight: 800;
      margin-bottom: 16px;
    }}
    .tier-features {{
      list-style: none;
      margin-bottom: 24px;
      flex-grow: 1;
    }}
    .tier-features li {{
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.875rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .tier-features li::before {{
      content: "✓";
      color: var(--success);
      font-weight: 700;
    }}
    .btn {{
      display: inline-flex;
      justify-content: center;
      align-items: center;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.925rem;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      text-align: center;
    }}
    .btn-primary {{
      background: var(--accent);
      color: #fff;
      box-shadow: 0 4px 14px var(--accent-glow);
    }}
    .btn-primary:hover {{
      background: #4f46e5;
      transform: translateY(-1px);
    }}
    .btn-secondary {{
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }}
    .btn-secondary:hover {{
      background: rgba(255, 255, 255, 0.1);
    }}
    
    footer {{
      margin-top: 60px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--border-color);
      padding-top: 32px;
    }}
    footer a {{
      color: var(--text-secondary);
      text-decoration: none;
    }}
    footer a:hover {{
      color: var(--accent);
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">
        <span class="badge-dot"></span>
        Runwall MCP Gateway v1.0
      </div>
      <h1>Secure AI Agent Execution Protocol</h1>
      <p class="subtitle">
        Enterprise-grade governance, intent classification, and OPA policy evaluation for Model Context Protocol (MCP) agents and clients.
      </p>
    </header>

    <div class="auth-callout">
      <div class="auth-callout-icon">🔒</div>
      <div>
        <div class="auth-callout-title">API Key Authentication Required</div>
        <div class="auth-callout-desc">
          Every request to <code>https://mcp.runwall.in/mcp</code> must include a valid Runwall API key in the <code>Authorization: Bearer &lt;api_key&gt;</code> header. There is <strong>no unauthenticated access</strong>. Requests without an active key are immediately rejected with HTTP 401.
        </div>
      </div>
    </div>

    <!-- Quickstart Config Section -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">⚡ Claude Desktop / Cursor Configuration</div>
        <div class="card-desc">Add Runwall to your client configuration file (e.g. <code>claude_desktop_config.json</code> or <code>.cursor/mcp.json</code>):</div>
        <div class="code-wrapper">
          <div class="code-header">
            <span>claude_desktop_config.json</span>
            <button class="copy-btn" onclick="copyCode('config-json')">Copy</button>
          </div>
          <pre id="config-json">{{
  "mcpServers": {{
    "runwall": {{
      "url": "https://mcp.runwall.in/mcp",
      "headers": {{
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }}
    }}
  }}
}}</pre>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🧪 cURL Sanity Verification</div>
        <div class="card-desc">Verify your connection from terminal:</div>
        <div class="code-wrapper">
          <div class="code-header">
            <span>Terminal (With API Key)</span>
            <button class="copy-btn" onclick="copyCode('curl-auth')">Copy</button>
          </div>
          <pre id="curl-auth">curl -H "Authorization: Bearer YOUR_API_KEY_HERE" \\
     https://mcp.runwall.in/mcp</pre>
        </div>

        <div class="code-wrapper" style="margin-top: 16px;">
          <div class="code-header">
            <span>Terminal (Without Key — 401 Expected)</span>
            <button class="copy-btn" onclick="copyCode('curl-noauth')">Copy</button>
          </div>
          <pre id="curl-noauth">curl https://mcp.runwall.in/mcp
# Returns HTTP 401: {{"error": "missing_api_key"}}</pre>
        </div>
      </div>
    </div>

    <!-- Plan Tiers Section -->
    <section class="tiers-section">
      <h2 class="tiers-title">Plan Tiers & Gated Capabilities</h2>
      <div class="tier-cards">
        
        <!-- Free Tier -->
        <div class="tier-card">
          <div class="tier-name">Free</div>
          <div class="tier-price">₹0 <span style="font-size:0.875rem; color:var(--text-muted); font-weight:normal;">/ forever</span></div>
          <ul class="tier-features">
            <li><strong>{free_rpm} req/min</strong> rate limit</li>
            <li><strong>{free_daily} tool calls</strong> / day</li>
            <li><strong>{free_keys} API Key</strong> max</li>
            <li>Default OPA Zero-Trust policies</li>
            <li>Community support</li>
          </ul>
          <a href="/api/keys" class="btn btn-secondary">Get Free Key</a>
        </div>

        <!-- Pro Tier -->
        <div class="tier-card featured">
          <span class="tier-tag">Recommended</span>
          <div class="tier-name">Pro</div>
          <div class="tier-price">₹674 <span style="font-size:0.875rem; color:var(--text-muted); font-weight:normal;">/ month</span></div>
          <ul class="tier-features">
            <li><strong>{pro_rpm} req/min</strong> rate limit</li>
            <li><strong>{pro_daily} tool calls</strong> / day</li>
            <li><strong>{pro_keys} API Keys</strong> max</li>
            <li>Custom OPA Rego policies</li>
            <li>LLM Semantic Risk Scoring</li>
            <li>Email support (24h SLA)</li>
          </ul>
          <a href="/api/v1/payment/create-order" class="btn btn-primary">Upgrade to Pro</a>
        </div>

        <!-- Enterprise Tier -->
        <div class="tier-card">
          <div class="tier-name">Enterprise</div>
          <div class="tier-price">Custom</div>
          <ul class="tier-features">
            <li><strong>Unmetered / Custom</strong> RPM</li>
            <li><strong>Custom tool call quota</strong></li>
            <li><strong>Unlimited</strong> API keys & org seats</li>
            <li>Multi-tenant VPC & isolation</li>
            <li>Dedicated SLA & priority channel</li>
          </ul>
          <a href="mailto:support@runwall.in" class="btn btn-secondary">Contact Sales</a>
        </div>

      </div>
    </section>

    <footer>
      <p>© 2026 Runwall Inc. • Endpoint: <code>https://mcp.runwall.in/mcp</code> • <a href="/health">Health Check</a> • <a href="https://github.com/dushyantzz/Runwall">GitHub</a></p>
    </footer>
  </div>

  <script>
    function copyCode(id) {{
      const text = document.getElementById(id).innerText;
      navigator.clipboard.writeText(text).then(() => {{
        event.target.innerText = 'Copied!';
        setTimeout(() => event.target.innerText = 'Copy', 2000);
      }});
    }}
  </script>
</body>
</html>
"""
