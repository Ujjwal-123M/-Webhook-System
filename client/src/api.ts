const API_BASE = 'http://localhost:3000';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function post(path: string, body: any) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Subscriptions
export const fetchSubscriptions = () => request('/subscriptions');
export const fetchSubscription = (id: string) => request(`/subscriptions/${id}`);
export const createSubscription = (data: { targetUrl: string; eventTypes: string[]; secret?: string }) =>
  post('/subscriptions', data);
export const deleteSubscription = (id: string) =>
  request(`/subscriptions/${id}`, { method: 'DELETE' });

// Events
export const fetchEvents = () => request('/events');
export const fetchEvent = (id: string) => request(`/events/${id}`);
export const ingestEvent = (data: { type: string; data: Record<string, any> }) =>
  post('/events/ingest', data);

// Deliveries
export const fetchDeliveries = () => request('/deliveries');
export const fetchDelivery = (id: string) => request(`/deliveries/${id}`);
export const fetchDeliveriesByEvent = (eventId: string) => request(`/deliveries/event/${eventId}`);
export const retryDelivery = (id: string) => post(`/deliveries/${id}/retry`, {});
