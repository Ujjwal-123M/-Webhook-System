import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents, ingestEvent } from '../api';
import { EventIngestForm } from '../components';

export function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setEvents(await fetchEvents());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleIngest = async (data: { type: string; data: Record<string, any> }) => {
    await ingestEvent(data);
    load();
  };

  return (
    <div>
      <h1>Events</h1>
      <EventIngestForm onSubmit={handleIngest} />

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>Type</th>
            <th style={th}>Received At</th>
            <th style={th}>Deliveries</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr
              key={ev.id}
              onClick={() => navigate(`/events/${ev.id}`)}
              style={{ cursor: 'pointer' }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#f0f0f0')}
              onMouseOut={(e) => (e.currentTarget.style.background = '')}
            >
              <td style={td}>{ev.type}</td>
              <td style={td}>{new Date(ev.receivedAt).toLocaleString()}</td>
              <td style={td}>{ev.deliveries?.length ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && events.length === 0 && <p>No events yet.</p>}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd' };
const td: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #eee' };
