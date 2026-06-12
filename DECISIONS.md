# Decisions

## Storage
**Chose:**
SQLite via Prisma ORM. File-based, zero infrastructure, data survives restarts. The `eventTypes` field is stored as a JSON string because SQLite has no native array type.

**Alternatives:**
PostgreSQL with native JSONB and array types would allow filtering directly in SQL.

**Tradeoffs:**
SQLite has a single-writer lock, so concurrent writes queue up. Acceptable here since we're single-process. At a few hundred events/sec, I'd migrate to PostgreSQL.


## Worker Model
**Chose:**
A setInterval polling loop that queries for pending deliveries every 5 seconds and processes them with `Promise.allSettled`. After event fan-out, `processNow()` triggers an immediate tick so new deliveries don't wait. On startup, all `in_flight` deliveries are reset to `pending` this is crash recovery and gives us at-least-once delivery semantics.

**Alternatives:**
BullMQ with Redis a purpose-built job queue with built-in delayed retries and concurrency control.

**Tradeoffs:**
Polling burns one DB query every 5 seconds even when idle, which is negligible at this scale. Rejected BullMQ because it requires Redis infrastructure.


## Retry Policy
**Chose:**
Exponential backoff with jitter. Formula: `30s × 2^(attempt-1) + random(0–5s)`. Max 5 attempts per delivery. After exhausting all attempts, the delivery is marked `failed` and can be manually retried from the dashboard.

Status code rules: 2xx → delivered. 408/429/5xx/network error → temporary, retry. Other 4xx → permanent, mark failed.

**Alternatives:**
Fixed delay (retry every 30s) or linear backoff (30s, 60s, 90s).

**Tradeoffs:**
Fixed and linear backoff create predictable retry patterns that can overwhelm a recovering subscriber.


## Payload Signing
**Chose:**
HMAC-SHA256 when a subscription has a secret. The signature is sent in the `X-Webhook-Signature: sha256=<hex>` header. The secret itself never leaves the server the subscriber verifies by computing the same HMAC on their end.

**Alternatives:**
No signing, or RSA asymmetric signing.

**Tradeoffs:**
HMAC-SHA256 is what GitHub, Stripe, and Shopify use subscribers are likely already familiar with verifying it. Secrets are not encrypted at rest in the database; for production I'd add server-side encryption.


## Dashboard
**Chose:**
React with Vite and React Router. Five views: subscriptions, events, event detail with delivery breakdown, deliveries list with retry button for failed ones, and delivery detail with full attempt log history.

**Alternatives:**
Server-rendered HTML with EJS or Handlebars, or a heavier framework like Next.js.

**Tradeoffs:**
Kept it minimal plain tables, no CSS framework. With more time I'd add auto-refresh so you can watch retry progress in real time.
