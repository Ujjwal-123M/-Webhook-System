import { DeliveryWorker } from '../src/deliveries/worker/delivery.worker';

// Test the backoff calculation without spinning up the full app.
// We instantiate the worker with a null prisma (we only call calculateBackoff).
describe('DeliveryWorker', () => {
  let worker: DeliveryWorker;

  beforeAll(() => {
    worker = new DeliveryWorker(null as any);
  });

  describe('calculateBackoff', () => {
    it('should return ~30s for attempt 1', () => {
      const delay = worker.calculateBackoff(1);
      // BASE_DELAY_MS=30000, 30000 * 2^0 = 30000, plus jitter 0-5000
      expect(delay).toBeGreaterThanOrEqual(30_000);
      expect(delay).toBeLessThanOrEqual(35_000);
    });

    it('should return ~60s for attempt 2', () => {
      const delay = worker.calculateBackoff(2);
      // 30000 * 2^1 = 60000, plus jitter 0-5000
      expect(delay).toBeGreaterThanOrEqual(60_000);
      expect(delay).toBeLessThanOrEqual(65_000);
    });

    it('should return ~120s for attempt 3', () => {
      const delay = worker.calculateBackoff(3);
      // 30000 * 2^2 = 120000, plus jitter 0-5000
      expect(delay).toBeGreaterThanOrEqual(120_000);
      expect(delay).toBeLessThanOrEqual(125_000);
    });

    it('should grow exponentially for attempt 5', () => {
      const delay = worker.calculateBackoff(5);
      // 30000 * 2^4 = 480000, plus jitter
      expect(delay).toBeGreaterThanOrEqual(480_000);
      expect(delay).toBeLessThanOrEqual(485_000);
    });

    it('should include jitter (not always return exact base)', () => {
      // Run it 20 times — at least some should differ due to jitter
      const results = new Set<number>();
      for (let i = 0; i < 20; i++) {
        results.add(worker.calculateBackoff(1));
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
