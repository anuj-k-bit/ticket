import { ShowRepo } from '../models/Show.js';
import { VenueRepo } from '../models/Venue.js';
import { SeatRepo } from '../models/Seat.js';
import { holdService } from '../services/holdService.js';
import { seedInitialCloudData } from '../utils/seedData.js';

export const createShow = async (req, res) => {
  try {
    const { title, description, category, venueId, startTime, endTime, bannerUrl, pricing } = req.body;

    const venue = await VenueRepo.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Selected Venue not found' });
    }

    if (!venue.seatMapTemplate || venue.seatMapTemplate.length === 0) {
      return res.status(400).json({ message: 'Selected venue has no seat layout template defined' });
    }

    if (!pricing || !Array.isArray(pricing) || pricing.length === 0) {
      return res.status(400).json({ message: 'Pricing tiers for seat categories are required' });
    }

    const pricingMap = {};
    pricing.forEach((p) => {
      pricingMap[p.category] = Number(p.price) || 0;
    });

    const show = await ShowRepo.create({
      title,
      description: description || '',
      category,
      venue: venue._id,
      organiser: req.user.id,
      startTime,
      endTime,
      bannerUrl: bannerUrl || undefined,
      pricing,
      status: 'upcoming'
    });

    const createdSeats = await SeatRepo.createSeatsForShow({
      showId: show._id,
      venueId: venue._id,
      seatTemplates: venue.seatMapTemplate,
      pricingMap
    });

    res.status(201).json({
      message: `Show created successfully with ${createdSeats.length} available seats`,
      show,
      seatCount: createdSeats.length
    });
  } catch (error) {
    console.error('[Create Show Error]:', error);
    res.status(500).json({ message: 'Server error creating show', error: error.message });
  }
};

export const getShows = async (req, res) => {
  try {
    const { category, date, search } = req.query;

    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    let shows = await ShowRepo.find(filter);
    if (!shows || shows.length === 0) {
      console.log('[Get Shows] 0 shows in DB. Executing seedInitialCloudData(true)...');
      await seedInitialCloudData(true);
      shows = await ShowRepo.find(filter);
    }

    if (date) {
      const targetDate = new Date(date).toDateString();
      shows = shows.filter((s) => new Date(s.startTime).toDateString() === targetDate);
    }

    if (search) {
      const queryStr = search.toLowerCase();
      shows = shows.filter((s) => s.title.toLowerCase().includes(queryStr));
    }

    res.json({ shows });
  } catch (error) {
    console.error('[Get Shows Error]:', error);
    res.status(500).json({ message: 'Server error fetching shows', error: error.message });
  }
};

export const getOrganiserShows = async (req, res) => {
  try {
    const shows = await ShowRepo.find({ organiser: req.user.id });
    res.json({ shows });
  } catch (error) {
    console.error('[Get Organiser Shows Error]:', error);
    res.status(500).json({ message: 'Server error fetching organiser shows', error: error.message });
  }
};

export const getShowById = async (req, res) => {
  try {
    const show = await ShowRepo.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    let venue = show.venue;
    if (typeof venue === 'string' || venue instanceof String) {
      venue = await VenueRepo.findById(venue);
    }

    const seats = await SeatRepo.findByShow(req.params.id);
    const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;

    res.json({
      show: {
        ...show,
        venue
      },
      stats: {
        totalSeats: seats.length,
        availableSeats: availableCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching show details', error: error.message });
  }
};

export const getShowSeats = async (req, res) => {
  try {
    const seats = await SeatRepo.findByShow(req.params.id);
    res.json({
      total: seats.length,
      seats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching show seats', error: error.message });
  }
};

export const updateShow = async (req, res) => {
  try {
    const show = await ShowRepo.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    const organiserId = show.organiser._id || show.organiser;
    if (String(organiserId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only edit your own shows' });
    }

    const { title, description, category, startTime, endTime, bannerUrl, status } = req.body;

    const updated = await ShowRepo.findByIdAndUpdate(req.params.id, {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(category && { category }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(bannerUrl && { bannerUrl }),
      ...(status && { status })
    });

    res.json({ message: 'Show updated successfully', show: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating show', error: error.message });
  }
};

export const deleteShow = async (req, res) => {
  try {
    const show = await ShowRepo.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    const organiserId = show.organiser._id || show.organiser;
    if (String(organiserId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own shows' });
    }

    await ShowRepo.findByIdAndDelete(req.params.id);
    await SeatRepo.deleteByShow(req.params.id);

    res.json({ message: 'Show and generated seat records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting show', error: error.message });
  }
};

/**
 * Controller endpoint: Hold a seat (Acquire Redis lock + Atomic Mongo update)
 */
export const holdSeatController = async (req, res) => {
  try {
    const { showId, seatId } = req.params;
    const userId = req.user.id;
    const ttlSeconds = req.body.ttlSeconds ? Number(req.body.ttlSeconds) : undefined;

    const result = await holdService.holdSeat({
      showId,
      seatId,
      userId,
      ttlSeconds
    });

    return res.status(result.code).json(result);
  } catch (error) {
    console.error('[Hold Controller Error]:', error);
    res.status(500).json({ message: 'Server error during seat hold request', error: error.message });
  }
};

/**
 * Controller endpoint: Release a seat hold
 */
export const releaseSeatController = async (req, res) => {
  try {
    const { showId, seatId } = req.params;
    const userId = req.user.id;

    const result = await holdService.releaseSeatHold({
      showId,
      seatId,
      userId,
      reason: 'USER_RELEASE'
    });

    return res.status(result.code).json(result);
  } catch (error) {
    console.error('[Release Controller Error]:', error);
    res.status(500).json({ message: 'Server error during seat release request', error: error.message });
  }
};
