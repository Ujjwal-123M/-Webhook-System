import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEvent, fetchDeliveriesByEvent } from '../api';
import { StatusBadge } from '../components';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [ev, dels] = await Promise.all([
        fetchEvent(id!),
        fetchDeliveriesByEvent(id!),
      ]);
      setEvent(ev);
      setDeliveries(dels);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!event) return <p>Event not found.</p>;

  return (
    <div>
      <button onClick={() => navigate('/events')} style={{ marginBottom: '1rem' }}>← Back to Events</button>
      <h1>Event: {event.type}</h1>

      <div style={{ background: '#fff', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
        <p><strong>ID:</strong> {event.id}</p>
        <p><strong>Type:</strong> {event.type}</p>
        <p><strong>Received:</strong> {new Date(event.receivedAt).toLocaleString()}</p>
        <p><strong>Payload:</strong></p>
        <pre style={{ background: '#f5f5f5', padding: '0.5rem', overflow: 'auto' }}>
          {JSON.stringify(JSON.parse(event.payload), null, 2)}
        </pre>
      </div>

      <h2>Deliveries ({deliveries.length})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Subscription URL</th>
            <th style={th}>Status</th>
            <th style={th}>Attempts</th>
            <th style={th}>Last Attempt</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr
              key={d.id}
              onClick={() => navigate(`/deliveries/${d.id}`)}
              style={{ cursor: 'pointer' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#f0f0f0')}
              onMouseOut={(e) => (e.currentTarget.style.background = '')}
            >
              <td style={td}>{d.subscription?.targetUrl}</td>
              <td style={td}><StatusBadge status={d.status} /></td>
              <td style={td}>{d.attempts}/{d.maxAttempts}</td>
              <td style={td}>{d.lastAttemptAt ? new Date(d.lastAttemptAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd' };
const td: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #eee' };
