import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDelivery, retryDelivery } from '../api';
import { StatusBadge } from '../components';

export function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setDelivery(await fetchDelivery(id!));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleRetry = async () => {
    await retryDelivery(id!);
    load();
  };

  if (loading) return <p>Loading...</p>;
  if (!delivery) return <p>Delivery not found.</p>;

  return (
    <div>
      <button onClick={() => navigate('/deliveries')} style={{ marginBottom: '1rem' }}>← Back to Deliveries</button>
      <h1>Delivery Detail</h1>

      <div style={{ background: '#fff', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
        <p><strong>Status:</strong> <StatusBadge status={delivery.status} /></p>
        <p><strong>Attempts:</strong> {delivery.attempts}/{delivery.maxAttempts}</p>
        <p><strong>Event:</strong> {delivery.event?.type}</p>
        <p><strong>Subscription:</strong> {delivery.subscription?.targetUrl}</p>
        <p><strong>Next Retry:</strong> {delivery.nextRetryAt ? new Date(delivery.nextRetryAt).toLocaleString() : '—'}</p>
        <p><strong>Last Error:</strong> {delivery.lastError || '—'}</p>

        {delivery.status === 'failed' && (
          <button onClick={handleRetry} style={{ marginTop: '0.5rem' }}>
            Retry Delivery
          </button>
        )}
      </div>

      <h2>Attempt Logs</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Status Code</th>
            <th style={th}>Error</th>
            <th style={th}>Duration (ms)</th>
            <th style={th}>Attempted At</th>
          </tr>
        </thead>
        <tbody>
          {(delivery.attemptLogs || []).map((log: any) => (
            <tr key={log.id}>
              <td style={td}>{log.attemptNum}</td>
              <td style={td}>{log.statusCode ?? '—'}</td>
              <td style={td}>{log.error || '—'}</td>
              <td style={td}>{log.durationMs}</td>
              <td style={td}>{new Date(log.attemptedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(delivery.attemptLogs || []).length === 0 && <p>No attempts recorded yet.</p>}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd' };
const td: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #eee' };
