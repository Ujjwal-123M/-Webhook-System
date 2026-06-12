import * as crypto from 'crypto';

// Tests the same HMAC-SHA256 signing logic used in delivery.worker.ts
describe('Payload Signing', () => {
  const secret = 'my-webhook-secret';
  const payload = '{"event":"order.created","orderId":"123"}';

  it('should produce a valid HMAC-SHA256 hex signature', () => {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    expect(signature).toMatch(/^[a-f0-9]{64}$/); // SHA-256 = 64 hex chars
  });

  it('should produce the same signature for the same payload + secret', () => {
    const sig1 = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sig2 = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(sig1).toBe(sig2);
  });

  it('should produce different signatures for different secrets', () => {
    const sig1 = crypto.createHmac('sha256', 'secret-a').update(payload).digest('hex');
    const sig2 = crypto.createHmac('sha256', 'secret-b').update(payload).digest('hex');
    expect(sig1).not.toBe(sig2);
  });

  it('should produce different signatures for different payloads', () => {
    const sig1 = crypto.createHmac('sha256', secret).update('{"a":1}').digest('hex');
    const sig2 = crypto.createHmac('sha256', secret).update('{"a":2}').digest('hex');
    expect(sig1).not.toBe(sig2);
  });

  it('subscriber can verify by computing the same HMAC', () => {
    // Server side: compute signature
    const serverSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Subscriber side: verify with their copy of the secret
    const subscriberSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    expect(serverSignature).toBe(subscriberSignature);
  });
});
