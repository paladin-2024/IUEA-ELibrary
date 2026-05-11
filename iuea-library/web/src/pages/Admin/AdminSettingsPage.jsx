import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: '0.75rem', border: '1px solid #E9EAEC', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
        <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#111', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#6B7280' }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'monospace' : 'Inter, sans-serif',
        fontSize: '0.875rem', fontWeight: 500, color: '#111',
        background: mono ? '#F3F4F6' : 'transparent',
        padding: mono ? '2px 8px' : 0,
        borderRadius: mono ? 4 : 0,
      }}>{value ?? '—'}</span>
    </div>
  );
}

function Badge({ ok, yes, no }) {
  const isOk = ok === true;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: isOk ? '#DCFCE7' : '#FEE2E2',
      color: isOk ? '#15803D' : '#B91C1C',
      fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600,
      padding: '2px 10px', borderRadius: 999,
    }}>
      <span style={{ fontSize: '0.6rem' }}>{isOk ? '●' : '●'}</span>
      {isOk ? yes : no}
    </span>
  );
}

export default function AdminSettingsPage() {
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    staleTime: 60_000,
  });

  const stats = statsData?.stats ?? {};

  return (
    <div style={{ padding: '1.75rem', maxWidth: 860, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>

      <div>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1A1A1A', margin: '0 0 0.25rem' }}>
          Settings
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
          System configuration and library information
        </p>
      </div>

      <Section title="Library Information">
        <Row label="Institution" value="International University of East Africa (IUEA)" />
        <Row label="Location" value="Kampala, Uganda" />
        <Row label="Platform" value="IUEA Digital Library" />
        <Row label="Admin Panel Version" value="2.0" mono />
      </Section>

      <Section title="Content Summary">
        <Row label="Total Books" value={stats.books?.toLocaleString() ?? '…'} />
        <Row label="Registered Users" value={stats.users?.toLocaleString() ?? '…'} />
        <Row label="Active Loans" value={stats.activeLoans?.toLocaleString() ?? '…'} />
        <Row label="Podcast Shows" value={stats.podcasts?.toLocaleString() ?? '…'} />
      </Section>

      <Section title="AI Assistant">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#6B7280' }}>Gemini AI (chatbot &amp; translation)</span>
          <Badge ok={true} yes="Configured" no="Not configured" />
        </div>
        <Row label="Model" value="gemini-flash-latest" mono />
        <div style={{ padding: '0.75rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.5rem' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#92400E', margin: 0 }}>
            To change the AI key, update <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '1px 4px', borderRadius: 3 }}>GEMINI_API_KEY</code> in the server <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '1px 4px', borderRadius: 3 }}>.env</code> file and restart the server.
          </p>
        </div>
      </Section>

      <Section title="Mobile App">
        <Row label="Platform" value="Flutter (Android &amp; iOS)" />
        <Row label="Features" value="Reader, TTS, AI Chatbot, Podcasts, Loans" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#6B7280' }}>Text-to-Speech (flutter_tts)</span>
          <Badge ok={true} yes="Enabled" no="Disabled" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#6B7280' }}>Book translation via Gemini</span>
          <Badge ok={true} yes="Enabled" no="Disabled" />
        </div>
      </Section>

      <Section title="API Server">
        <Row label="Base URL" value={import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'} mono />
        <Row label="Database" value="MongoDB via Prisma" mono />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#6B7280' }}>Server status</span>
          <Badge ok={!!statsData} yes="Online" no="Unreachable" />
        </div>
      </Section>
    </div>
  );
}
