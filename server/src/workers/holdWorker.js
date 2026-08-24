import { Worker } from 'bullmq';
import { createRedisClient } from '../config/redis.js';
import { seatHoldExpiryQueue } from '../config/queue.js';
import { holdService } from '../services/holdService.js';

const connection = createRedisClient();

export const holdExpiryWorker = new Worker(
  'seatHoldExpiry',
  async (job) => {
    if (job.name === 'cleanupStaleHolds') {
      console.log('[BullMQ Repeatable Worker] Running 60s periodic stale hold cleanup...');
      const result = await holdService.cleanStaleHolds();
      return result;
    }

    const { showId, seatId, userId, lockToken } = job.data;
    console.log(`[BullMQ Worker] Processing hold expiry for seat ${seatId} in show ${showId}...`);
    await holdService.releaseSeatHold({
      showId,
      seatId,
      userId,
      lockToken,
      reason: 'TTL_EXPIRED'
    });
  },
  { connection }
);

holdExpiryWorker.on('completed', (job) => {
  if (job.name !== 'cleanupStaleHolds') {
    console.log(`[BullMQ Worker] Seat hold expiry job ${job.id} completed`);
  }
});

holdExpiryWorker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] Seat hold expiry job ${job?.id} failed:`, err.message);
});

// Register 60s Repeatable BullMQ Job & 60s Interval Fallback
export const initPeriodicHoldCleanup = () => {
  // 1. BullMQ Repeatable Job (Runs every 60,000ms / 60 seconds)
  seatHoldExpiryQueue
    .add(
      'cleanupStaleHolds',
      {},
      {
        repeat: { every: 60000 },
        jobId: 'repeatable_stale_hold_cleanup'
      }
    )
    .then(() => {
      console.log('[BullMQ Queue] Repeatable 60s stale hold cleanup job registered.');
    })
    .catch((err) => {
      console.warn('[BullMQ Queue Warning]: Repeatable job add skipped:', err.message);
    });

  // 2. 60-Second Fallback Interval Timer (Ensures cleanup runs even during dev/mock mode)
  setInterval(async () => {
    try {
      await holdService.cleanStaleHolds();
    } catch (e) {
      console.error('[Periodic Cleanup Error]:', e.message);
    }
  }, 60000);
};

// Initialize periodic cleanup on load
initPeriodicHoldCleanup();
