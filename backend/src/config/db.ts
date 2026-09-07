import mongoose from 'mongoose';
import { env } from './env';

let memoryServer: any = null;

export async function connectDB(): Promise<void> {
  let uri = env.MONGODB_URI;

  if (env.USE_IN_MEMORY_DB || !uri) {
    // Local/demo mode: spin up an in-memory MongoDB instance so the full
    // application works out of the box without an Atlas cluster.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('carrymate');
    // eslint-disable-next-line no-console
    console.log('[db] MONGODB_URI not set (or USE_IN_MEMORY_DB=true) — using in-memory MongoDB for this run.');
    // eslint-disable-next-line no-console
    console.log('[db] Data will NOT persist across restarts. Set MONGODB_URI to use MongoDB Atlas.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: true });
  // eslint-disable-next-line no-console
  console.log(`[db] Connected to MongoDB (${env.USE_IN_MEMORY_DB ? 'in-memory' : 'configured URI'})`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
