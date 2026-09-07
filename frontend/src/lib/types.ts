export type UserRole = 'TRAVELER' | 'REQUESTER' | 'BOTH' | 'ADMIN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type TransportType = 'TRAIN' | 'BUS' | 'FLIGHT' | 'CAR' | 'BIKE' | 'OTHER';
export type TripStatus = 'ACTIVE' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type RequestStatus = 'OPEN' | 'MATCHED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type DeliveryState =
  | 'REQUESTED' | 'MATCHED' | 'TRAVELER_ACCEPTED' | 'PAYMENT_PENDING' | 'PAYMENT_CONFIRMED'
  | 'PICKUP_PENDING' | 'ITEM_PICKED_UP' | 'IN_TRANSIT' | 'DELIVERY_PENDING' | 'DELIVERED'
  | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'EXPIRED';

export interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  role: UserRole;
  bio?: string;
  rating: number;
  totalRatings: number;
  completedTrips: number;
  completedDeliveries: number;
  verificationStatus: VerificationStatus;
  trustScore: number;
  createdAt: string;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface Trip {
  _id: string;
  travelerId: string | User;
  origin: string;
  destination: string;
  originLocation: GeoPoint;
  destinationLocation: GeoPoint;
  departureDateTime: string;
  estimatedArrival: string;
  capacityKg: number;
  availableCapacityKg: number;
  transportType: TransportType;
  description?: string;
  status: TripStatus;
  createdAt: string;
}

export interface DeliveryRequest {
  _id: string;
  requesterId: string | User;
  pickup: string;
  destination: string;
  pickupLocation: GeoPoint;
  destinationLocation: GeoPoint;
  itemName: string;
  description?: string;
  imageUrl?: string;
  weightKg: number;
  itemValue: number;
  reward: number;
  deliveryDeadline: string;
  status: RequestStatus;
  createdAt: string;
}

export interface MatchRecord {
  _id: string;
  tripId: string;
  requestId: string;
  matchScore: number;
  routeScore: number;
  dateScore: number;
  capacityScore: number;
  proximityScore: number;
  reputationScore: number;
  status: string;
}

export interface Delivery {
  _id: string;
  deliveryRequestId: string | DeliveryRequest;
  tripId: string | Trip;
  travelerId: string | User;
  requesterId: string | User;
  state: DeliveryState;
  stateHistory: { state: DeliveryState; at: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  message: string;
  messageType: 'TEXT' | 'SYSTEM' | 'OTP_EVENT';
  readAt?: string;
  createdAt: string;
}

export interface ConversationSummary {
  _id: string;
  participants: User[];
  deliveryRequestId: DeliveryRequest;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Transaction {
  _id: string;
  deliveryRequestId: string;
  amount: number;
  platformFee: number;
  travelerAmount: number;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'SETTLED' | 'REFUNDED';
  isDemo: boolean;
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
