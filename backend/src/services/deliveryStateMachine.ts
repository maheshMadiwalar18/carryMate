import { DeliveryState, DELIVERY_TRANSITIONS } from '../utils/constants';
import { AppError } from '../utils/AppError';

/**
 * Validates and returns the target state for a delivery transition.
 * Throws an AppError (409/422) for any transition not explicitly allowed —
 * this is the single source of truth enforced server-side for every
 * delivery status change, regardless of what the client claims.
 */
export function assertTransition(current: DeliveryState, next: DeliveryState): void {
  const allowed = DELIVERY_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new AppError(
      `Cannot move delivery from ${current} to ${next}`,
      409,
      'INVALID_STATE_TRANSITION',
      { from: current, to: next, allowed }
    );
  }
}
