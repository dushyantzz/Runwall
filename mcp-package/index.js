#!/usr/bin/env node

/**
 * @runwall/mcp — Stdio-to-HTTP bridge for Runwall MCP Gateway
 *
 * This script connects local MCP clients (Claude Desktop, VS Code, Cursor, etc.)
 * to the hosted Runwall MCP platform over Streamable HTTP.
 *
 * Environment variables:
 *   RUNWALL_API_KEY  — Your Runwall API key (required)
 *   RUNWALL_URL      — Custom Runwall endpoint (optional, defaults to hosted)
 *
 * Usage in claude_desktop_config.json:
 *   {
 *     "mcpServers": {
 *       "runwall": {
 *         "command": "npx",
 *         "args": ["-y", "@runwall/mcp"],
 *         "env": {
 *           "RUNWALL_API_KEY": "your-api-key"
 *         }
 *       }
 *     }
 *   }
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const DEFAULT_URL = "https://mcp.runwall.dev/mcp";

async function main() {
  const apiKey = process.env.RUNWALL_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: RUNWALL_API_KEY environment variable is required.\n" +
        "Get your API key at https://runwall.vercel.app/docs\n"
    );
    process.exit(1);
  }

  const runwallUrl = process.env.RUNWALL_URL || DEFAULT_URL;

  console.error(`Connecting to Runwall at ${runwallUrl}...`);

  try {
    // Create the upstream HTTP transport to the hosted Runwall server
    const upstreamTransport = new StreamableHTTPClientTransport(
      new URL(runwallUrl),
      {
        requestInit: {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      }
    );

    // Create an MCP client connected to the upstream
    const client = new Client(
      { name: "runwall-stdio-bridge", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(upstreamTransport);
    console.error("Connected to Runwall successfully.");

    // Now create a stdio transport to serve the local MCP client
    const stdioTransport = new StdioServerTransport();

    // Bridge: forward stdio messages to the upstream and vice versa
    // The SDK handles the protocol bridging when we proxy the server
    stdioTransport.onMessage = async (message) => {
      try {
        const response = await client.request(message);
        await stdioTransport.send(response);
      } catch (err) {
        console.error("Bridge error:", err.message);
      }
    };

    await stdioTransport.start();
    console.error("Runwall MCP bridge is running. Waiting for requests...");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.error("Shutting down Runwall MCP bridge...");
      await client.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.error("Shutting down Runwall MCP bridge...");
      await client.close();
      process.exit(0);
    });
  } catch (err) {
    console.error(`Failed to connect to Runwall: ${err.message}`);
    console.error(
      "Make sure your API key is valid and the Runwall server is reachable."
    );
    process.exit(1);
  }
}

main();
