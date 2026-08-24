import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { Booking, BookingRepo } from '../models/Booking.js';
import { Seat, SeatRepo } from '../models/Seat.js';
import { ShowRepo } from '../models/Show.js';
import { UserRepo } from '../models/User.js';
import { releaseRedisLock } from '../config/redis.js';
import { seatHoldExpiryQueue, emailQueue } from '../config/queue.js';
import { getIO } from '../services/socketService.js';
import { waitlistService } from '../services/waitlistService.js';

const generateBookingRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'BK-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};



/**
 * ORGANISER / ADMIN: Look up ticket details by booking reference.
 */
export const verifyTicketByRef = async (req, res) => {
  try {
    const { ref } = req.params;
    const cleanRef = String(ref).trim().toUpperCase();

    const booking = await BookingRepo.findOne({ bookingRef: cleanRef });
    if (!booking) {
      return res.status(404).json({ message: `No booking found for reference "${cleanRef}"` });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying ticket', error: error.message });
  }
};

/**
 * ORGANISER / ADMIN: Mark ticket reference as CHECKED_IN.
 * REJECTS second check-in attempt with HTTP 409 Conflict if already checked in!
 */
export const checkInTicket = async (req, res) => {
  try {
    const { bookingRef } = req.body;
    const cleanRef = String(bookingRef).trim().toUpperCase();

    const booking = await BookingRepo.findOne({ bookingRef: cleanRef });
    if (!booking) {
      return res.status(404).json({ message: `No booking found for reference "${cleanRef}"` });
    }

    if (booking.status !== 'CONFIRMED') {
      return res.status(400).json({ message: `Cannot check in: Booking status is ${booking.status}` });
    }

    // DOUBLE CHECK-IN PROTECTION
    if (booking.checkInStatus === 'CHECKED_IN') {
      const formattedTime = booking.checkedInAt
        ? new Date(booking.checkedInAt).toLocaleString()
        : 'an earlier time';

      return res.status(409).json({
        message: `REJECTED: Ticket ${cleanRef} was ALREADY checked in on ${formattedTime}. Entry denied to prevent ticket reuse.`
      });
    }

    // Atomic Check-In
    const now = new Date();
    booking.checkInStatus = 'CHECKED_IN';
    booking.checkedInAt = now;
    booking.checkedInBy = req.user.id;

    if (mongoose.connection.readyState === 1) {
      await Booking.findOneAndUpdate(
        { bookingRef: cleanRef, checkInStatus: 'NOT_CHECKED_IN' },
        { $set: { checkInStatus: 'CHECKED_IN', checkedInAt: now, checkedInBy: req.user.id } }
      );
    }

    res.status(200).json({
      message: `🎉 SUCCESS: Ticket ${cleanRef} verified! Attendee checked in successfully.`,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error checking in ticket', error: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await BookingRepo.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingOwnerId = booking.user._id || booking.user;
    if (String(bookingOwnerId) !== String(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only cancel your own bookings' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'CANCELLED';
    if (mongoose.connection.readyState === 1) {
      await booking.save();
    }

    const showId = booking.show._id || booking.show;
    const seats = booking.seats || [];
    const waitlistResults = [];

    for (const seatObj of seats) {
      let seatId = seatObj._id || seatObj;
      let category = seatObj.category;

      if (!category) {
        const allShowSeats = await SeatRepo.findByShow(showId);
        const matchSeat = allShowSeats.find((s) => String(s._id) === String(seatId));
        if (matchSeat) category = matchSeat.category;
      }

      if (mongoose.connection.readyState === 1) {
        await Seat.findOneAndUpdate(
          { _id: seatId },
          { $set: { status: 'AVAILABLE', heldBy: null, holdExpiresAt: null } }
        );
      } else {
        const allSeats = await SeatRepo.findByShow(showId);
        const seat = allSeats.find((s) => String(s._id) === String(seatId));
        if (seat) {
          seat.status = 'AVAILABLE';
          seat.heldBy = null;
          seat.holdExpiresAt = null;
        }
      }

      const cascadeResult = await waitlistService.processNextWaitlistOffer({
        showId,
        category: category || 'Standard',
        seatId
      });
      waitlistResults.push(cascadeResult);
    }

    res.json({
      message: 'Booking cancelled successfully. Released seats have been processed for waitlist auto-assignment.',
      booking,
      waitlistResults
    });
  } catch (error) {
    console.error('[Cancel Booking Error]:', error);
    res.status(500).json({ message: 'Server error cancelling booking', error: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await BookingRepo.find({ user: req.user.id });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user bookings', error: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await BookingRepo.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching booking details', error: error.message });
  }
};
