# Cloudflare Tunnel Setup Guide for Runwall

This guide walks you through setting up Cloudflare Tunnel to expose your Runwall MCP server over HTTPS — for **free** (excluding domain cost).

---

## Prerequisites

1. **A domain name** (~$10/year from Cloudflare Registrar or Porkbun)
2. **A free Cloudflare account** — [sign up here](https://dash.cloudflare.com/sign-up)
3. **Your domain's nameservers pointed to Cloudflare** (Cloudflare will guide you through this when you add your domain)

---

## Step 1: Add your domain to Cloudflare

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **"Add a site"**
3. Enter your domain (e.g., `runwall.dev`)
4. Select the **Free plan**
5. Cloudflare will scan existing DNS records
6. Update your domain's nameservers at your registrar to the ones Cloudflare provides
7. Wait for nameserver propagation (usually 5-30 minutes)

---

## Step 2: Create a Cloudflare Tunnel

1. In the Cloudflare dashboard, go to **Zero Trust** → **Networks** → **Tunnels**
2. Click **"Create a tunnel"**
3. Choose **"Cloudflared"** as the connector
4. Name your tunnel: `runwall-mcp`
5. Click **"Save tunnel"**

---

## Step 3: Get your Tunnel Token

After creating the tunnel, Cloudflare will show you a connector command like:

```bash
cloudflared service install eyJhIjoiMT...
```

The long string after `install` is your **tunnel token**. Copy it — you'll need it for the ECS task definition.

---

## Step 4: Configure the public hostname

Still in the tunnel setup wizard:

1. Click **"Add a public hostname"**
2. Configure:
   - **Subdomain**: `mcp`
   - **Domain**: `yourdomain.dev` (select from dropdown)
   - **Service Type**: `HTTP`
   - **URL**: `localhost:8000`
3. Click **"Save hostname"**

This tells Cloudflare: "When someone visits `https://mcp.yourdomain.dev`, route their traffic through the tunnel to `localhost:8000` inside the Fargate task."

---

## Step 5: Deploy to ECS Fargate

### Option A: Using the AWS Console

1. Go to **ECS** → **Task Definitions** → **Create new revision**
2. Add a second container named `cloudflared`:
   - **Image**: `cloudflare/cloudflared:latest`
   - **Command**: `tunnel,--no-autoupdate,run,--token,YOUR_TUNNEL_TOKEN`
   - **Essential**: Yes
   - **Startup dependency**: Depends on `runwall-mcp` container being HEALTHY
3. Update your service to use the new task definition revision

### Option B: Using the CLI with our template

1. Edit `cloudflare/ecs-task-definition.json`:
   - Replace `YOUR_ACCOUNT_ID` with your AWS account ID
   - Replace `YOUR_ECR_REPO_URI` with your ECR image URI
   - Replace `YOUR_TUNNEL_TOKEN` with the token from Step 3

2. Register the task definition:
   ```bash
   aws ecs register-task-definition --cli-input-json file://cloudflare/ecs-task-definition.json
   ```

3. Update the service:
   ```bash
   aws ecs update-service \
     --cluster your-cluster-name \
     --service your-service-name \
     --task-definition runwall-mcp-with-tunnel \
     --force-new-deployment
   ```

---

## Step 6: Verify

1. Wait for the ECS task to reach RUNNING state (both containers)
2. Open your browser and visit:
   ```
   https://mcp.yourdomain.dev/health
   ```
   You should see: `{"status": "healthy"}`

3. Test the MCP endpoint:
   ```
   https://mcp.yourdomain.dev/mcp
   ```

---

## Step 7: Configure Claude Desktop

Update your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "runwall": {
      "url": "https://mcp.yourdomain.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

---

## Security Notes

- **No inbound ports needed**: The Cloudflare Tunnel creates an outbound-only connection. Your ECS security group does NOT need port 8000 open to the internet.
- **Origin IP hidden**: Cloudflare proxies all traffic, so your AWS IP is never exposed.
- **Free DDoS protection**: Cloudflare's free tier includes basic DDoS mitigation.
- **Tunnel token security**: Store the tunnel token in AWS Secrets Manager for production. Never commit it to source control.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tunnel shows "unhealthy" | Check CloudWatch logs for the `cloudflared` container |
| `502 Bad Gateway` | The MCP server container isn't healthy yet — check its logs |
| DNS not resolving | Wait for nameserver propagation (up to 48h, usually minutes) |
| Connection timeout | Ensure the ECS security group allows outbound HTTPS (port 443) for cloudflared |
