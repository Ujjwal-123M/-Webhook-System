import { useState } from 'react';
import { NavLink} from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  pending: '#e67e22',
  in_flight: '#3498db',
  delivered: '#27ae60',
  failed: '#e74c3c',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        backgroundColor: STATUS_COLORS[status] || '#95a5a6',
        color: '#fff',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.85em',
        fontWeight: 500,
      }}
    >
      {status}
    </span>
  );
}

export function Navbar() {
  const links = [
    { to: '/subscriptions', label: 'Subscriptions' },
    { to: '/events', label: 'Events' },
    { to: '/deliveries', label: 'Deliveries' },
  ];

  return (
    <nav style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem 2rem', background: '#2c3e50' }}>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          style={({ isActive }) => ({
            background: isActive ? '#3498db' : 'transparent',
            color: '#ecf0f1',
            border: 'none',
            padding: '0.4rem 1rem',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: isActive ? 600 : 400,
          })}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function SubscriptionForm({
  onSubmit,
}: {
  onSubmit: (data: { targetUrl: string; eventTypes: string[]; secret?: string }) => Promise<void>;
}) {
  const [targetUrl, setTargetUrl] = useState('');
  const [eventTypes, setEventTypes] = useState('');
  const [secret, setSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsed = eventTypes.split(',').map((s) => s.trim()).filter(Boolean);
      await onSubmit({ targetUrl, eventTypes: parsed, secret: secret || undefined });
      setTargetUrl('');
      setEventTypes('');
      setSecret('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <input
        placeholder="Target URL"
        value={targetUrl}
        onChange={(e) => setTargetUrl(e.target.value)}
        required
        style={{ flex: 2, minWidth: '200px', padding: '0.5rem' }}
      />
      <input
        placeholder="Event types (comma-separated)"
        value={eventTypes}
        onChange={(e) => setEventTypes(e.target.value)}
        required
        style={{ flex: 2, minWidth: '200px', padding: '0.5rem' }}
      />
      <input
        placeholder="Secret (optional)"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        style={{ flex: 1, minWidth: '120px', padding: '0.5rem' }}
      />
      <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
        {submitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}

export function EventIngestForm({
  onSubmit,
}: {
  onSubmit: (data: { type: string; data: Record<string, any> }) => Promise<void>;
}) {
  const [type, setType] = useState('');
  const [payload, setPayload] = useState('{}');
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setParseError('');
    let parsed: any;
    try {
      parsed = JSON.parse(payload);
    } catch {
      setParseError('Invalid JSON');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ type, data: parsed });
      setType('');
      setPayload('{}');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <input
        placeholder='Event type (e.g. order.created)'
        value={type}
        onChange={(e) => setType(e.target.value)}
        required
        style={{ flex: 1, minWidth: '180px', padding: '0.5rem' }}
      />
      <input
        placeholder='Payload JSON'
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        required
        style={{ flex: 2, minWidth: '200px', padding: '0.5rem' }}
      />
      <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
        {submitting ? 'Ingesting...' : 'Ingest Event'}
      </button>
      {parseError && <span style={{ color: 'red', width: '100%' }}>{parseError}</span>}
    </form>
  );
}
