import { Schema, model, Document, Types } from 'mongoose';
import { MatchStatus } from '../utils/constants';

export interface IMatch extends Document {
  _id: Types.ObjectId;
  tripId: Types.ObjectId;
  requestId: Types.ObjectId;
  travelerId: Types.ObjectId;
  requesterId: Types.ObjectId;
  matchScore: number;
  routeScore: number;
  dateScore: number;
  capacityScore: number;
  proximityScore: number;
  reputationScore: number;
  status: MatchStatus;
  createdAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'DeliveryRequest', required: true, index: true },
    travelerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    routeScore: { type: Number, required: true },
    dateScore: { type: Number, required: true },
    capacityScore: { type: Number, required: true },
    proximityScore: { type: Number, required: true },
    reputationScore: { type: Number, required: true },
    status: { type: String, enum: Object.values(MatchStatus), default: MatchStatus.SUGGESTED, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

matchSchema.index({ tripId: 1, requestId: 1 }, { unique: true });

export const Match = model<IMatch>('Match', matchSchema);
