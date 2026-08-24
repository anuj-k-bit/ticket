import { Queue } from 'bullmq';
import { createRedisClient } from './redis.js';

const connection = createRedisClient();

export const seatHoldExpiryQueue = new Queue('seatHoldExpiry', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true
  }
});

export const emailQueue = new Queue('emailNotifications', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true
  }
});

export const waitlistOfferExpiryQueue = new Queue('waitlistOfferExpiry', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true
  }
});

console.log('[BullMQ] Queues initialized');
