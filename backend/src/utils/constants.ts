export enum UserRole {
  TRAVELER = 'TRAVELER',
  REQUESTER = 'REQUESTER',
  BOTH = 'BOTH',
  ADMIN = 'ADMIN',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum TripStatus {
  ACTIVE = 'ACTIVE',
  FULL = 'FULL',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum TransportType {
  TRAIN = 'TRAIN',
  BUS = 'BUS',
  FLIGHT = 'FLIGHT',
  CAR = 'CAR',
  BIKE = 'BIKE',
  OTHER = 'OTHER',
}

export enum RequestStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// Core delivery lifecycle state machine
export enum DeliveryState {
  REQUESTED = 'REQUESTED',
  MATCHED = 'MATCHED',
  TRAVELER_ACCEPTED = 'TRAVELER_ACCEPTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PICKUP_PENDING = 'PICKUP_PENDING',
  ITEM_PICKED_UP = 'ITEM_PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERY_PENDING = 'DELIVERY_PENDING',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
}

export const DELIVERY_TRANSITIONS: Record<DeliveryState, DeliveryState[]> = {
  [DeliveryState.REQUESTED]: [DeliveryState.MATCHED, DeliveryState.CANCELLED, DeliveryState.EXPIRED],
  [DeliveryState.MATCHED]: [DeliveryState.TRAVELER_ACCEPTED, DeliveryState.CANCELLED, DeliveryState.EXPIRED],
  [DeliveryState.TRAVELER_ACCEPTED]: [DeliveryState.PAYMENT_PENDING, DeliveryState.CANCELLED],
  [DeliveryState.PAYMENT_PENDING]: [DeliveryState.PAYMENT_CONFIRMED, DeliveryState.CANCELLED, DeliveryState.EXPIRED],
  [DeliveryState.PAYMENT_CONFIRMED]: [DeliveryState.PICKUP_PENDING, DeliveryState.CANCELLED, DeliveryState.DISPUTED],
  [DeliveryState.PICKUP_PENDING]: [DeliveryState.ITEM_PICKED_UP, DeliveryState.CANCELLED, DeliveryState.DISPUTED],
  [DeliveryState.ITEM_PICKED_UP]: [DeliveryState.IN_TRANSIT, DeliveryState.DISPUTED],
  [DeliveryState.IN_TRANSIT]: [DeliveryState.DELIVERY_PENDING, DeliveryState.DISPUTED],
  [DeliveryState.DELIVERY_PENDING]: [DeliveryState.DELIVERED, DeliveryState.DISPUTED],
  [DeliveryState.DELIVERED]: [DeliveryState.COMPLETED, DeliveryState.DISPUTED],
  [DeliveryState.COMPLETED]: [],
  [DeliveryState.CANCELLED]: [],
  [DeliveryState.DISPUTED]: [DeliveryState.COMPLETED, DeliveryState.CANCELLED],
  [DeliveryState.EXPIRED]: [],
};

export enum TransactionStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  SETTLED = 'SETTLED',
  REFUNDED = 'REFUNDED',
}

export enum OtpType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum MatchStatus {
  SUGGESTED = 'SUGGESTED',
  SELECTED = 'SELECTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// Prohibited item categories — enforced server-side, cannot be bypassed via description text.
export const PROHIBITED_KEYWORDS: string[] = [
  'weapon', 'gun', 'firearm', 'ammunition', 'ammo', 'explosive', 'bomb', 'grenade',
  'drug', 'narcotic', 'cocaine', 'heroin', 'meth', 'cannabis', 'marijuana', 'weed',
  'hazardous', 'toxic', 'radioactive', 'poison', 'acid', 'flammable',
  'stolen', 'counterfeit', 'fake currency', 'alcohol', 'liquor',
  'live animal', 'human organ', 'ivory', 'endangered',
];

export const PROHIBITED_CATEGORIES = [
  'Weapons & Ammunition',
  'Explosives & Flammables',
  'Illegal Drugs & Narcotics',
  'Hazardous / Toxic Substances',
  'Stolen or Counterfeit Goods',
  'Currency & Financial Instruments',
  'Live Animals & Human Remains',
  'Other Legally Restricted Items',
];
