# Secure MCP Server Framework

## What is this project?
### Everybody wants to build with MCP, but no one is caring about the API Costs...
This is a secure, easy-to-use server that lets AI assistants like Claude or GPT safely access your tools, scripts, and APIs. It acts as a professional "security guard" between AI and your valuable resources, so you always stay in control.

---

## Why did people need this?

**Before:**
- Many AI/automation tools could run your code, but anyone could connect, and there were no real safety checks built in.
- Most open MCP servers are like vending machines on the street: they let anyone press buttons, break things, or spend your money quickly. There's no login, no limit, no logs, and no safety net.

**Problems this caused:**
- People (or bots) could spam your tools, rack up big bills, or break important stuff.
- There was no way to see who did what, when, or why—so if anything went wrong, you couldn’t track it.
- Sensitive actions (deleting files, changing configs) could be done by anyone who found your server.

---

## How does Secure MCP Server solve the problem?

**This project adds multiple strong security layers:**

| Security Layer        | What it does                                            | How it works                                                              |
|----------------------|--------------------------------------------------------|---------------------------------------------------------------------------|
| **Authentication**   | Only lets in people with correct username & password   | Uses secure password hashing (bcrypt) and issues tokens after login        |
| **Authorization**    | Separates admin from regular users                     | Checks user role before letting them call sensitive tools                  |
| **Rate Limiting**    | Stops spam and abuse                                   | Automatically blocks tools after 60 requests per hour per user             |
| **Input Validation** | Blocks dangerous commands from running                 | Code checks all inputs, blocks risky phrases (like 'delete files')         |
| **Audit Logging**    | Records who did what, when                             | Every tool use, error, and blocked action is written to a secure log       |
| **Sandboxing**       | Runs tools in isolated mode                            | Prevents tools from accessing files, system, or other risky resources      |
| **Token Checking**   | Requires every action to have a valid access token     | Blocks any user or bot who tries to act without a real token               |

**In short:**
- ONLY the right person can use the right tool.
- Every attempt (good or bad) is logged.
- Rate limits stop spamming, cost overruns, and accidental infinite loops.
- Even if someone tries something risky, tools run in a secure sandbox that can't touch your system files.

---

## How does it protect you compared to a basic MCP server?

|                    | Basic MCP Server            | Secure MCP Server             |
|--------------------|----------------------------|------------------------------|
| Login Required     | ❌ No (open to all)         | ✅ Yes (username & password)  |
| Admin Permissions  | ❌ No                       | ✅ Yes (only admin sees sensitive info) |
| Spam Protection    | ❌ No                       | ✅ Yes (rate limits)          |
| Blocks Dangerous   | ❌ No                       | ✅ Yes (input check & sandbox)|
| Activity Logs      | ❌ No                       | ✅ Yes (audit logging)        |
| Knows Who Did What| ❌ No                        | ✅ Yes                        |
| Safe For Business  | ❌ No                       | ✅ Yes                        |

---

## What technologies make this possible?
- **Python 3.9+**: Easy to read and fast to develop in.
- **FastMCP & MCP SDK**: Handles messages between AI and your server, so any AI app that uses MCP can connect.
- **passlib + bcrypt**: Keeps passwords safe so nobody can steal them.
- **python-jose (JWT)**: Makes the 'ID cards' (tokens) that prove who each user is.
- **SQLAlchemy + SQLite**: Saves user, log, and tool data simply; easy to upgrade to PostgreSQL for big teams.
- **structlog & prometheus**: Simple, searchable logs and graphs to see how your system is running.
- **psutil**: Lets you monitor your own server’s CPU/memory usage.
- **pydantic, python-dotenv**: Clean, safe ways to use environment variables and settings.

---

## Typical life of a request (How the layers protect you)
1. **User logs in** with username & password → gets a secure token.
2. Every time they do anything, the **token** is checked (like showing their ID card).
3. Before any tool runs, the server double-checks:
   - Are you allowed to do this? (admin vs. regular user)
   - Have you already used this tool too many times? (rate limiting)
   - Is your request safe? (input check)
   - Are you inside of your allowed memory? (context)
4. If all is good, the tool runs inside a **sandbox** (safe zone) so nothing dangerous can escape.
5. Every attempt (success or blocked) is written to the **audit log** for full traceability.
6. If anyone acts suspicious, they’re blocked and the admin can see everything in the logs.

---

## Available Tools

| Tool | Description |
|------|-------------|
| **echo** | Echo back text with its character length |
| **calculator** | Safely evaluate math expressions (`2 ** 10`, `math.sqrt(144)`, etc.) |
| **text_processor** | uppercase, lowercase, title_case, reverse, word_count, char_count, strip |
| **secure_hash** | Generate MD5 / SHA-1 / SHA-256 / SHA-512 hashes |
| **uuid_generator** | Generate UUID v1 or v4 |
| **datetime_info** | Current date/time in ISO, readable, timestamp, date-only, or time-only format |
| **json_formatter** | Pretty-print and validate JSON strings |
| **base64_codec** | Encode or decode Base64 strings |

---

## Use this MCP Server

There are two ways anyone can start using this server right now.

### Option A: FastMCP Cloud (hosted, zero setup)

The server is deployed and live on FastMCP Cloud:

```
https://secure-mcp-server.fastmcp.app/mcp
```

> **Note:** This server is hosted under the **daredevil** organisation on FastMCP Cloud.
> To connect, you need to be a member of the organisation.

**How to join:**

1. Go to [fastmcp.cloud](https://fastmcp.cloud) and sign in with your **GitHub** account.
2. Ask the maintainer ([@dushyantzz](https://github.com/dushyantzz)) to invite you to the **daredevil** organisation — open an [issue](https://github.com/dushyantzz/secure-mcp-server-framework/issues) or reach out directly.
3. Once you accept the invite, you can connect immediately.

**Connect from Claude Desktop** — add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "secure-mcp-server": {
      "url": "https://secure-mcp-server.fastmcp.app/mcp"
    }
  }
}
```

**Connect from Cursor** — add this to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "secure-mcp-server": {
      "url": "https://secure-mcp-server.fastmcp.app/mcp"
    }
  }
}
```

---

### Option B: Docker (self-hosted, no account needed)

Pull the image from DockerHub and run it yourself — no sign-ups, no org invites.

```bash
docker pull dushyantzz/secure-mcp-server:latest
```

**Run the MCP server:**

```bash
docker run -d -p 8000:8000 \
  -e SECRET_KEY=change-me-to-a-strong-secret \
  dushyantzz/secure-mcp-server:latest
```

Your MCP server is now running at `http://localhost:8000/mcp`.

**Run the FastAPI REST server instead:**

```bash
docker run -d -p 8000:8000 \
  -e SECRET_KEY=change-me-to-a-strong-secret \
  -e MODE=api \
  dushyantzz/secure-mcp-server:latest
```

REST API docs will be available at `http://localhost:8000/docs`.

**Connect any MCP client** to `http://localhost:8000/mcp` — same JSON config as above, just swap the URL.

**With docker-compose** (includes PostgreSQL, Redis, Prometheus, Grafana):

```bash
git clone https://github.com/dushyantzz/secure-mcp-server-framework.git
cd secure-mcp-server-framework
docker-compose up
```

---

### Option C: Run from source

```bash
git clone https://github.com/dushyantzz/secure-mcp-server-framework.git
cd secure-mcp-server-framework

# Install dependencies
pip install -r requirements.txt

# Copy and edit environment config
cp .env.example .env

# Run the MCP server
fastmcp run server.py --transport streamable-http --port 8000

# Or run the FastAPI REST server
uvicorn mcp_server.main:app --host 0.0.0.0 --port 8000
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | — | Secret key for JWT token signing |
| `MODE` | No | `mcp` | Docker mode: `mcp` (MCP server) or `api` (FastAPI REST server) |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./secure_mcp.db` | Database connection string |
| `DEBUG` | No | `false` | Enable debug mode and API docs |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `RATE_LIMIT_RPM` | No | `60` | Max requests per minute per user |

See [`.env.example`](.env.example) for the full list.

---

## In summary
- **Secure MCP Server** gives you all the power of an MCP server
- **PLUS** enterprise-level safety and logs
- It adds a professional security guard, not just an open gateway
- Perfect for anyone who wants to run real workflows or tools with AI, safely

#   E x e c u t i o n - G o v e r n a n c e - P l a t f o r m - f o r - A I - A g e n t s  
 