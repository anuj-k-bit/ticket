import { BookingRepo } from '../models/Booking.js';
import { ShowRepo } from '../models/Show.js';
import { SeatRepo } from '../models/Seat.js';

/**
 * Get Organiser Analytics & Sales Metrics
 */
export const getOrganiserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const allShows = await ShowRepo.find({});

    const organiserShows = allShows.filter(
      (s) => String(s.organiser?._id || s.organiser) === String(userId) || req.user.role === 'admin'
    );

    const showIds = organiserShows.map((s) => String(s._id));

    const allBookings = await BookingRepo.find({});
    const organiserBookings = allBookings.filter((b) => showIds.includes(String(b.show?._id || b.show)));

    let totalRevenueINR = 0;
    let totalTicketsSold = 0;

    organiserBookings.forEach((b) => {
      totalRevenueINR += Number(b.totalAmount) || 0;
      totalTicketsSold += Array.isArray(b.seats) ? b.seats.length : 1;
    });

    const categoryBreakdown = {};

    for (const show of organiserShows) {
      const seats = await SeatRepo.findByShow(show._id);
      seats.forEach((seat) => {
        if (!categoryBreakdown[seat.category]) {
          categoryBreakdown[seat.category] = { total: 0, booked: 0, revenue: 0 };
        }
        categoryBreakdown[seat.category].total += 1;
        if (seat.status === 'BOOKED') {
          categoryBreakdown[seat.category].booked += 1;
          categoryBreakdown[seat.category].revenue += Number(seat.price) || 0;
        }
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalRevenueINR,
        totalTicketsSold,
        totalShowsCount: organiserShows.length,
        totalBookingsCount: organiserBookings.length
      },
      shows: organiserShows.map((s) => ({
        id: s._id,
        title: s.title,
        category: s.category,
        startTime: s.startTime,
        venueName: s.venue?.name || 'Venue'
      })),
      categoryBreakdown,
      recentBookings: organiserBookings.slice(0, 5)
    });
  } catch (error) {
    console.error('[Organiser Analytics Error]:', error);
    res.status(500).json({ message: 'Server error fetching analytics', error: error.message });
  }
};
