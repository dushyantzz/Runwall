#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const apiKey = process.env.RUNWALL_API_KEY;
const runwallUrl = process.env.RUNWALL_URL || "https://runwall.vercel.app/mcp";

if (!apiKey) {
  console.error("Error: RUNWALL_API_KEY environment variable is required.");
  process.exit(1);
}

async function main() {
  console.error(`Connecting to remote Runwall at ${runwallUrl}...`);
  
  try {
    // 1. Connect to the remote Streamable HTTP server
    const upstreamTransport = new StreamableHTTPClientTransport(
      new URL(runwallUrl),
      {
        requestInit: {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "application/json, text/event-stream"
          }
        }
      }
    );

    const client = new Client(
      { name: "runwall-bridge-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await client.connect(upstreamTransport);
    console.error("Successfully connected to remote Runwall.");

    // 2. Set up the local stdio MCP Server for Claude Desktop
    const server = new Server(
      { name: "Runwall Gateway", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    // Forward tool listing requests
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("Received tools/list request from Claude Desktop");
      try {
        const result = await client.listTools();
        return result;
      } catch (err) {
        console.error(`Error forwarding tools/list: ${err.message}`);
        return { tools: [] };
      }
    });

    // Forward tool execution requests
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      console.error(`Received tools/call request for tool: ${toolName}`);
      try {
        const result = await client.callTool(toolName, request.params.arguments);
        return result;
      } catch (err) {
        console.error(`Error executing tool ${toolName}: ${err.message}`);
        return {
          content: [{ type: "text", text: `Error executing tool: ${err.message}` }],
          isError: true
        };
      }
    });

    // Start stdio transport
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error("Runwall local stdio bridge is active and listening.");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await client.close();
      await server.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await client.close();
      await server.close();
      process.exit(0);
    });

  } catch (err) {
    console.error(`Fatal connection error: ${err.message}`);
    process.exit(1);
  }
}

main();
