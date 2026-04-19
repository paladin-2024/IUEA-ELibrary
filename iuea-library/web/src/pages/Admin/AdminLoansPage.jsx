import { useState }                                    from 'react';
import { useQuery, useMutation, useQueryClient }       from '@tanstack/react-query';
import api   from '../../services/api';
import toast from 'react-hot-toast';

const fetchLoans = (params) => api.get('/borrowing',       { params }).then(r => r.data);
const fetchStats = ()       => api.get('/borrowing/stats').then(r => r.data.stats);
const patchLoan  = ({ id, ...body }) => api.patch(`/borrowing/${id}`, body).then(r => r.data);

const STATUS_META = {
  pending:  { label: 'Pending',  bg: '#FEF3C7', color: '#92400E' },
  approved: { label: 'Approved', bg: '#D1FAE5', color: '#065F46' },
  active:   { label: 'Active',   bg: '#DBEAFE', color: '#1E40AF' },
  overdue:  { label: 'Overdue',  bg: '#FEE2E2', color: '#991B1B' },
  returned: { label: 'Returned', bg: '#F3F4F6', color: '#374151' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#991B1B' },
};

function ApproveModal({ loan, onClose, onSave }) {
  const [form, setForm] = useState({ shelfLocation: '', loanDays: 14, adminNotes: '' });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const inp = { width: '100%', border: '1px solid #EBD2CF', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 420 }}>
        <h3 style={{ margin: '0 0 1rem', fontFamily: 'Playfair Display,serif', color: '#8A1228' }}>Approve — {loan.bookTitle}</h3>
        <p style={{ margin: '0 0 1rem', color: '#6B7280', fontSize: '0.875rem' }}>Student: <strong>{loan.userId?.name}</strong> ({loan.userId?.email})</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.813rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Shelf Location</label>
            <input style={inp} placeholder="e.g. Floor 2, Section B, Row 4" value={form.shelfLocation} onChange={f('shelfLocation')} />
          </div>
          <div>
            <label style={{ fontSize: '0.813rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loan Duration (days)</label>
            <input style={inp} type="number" min={1} max={60} value={form.loanDays} onChange={f('loanDays')} />
          </div>
          <div>
            <label style={{ fontSize: '0.813rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Note to Student (optional)</label>
            <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} placeholder="Pick up instructions, conditions..." value={form.adminNotes} onChange={f('adminNotes')} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave({ status: 'approved', ...form })} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: '#065F46', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Approve & Notify
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ loan, onClose, onSave }) {
  const [reason, setReason] = useState('');
  const inp = { width: '100%', border: '1px solid #EBD2CF', borderRadius: 6, padding: '0.5rem 0.75rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', minHeight: 80, resize: 'vertical' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 380 }}>
        <h3 style={{ margin: '0 0 0.75rem', color: '#991B1B' }}>Reject Request</h3>
        <p style={{ margin: '0 0 1rem', color: '#6B7280', fontSize: '0.875rem' }}>{loan.bookTitle} — {loan.userId?.name}</p>
        <textarea style={inp} placeholder="Reason (optional, sent to student)" value={reason} onChange={e => setReason(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave({ status: 'rejected', adminNotes: reason })} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: '#991B1B', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Reject & Notify
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoansPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);

  const { data: statsData } = useQuery({ queryKey: ['loan-stats'], queryFn: fetchStats, staleTime: 30_000 });
  const { data, isLoading } = useQuery({
    queryKey: ['admin-loans', statusFilter, page],
    queryFn:  () => fetchLoans({ status: statusFilter || undefined, page, limit: 15 }),
    staleTime: 15_000,
  });

  const { mutate: patch, isPending } = useMutation({
    mutationFn: patchLoan,
    onSuccess: () => {
      toast.success('Loan updated.');
      qc.invalidateQueries(['admin-loans']);
      qc.invalidateQueries(['loan-stats']);
      setApproveTarget(null);
      setRejectTarget(null);
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Update failed.'),
  });

  const loans   = data?.loans  ?? [];
  const pages   = data?.pages  ?? 1;
  const total   = data?.total  ?? 0;
  const stats   = statsData    ?? {};

  const FILTERS = ['', 'pending', 'approved', 'active', 'overdue', 'returned', 'rejected'];
  const statCard = (label, val, color) => (
    <div key={label} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 10, padding: '0.875rem 1.25rem', minWidth: 100 }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{val ?? 0}</div>
      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {approveTarget && <ApproveModal loan={approveTarget} onClose={() => setApproveTarget(null)} onSave={(body) => patch({ id: approveTarget._id, ...body })} />}
      {rejectTarget  && <RejectModal  loan={rejectTarget}  onClose={() => setRejectTarget(null)}  onSave={(body) => patch({ id: rejectTarget._id,  ...body })} />}

      <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.75rem', fontWeight: 700, color: '#1A1A1A', margin: '0 0 1.25rem' }}>
        Loan Management
      </h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {statCard('Pending',  stats.pending,  '#92400E')}
        {statCard('Active',   stats.active,   '#1E40AF')}
        {statCard('Overdue',  stats.overdue,  '#991B1B')}
        {statCard('Returned', stats.returned, '#374151')}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {FILTERS.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{ padding: '0.35rem 0.875rem', borderRadius: 999, fontSize: '0.813rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: statusFilter === s ? '#8A1228' : '#F3F4F6', color: statusFilter === s ? '#fff' : '#374151' }}>
            {s ? (STATUS_META[s]?.label ?? s) : 'All'} {s === '' ? `(${total})` : ''}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>Loading…</div>
      ) : loans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>No loans found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loans.map(loan => {
            const meta = STATUS_META[loan.status] ?? STATUS_META.pending;
            const due  = loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : null;

            return (
              <div key={loan._id} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Book cover */}
                <div style={{ width: 44, height: 60, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: '#FCE8E6' }}>
                  {loan.bookCoverUrl
                    ? <img src={loan.bookCoverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📖</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1A1A1A' }}>{loan.bookTitle}</span>
                    <span style={{ padding: '0.1rem 0.5rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: meta.bg, color: meta.color }}>{meta.label}</span>
                    {loan.renewalRequested && (
                      <span style={{ padding: '0.1rem 0.5rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: '#EDE9FE', color: '#5B21B6' }}>Renewal Req.</span>
                    )}
                  </div>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.813rem', color: '#6B7280' }}>
                    {loan.userId?.name} · {loan.userId?.email} · {loan.userId?.faculty ?? 'N/A'}
                  </p>
                  {due && <p style={{ margin: 0, fontSize: '0.75rem', color: '#374151' }}>Due: {due}</p>}
                  {loan.shelfLocation && <p style={{ margin: 0, fontSize: '0.75rem', color: '#065F46' }}>📍 {loan.shelfLocation}</p>}
                </div>

                {/* Date */}
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', flexShrink: 0 }}>
                  {new Date(loan.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  {loan.status === 'pending' && (
                    <>
                      <button onClick={() => setApproveTarget(loan)} style={{ padding: '0.35rem 0.875rem', borderRadius: 6, border: 'none', background: '#D1FAE5', color: '#065F46', fontWeight: 700, cursor: 'pointer', fontSize: '0.813rem' }}>Approve</button>
                      <button onClick={() => setRejectTarget(loan)}  style={{ padding: '0.35rem 0.875rem', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#991B1B', fontWeight: 700, cursor: 'pointer', fontSize: '0.813rem' }}>Reject</button>
                    </>
                  )}
                  {['approved', 'active', 'overdue'].includes(loan.status) && (
                    <button
                      disabled={isPending}
                      onClick={() => patch({ id: loan._id, status: 'returned' })}
                      style={{ padding: '0.35rem 0.875rem', borderRadius: 6, border: 'none', background: '#DBEAFE', color: '#1E40AF', fontWeight: 700, cursor: 'pointer', fontSize: '0.813rem' }}
                    >
                      Mark Returned
                    </button>
                  )}
                  {loan.renewalRequested && ['active','overdue'].includes(loan.status) && (
                    <button
                      disabled={isPending}
                      onClick={() => patch({ id: loan._id, status: 'returned' })}
                      style={{ padding: '0.35rem 0.875rem', borderRadius: 6, border: 'none', background: '#EDE9FE', color: '#5B21B6', fontWeight: 700, cursor: 'pointer', fontSize: '0.813rem' }}
                    >
                      Approve Renewal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button disabled={page === 1}     onClick={() => setPage(p => p - 1)} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>← Prev</button>
          <span style={{ padding: '0.5rem 1rem', color: '#6B7280' }}>Page {page} / {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>Next →</button>
        </div>
      )}
    </div>
  );
}
