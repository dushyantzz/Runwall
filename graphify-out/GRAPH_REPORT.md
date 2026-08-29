# Graph Report - .  (2026-08-29)

## Corpus Check
- 202 files · ~194,796 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1363 nodes · 2957 edges · 111 communities (57 shown, 54 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 319 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- fastapi Abstractions
- inspect_tools Abstractions
- secure_mcp_server_connectors_base Abstractions
- path Abstractions
- frontend_src_components_featurepagetemplate_featurepagedata Abstractions
- scratch_test_sarvam_api Abstractions
- secure_mcp_server_api_routes_dashboard Abstractions
- base Abstractions
- secure_mcp_server_auth Abstractions
- secure_mcp_server_risk_semantic_fusion_rationale_144 Abstractions
- secure_mcp_server_risk_semantic_budget_guard Abstractions
- secure_mcp_server_risk_semantic_cache Abstractions
- secure_mcp_server_risk_semantic_cache_inmemorysemanticcache Abstractions
- secure_mcp_server_governance_intent_types_intentclassification Abstractions
- secure_mcp_server_tools_py_any Abstractions
- datetime Abstractions
- frontend_tsconfig_app Abstractions
- mcp_package_package Abstractions
- secure_mcp_server_api_routes_approvals Abstractions
- secure_mcp_server_governance_intent_types_policydecisiontype Abstractions
- secure_mcp_server_risk_semantic_exceptions_rationale_18 Abstractions
- command Abstractions
- frontend_src_components_paymentmodal Abstractions
- secure_mcp_server_security_py_any Abstractions
- tests_risk_semantic_test_integration_build_full_pipeline Abstractions
- frontend_src_components_protectedroute Abstractions
- frontend_src_components_runwallflowdiagram Abstractions
- secure_mcp_server_risk_semantic_config Abstractions
- frontend_tsconfig_node Abstractions
- frontend_package_devdependencies Abstractions
- frontend_src_components_featurepagetemplate Abstractions
- class_variance_authority Abstractions
- secure_mcp_server_context Abstractions
- secure_mcp_server_governance_intent_classifier_intentclassifier Abstractions
- secure_mcp_server_init Abstractions
- tests_risk_semantic_test_language_detector Abstractions
- secure_mcp_server_governance_compensation_compensationregistry Abstractions
- frontend_package Abstractions
- secure_mcp_server_main_amain Abstractions
- frontend_oxlintrc Abstractions
- secure_mcp_server_database_connection_databasemanager_get_session Abstractions
- secure_mcp_server_governance_approvals_approvalmanager Abstractions
- secure_mcp_server_governance_trust_py_any Abstractions
- secure_mcp_server_governance_intent_types_policyevaluationresult Abstractions
- secure_mcp_server_governance_opa_evaluator_opapolicyevaluator_evaluate Abstractions
- secure_mcp_server_main_rationale_104 Abstractions
- tests_risk_semantic_test_language_detector_rationale_63 Abstractions
- secure_mcp_server_governance_taint Abstractions
- secure_mcp_server_risk_semantic_classifier_degraded_result Abstractions
- tests_risk_semantic_test_language_detector_rationale_120 Abstractions
- tests_risk_semantic_test_language_detector_testlatinonly Abstractions
- secure_mcp_server_main_py_any Abstractions
- secure_mcp_server_risk_semantic_sarvam_client_rationale_123 Abstractions
- frontend_src_app Abstractions
- frontend_tsconfig Abstractions
- group Abstractions
- frontend_package_dependencies_lucide_react Abstractions
- frontend_package_dependencies_radix_ui_react_dialog Abstractions
- frontend_package_dependencies_radix_ui_react_tabs Abstractions
- frontend_package_dependencies_radix_ui_react_tooltip Abstractions
- frontend_package_dependencies_react Abstractions
- frontend_package_dependencies_react_dom Abstractions
- frontend_package_dependencies_supabase_supabase_js Abstractions
- frontend_package_dependencies_tailwind_merge Abstractions
- frontend_vercel Abstractions
- secure_mcp_server_risk_init Abstractions
- tests_risk_init Abstractions
- tests_risk_semantic_init Abstractions
- vercel Abstractions
- Graphify Context
- Readme Context
- Runwall Geo Task Context
- constraints.txt Abstractions
- docker-compose.yml Abstractions
- fastmcp.yaml Abstractions
- features_guide_01_intent_aware_execution_policy_md Abstractions
- features_guide_02_enterprise_identity_session_management_md Abstractions
- features_guide_03_enterprise_api_key_management_md Abstractions
- features_guide_04_distributed_quotas_and_rate_limiting_md Abstractions
- features_guide_05_admin_and_governance_controls_md Abstractions
- features_guide_06_taint_tracking_engine_md Abstractions
- features_guide_07_reversible_execution_and_compensating_controls_md Abstractions
- features_guide_08_tool_trust_and_provenance_md Abstractions
- features_guide_09_approval_workflow_engine_md Abstractions
- features_guide_10_optional_task_contracts_md Abstractions
- features_guide_11_connector_architecture_md Abstractions
- features_guide_12_opa_rego_policy_system_md Abstractions
- features_guide_13_rest_api_control_plane_md Abstractions
- features_guide_aegisguard_testing_verification_s_txt Abstractions
- features_guide_feature_explaination_txt Abstractions
- frontend_index_html Abstractions
- frontend_public_de0a7b2ca970490d987bbe12f705a966_txt Abstractions
- frontend_public_google7d274e66a7e377b4_html Abstractions
- frontend_public_llms_txt Abstractions
- frontend_public_robots_txt Abstractions
- Governance Code Mapping Context
- How It Works Context
- jules_sentinel_md Abstractions
- pkg_secure_mcp_server Abstractions
- requirements.txt Abstractions
- Runwall Indic Risk Layer Plan Context
- Runwall Verification Context
- Semantic Risk Layer Faq Context
- Semantic Risk Layer Overview Context
- serena_project_yml Abstractions

## God Nodes (most connected - your core abstractions)
1. `get_db_manager()` - 72 edges
2. `RiskScorer` - 49 edges
3. `AuthManager` - 46 edges
4. `ClassificationResult` - 46 edges
5. `RiskFusion` - 43 edges
6. `IntentClassification` - 40 edges
7. `BudgetGuard` - 39 edges
8. `InMemorySemanticCache` - 39 edges
9. `SarvamClient` - 37 edges
10. `SemanticRiskClassifier` - 35 edges

## Surprising Connections (you probably didn't know these)
- `get_db_manager()` --indirect_call--> `db_manager()`  [INFERRED]
  secure_mcp_server/database/connection.py → tests/conftest.py
- `FakeSarvamClient` --uses--> `IntentCategory`  [INFERRED]
  tests/risk/semantic/test_integration.py → secure_mcp_server/governance/intent_types.py
- `TestBudgetIntegration` --uses--> `IntentCategory`  [INFERRED]
  tests/risk/semantic/test_integration.py → secure_mcp_server/governance/intent_types.py
- `TestCacheIntegration` --uses--> `IntentCategory`  [INFERRED]
  tests/risk/semantic/test_integration.py → secure_mcp_server/governance/intent_types.py
- `TestEndToEndPipeline` --uses--> `IntentCategory`  [INFERRED]
  tests/risk/semantic/test_integration.py → secure_mcp_server/governance/intent_types.py

## Import Cycles
- None detected.

## Communities (111 total, 54 thin omitted)

### Community 0 - "fastapi Abstractions"
Cohesion: 0.06
Nodes (66): FastAPI, HTTPBasicCredentials, Request, authenticate_admin(), create_app(), lifespan(), MCPAuthASGIMiddleware, Create and configure the FastAPI application for the Control Plane. (+58 more)

### Community 1 - "inspect_tools Abstractions"
Cohesion: 0.06
Nodes (50): test(), Validate Rego syntax locally. Returns an error message if invalid, or None if…, validate_rego_syntax(), BaseSettings, Configuration management for the Secure MCP Server., Application settings with environment variable support., Reload settings (useful for testing)., reload_settings() (+42 more)

### Community 2 - "secure_mcp_server_connectors_base Abstractions"
Cohesion: 0.05
Nodes (34): BaseConnector, ConnectorMetadata, ABC, Any, Base Connector Abstraction., Abstract base class for all Tool Connectors., Initialize the connector (e.g., connect to DB, authenticate)., Return the dictionary of callable tool functions exposed by this connector. (+26 more)

### Community 3 - "path Abstractions"
Cohesion: 0.06
Nodes (28): Path, setup(), BudgetGuard, estimate_cost_inr(), FileBudgetStorage, Load persisted spend state from storage., Budget utilization as a fraction (0–1)., Check if budget is available for a new API call. Raises ------… (+20 more)

### Community 4 - "frontend_src_components_featurepagetemplate_featurepagedata Abstractions"
Cohesion: 0.07
Nodes (30): FeaturePageData, FeaturePageTemplate(), CATEGORIES, DocSection, ApprovalWorkflowEngine(), data, AuditEvidenceReplay(), data (+22 more)

### Community 5 - "scratch_test_sarvam_api Abstractions"
Cohesion: 0.09
Nodes (27): test_sarvam(), Any, Close the HTTP client if we own it., Extract JSON from text that may be wrapped in markdown code fences., Thin adapter over the Sarvam AI chat completions API. Parameters ----------…, SarvamClient, _make_mock_http_client(), _make_sarvam_response() (+19 more)

### Community 6 - "secure_mcp_server_api_routes_dashboard Abstractions"
Cohesion: 0.09
Nodes (40): add_session_taint(), APIKeyCreateRequest, clear_session_taint(), compute_risk_score(), generate_api_key(), get_api_keys(), get_limits(), get_rollback_logs() (+32 more)

### Community 7 - "base Abstractions"
Cohesion: 0.09
Nodes (37): Base, FastMCP, Admin MCP Tools for Governance & Platform Management. Provides CRUD for…, Ensure the requester is an admin., Register all administrative tools to the MCP server., register_admin_tools(), _require_admin(), Database package for MCP Server. (+29 more)

### Community 8 - "secure_mcp_server_auth Abstractions"
Cohesion: 0.08
Nodes (24): AuthManager, Any, AsyncSession, Authentication and session management for MCP server. Provides Enterprise…, Verify and decode a JWT token, ensuring it hasn't been revoked., Revoke a specific token by adding its JTI to the revocation list., Authenticate user, tracking failed attempts/lockouts, and return (User,…, Log out user by revoking tokens and deactivating session. (+16 more)

### Community 9 - "secure_mcp_server_risk_semantic_fusion_rationale_144 Abstractions"
Cohesion: 0.09
Nodes (19): Handle degraded semantic signal based on fail mode. fail-open: ignore semantic…, Clamp score to [0, 1]., Fuses structural and semantic risk signals into a final score. Parameters…, Combine structural and semantic scores into a final risk score. Parameters…, RiskFusion, _make_result(), Tests for the fusion logic — weighting, fail-open, fail-closed., Default: structural 0.6, semantic 0.4. (+11 more)

### Community 10 - "secure_mcp_server_risk_semantic_budget_guard Abstractions"
Cohesion: 0.14
Nodes (30): Semantic Risk Layer — Budget Guard. Tracks cumulative credit spend against the…, Semantic Risk Layer — Classifier Orchestration. ``SemanticRiskClassifier`` is…, Orchestrates the semantic risk classification pipeline. Dependencies are…, SemanticRiskClassifier, BudgetExhaustedError, MalformedResponseError, Exception, Semantic Risk Layer — Typed Exception Hierarchy. Every failure path in the… (+22 more)

### Community 11 - "secure_mcp_server_risk_semantic_cache Abstractions"
Cohesion: 0.10
Nodes (26): Semantic Risk Layer — Classification Result Cache. Caches Sarvam API…, CacheProtocol, LanguageDetectorProtocol, ABC, Semantic Risk Layer — Abstract Contracts. Defines the interfaces that make the…, Store a classification result in the cache. Parameters ---------- content: The…, Abstract interface for semantic risk classification. Any provider that can…, Classify the given content for semantic risk. Parameters ---------- content:… (+18 more)

### Community 12 - "secure_mcp_server_risk_semantic_cache_inmemorysemanticcache Abstractions"
Cohesion: 0.11
Nodes (19): InMemorySemanticCache, SHA-256 hash of normalised content for cache key., Evict the oldest 10% of entries when cache is full., In-memory TTL cache for classification results. Parameters ----------…, Retrieve a cached classification result. Returns None on cache miss or if the…, Store a classification result in the cache. Evicts oldest entries if the cache…, Current number of entries in the cache., Clear all cached entries. (+11 more)

### Community 13 - "secure_mcp_server_governance_intent_types_intentclassification Abstractions"
Cohesion: 0.13
Nodes (16): IntentClassification, Individual risk factors with their computed scores., Result of analysing what the caller *intends* to do., RiskFactors, Any, Computes multi-factor risk scores for tool invocations. Usage:: scorer =…, Compute composite risk score for a classified intent. Parameters ----------…, Computes risk from user trust perspective. NOTE: This is *risk*, not *trust*. A… (+8 more)

### Community 14 - "secure_mcp_server_tools_py_any Abstractions"
Cohesion: 0.10
Nodes (15): Any, UUID generator tool implementation., DateTime info tool implementation., System info tool implementation (admin only)., Context summary tool implementation., Execute a tool with security, governance, and monitoring. Execution pipeline::…, Registry for managing and executing MCP tools., Tool handler to execute an approved action. (+7 more)

### Community 15 - "datetime Abstractions"
Cohesion: 0.17
Nodes (19): datetime, Approval Workflow Engine. This module provides an asynchronous staging area for…, Task Contract Manager. Allows LLM agents to declare intended multi-step…, Intent-Aware Execution Policy Engine. This package implements the governance…, Intent Classifier — deterministic intent analysis for tool invocations.…, BlastRadius, IntentCategory, Enum (+11 more)

### Community 16 - "frontend_tsconfig_app Abstractions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib (+18 more)

### Community 17 - "mcp_package_package Abstractions"
Cohesion: 0.07
Nodes (26): author, bin, runwall-mcp, dependencies, @modelcontextprotocol/sdk, description, engines, node (+18 more)

### Community 18 - "secure_mcp_server_api_routes_approvals Abstractions"
Cohesion: 0.11
Nodes (22): get_pending_approvals(), get, post, List all pending approval requests., Review an approval request (Approve/Reject)., review_approval(), get_audit_logs(), get_policy_decisions() (+14 more)

### Community 19 - "secure_mcp_server_governance_intent_types_policydecisiontype Abstractions"
Cohesion: 0.13
Nodes (19): PolicyDecisionType, PolicyRuleMatch, BaseModel, Composite risk assessment for a single tool invocation., Represents a single policy rule that was evaluated., What the policy engine decides to do with a request., RiskScore, OPA / Rego Policy Evaluator. Evaluates execution intent, risk, and user context… (+11 more)

### Community 20 - "secure_mcp_server_risk_semantic_exceptions_rationale_18 Abstractions"
Cohesion: 0.15
Nodes (18): Raised when the Sarvam API returns a non-transient error (auth, bad request,…, SarvamAPIError, _build_classifier(), _hinglish_profile(), _latin_profile(), _make_result(), asyncio, Tests for the classifier orchestration — full pipeline with fakes. (+10 more)

### Community 21 - "command Abstractions"
Cohesion: 0.14
Nodes (17): command, option, async_bootstrap(), bootstrap(), CLI commands for Secure MCP Server., Bootstrap the initial admin user in the database., DatabaseManager, Clean up database connections. (+9 more)

### Community 22 - "frontend_src_components_paymentmodal Abstractions"
Cohesion: 0.11
Nodes (16): closeBtnStyle, loadRazorpayScript(), modalStyle, overlayStyle, PaymentModal(), primaryBtnStyle, Props, Window (+8 more)

### Community 23 - "secure_mcp_server_security_py_any Abstractions"
Cohesion: 0.09
Nodes (12): Any, Validate if user can access a specific tool., Create a sandboxed execution context for tools., Record a security event for auditing., Detect anomalies in API key usage (e.g., burst usage, unusual IPs)., Get audit events for security analysis., Detect security anomalies in recent events., Calculate overall security score. (+4 more)

### Community 24 - "tests_risk_semantic_test_integration_build_full_pipeline Abstractions"
Cohesion: 0.13
Nodes (13): _build_full_pipeline(), FakeSarvamClient, asyncio, Hinglish injection content should flow through the full pipeline., Pure Hindi (Devanagari) should trigger the semantic layer., Plain English content should skip the Sarvam call entirely., Second call with same content should hit cache, not API., When budget is exhausted, classifier returns degraded result. (+5 more)

### Community 25 - "frontend_src_components_protectedroute Abstractions"
Cohesion: 0.15
Nodes (10): ProtectedRoute(), ProtectedRouteProps, AuthContext, AuthContextType, useAuth(), supabase, CTASection(), HeroSection() (+2 more)

### Community 26 - "frontend_src_components_runwallflowdiagram Abstractions"
Cohesion: 0.10
Nodes (9): nodeTypes, RunwallFlowDiagram(), BranchingWorkflowSection(), faqItems, FAQSection(), feedbackItemsRow1, feedbackItemsRow2, tickerItems (+1 more)

### Community 27 - "secure_mcp_server_risk_semantic_config Abstractions"
Cohesion: 0.13
Nodes (18): BaseSettings, Semantic Risk Layer — Typed Configuration. Single typed config object loaded…, Convert string fail_mode to FailMode enum., Configuration for the Indic-Aware Semantic Risk Layer. All values are loaded…, SemanticRiskConfig, FailMode, Enum, str (+10 more)

### Community 28 - "frontend_tsconfig_node Abstractions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 29 - "frontend_package_devdependencies Abstractions"
Cohesion: 0.11
Nodes (19): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript (+11 more)

### Community 30 - "frontend_src_components_featurepagetemplate Abstractions"
Cohesion: 0.19
Nodes (12): ArchitectureSection(), CapabilitiesSection(), CodeExampleSection(), FAQSection(), highlightCode(), ProblemSection(), TrustModelSection(), WhatItDoesSection() (+4 more)

### Community 31 - "class_variance_authority Abstractions"
Cohesion: 0.12
Nodes (17): class-variance-authority, clsx, dependencies, class-variance-authority, clsx, @radix-ui/react-dropdown-menu, @radix-ui/react-separator, @radix-ui/react-slot (+9 more)

### Community 32 - "secure_mcp_server_context Abstractions"
Cohesion: 0.20
Nodes (6): ContextItem, ContextManager, Any, Context management for Secure MCP Server., Manages session contexts, token budgets, and eviction., SessionContext

### Community 33 - "secure_mcp_server_governance_intent_classifier_intentclassifier Abstractions"
Cohesion: 0.28
Nodes (6): IntentClassifier, Any, Deterministic intent classifier for tool invocations. The classifier inspects…, Classify the intent of a tool call. Parameters ---------- tool_name: Registered…, Normalise tool name and parameter values into a matchable string. Replaces…, Determine the high-level intent category. Two-pass classification: 1. Tool-name…

### Community 34 - "secure_mcp_server_init Abstractions"
Cohesion: 0.15
Nodes (7): _current_request_prop(), Package init for secure_mcp_server., MetricsCollector, Any, Monitoring and metrics collection for Secure MCP Server., Lightweight metrics and health tracker (no external server needed)., setter

### Community 35 - "tests_risk_semantic_test_language_detector Abstractions"
Cohesion: 0.15
Nodes (7): detector(), fixture, Tests for the language/script detector — no mocking needed, pure logic., Adversarial prompt injection in Hindi Devanagari., Code-mixed: Devanagari + Latin + Hinglish tokens., TestDevanagari, TestMixedScript

### Community 36 - "secure_mcp_server_governance_compensation_compensationregistry Abstractions"
Cohesion: 0.20
Nodes (7): CompensationRegistry, Any, Registry mapping tool actions to their compensating handlers., Decorator to register a compensating handler., Retrieve a registered compensating handler by name., Record an execution that can be reversed., Execute a rollback for a previously committed action.

### Community 37 - "frontend_package Abstractions"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 38 - "secure_mcp_server_main_amain Abstractions"
Cohesion: 0.20
Nodes (6): amain(), main(), Initialize all server components., Cleanup server resources., Async entry point for the secure MCP server., Main entry point for the secure MCP server.

### Community 39 - "frontend_oxlintrc Abstractions"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 40 - "secure_mcp_server_database_connection_databasemanager_get_session Abstractions"
Cohesion: 0.28
Nodes (6): get_db_session(), AsyncSession, Get a database session., Get a database session as async context manager., Check database health., Dependency for getting database session in FastAPI routes.

### Community 41 - "secure_mcp_server_governance_approvals_approvalmanager Abstractions"
Cohesion: 0.28
Nodes (6): ApprovalManager, Any, Manages the lifecycle of approval requests., Create a new approval request., Approve or reject a pending request., Fetch an approved request and mark it as EXECUTED.

### Community 42 - "secure_mcp_server_governance_trust_py_any Abstractions"
Cohesion: 0.28
Nodes (6): Any, Manages the cryptographic trust state of tools., Compute SHA-256 hash of a string., Retrieve the source code of a function safely., Verify the tool against its stored trusted manifest. If it's the first time…, ToolTrustManager

### Community 43 - "secure_mcp_server_governance_intent_types_policyevaluationresult Abstractions"
Cohesion: 0.29
Nodes (5): PolicyEvaluationResult, Any, Full, explainable result of the governance pipeline., Serialise into a dict suitable for the PolicyDecisionLog table., Deterministic hash of tool parameters for deduplication / auditing.

### Community 44 - "secure_mcp_server_governance_opa_evaluator_opapolicyevaluator_evaluate Abstractions"
Cohesion: 0.36
Nodes (4): OPAPolicyResult, Any, A native python fallback mimicking the Rego logic if the opa binary is missing., Evaluate the execution against OPA policies.

### Community 45 - "secure_mcp_server_main_rationale_104 Abstractions"
Cohesion: 0.25
Nodes (4): Setup MCP server with security middleware and tools., Register all available tools., Register MCP resources., Register MCP prompts.

### Community 46 - "tests_risk_semantic_test_language_detector_rationale_63 Abstractions"
Cohesion: 0.29
Nodes (3): Classic adversarial pattern in transliterated Hindi., A single Hinglish token should have lower confidence than multiple., TestHinglish

### Community 47 - "secure_mcp_server_governance_taint Abstractions"
Cohesion: 0.40
Nodes (5): Enum, str, Taint Tracking Engine for execution governance. This module provides the…, Canonical taint labels., TaintLabel

### Community 48 - "secure_mcp_server_risk_semantic_classifier_degraded_result Abstractions"
Cohesion: 0.33
Nodes (5): _degraded_result(), _neutral_result(), Classify content for semantic risk. Pipeline: 1. Detect language — if Latin-…, Return a neutral/no-op classification result. Used when content is…, Return a degraded fallback classification result. Used when the semantic layer…

### Community 52 - "secure_mcp_server_main_py_any Abstractions"
Cohesion: 0.40
Nodes (3): Any, Extract user context from current request., Check if user context represents an admin or has admin permissions.

### Community 57 - "group Abstractions"
Cohesion: 0.67
Nodes (3): group, cli(), Secure MCP Server CLI

## Knowledge Gaps
- **169 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RiskScorer` connect `secure_mcp_server_governance_intent_types_intentclassification Abstractions` to `inspect_tools Abstractions`, `secure_mcp_server_api_routes_dashboard Abstractions`, `base Abstractions`, `secure_mcp_server_risk_semantic_budget_guard Abstractions`, `datetime Abstractions`, `secure_mcp_server_governance_intent_types_policydecisiontype Abstractions`, `command Abstractions`, `tests_risk_semantic_test_integration_build_full_pipeline Abstractions`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `get_db_manager()` connect `secure_mcp_server_api_routes_dashboard Abstractions` to `fastapi Abstractions`, `inspect_tools Abstractions`, `secure_mcp_server_governance_compensation_compensationregistry Abstractions`, `base Abstractions`, `secure_mcp_server_auth Abstractions`, `secure_mcp_server_database_connection_databasemanager_get_session Abstractions`, `secure_mcp_server_governance_approvals_approvalmanager Abstractions`, `secure_mcp_server_governance_trust_py_any Abstractions`, `secure_mcp_server_governance_opa_evaluator_opapolicyevaluator_evaluate Abstractions`, `secure_mcp_server_tools_py_any Abstractions`, `datetime Abstractions`, `secure_mcp_server_governance_taint Abstractions`, `secure_mcp_server_api_routes_approvals Abstractions`, `secure_mcp_server_governance_intent_types_policydecisiontype Abstractions`, `command Abstractions`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `IntentCategory` connect `datetime Abstractions` to `secure_mcp_server_governance_intent_classifier_intentclassifier Abstractions`, `inspect_tools Abstractions`, `secure_mcp_server_api_routes_dashboard Abstractions`, `base Abstractions`, `secure_mcp_server_risk_semantic_budget_guard Abstractions`, `secure_mcp_server_governance_opa_evaluator_opapolicyevaluator_evaluate Abstractions`, `secure_mcp_server_governance_intent_types_intentclassification Abstractions`, `secure_mcp_server_governance_intent_types_policydecisiontype Abstractions`, `tests_risk_semantic_test_integration_build_full_pipeline Abstractions`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `RiskScorer` (e.g. with `BlastRadius` and `IntentCategory`) actually correct?**
  _`RiskScorer` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `AuthManager` (e.g. with `MCPAuthASGIMiddleware` and `APIKeyCreateRequest`) actually correct?**
  _`AuthManager` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `ClassificationResult` (e.g. with `BudgetGuard` and `FileBudgetStorage`) actually correct?**
  _`ClassificationResult` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `RiskFusion` (e.g. with `ClassificationResult` and `RiskSignal`) actually correct?**
  _`RiskFusion` has 16 INFERRED edges - model-reasoned connections that need verification._