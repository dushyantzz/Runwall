import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Custom Agent Integration with Runwall — MCP Governance for Any Agent',
  description: 'How to integrate any MCP-compliant custom AI agent with Runwall\'s execution governance layer. HTTP/SSE and stdio transport options for custom agent pipelines.',
  path: '/integrations/custom-agents',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Integrations', href: 'https://runwall.in/integrations/custom-agents' },
    { name: 'Custom Agents', href: 'https://runwall.in/integrations/custom-agents' },
  ],
  content: [
    'Runwall works with any AI agent that implements the Model Context Protocol (MCP). If your custom agent can connect to an MCP server — whether through stdio transport or HTTP/SSE — it can be governed by Runwall with zero code changes. This includes agents built with LangChain, LangGraph, CrewAI, AutoGen, or any custom framework that supports MCP tool calling.',
    'For custom agents, Runwall provides both transport options: the @runwall/mcp npm package for stdio-based local agents, and the https://mcp.runwall.in/mcp HTTP endpoint for remote agents. Both options provide identical governance coverage — policy enforcement, risk scoring, taint tracking, approval workflows, and audit logging.',
  ],
  sections: [
    {
      heading: 'Integration Patterns',
      body: 'Stdio transport: If your agent runs locally and connects to MCP servers via subprocess, configure it to launch the @runwall/mcp package with your API key. HTTP/SSE transport: If your agent connects to remote MCP servers over HTTP, point its MCP endpoint configuration to https://mcp.runwall.in/mcp. M2M pipelines: For multi-agent systems where agents delegate tasks to each other, each agent can be independently connected to Runwall with its own identity and policy scope.',
    },
  ],
  codeSnippet: {
    title: 'Custom Agent — HTTP/SSE Integration Example',
    language: 'python',
    code: `# Example: connecting a LangChain agent to Runwall
# via the MCP HTTP/SSE endpoint

from langchain_mcp import MCPToolkit

# Point MCP connection to Runwall instead of direct tools
toolkit = MCPToolkit(
    server_url="https://mcp.runwall.in/mcp",
    api_key="YOUR_RUNWALL_API_KEY",
    transport="sse"
)

# All tool calls now flow through Runwall's
# governance pipeline automatically
tools = toolkit.get_tools()
agent = create_agent(tools=tools)
agent.invoke("Analyze the codebase and fix the failing tests")`,
  },
  faqs: [
    {
      question: 'Can I use Runwall with a custom AI agent built with LangChain?',
      answer: 'Yes. Any agent framework that supports MCP (LangChain, LangGraph, CrewAI, AutoGen, or custom frameworks) can connect to Runwall. Point your MCP connection to the Runwall endpoint and all tool calls will be governed automatically.',
    },
    {
      question: 'Does Runwall work with agents that don\'t use MCP?',
      answer: 'Runwall is designed for MCP-based tool calling. If your agent uses a different tool-calling protocol, you would need to bridge it to MCP to use Runwall. For agents that already use MCP (which is the standard for most modern AI agent frameworks), integration is transparent.',
    },
    {
      question: 'Can multiple custom agents share the same Runwall instance?',
      answer: 'Yes. Runwall supports multi-tenant and multi-agent deployments. Each agent connects with its own identity (API key), and policies, rate limits, and audit logs are scoped per agent and per tenant. Multiple agents can share the same Runwall endpoint with independent governance contexts.',
    },
    {
      question: 'How do I authenticate my custom agent with Runwall?',
      answer: 'Provide your Runwall API key in the MCP connection configuration. For stdio transport, set it as the RUNWALL_API_KEY environment variable. For HTTP/SSE transport, include it in the connection parameters. The API key identifies your agent and determines which tenant\'s policies apply.',
    },
  ],
  relatedLinks: [
    { label: 'Getting Started Guide', to: '/docs/getting-started' },
    { label: 'MCP Protocol Documentation', to: '/docs/mcp' },
    { label: 'Autonomous Agents Use Case', to: '/use-cases/autonomous-agents' },
    { label: 'Security Architecture', to: '/security/architecture' },
  ],
};

export default function IntegrationCustomAgents() {
  return <GeoPageTemplate data={data} />;
}
