# Webhook Delivery Service

Single-process webhook delivery service. Accepts events, matches them to subscriptions, delivers to subscriber URLs with retries, and persists everything in SQLite.

## Setup

```bash
# Backend
npm install
npx prisma db push
npm run start:dev          # http://localhost:3000

# Frontend (separate terminal)
cd client
npm install
npm run dev                # http://localhost:5173
```

## Run Tests

```bash
npm test
```

Tests cover pattern matching, exponential backoff calculation, and HMAC-SHA256 payload signing.

## How It Works

1. **Subscribe** — Register a target URL with event type filters (`order.created`, `order.*`, or `*`) and an optional HMAC secret.
2. **Ingest** — POST an event. The service fans it out by creating a delivery record for each matching subscription.
3. **Deliver** — A background worker picks up pending deliveries, sends HTTP POST requests to target URLs, and records each attempt.
4. **Retry** — Failed deliveries are retried with exponential backoff + random jitter (up to 5 attempts). Failed deliveries can also be retried manually from the dashboard.
5. **Crash Recovery** — On startup, any in-flight deliveries are reset to pending so nothing is lost across restarts.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/subscriptions` | Create a subscription |
| GET | `/subscriptions` | List all subscriptions |
| DELETE | `/subscriptions/:id` | Delete a subscription |
| POST | `/events/ingest` | Ingest an event |
| GET | `/events` | List all events |
| GET | `/events/:id` | Get event with its deliveries |
| GET | `/deliveries` | List all deliveries |
| GET | `/deliveries/:id` | Get delivery with attempt logs |
| POST | `/deliveries/:id/retry` | Manually retry a failed delivery |

## What's Not Included

- No authentication on API or dashboard routes.
- No real-time UI updates (manual page refresh needed).
- Worker uses SQLite polling — works for single process, won't scale to distributed.
