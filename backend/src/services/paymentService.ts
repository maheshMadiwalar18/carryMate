import crypto from 'crypto';
import { env, isDemoPayments } from '../config/env';
import { AppError } from '../utils/AppError';

let razorpayClient: any = null;
function getRazorpay() {
  if (isDemoPayments) return null;
  if (razorpayClient) return razorpayClient;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Razorpay = require('razorpay');
  razorpayClient = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return razorpayClient;
}

export interface OrderResult {
  orderId: string;
  amount: number; // in paise
  currency: string;
  isDemo: boolean;
  keyId?: string; // returned so the frontend Razorpay Checkout widget can open
}

/**
 * Creates a payment order for the delivery reward + platform fee.
 * - Real mode: creates an actual Razorpay order via the Orders API.
 * - Demo mode (no Razorpay keys configured): creates a locally-generated
 *   pseudo-order so the full flow (order -> "payment" -> verification) can
 *   still be exercised end-to-end without live credentials. This is clearly
 *   flagged via `isDemo: true` and is never presented as real money movement.
 */
export async function createOrder(amountInRupees: number, receipt: string): Promise<OrderResult> {
  const amountPaise = Math.round(amountInRupees * 100);
  const client = getRazorpay();

  if (!client) {
    return {
      orderId: `demo_order_${crypto.randomBytes(8).toString('hex')}`,
      amount: amountPaise,
      currency: 'INR',
      isDemo: true,
    };
  }

  const order = await client.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    payment_capture: 1,
  });

  return { orderId: order.id, amount: order.amount, currency: order.currency, isDemo: false, keyId: env.RAZORPAY_KEY_ID };
}

/**
 * Verifies a Razorpay payment signature (HMAC-SHA256 of orderId|paymentId
 * using the account's key secret), per Razorpay's documented verification
 * scheme. In demo mode, verification is simulated deterministically so the
 * pickup/delivery/rating flow downstream can still be demonstrated, and the
 * transaction is recorded with isDemo=true rather than pretending real
 * settlement occurred.
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (isDemoPayments || orderId.startsWith('demo_order_')) {
    // Demo signature convention: signature must equal `${orderId}.${paymentId}` reversed-hash placeholder.
    const expected = crypto.createHash('sha256').update(`${orderId}|${paymentId}|demo`).digest('hex');
    return signature === expected;
  }

  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

export function computeDemoSignature(orderId: string, paymentId: string): string {
  return crypto.createHash('sha256').update(`${orderId}|${paymentId}|demo`).digest('hex');
}

export function assertPaymentsAvailable() {
  // Payments always "work" (real or demo) — this hook exists for future
  // provider-down handling / feature flags.
  return true;
}
