import { WaitlistRepo } from '../models/WaitlistEntry.js';
import { ShowRepo } from '../models/Show.js';

export const joinWaitlist = async (req, res) => {
  try {
    const { showId, category } = req.body;
    const userId = req.user.id;

    const show = await ShowRepo.findById(showId);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    // Check if user is already waiting for this category
    const existing = await WaitlistRepo.find({
      show: showId,
      user: userId,
      category,
      status: 'WAITING'
    });

    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'You are already in the waitlist queue for this section category.' });
    }

    const entry = await WaitlistRepo.create({
      show: showId,
      user: userId,
      category,
      status: 'WAITING',
      joinedAt: new Date()
    });

    // Calculate queue position
    const queueEntries = await WaitlistRepo.find({ show: showId, category, status: 'WAITING' });
    const position = queueEntries.length;

    res.status(201).json({
      message: `Joined waitlist queue for ${category} successfully!`,
      entry,
      position
    });
  } catch (error) {
    console.error('[Join Waitlist Error]:', error);
    res.status(500).json({ message: 'Server error joining waitlist', error: error.message });
  }
};

export const getMyWaitlistEntries = async (req, res) => {
  try {
    const entries = await WaitlistRepo.find({ user: req.user.id });
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching waitlist entries', error: error.message });
  }
};

export const cancelWaitlistEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await WaitlistRepo.findById(id);

    if (!entry) {
      return res.status(404).json({ message: 'Waitlist entry not found' });
    }

    const entryUserId = entry.user._id || entry.user;
    if (String(entryUserId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You can only cancel your own waitlist entries' });
    }

    const updated = await WaitlistRepo.findOneAndUpdate({ _id: id }, { $set: { status: 'CANCELLED' } });
    res.json({ message: 'Waitlist entry cancelled successfully', entry: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error cancelling waitlist entry', error: error.message });
  }
};
