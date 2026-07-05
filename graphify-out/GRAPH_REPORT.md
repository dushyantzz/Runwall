# Graph Report - .  (2026-07-05)

## Corpus Check
- 120 files · ~63,232 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 32 nodes · 12 edges · 23 communities (2 shown, 21 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Intent & Core Policy Governance|Intent & Core Policy Governance]]
- [[_COMMUNITY_Staging, Approvals & Compensation|Staging, Approvals & Compensation]]
- [[_COMMUNITY_Platform Blueprint & Setup|Platform Blueprint & Setup]]
- [[_COMMUNITY_Identity, Access & API Keys|Identity, Access & API Keys]]
- [[_COMMUNITY_Connectors & Cryptographic Tool Trust|Connectors & Cryptographic Tool Trust]]
- [[_COMMUNITY_OPA Rego Policies & Control Plane|OPA Rego Policies & Control Plane]]
- [[_COMMUNITY_UI Feature Page Data|UI Feature Page Data]]
- [[_COMMUNITY_UI Feature Page Template|UI Feature Page Template]]
- [[_COMMUNITY_UI Approval Workflow Engine Page|UI Approval Workflow Engine Page]]
- [[_COMMUNITY_UI Audit Evidence Replay Page|UI Audit Evidence Replay Page]]
- [[_COMMUNITY_UI Identity & Access Control Page|UI Identity & Access Control Page]]
- [[_COMMUNITY_UI Policy Engine Page|UI Policy Engine Page]]
- [[_COMMUNITY_UI Quotas & Rate Limits Page|UI Quotas & Rate Limits Page]]
- [[_COMMUNITY_UI Risk Scoring Engine Page|UI Risk Scoring Engine Page]]
- [[_COMMUNITY_UI Rollback & Compensation Page|UI Rollback & Compensation Page]]
- [[_COMMUNITY_UI Runtime Interceptor Page|UI Runtime Interceptor Page]]
- [[_COMMUNITY_UI Sandboxing Execution Page|UI Sandboxing Execution Page]]
- [[_COMMUNITY_UI Taint Tracking Engine Page|UI Taint Tracking Engine Page]]
- [[_COMMUNITY_UI Tenant Management Page|UI Tenant Management Page]]
- [[_COMMUNITY_UI Tool MCP Registry Page|UI Tool MCP Registry Page]]
- [[_COMMUNITY_UI Scroll Animation Hook|UI Scroll Animation Hook]]
- [[_COMMUNITY_UI App Shell Layout|UI App Shell Layout]]
- [[_COMMUNITY_UI Router Configuration|UI Router Configuration]]

## God Nodes (most connected - your core abstractions)
1. `Intent-Aware Policy Engine` - 6 edges
2. `Approval Workflow Engine` - 3 edges
3. `Secure MCP Server` - 2 edges
4. `OPA Rego Policy System` - 2 edges
5. `Execution Governance Platform` - 1 edges
6. `Identity & Session Management` - 1 edges
7. `API Key Management` - 1 edges
8. `Distributed Quotas & Rate Limiting` - 1 edges
9. `Admin & Governance Controls` - 1 edges
10. `Taint Tracking Engine` - 1 edges

## Surprising Connections (you probably didn't know these)
- `Secure MCP Server` --runs--> `Intent-Aware Policy Engine`  [EXTRACTED]
  README.md → Features Guide/01_Intent_Aware_Execution_Policy.md
- `Execution Governance Platform` --describes--> `Secure MCP Server`  [EXTRACTED]
  Execution_Governance_Platform_Blueprint.md → README.md
- `Intent-Aware Policy Engine` --evaluates--> `OPA Rego Policy System`  [EXTRACTED]
  Features Guide/01_Intent_Aware_Execution_Policy.md → Features Guide/12_OPA_Rego_Policy_System.md
- `Admin & Governance Controls` --configures--> `Intent-Aware Policy Engine`  [EXTRACTED]
  Features Guide/05_Admin_and_Governance_Controls.md → Features Guide/01_Intent_Aware_Execution_Policy.md
- `Intent-Aware Policy Engine` --triggers--> `Approval Workflow Engine`  [EXTRACTED]
  Features Guide/01_Intent_Aware_Execution_Policy.md → Features Guide/09_Approval_Workflow_Engine.md

## Import Cycles
- None detected.

## Communities (23 total, 21 thin omitted)

### Community 0 - "Intent & Core Policy Governance"
Cohesion: 0.50
Nodes (4): Admin & Governance Controls, Intent-Aware Policy Engine, Distributed Quotas & Rate Limiting, Taint Tracking Engine

### Community 1 - "Staging, Approvals & Compensation"
Cohesion: 0.67
Nodes (3): Approval Workflow Engine, Reversible Execution & Compensating Controls, Optional Task Contracts

## Knowledge Gaps
- **28 isolated node(s):** `FeaturePageData`, `FeaturePageTemplate`, `useScrollAnimation`, `AppLayout`, `ApprovalWorkflowEngine` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Intent-Aware Policy Engine` connect `Intent & Core Policy Governance` to `Staging, Approvals & Compensation`, `Platform Blueprint & Setup`, `OPA Rego Policies & Control Plane`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `Approval Workflow Engine` connect `Staging, Approvals & Compensation` to `Intent & Core Policy Governance`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `Secure MCP Server` connect `Platform Blueprint & Setup` to `Intent & Core Policy Governance`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `FeaturePageData`, `FeaturePageTemplate`, `useScrollAnimation` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._