import mongoose from 'mongoose';

const waitlistEntrySchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['WAITING', 'OFFERED', 'EXPIRED', 'FULFILLED', 'CANCELLED'],
      default: 'WAITING',
      index: true
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    offeredSeat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seat'
    },
    offerExpiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// UNIQUE COMPOUND INDEX preventing duplicate active waitlist entries for the same user, show, and category
waitlistEntrySchema.index({ show: 1, user: 1, category: 1, status: 1 }, { unique: true });

export const WaitlistEntry = mongoose.model('WaitlistEntry', waitlistEntrySchema);

// In-memory fallback repository for Waitlist entries
const inMemoryWaitlist = new Map();

export const WaitlistRepo = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const entry = new WaitlistEntry(data);
      return await entry.save();
    }

    const id = 'waitlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const entryDoc = {
      _id: id,
      show: data.show,
      user: data.user,
      category: data.category,
      status: data.status || 'WAITING',
      joinedAt: new Date(),
      offeredSeat: data.offeredSeat || null,
      offerExpiresAt: data.offerExpiresAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryWaitlist.set(id, entryDoc);
    return entryDoc;
  },

  async find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return await WaitlistEntry.find(filter)
        .populate('show')
        .populate('user', 'name email')
        .populate('offeredSeat')
        .sort({ joinedAt: 1 });
    }
    let list = Array.from(inMemoryWaitlist.values());
    if (filter.show) list = list.filter((e) => String(e.show._id || e.show) === String(filter.show));
    if (filter.user) list = list.filter((e) => String(e.user._id || e.user) === String(filter.user));
    if (filter.category) list = list.filter((e) => e.category === filter.category);
    if (filter.status) list = list.filter((e) => e.status === filter.status);

    return list.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
  },

  async findOneAndUpdate(filter, update, options = {}) {
    if (mongoose.connection.readyState === 1) {
      return await WaitlistEntry.findOneAndUpdate(filter, update, {
        sort: { joinedAt: 1 },
        new: true,
        ...options
      })
        .populate('user', 'name email')
        .populate('show');
    }

    let list = Array.from(inMemoryWaitlist.values());
    list = list.sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

    const match = list.find((e) => {
      if (filter.show && String(e.show._id || e.show) !== String(filter.show)) return false;
      if (filter.category && e.category !== filter.category) return false;
      if (filter.status && e.status !== filter.status) return false;
      if (filter._id && String(e._id) !== String(filter._id)) return false;
      return true;
    });

    if (!match) return null;

    if (update.$set) {
      Object.assign(match, update.$set);
    }
    match.updatedAt = new Date();
    return match;
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await WaitlistEntry.findById(id).populate('show').populate('user', 'name email');
    }
    return inMemoryWaitlist.get(id) || null;
  }
};
