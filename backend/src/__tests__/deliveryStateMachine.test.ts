import { assertTransition } from '../services/deliveryStateMachine';
import { DeliveryState } from '../utils/constants';

describe('deliveryStateMachine.assertTransition', () => {
  it('allows the full documented happy-path sequence', () => {
    const sequence: DeliveryState[] = [
      DeliveryState.REQUESTED,
      DeliveryState.MATCHED,
      DeliveryState.TRAVELER_ACCEPTED,
      DeliveryState.PAYMENT_PENDING,
      DeliveryState.PAYMENT_CONFIRMED,
      DeliveryState.PICKUP_PENDING,
      DeliveryState.ITEM_PICKED_UP,
      DeliveryState.IN_TRANSIT,
      DeliveryState.DELIVERY_PENDING,
      DeliveryState.DELIVERED,
      DeliveryState.COMPLETED,
    ];

    for (let i = 0; i < sequence.length - 1; i++) {
      expect(() => assertTransition(sequence[i], sequence[i + 1])).not.toThrow();
    }
  });

  it('rejects jumping straight from COMPLETED back to REQUESTED', () => {
    expect(() => assertTransition(DeliveryState.COMPLETED, DeliveryState.REQUESTED)).toThrow(/Cannot move delivery/);
  });

  it('rejects skipping states (e.g. TRAVELER_ACCEPTED straight to DELIVERED)', () => {
    expect(() => assertTransition(DeliveryState.TRAVELER_ACCEPTED, DeliveryState.DELIVERED)).toThrow();
  });

  it('rejects any transition out of a terminal COMPLETED state', () => {
    expect(() => assertTransition(DeliveryState.COMPLETED, DeliveryState.CANCELLED)).toThrow();
  });

  it('rejects any transition out of a terminal CANCELLED state', () => {
    expect(() => assertTransition(DeliveryState.CANCELLED, DeliveryState.MATCHED)).toThrow();
  });

  it('allows cancellation from early, in-flight states', () => {
    expect(() => assertTransition(DeliveryState.REQUESTED, DeliveryState.CANCELLED)).not.toThrow();
    expect(() => assertTransition(DeliveryState.PAYMENT_PENDING, DeliveryState.CANCELLED)).not.toThrow();
  });

  it('does not allow cancellation once picked up (must go through DISPUTED instead)', () => {
    expect(() => assertTransition(DeliveryState.ITEM_PICKED_UP, DeliveryState.CANCELLED)).toThrow();
    expect(() => assertTransition(DeliveryState.ITEM_PICKED_UP, DeliveryState.DISPUTED)).not.toThrow();
  });

  it('allows a dispute to resolve to either COMPLETED or CANCELLED', () => {
    expect(() => assertTransition(DeliveryState.DISPUTED, DeliveryState.COMPLETED)).not.toThrow();
    expect(() => assertTransition(DeliveryState.DISPUTED, DeliveryState.CANCELLED)).not.toThrow();
  });
});
