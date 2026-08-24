import mongoose from 'mongoose';
import crypto from 'crypto';
import { acquireRedisLock, releaseRedisLock } from '../config/redis.js';
import { seatHoldExpiryQueue } from '../config/queue.js';
import { Seat, SeatRepo } from '../models/Seat.js';
import { getIO } from './socketService.js';

const DEFAULT_TTL_SECONDS = parseInt(process.env.SEAT_HOLD_TTL_SECONDS || '600', 10); // 10 minutes default
const MAX_HELD_SEATS_PER_USER = parseInt(process.env.MAX_HELD_SEATS_PER_USER || '6', 10); // 6 seats cap

export const holdService = {
  /**
   * Acquire a seat hold with Redis locking, atomic MongoDB update, BullMQ delayed job, and Socket.io broadcast.
   * Uses unique crypto.randomUUID() lock tokens for safe atomic releases.
   */
  async holdSeat({ showId, seatId, userId, ttlSeconds = DEFAULT_TTL_SECONDS }) {
    // REQUIREMENT 3: Hold-Griefing Prevention (Per-User Hold Cap)
    const currentlyHeldCount = await SeatRepo.countHeldByUser(userId);
    if (currentlyHeldCount >= MAX_HELD_SEATS_PER_USER) {
      return {
        success: false,
        code: 400,
        message: `Hold limit reached: You can hold a maximum of ${MAX_HELD_SEATS_PER_USER} seats at once across the platform.`
      };
    }

    const lockKey = `hold:${showId}:${seatId}`;
    // Generate unique lock token to prevent lock deletion by expired threads
    const lockToken = crypto.randomUUID();

    // STEP 1: Attempt Atomic Redis Lock (SET key lockToken NX EX ttlSeconds)
    const lockAcquired = await acquireRedisLock(lockKey, lockToken, ttlSeconds);
    if (!lockAcquired) {
      return {
        success: false,
        code: 409,
        message: 'Seat is currently locked by another user. Please choose another seat.'
      };
    }

    const holdExpiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // STEP 2: Atomic MongoDB Update requiring status === 'AVAILABLE'
    let updatedSeat = null;

    if (mongoose.connection.readyState === 1) {
      updatedSeat = await Seat.findOneAndUpdate(
        { _id: seatId, show: showId, status: 'AVAILABLE' },
        {
          $set: {
            status: 'HELD',
            heldBy: userId,
            lockToken,
            holdExpiresAt
          }
        },
        { new: true }
      );
    } else {
      const seats = await SeatRepo.findByShow(showId);
      const seat = seats.find((s) => String(s._id) === String(seatId));

      if (seat && seat.status === 'AVAILABLE') {
        seat.status = 'HELD';
        seat.heldBy = userId;
        seat.lockToken = lockToken;
        seat.holdExpiresAt = holdExpiresAt;
        updatedSeat = seat;
      }
    }

    // Step 2 Edge Case: Lost race at DB layer despite winning Redis lock
    if (!updatedSeat) {
      await releaseRedisLock(lockKey, lockToken);
      return {
        success: false,
        code: 409,
        message: 'Seat state changed or is no longer available.'
      };
    }

    // STEP 3: Non-blocking BullMQ delayed job schedule
    const jobId = `hold_job:${showId}:${seatId}`;
    Promise.race([
      seatHoldExpiryQueue.add(
        'expireSeatHold',
        { showId, seatId, userId, lockToken },
        {
          delay: ttlSeconds * 1000,
          jobId,
          removeOnComplete: true,
          removeOnFail: true
        }
      ),
      new Promise((res) => setTimeout(res, 500))
    ]).catch((queueErr) => {
      console.warn('[Hold Queue Warning]: BullMQ job add skipped or timed out:', queueErr.message);
    });

    // STEP 4: Broadcast real-time update via Socket.io to everyone viewing this show
    try {
      const io = getIO();
      io.to(`show_${showId}`).emit('seat_updated', {
        seatId: String(updatedSeat._id),
        showId: String(showId),
        status: 'HELD',
        heldBy: String(userId),
        holdExpiresAt
      });
    } catch (socketErr) {
      console.warn('[Socket.io Broadcast Warning]:', socketErr.message);
    }

    return {
      success: true,
      code: 200,
      message: 'Seat hold acquired successfully',
      seat: updatedSeat,
      lockToken,
      holdExpiresAt
    };
  },

  /**
   * Release a seat hold (manual cancel, navigation away, or BullMQ TTL expiry).
   * Safe atomic release via Lua script (GET + compare + DEL).
   */
  async releaseSeatHold({ showId, seatId, userId, lockToken, reason = 'USER_CANCELLED' }) {
    const lockKey = `hold:${showId}:${seatId}`;

    // Safe atomic release: only deletes lock if stored value matches lockToken
    await releaseRedisLock(lockKey, lockToken);

    let updatedSeat = null;

    if (mongoose.connection.readyState === 1) {
      updatedSeat = await Seat.findOneAndUpdate(
        { _id: seatId, show: showId, status: 'HELD' },
        {
          $set: {
            status: 'AVAILABLE',
            heldBy: null,
            lockToken: null,
            holdExpiresAt: null
          }
        },
        { new: true }
      );
    } else {
      const seats = await SeatRepo.findByShow(showId);
      const seat = seats.find((s) => String(s._id) === String(seatId));
      if (seat && (seat.status === 'HELD' || String(seat.heldBy) === String(userId))) {
        seat.status = 'AVAILABLE';
        seat.heldBy = null;
        seat.lockToken = null;
        seat.holdExpiresAt = null;
        updatedSeat = seat;
      }
    }

    const jobId = `hold_job:${showId}:${seatId}`;
    Promise.race([
      seatHoldExpiryQueue.getJob(jobId).then((job) => job && job.remove()),
      new Promise((res) => setTimeout(res, 300))
    ]).catch(() => {});

    try {
      const io = getIO();
      io.to(`show_${showId}`).emit('seat_updated', {
        seatId: String(seatId),
        showId: String(showId),
        status: 'AVAILABLE',
        heldBy: null,
        holdExpiresAt: null,
        reason
      });
    } catch (socketErr) {
      console.warn('[Socket.io Broadcast Warning]:', socketErr.message);
    }

    return {
      success: true,
      code: 200,
      message: `Seat hold released (${reason})`,
      seat: updatedSeat
    };
  }
};
