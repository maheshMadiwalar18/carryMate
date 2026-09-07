import { Schema, model, Document, Types } from 'mongoose';
import { RequestStatus } from '../utils/constants';

interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface IDeliveryRequest extends Document {
  _id: Types.ObjectId;
  requesterId: Types.ObjectId;
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
  deliveryDeadline: Date;
  status: RequestStatus;
  selectedTripId?: Types.ObjectId;
  selectedTravelerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const geoPointSchema = new Schema<GeoPoint>(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const deliveryRequestSchema = new Schema<IDeliveryRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pickup: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    pickupLocation: { type: geoPointSchema, required: true },
    destinationLocation: { type: geoPointSchema, required: true },
    itemName: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 500 },
    imageUrl: { type: String },
    weightKg: { type: Number, required: true, min: 0.01, max: 30 },
    itemValue: { type: Number, required: true, min: 0 },
    reward: { type: Number, required: true, min: 1 },
    deliveryDeadline: { type: Date, required: true },
    status: { type: String, enum: Object.values(RequestStatus), default: RequestStatus.OPEN, index: true },
    selectedTripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
    selectedTravelerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

deliveryRequestSchema.index({ pickupLocation: '2dsphere' });
deliveryRequestSchema.index({ destinationLocation: '2dsphere' });
deliveryRequestSchema.index({ status: 1, deliveryDeadline: 1 });

export const DeliveryRequest = model<IDeliveryRequest>('DeliveryRequest', deliveryRequestSchema);
