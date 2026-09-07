import { Schema, model, Document, Types } from 'mongoose';
import { DeliveryState } from '../utils/constants';

export interface IDeliveryStateHistoryEntry {
  state: DeliveryState;
  at: Date;
  note?: string;
}

export interface IDelivery extends Document {
  _id: Types.ObjectId;
  deliveryRequestId: Types.ObjectId;
  tripId: Types.ObjectId;
  matchId: Types.ObjectId;
  travelerId: Types.ObjectId;
  requesterId: Types.ObjectId;
  state: DeliveryState;
  stateHistory: IDeliveryStateHistoryEntry[];
  pickupVerifiedAt?: Date;
  deliveryVerifiedAt?: Date;
  requesterConfirmedAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const historyEntrySchema = new Schema<IDeliveryStateHistoryEntry>(
  {
    state: { type: String, enum: Object.values(DeliveryState), required: true },
    at: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const deliverySchema = new Schema<IDelivery>(
  {
    deliveryRequestId: { type: Schema.Types.ObjectId, ref: 'DeliveryRequest', required: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    travelerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    state: { type: String, enum: Object.values(DeliveryState), default: DeliveryState.REQUESTED, index: true },
    stateHistory: { type: [historyEntrySchema], default: [] },
    pickupVerifiedAt: { type: Date },
    deliveryVerifiedAt: { type: Date },
    requesterConfirmedAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

export const Delivery = model<IDelivery>('Delivery', deliverySchema);
