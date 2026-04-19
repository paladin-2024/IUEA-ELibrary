import { useState }                          from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate }                       from 'react-router-dom';
import api                                   from '../../services/api';
import toast                                 from 'react-hot-toast';

const fetchMyLoans = () => api.get('/borrowing/my').then(r => r.data.loans ?? []);
const cancelLoan  = (id) => api.delete(`/borrowing/${id}`).then(r => r.data);
const renewLoan   = (id) => api.post(`/borrowing/${id}/renew`).then(r => r.data);

const STATUS_META = {
  pending:  { label: 'Pending',    bg: '#FEF3C7', color: '#92400E' },
  approved: { label: 'Ready',      bg: '#D1FAE5', color: '#065F46' },
  active:   { label: 'Active',     bg: '#DBEAFE', color: '#1E40AF' },
  overdue:  { label: 'Overdue',    bg: '#FEE2E2', color: '#991B1B' },
  returned: { label: 'Returned',   bg: '#F3F4F6', color: '#374151' },
  rejected: { label: 'Rejected',   bg: '#FEE2E2', color: '#991B1B' },
};

function daysUntil(date) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function MyLoansPage() {
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['my-loans'],
    queryFn:  fetchMyLoans,
    staleTime: 30_000,
  });

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: cancelLoan,
    onSuccess: () => { toast.success('Request cancelled.'); qc.invalidateQueries(['my-loans']); },
    onError:   () => toast.error('Could not cancel request.'),
  });

  const { mutate: renew, isPending: renewing } = useMutation({
    mutationFn: renewLoan,
    onSuccess: () => { toast.success('Renewal requested — library will confirm.'); qc.invalidateQueries(['my-loans']); },
    onError:   (e) => toast.error(e?.response?.data?.message ?? 'Could not request renewal.'),
  });

  const filtered = filter === 'all' ? loans : loans.filter(l => l.status === filter);

  const tabs = [
    { key: 'all',      label: 'All' },
    { key: 'pending',  label: 'Pending' },
    { key: 'active',   label: 'Active' },
    { key: 'overdue',  label: 'Overdue' },
    { key: 'returned', label: 'Returned' },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1A1A1A', margin: '0 0 0.25rem' }}>
        My Loans
      </h1>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
        Physical books you've borrowed or requested from the library
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.813rem', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: filter === t.key ? '#8A1228' : '#F3F4F6',
              color:      filter === t.key ? '#fff'    : '#374151',
            }}
          >
            {t.label}
            {t.key !== 'all' && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>
                {loans.filter(l => l.status === t.key).length || ''}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 100, background: '#F3F4F6', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9CA3AF' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
          <p style={{ fontWeight: 600, color: '#6B7280' }}>No loans found</p>
          <p style={{ fontSize: '0.875rem' }}>Go to a book page and click "Borrow this book" to request a physical copy.</p>
          <button
            onClick={() => navigate('/home/search')}
            style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', background: '#8A1228', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Browse Books
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(loan => {
            const meta     = STATUS_META[loan.status] ?? STATUS_META.pending;
            const days     = daysUntil(loan.dueDate);
            const isActive = ['active', 'overdue'].includes(loan.status);

            return (
              <div key={loan._id} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Cover */}
                <div style={{ width: 56, height: 80, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: '#FCE8E6' }}>
                  {loan.bookCoverUrl
                    ? <img src={loan.bookCoverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📖</div>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.938rem', color: '#1A1A1A' }}>{loan.bookTitle}</span>
                    <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    {loan.renewalRequested && (
                      <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: '#EDE9FE', color: '#5B21B6' }}>
                        Renewal Requested
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.5rem', color: '#6B7280', fontSize: '0.813rem' }}>{loan.bookAuthor}</p>

                  {loan.status === 'approved' && loan.shelfLocation && (
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.813rem', color: '#065F46', fontWeight: 600 }}>
                      📍 Pickup: {loan.shelfLocation}
                    </p>
                  )}

                  {loan.dueDate && isActive && (
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.813rem', color: days !== null && days < 0 ? '#991B1B' : days !== null && days <= 3 ? '#B45309' : '#374151' }}>
                      {days !== null && days < 0
                        ? `⚠️ Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`
                        : days !== null && days === 0
                        ? '⚠️ Due today!'
                        : `Due in ${days} day${days !== 1 ? 's' : ''} — ${new Date(loan.dueDate).toLocaleDateString()}`
                      }
                    </p>
                  )}

                  {loan.adminNotes && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.813rem', color: '#6B7280', fontStyle: 'italic' }}>
                      "{loan.adminNotes}"
                    </p>
                  )}

                  {loan.status === 'returned' && loan.returnedAt && (
                    <p style={{ margin: 0, fontSize: '0.813rem', color: '#6B7280' }}>
                      Returned {new Date(loan.returnedAt).toLocaleDateString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {loan.status === 'pending' && (
                      <button
                        onClick={() => cancel(loan._id)}
                        disabled={cancelling}
                        style={{ padding: '0.35rem 0.875rem', fontSize: '0.813rem', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', cursor: 'pointer', fontWeight: 500 }}
                      >
                        Cancel Request
                      </button>
                    )}
                    {isActive && !loan.renewalRequested && loan.renewalCount < 2 && (
                      <button
                        onClick={() => renew(loan._id)}
                        disabled={renewing}
                        style={{ padding: '0.35rem 0.875rem', fontSize: '0.813rem', borderRadius: 6, border: '1px solid #8A1228', background: '#fff', color: '#8A1228', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Request Renewal
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/home/books/${loan.bookId}`)}
                      style={{ padding: '0.35rem 0.875rem', fontSize: '0.813rem', borderRadius: 6, border: 'none', background: '#FCE8E6', color: '#8A1228', cursor: 'pointer', fontWeight: 600 }}
                    >
                      View Book
                    </button>
                  </div>
                </div>

                {/* Requested date */}
                <div style={{ flexShrink: 0, textAlign: 'right', fontSize: '0.75rem', color: '#9CA3AF' }}>
                  {new Date(loan.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
