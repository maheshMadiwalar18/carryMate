import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { User } from './models/User';
import { runSeed } from './scripts/seed';

async function main() {
  await connectDB();

  if (env.USE_IN_MEMORY_DB) {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[server] In-memory DB is empty — loading demo seed data automatically...');
      await runSeed();
    }
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] CarryMate API listening on port ${env.PORT} (${env.NODE_ENV})`);
    // eslint-disable-next-line no-console
    console.log(`[server] Auth mode: ${env.FIREBASE_CONFIGURED ? 'Firebase' : 'Demo JWT'}`);
    // eslint-disable-next-line no-console
    console.log(`[server] Payments mode: ${env.RAZORPAY_CONFIGURED ? 'Razorpay (live keys)' : 'Demo'}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
