import { Worker } from 'bullmq';
import { createRedisClient } from '../config/redis.js';
import { holdService } from '../services/holdService.js';

const connection = createRedisClient();

export const holdExpiryWorker = new Worker(
  'seatHoldExpiry',
  async (job) => {
    const { showId, seatId, userId } = job.data;
    console.log(`[BullMQ Worker] Processing hold expiry for seat ${seatId} in show ${showId}...`);
    await holdService.releaseSeatHold({
      showId,
      seatId,
      userId,
      reason: 'TTL_EXPIRED'
    });
  },
  { connection }
);

holdExpiryWorker.on('completed', (job) => {
  console.log(`[BullMQ Worker] Seat hold expiry job ${job.id} completed`);
});

holdExpiryWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Seat hold expiry job ${job?.id} failed:`, err.message);
});
