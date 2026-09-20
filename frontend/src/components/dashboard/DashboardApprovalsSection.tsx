import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { ApprovalItem } from '@/types/dashboard';

interface DashboardApprovalsSectionProps {
  approvals: ApprovalItem[];
  loading: boolean;
  onReview: (id: string, decision: 'APPROVED' | 'REJECTED', reason: string) => Promise<void>;
}

export const DashboardApprovalsSection: React.FC<DashboardApprovalsSectionProps> = ({
  approvals,
  loading,
  onReview,
}) => {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewReason, setReviewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenReview = (approval: ApprovalItem, decision: 'APPROVED' | 'REJECTED') => {
    setSelectedApproval(approval);
    setReviewDecision(decision);
    setReviewReason('');
  };

  const handleConfirmReview = async () => {
    if (!selectedApproval) return;
    setSubmitting(true);
    try {
      await onReview(selectedApproval.id, reviewDecision, reviewReason);
      setSelectedApproval(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'var(--card-bg, #141414)',
      border: '1px solid var(--border, #262626)',
      borderRadius: '10px',
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} style={{ color: '#f59e0b' }} />
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--heading, #ffffff)',
              margin: 0,
            }}>
              Approvals Inbox
            </h2>
            {approvals.length > 0 && (
              <span style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
              }}>
                {approvals.length} PENDING
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted, #9ca3af)' }}>
            High-risk operations and destructive commands staged for human-in-the-loop review
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ height: '60px', background: '#0f0f0f', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }} />
      ) : approvals.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted, #888888)', fontSize: '13px' }}>
          No pending approvals at this time. All high-risk actions are cleared.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {approvals.map((app) => (
            <div
              key={app.id}
              style={{
                background: '#0d0d0d',
                border: '1px solid var(--border, #262626)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    color: 'var(--heading, #ffffff)',
                    fontSize: '13px',
                  }}>
                    {app.tool_name}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--muted, #888888)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}>
                    req: {app.id.substring(0, 8)}...
                  </span>
                  {app.required_role && (
                    <span style={{
                      fontSize: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--body, #b4b4b4)',
                    }}>
                      Role: {app.required_role}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted, #9ca3af)' }}>
                  Submitted {new Date(app.created_at).toLocaleString()}
                </div>
              </div>

              {/* Review Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleOpenReview(app, 'APPROVED')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => handleOpenReview(app, 'REJECTED')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  <XCircle size={13} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal Dialog */}
      {selectedApproval && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSelectedApproval(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Review Request Confirmation"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#141414',
              border: '1px solid var(--border, #262626)',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--heading, #ffffff)',
              marginBottom: 8,
            }}>
              {reviewDecision === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--body, #b4b4b4)', marginBottom: 16 }}>
              You are about to mark request for <code style={{ color: 'var(--heading, #ffffff)' }}>{selectedApproval.tool_name}</code> as <strong>{reviewDecision}</strong>.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #9ca3af)', marginBottom: 6 }}>
                Reason / Audit Note:
              </label>
              <input
                type="text"
                placeholder="e.g. Authorized by security admin, safe parameters verified"
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d0d0d',
                  border: '1px solid var(--border, #262626)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: 'var(--heading, #ffffff)',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setSelectedApproval(null)}
                disabled={submitting}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border, #262626)',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '13px',
                  color: 'var(--muted, #9ca3af)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={submitting}
                style={{
                  background: reviewDecision === 'APPROVED' ? '#10b981' : '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                <span>Submit {reviewDecision}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardApprovalsSection;
