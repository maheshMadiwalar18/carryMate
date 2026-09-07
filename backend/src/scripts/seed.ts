/* eslint-disable no-console */
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { DeliveryRequest } from '../models/DeliveryRequest';
import { PlatformSettings } from '../models/PlatformSettings';
import { UserRole, TransportType, VerificationStatus } from '../utils/constants';
import { env } from '../config/env';

const CITIES = {
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hubli: { lat: 15.3647, lng: 75.124 },
  dharwad: { lat: 15.4589, lng: 74.9997 }, // ~20km from Hubli, used to demonstrate geospatial route matching
  mysore: { lat: 12.2958, lng: 76.6394 },
};

function geo(c: { lat: number; lng: number }) {
  return { type: 'Point' as const, coordinates: [c.lng, c.lat] as [number, number] };
}

function inDays(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

async function upsertUser(data: {
  name: string;
  email: string;
  phone: string;
  rating: number;
  totalRatings: number;
  completedDeliveries: number;
  completedTrips: number;
  role: UserRole;
}) {
  const passwordHash = await bcrypt.hash('password123', 10);
  return User.findOneAndUpdate(
    { email: data.email },
    {
      ...data,
      passwordHash,
      verificationStatus: VerificationStatus.VERIFIED,
      trustScore: Math.round(50 + data.rating * 10),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * Runs the demo seed. Exported so `server.ts` can call it automatically when
 * running against the in-memory database (each process gets a fresh, empty
 * DB, so without this the demo-mode server would start empty on every run).
 * Also runnable standalone via `npm run seed` against a real MONGODB_URI.
 */
export async function runSeed() {
  await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { platformFeePercent: env.DEFAULT_PLATFORM_FEE_PERCENT, prohibitedCategories: [] } },
    { upsert: true }
  );

  const admin = await upsertUser({
    name: 'CarryMate Admin', email: 'admin@carrymate.app', phone: '+919900000000',
    rating: 5, totalRatings: 1, completedDeliveries: 0, completedTrips: 0, role: UserRole.ADMIN,
  });

  const mahesh = await upsertUser({
    name: 'Mahesh Kumar', email: 'mahesh@example.com', phone: '+919900000001',
    rating: 4.9, totalRatings: 24, completedDeliveries: 23, completedTrips: 31, role: UserRole.BOTH,
  });
  const rahul = await upsertUser({
    name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+919900000002',
    rating: 4.7, totalRatings: 15, completedDeliveries: 14, completedTrips: 18, role: UserRole.BOTH,
  });
  const ananya = await upsertUser({
    name: 'Ananya Rao', email: 'ananya@example.com', phone: '+919900000003',
    rating: 4.8, totalRatings: 20, completedDeliveries: 19, completedTrips: 22, role: UserRole.BOTH,
  });
  const priya = await upsertUser({
    name: 'Priya Nair', email: 'priya@example.com', phone: '+919900000004',
    rating: 4.6, totalRatings: 8, completedDeliveries: 0, completedTrips: 0, role: UserRole.BOTH,
  });
  const arjun = await upsertUser({
    name: 'Arjun Patel', email: 'arjun@example.com', phone: '+919900000005',
    rating: 4.5, totalRatings: 5, completedDeliveries: 0, completedTrips: 0, role: UserRole.BOTH,
  });

  await Trip.deleteMany({ travelerId: { $in: [mahesh._id, rahul._id, ananya._id] } });

  const tripMahesh = await Trip.create({
    travelerId: mahesh._id,
    origin: 'Bangalore', destination: 'Hubli',
    originLocation: geo(CITIES.bangalore), destinationLocation: geo(CITIES.hubli),
    departureDateTime: inDays(6), estimatedArrival: inDays(6),
    capacityKg: 5, availableCapacityKg: 5, transportType: TransportType.TRAIN,
    description: 'Overnight train, plenty of space in cabin luggage.',
  });

  const tripRahul = await Trip.create({
    travelerId: rahul._id,
    origin: 'Bangalore', destination: 'Dharwad',
    originLocation: geo(CITIES.bangalore), destinationLocation: geo(CITIES.dharwad),
    departureDateTime: inDays(5), estimatedArrival: inDays(5),
    capacityKg: 3, availableCapacityKg: 3, transportType: TransportType.BUS,
  });

  const tripAnanya = await Trip.create({
    travelerId: ananya._id,
    origin: 'Mysore', destination: 'Bangalore',
    originLocation: geo(CITIES.mysore), destinationLocation: geo(CITIES.bangalore),
    departureDateTime: inDays(4), estimatedArrival: inDays(4),
    capacityKg: 2, availableCapacityKg: 2, transportType: TransportType.CAR,
  });

  await DeliveryRequest.deleteMany({ requesterId: { $in: [priya._id, arjun._id] } });

  await DeliveryRequest.create({
    requesterId: priya._id,
    pickup: 'Bangalore', destination: 'Hubli',
    pickupLocation: geo(CITIES.bangalore), destinationLocation: geo(CITIES.hubli),
    itemName: 'Engineering Textbook', description: 'Data Structures textbook, lightly used.',
    weightKg: 1, itemValue: 800, reward: 150, deliveryDeadline: inDays(7),
  });

  await DeliveryRequest.create({
    requesterId: arjun._id,
    pickup: 'Bangalore', destination: 'Dharwad',
    pickupLocation: geo(CITIES.bangalore), destinationLocation: geo(CITIES.dharwad),
    itemName: 'Laptop Charger', description: 'Dell 65W charger.',
    weightKg: 0.5, itemValue: 1500, reward: 100, deliveryDeadline: inDays(6),
  });

  await DeliveryRequest.create({
    requesterId: priya._id,
    pickup: 'Mysore', destination: 'Bangalore',
    pickupLocation: geo(CITIES.mysore), destinationLocation: geo(CITIES.bangalore),
    itemName: 'Notes', description: 'Handwritten exam notes in an envelope.',
    weightKg: 0.5, itemValue: 0, reward: 80, deliveryDeadline: inDays(5),
  });

  console.log('\nSeed complete. Demo accounts (password: password123):');
  console.log(' Admin:     admin@carrymate.app');
  console.log(' Traveler:  mahesh@example.com  (Bangalore -> Hubli, 5kg)');
  console.log(' Traveler:  rahul@example.com   (Bangalore -> Dharwad, 3kg)');
  console.log(' Traveler:  ananya@example.com  (Mysore -> Bangalore, 2kg)');
  console.log(' Requester: priya@example.com   (Engineering Textbook, Bangalore -> Hubli, ₹150)');
  console.log(' Requester: arjun@example.com   (Laptop Charger, Bangalore -> Dharwad, ₹100)');
  console.log(`\nTrip IDs -> Mahesh: ${tripMahesh._id}, Rahul: ${tripRahul._id}, Ananya: ${tripAnanya._id}`);
}

// Allow `ts-node src/scripts/seed.ts` to run standalone against MONGODB_URI.
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { connectDB, disconnectDB } = require('../config/db');
  connectDB()
    .then(() => runSeed())
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error(err);
      process.exit(1);
    });
}
