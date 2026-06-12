# AI Log

## 1. Database Selection
**Asked:** Which database for a single-process webhook service  SQLite or PostgreSQL?
**AI suggested:** SQLite with Prisma, since the assignment allows it and there's no need for a separate database process.
**Kept.** Read through the tradeoffs myself  SQLite's single-writer lock is fine for this scope. No reason to add PostgreSQL infrastructure complexity.

## 2. Retry Policy
**Asked:** What retry strategy to use for failed webhook deliveries?
**AI suggested:** Exponential backoff: `base × 2^(attempt-1)`.
**Modified.** Added random jitter (0–5s) on top of the exponential delay. AI's original suggestion didn't account for retry storms  if a subscriber goes down and 500 deliveries fail at the same time, pure exponential backoff retries them all at the exact same intervals. Jitter was trivial to implement and solves this.

## 3. Worker Model
**Asked:** How to process deliveries in the background  setInterval polling, event-driven, or a job queue?
**AI suggested:** Three options: setInterval polling loop, Node EventEmitter, or BullMQ with Redis.
**Kept setInterval, rejected BullMQ and EventEmitter.** BullMQ requires Redis  unnecessary infrastructure for a single-process app. EventEmitter is harder to reason about for crash recovery. setInterval with database-as-queue is simple and the delivery state is already in SQLite.

## 4. Dashboard Routing
**Asked:** How to handle page navigation in the React dashboard.
**AI suggested:** State-based routing with `useState` and a `switch/case` in App.tsx.
**Rejected.** The code was messy  `selectedEventId`, `selectedDeliveryId` state variables, callback props drilled through every page. Replaced with React Router. Each page reads its own params via `useParams()` and navigates via `useNavigate()`. Cleaner, more maintainable, and standard practice.

## 5. Payload Signing
**Asked:** How to sign webhook payloads so subscribers can verify authenticity.
**AI suggested:** HMAC-SHA256 or JWT-based signing.
**Kept HMAC-SHA256, rejected JWT.** JWT adds unnecessary complexity  we're signing a payload, not creating a session token. HMAC-SHA256 is what GitHub, Stripe, and Shopify use. Subscribers likely already know how to verify it.

## 6. Circular Dependency Design
**Asked:** AI's boilerplate had a comment suggesting `forwardRef()` to inject DeliveryWorker into DeliveriesService.
**Rejected.** Questioned whether the circular dependency actually existed. Traced the dependency graph myself  all dependencies are one-way (Events → Subscriptions/Deliveries → Prisma). The `retry()` method just resets status to `pending` in the DB; the worker's polling loop picks it up automatically. No need to inject the worker. Removed the comment.

## 7. Schema Design responseBody Field
**Asked:** AI's initial schema included a `responseBody` field on AttemptLog to store the full HTTP response from subscribers.
**Rejected.** Subscriber responses can be arbitrarily large and we don't need them. Kept `statusCode` and `error` which are enough to debug delivery failures. Saves storage and keeps the attempt log clean.

