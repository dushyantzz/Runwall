import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/AuthContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardTimelineChart } from '@/components/dashboard/DashboardTimelineChart';
import { DashboardBreakdowns } from '@/components/dashboard/DashboardBreakdowns';
import { DashboardActivityFeed } from '@/components/dashboard/DashboardActivityFeed';
import { DashboardEventDrawer } from '@/components/dashboard/DashboardEventDrawer';
import { DashboardApprovalsSection } from '@/components/dashboard/DashboardApprovalsSection';
import { DashboardKeysSection } from '@/components/dashboard/DashboardKeysSection';
import type {
  TimeRange,
  DashboardSummary,
  DashboardTimeseries,
  DashboardBreakdown,
  SecurityEventItem,
  EventsResponse,
  ApprovalItem,
  ActiveKeyItem,
} from '@/types/dashboard';
import { AlertCircle } from 'lucide-react';

const DeveloperKeysModal = lazy(() => import('@/components/DeveloperKeysModal'));

export const DashboardPage: React.FC = () => {
  const { user, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query param for time range
  const rawRange = searchParams.get('range');
  const range: TimeRange = (rawRange === '7d' || rawRange === '30d') ? rawRange : '24h';

  const setRange = (newRange: TimeRange) => {
    setSearchParams({ range: newRange }, { replace: true });
  };

  // API Base URL
  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const API_BASE = rawApiUrl.endsWith('/api/v1')
    ? rawApiUrl.replace('/api/v1', '/api')
    : rawApiUrl.endsWith('/api')
    ? rawApiUrl
    : `${rawApiUrl}/api`;

  // State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [timeseries, setTimeseries] = useState<DashboardTimeseries | null>(null);
  const [breakdown, setBreakdown] = useState<DashboardBreakdown | null>(null);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [keys, setKeys] = useState<ActiveKeyItem[]>([]);

  // Filter state
  const [decisionFilter, setDecisionFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventItem | null>(null);
  const [keysModalOpen, setKeysModalOpen] = useState(false);

  // Headers helper
  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    if (user?.email) {
      headers['X-User-Email'] = user.email.trim().toLowerCase();
    }
    return headers;
  }, [session, user]);

  // Fetch summary, timeseries, breakdown, approvals, keys
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const headers = getAuthHeaders();

    try {
      const [sumRes, timeRes, breakRes, appRes, keyRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/summary?range=${range}`, { headers }),
        fetch(`${API_BASE}/dashboard/timeseries?range=${range}`, { headers }),
        fetch(`${API_BASE}/dashboard/breakdown?range=${range}`, { headers }),
        fetch(`${API_BASE}/dashboard/approvals`, { headers }),
        fetch(`${API_BASE}/dashboard/keys`, { headers }),
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (timeRes.ok) setTimeseries(await timeRes.json());
      if (breakRes.ok) setBreakdown(await breakRes.json());
      if (appRes.ok) setApprovals(await appRes.json());
      if (keyRes.ok) setKeys(await keyRes.json());
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to fetch real-time dashboard data. Please check connection and retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE, range, getAuthHeaders]);

  // Fetch events list
  const fetchEvents = useCallback(async () => {
    const headers = getAuthHeaders();
    const params = new URLSearchParams({
      range,
      limit: '25',
    });
    if (decisionFilter) params.set('decision', decisionFilter);
    if (stageFilter) params.set('stage', stageFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    try {
      const res = await fetch(`${API_BASE}/dashboard/events?${params.toString()}`, { headers });
      if (res.ok) {
        const data: EventsResponse = await res.json();
        setEvents(data.events || []);
        setHasMoreEvents(data.has_more || false);
        setNextCursor(data.next_cursor || null);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, [API_BASE, range, decisionFilter, stageFilter, searchQuery, getAuthHeaders]);

  // Load more events with keyset pagination
  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const headers = getAuthHeaders();
    const params = new URLSearchParams({
      range,
      limit: '25',
      cursor: nextCursor,
    });
    if (decisionFilter) params.set('decision', decisionFilter);
    if (stageFilter) params.set('stage', stageFilter);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    try {
      const res = await fetch(`${API_BASE}/dashboard/events?${params.toString()}`, { headers });
      if (res.ok) {
        const data: EventsResponse = await res.json();
        setEvents((prev) => [...prev, ...(data.events || [])]);
        setHasMoreEvents(data.has_more || false);
        setNextCursor(data.next_cursor || null);
      }
    } catch (err) {
      console.error('Failed to paginate events:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Review approval action
  const handleReviewApproval = async (id: string, decision: 'APPROVED' | 'REJECTED', reason: string) => {
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    };
    const res = await fetch(`${API_BASE}/dashboard/approvals/${id}/review`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ decision, reason }),
    });

    if (res.ok) {
      // Refresh approvals and events
      const appRes = await fetch(`${API_BASE}/dashboard/approvals`, { headers });
      if (appRes.ok) setApprovals(await appRes.json());
      fetchEvents();
      fetchDashboardData(true);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.detail || 'Failed to submit approval review');
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    const url = `${API_BASE}/dashboard/export.csv?range=${range}`;

    // Fetch as blob to include auth headers
    const headers = getAuthHeaders();
    fetch(url, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `runwall-security-audit-${range}-${new Date().toISOString().substring(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        console.error('CSV export failed:', err);
        alert('Could not export CSV audit log. Please try again.');
      });
  };

  // Trigger data load on mount or range change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Trigger events load on filter change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #000000)',
      color: 'var(--body, #b4b4b4)',
      paddingTop: '80px',
      paddingBottom: '80px',
    }}>
      <Helmet>
        <title>Security Dashboard | Runwall</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px' }}>
        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ef4444',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDashboardData()}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Header */}
        <DashboardHeader
          range={range}
          onRangeChange={setRange}
          onRefresh={() => fetchDashboardData(true)}
          refreshing={refreshing}
          onExportCsv={handleExportCsv}
          userEmail={user?.email}
        />

        {/* KPI Stats */}
        <DashboardStats summary={summary} loading={loading} />

        {/* Timeline Chart */}
        <DashboardTimelineChart timeseries={timeseries} loading={loading} />

        {/* Breakdowns */}
        <DashboardBreakdowns breakdown={breakdown} loading={loading} />

        {/* Approvals Inbox (if any pending) */}
        <DashboardApprovalsSection
          approvals={approvals}
          loading={loading}
          onReview={handleReviewApproval}
        />

        {/* Activity Feed */}
        <DashboardActivityFeed
          events={events}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMoreEvents}
          onLoadMore={handleLoadMore}
          decisionFilter={decisionFilter}
          onDecisionFilterChange={setDecisionFilter}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSelectEvent={(ev) => setSelectedEvent(ev)}
          onOpenKeysModal={() => setKeysModalOpen(true)}
        />

        {/* Keys Management */}
        <DashboardKeysSection
          keys={keys}
          loading={loading}
          onOpenKeysModal={() => setKeysModalOpen(true)}
        />
      </div>

      {/* Detail Drawer */}
      <DashboardEventDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Developer Keys Modal */}
      {user && keysModalOpen && (
        <Suspense fallback={null}>
          <DeveloperKeysModal
            isOpen={keysModalOpen}
            onClose={() => {
              setKeysModalOpen(false);
              fetchDashboardData(true);
            }}
            userEmail={user.email || ''}
            onUpgradeClick={() => {}}
          />
        </Suspense>
      )}
    </div>
  );
};

export default DashboardPage;
