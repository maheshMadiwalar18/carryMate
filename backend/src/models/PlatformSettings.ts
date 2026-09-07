import { Schema, model, Document } from 'mongoose';

export interface IPlatformSettings extends Document {
  key: string;
  platformFeePercent: number;
  prohibitedCategories: string[];
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, default: 'global', unique: true },
    platformFeePercent: { type: Number, default: 10, min: 0, max: 50 },
    prohibitedCategories: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const PlatformSettings = model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
