import { VenueRepo } from '../models/Venue.js';

export const createVenue = async (req, res) => {
  try {
    const { name, address, city, sections } = req.body;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ message: 'At least one seating section is required' });
    }

    // Validate sections
    for (const sec of sections) {
      if (!sec.name || !sec.rows || !sec.seatsPerRow || sec.rows < 1 || sec.seatsPerRow < 1) {
        return res.status(400).json({
          message: `Invalid section format for '${sec.name || 'Unnamed'}'. Rows and Seats per row must be positive integers.`
        });
      }
    }

    const venue = await VenueRepo.create({
      name,
      address,
      city,
      sections,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Venue created successfully',
      venue
    });
  } catch (error) {
    console.error('[Create Venue Error]:', error);
    res.status(500).json({ message: 'Server error creating venue', error: error.message });
  }
};

export const getVenues = async (req, res) => {
  try {
    const venues = await VenueRepo.find({});
    res.json({ venues });
  } catch (error) {
    console.error('[Get Venues Error]:', error);
    res.status(500).json({ message: 'Server error fetching venues', error: error.message });
  }
};

export const getVenueById = async (req, res) => {
  try {
    const venue = await VenueRepo.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json({ venue });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching venue', error: error.message });
  }
};

export const updateVenue = async (req, res) => {
  try {
    const { name, address, city, sections } = req.body;

    if (sections) {
      if (!Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({ message: 'At least one seating section is required' });
      }
      for (const sec of sections) {
        if (!sec.name || !sec.rows || !sec.seatsPerRow || sec.rows < 1 || sec.seatsPerRow < 1) {
          return res.status(400).json({ message: 'Invalid section parameters' });
        }
      }
    }

    const updated = await VenueRepo.findByIdAndUpdate(req.params.id, {
      ...(name && { name }),
      ...(address && { address }),
      ...(city && { city }),
      ...(sections && { sections })
    });

    if (!updated) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    res.json({
      message: 'Venue updated successfully',
      venue: updated
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating venue', error: error.message });
  }
};

export const deleteVenue = async (req, res) => {
  try {
    const deleted = await VenueRepo.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting venue', error: error.message });
  }
};
