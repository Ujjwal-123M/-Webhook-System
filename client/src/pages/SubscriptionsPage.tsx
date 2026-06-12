import { useState, useEffect } from 'react';
import { fetchSubscriptions, createSubscription, deleteSubscription } from '../api';
import { SubscriptionForm } from '../components';

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setSubscriptions(await fetchSubscriptions());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: { targetUrl: string; eventTypes: string[]; secret?: string }) => {
    await createSubscription(data);
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteSubscription(id);
    load();
  };

  return (
    <div>
      <h1>Subscriptions</h1>
      <SubscriptionForm onSubmit={handleCreate} />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Target URL</th>
            <th style={th}>Event Types</th>
            <th style={th}>Created At</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id}>
              <td style={td}>{sub.targetUrl}</td>
              <td style={td}>{Array.isArray(sub.eventTypes) ? sub.eventTypes.join(', ') : sub.eventTypes}</td>
              <td style={td}>{new Date(sub.createdAt).toLocaleString()}</td>
              <td style={td}>
                <button onClick={() => handleDelete(sub.id)} style={{ color: 'red' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && subscriptions.length === 0 && <p>No subscriptions yet.</p>}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd' };
const td: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #eee' };
