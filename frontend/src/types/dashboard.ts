export type TimeRange = '24h' | '7d' | '30d';

export interface DashboardSummary {
  range: TimeRange;
  total_requests: number;
  blocked_count: number;
  allowed_count: number;
  pending_approvals: number;
  active_keys: number;
  deltas: {
    total_pct: number;
    blocked_pct: number;
    allowed_pct: number;
  };
}

export interface TimeseriesPoint {
  timestamp: string;
  allowed: number;
  blocked: number;
  approvals: number;
}

export interface DashboardTimeseries {
  range: TimeRange;
  bucket: '1h' | '1d';
  points: TimeseriesPoint[];
}

export interface TopRule {
  rule: string;
  decision: string;
  count: number;
}

export interface TopTool {
  tool: string;
  total: number;
  blocked: number;
}

export interface StageCount {
  stage: string;
  count: number;
}

export interface TaintCount {
  source: string;
  count: number;
}

export interface DashboardBreakdown {
  range: TimeRange;
  top_rules: TopRule[];
  top_tools: TopTool[];
  stages: StageCount[];
  taint_sources: TaintCount[];
}

export interface SecurityEventItem {
  id: number;
  request_id: string;
  ts: string;
  tenant_id: string;
  user_id: number | null;
  api_key_id: number | null;
  principal: string | null;
  agent_name: string | null;
  client_ip: string | null;
  user_agent: string | null;
  session_id: string | null;
  event_type: string;
  action: string | null;
  stage: string | null;
  tool_name: string | null;
  intent_category: string | null;
  risk_score: number | null;
  risk_level: string | null;
  decision: 'allow' | 'deny' | 'require_approval' | 'quarantine' | 'log_only' | 'simulate';
  rule_id: string | null;
  rule_snapshot?: any;
  bundle_version?: string | null;
  engine: string | null;
  mode: string;
  reason: string | null;
  args_redacted?: any;
  args_hash: string | null;
  taint_labels: string[];
  latency_ms: number | null;
}

export interface EventsResponse {
  events: SecurityEventItem[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface ApprovalItem {
  id: string;
  tool_name: string;
  requester_id: number | null;
  context_snapshot: any;
  status: string;
  required_role: string | null;
  created_at: string;
}

export interface ActiveKeyItem {
  id: number;
  name: string;
  prefix: string;
  tier: string;
  environment: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}
