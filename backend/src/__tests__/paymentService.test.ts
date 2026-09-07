import { verifyPaymentSignature, computeDemoSignature } from '../services/paymentService';

describe('paymentService signature verification (demo mode — no Razorpay keys configured in test env)', () => {
  it('accepts a correctly computed demo signature', () => {
    const orderId = 'demo_order_abc123';
    const paymentId = 'pay_xyz789';
    const signature = computeDemoSignature(orderId, paymentId);
    expect(verifyPaymentSignature(orderId, paymentId, signature)).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const orderId = 'demo_order_abc123';
    const paymentId = 'pay_xyz789';
    expect(verifyPaymentSignature(orderId, paymentId, 'not-the-real-signature')).toBe(false);
  });

  it('rejects a signature computed for a different payment id (prevents replay across payments)', () => {
    const orderId = 'demo_order_abc123';
    const signature = computeDemoSignature(orderId, 'pay_original');
    expect(verifyPaymentSignature(orderId, 'pay_different', signature)).toBe(false);
  });

  it('rejects a signature computed for a different order id', () => {
    const signature = computeDemoSignature('demo_order_one', 'pay_xyz789');
    expect(verifyPaymentSignature('demo_order_two', 'pay_xyz789', signature)).toBe(false);
  });
});
