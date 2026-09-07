import dotenv from 'dotenv';
dotenv.config();

function bool(v: string | undefined, fallback = false): boolean {
  if (v === undefined) return fallback;
  return v.toLowerCase() === 'true' || v === '1';
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  // Database
  MONGODB_URI: process.env.MONGODB_URI || '',
  USE_IN_MEMORY_DB: bool(process.env.USE_IN_MEMORY_DB, !process.env.MONGODB_URI),

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  get FIREBASE_CONFIGURED() {
    return Boolean(this.FIREBASE_PROJECT_ID && this.FIREBASE_CLIENT_EMAIL && this.FIREBASE_PRIVATE_KEY);
  },

  // Storage
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',

  // Maps
  MAPS_PROVIDER: process.env.MAPS_PROVIDER || 'mapbox',
  MAPBOX_TOKEN: process.env.MAPBOX_TOKEN || '',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  get MAPS_CONFIGURED() {
    return Boolean(this.MAPBOX_TOKEN || this.GOOGLE_MAPS_API_KEY);
  },

  // Payments
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  get RAZORPAY_CONFIGURED() {
    return Boolean(this.RAZORPAY_KEY_ID && this.RAZORPAY_KEY_SECRET);
  },

  // Platform settings (defaults; overridable via admin settings collection)
  DEFAULT_PLATFORM_FEE_PERCENT: parseFloat(process.env.DEFAULT_PLATFORM_FEE_PERCENT || '10'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
};

export const isDemoAuth = !env.FIREBASE_CONFIGURED;
export const isDemoPayments = !env.RAZORPAY_CONFIGURED;
export const isDemoMaps = !env.MAPS_CONFIGURED;
