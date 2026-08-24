import { Worker } from 'bullmq';
import { createRedisClient } from '../config/redis.js';
import { waitlistService } from '../services/waitlistService.js';

const connection = createRedisClient();

export const waitlistWorker = new Worker(
  'waitlistOfferExpiry',
  async (job) => {
    const { waitlistEntryId, showId, category, seatId, userId } = job.data;
    console.log(`[Waitlist BullMQ Worker] Processing 15-min offer expiry for Waitlist Entry ${waitlistEntryId}...`);
    await waitlistService.handleOfferExpiration({
      waitlistEntryId,
      showId,
      category,
      seatId,
      userId
    });
  },
  { connection }
);

waitlistWorker.on('completed', (job) => {
  console.log(`[Waitlist Worker] Offer expiry job ${job.id} completed.`);
});

waitlistWorker.on('failed', (job, err) => {
  console.error(`[Waitlist Worker] Offer expiry job ${job?.id} failed:`, err.message);
});
