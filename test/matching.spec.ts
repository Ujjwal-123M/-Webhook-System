// Tests the pattern matching logic from SubscriptionsService.findMatching()
// Extracted here as a pure function to test without database/DI.
function matchesPattern(patterns: string[], eventType: string): boolean {
  return patterns.some((pattern) => {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return eventType.startsWith(prefix);
    }
    return false;
  });
}

describe('Event Pattern Matching', () => {
  it('should match exact event type', () => {
    expect(matchesPattern(['order.created'], 'order.created')).toBe(true);
  });

  it('should not match different event type', () => {
    expect(matchesPattern(['order.created'], 'order.updated')).toBe(false);
  });

  it('should match wildcard "order.*" against "order.created"', () => {
    expect(matchesPattern(['order.*'], 'order.created')).toBe(true);
  });

  it('should match wildcard "order.*" against "order.updated"', () => {
    expect(matchesPattern(['order.*'], 'order.updated')).toBe(true);
  });

  it('should not match "order.*" against "user.created"', () => {
    expect(matchesPattern(['order.*'], 'user.created')).toBe(false);
  });

  it('should match global wildcard "*" against anything', () => {
    expect(matchesPattern(['*'], 'order.created')).toBe(true);
    expect(matchesPattern(['*'], 'user.deleted')).toBe(true);
    expect(matchesPattern(['*'], 'anything.at.all')).toBe(true);
  });

  it('should match if any pattern in the array matches', () => {
    expect(matchesPattern(['user.created', 'order.*'], 'order.updated')).toBe(true);
  });

  it('should not match if no patterns match', () => {
    expect(matchesPattern(['user.created', 'order.created'], 'payment.failed')).toBe(false);
  });

  it('should handle empty patterns array', () => {
    expect(matchesPattern([], 'order.created')).toBe(false);
  });
});
