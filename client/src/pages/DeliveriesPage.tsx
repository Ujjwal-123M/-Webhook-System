import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDeliveries, retryDelivery } from '../api';
import { StatusBadge } from '../components';

export function DeliveriesPage() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setDeliveries(await fetchDeliveries());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRetry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await retryDelivery(id);
    load();
  };

  return (
    <div>
      <h1>Deliveries</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Event Type</th>
            <th style={th}>Target URL</th>
            <th style={th}>Status</th>
            <th style={th}>Attempts</th>
            <th style={th}>Created At</th>
            <th style={th}>Actions</th>
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
              <td style={td}>{d.event?.type}</td>
              <td style={td}>{d.subscription?.targetUrl}</td>
              <td style={td}><StatusBadge status={d.status} /></td>
              <td style={td}>{d.attempts}/{d.maxAttempts}</td>
              <td style={td}>{new Date(d.createdAt).toLocaleString()}</td>
              <td style={td}>
                {d.status === 'failed' && (
                  <button onClick={(e) => handleRetry(e, d.id)}>Retry</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && deliveries.length === 0 && <p>No deliveries yet.</p>}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd' };
const td: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #eee' };
