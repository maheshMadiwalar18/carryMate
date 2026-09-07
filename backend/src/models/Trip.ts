import { Schema, model, Document, Types } from 'mongoose';
import { TripStatus, TransportType } from '../utils/constants';

interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface ITrip extends Document {
  _id: Types.ObjectId;
  travelerId: Types.ObjectId;
  origin: string;
  destination: string;
  originLocation: GeoPoint;
  destinationLocation: GeoPoint;
  departureDateTime: Date;
  estimatedArrival: Date;
  capacityKg: number;
  availableCapacityKg: number;
  transportType: TransportType;
  description?: string;
  status: TripStatus;
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

const tripSchema = new Schema<ITrip>(
  {
    travelerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    originLocation: { type: geoPointSchema, required: true },
    destinationLocation: { type: geoPointSchema, required: true },
    departureDateTime: { type: Date, required: true, index: true },
    estimatedArrival: { type: Date, required: true },
    capacityKg: { type: Number, required: true, min: 0.1 },
    availableCapacityKg: { type: Number, required: true, min: 0 },
    transportType: { type: String, enum: Object.values(TransportType), required: true },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: Object.values(TripStatus), default: TripStatus.ACTIVE, index: true },
  },
  { timestamps: true }
);

tripSchema.index({ originLocation: '2dsphere' });
tripSchema.index({ destinationLocation: '2dsphere' });
tripSchema.index({ status: 1, departureDateTime: 1 });

export const Trip = model<ITrip>('Trip', tripSchema);
