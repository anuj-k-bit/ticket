import { WaitlistRepo } from '../models/WaitlistEntry.js';
import { UserRepo } from '../models/User.js';
import { ShowRepo } from '../models/Show.js';
import { holdService } from './holdService.js';
import { waitlistOfferExpiryQueue, emailQueue } from '../config/queue.js';

const OFFER_TTL_SECONDS = parseInt(process.env.WAITLIST_OFFER_TTL_SECONDS || '900', 10); // 15 minutes default

export const waitlistService = {
  /**
   * Process and assign a released seat to the next customer in the waitlist queue.
   * REUSES Phase 5 holdService.holdSeat for Redis lock, atomic Mongo update, & Socket.io broadcast.
   */
  async processNextWaitlistOffer({ showId, category, seatId }) {
    console.log(`[Waitlist Service] Checking waitlist queue for Show ${showId}, Category "${category}"...`);

    const offerExpiresAt = new Date(Date.now() + OFFER_TTL_SECONDS * 1000);

    // STEP 1: Atomically Claim Next Waiting Entry (status === 'WAITING', sorted by joinedAt ASC)
    const nextEntry = await WaitlistRepo.findOneAndUpdate(
      {
        show: showId,
        category,
        status: 'WAITING'
      },
      {
        $set: {
          status: 'OFFERED',
          offeredSeat: seatId,
          offerExpiresAt
        }
      }
    );

    // If no customer is waiting in line -> Release seat back to public 'AVAILABLE'
    if (!nextEntry) {
      console.log(`[Waitlist Service] No customers waiting for Category "${category}". Releasing seat to public.`);
      await holdService.releaseSeatHold({
        showId,
        seatId,
        userId: 'SYSTEM',
        reason: 'NO_WAITLIST_ENTRIES'
      });
      return { offered: false, message: 'No waitlist entries found. Seat released to public.' };
    }

    const recipientUser = nextEntry.user._id ? nextEntry.user : await UserRepo.findById(nextEntry.user);
    const recipientUserId = recipientUser._id || recipientUser;

    console.log(`[Waitlist Service] Claimed Waitlist Entry ${nextEntry._id} for User ${recipientUser.email || recipientUserId}.`);

    // STEP 2: REUSE Phase 5 holdService to place seat hold for 15-minute offer TTL
    const holdResult = await holdService.holdSeat({
      showId,
      seatId,
      userId: recipientUserId,
      ttlSeconds: OFFER_TTL_SECONDS
    });

    if (!holdResult.success) {
      console.warn('[Waitlist Service Warning]: holdService failed for waitlist recipient:', holdResult.message);
    }

    // STEP 3: Non-blocking BullMQ Delayed Expiry Job for 15-minute Offer TTL
    const jobId = `waitlist_offer:${nextEntry._id}`;
    Promise.race([
      waitlistOfferExpiryQueue.add(
        'expireWaitlistOffer',
        {
          waitlistEntryId: nextEntry._id,
          showId,
          category,
          seatId,
          userId: recipientUserId
        },
        {
          delay: OFFER_TTL_SECONDS * 1000,
          jobId,
          removeOnComplete: true,
          removeOnFail: true
        }
      ),
      new Promise((res) => setTimeout(res, 500))
    ]).catch((queueErr) => {
      console.warn('[Waitlist Queue Warning]: Failed to schedule offer expiry job:', queueErr.message);
    });

    // STEP 4: Non-blocking Email to Waitlisted Customer with Time-Limited Claim Link
    const showDoc = nextEntry.show?.title ? nextEntry.show : await ShowRepo.findById(showId);
    const claimLink = `http://localhost:5173/shows/${showId}?offerSeatId=${seatId}`;

    Promise.race([
      emailQueue.add(
        'sendWaitlistOfferEmail',
        {
          to: recipientUser.email || 'customer@example.com',
          userName: recipientUser.name || 'Valued Customer',
          showTitle: showDoc?.title || 'Event',
          category,
          claimLink,
          expiresInMinutes: Math.round(OFFER_TTL_SECONDS / 60)
        },
        { removeOnComplete: true, removeOnFail: true }
      ),
      new Promise((res) => setTimeout(res, 500))
    ]).catch((emailErr) => {
      console.warn('[Waitlist Email Queue Warning]:', emailErr.message);
    });

    return {
      offered: true,
      waitlistEntry: nextEntry,
      recipientUser,
      offerExpiresAt
    };
  },

  /**
   * Handle expired waitlist offer: mark EXPIRED, release seat hold, and RECURSIVELY cascade to next person in line!
   */
  async handleOfferExpiration({ waitlistEntryId, showId, category, seatId, userId }) {
    console.log(`[Waitlist Service] Handling offer expiry for Waitlist Entry ${waitlistEntryId}...`);

    const entry = await WaitlistRepo.findOneAndUpdate(
      { _id: waitlistEntryId, status: 'OFFERED' },
      { $set: { status: 'EXPIRED' } }
    );

    if (!entry) {
      console.log(`[Waitlist Service] Waitlist Entry ${waitlistEntryId} was already fulfilled or cancelled.`);
      return;
    }

    await holdService.releaseSeatHold({
      showId,
      seatId,
      userId,
      reason: 'WAITLIST_OFFER_EXPIRED'
    });

    console.log(`[Waitlist Service] Cascading seat ${seatId} to the next waitlisted customer...`);
    await this.processNextWaitlistOffer({ showId, category, seatId });
  }
};
