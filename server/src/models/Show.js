import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

const pricingTierSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const showSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Show title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['movie', 'concert', 'theater', 'standup', 'sports'],
      required: true
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true
    },
    organiser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
    },
    pricing: [pricingTierSchema],
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed', 'cancelled'],
      default: 'upcoming'
    }
  },
  {
    timestamps: true
  }
);

export const Show = mongoose.model('Show', showSchema);

// In-memory fallback repository for dev mode when Mongo daemon is offline
const inMemoryShows = new Map();

const ensureConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      // fallback
    }
  }
};

export const ShowRepo = {
  async create(data) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      const show = new Show(data);
      return await show.save();
    }

    const id = 'show_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const showDoc = {
      _id: id,
      title: data.title,
      description: data.description || '',
      category: data.category,
      venue: data.venue,
      organiser: data.organiser,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      pricing: data.pricing || [],
      status: data.status || 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryShows.set(id, showDoc);
    return showDoc;
  },

  async find(filter = {}) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      let query = Show.find(filter).populate('venue').populate('organiser', 'name email');
      return await query;
    }
    let list = Array.from(inMemoryShows.values());

    if (filter.category) {
      list = list.filter((s) => s.category === filter.category);
    }
    if (filter.organiser) {
      list = list.filter((s) => String(s.organiser._id || s.organiser) === String(filter.organiser));
    }
    if (filter.status) {
      list = list.filter((s) => s.status === filter.status);
    }
    return list;
  },

  async findById(id) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      return await Show.findById(id).populate('venue').populate('organiser', 'name email');
    }
    return inMemoryShows.get(id) || null;
  },

  async findByIdAndUpdate(id, data) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      return await Show.findByIdAndUpdate(id, data, { new: true });
    }
    const show = inMemoryShows.get(id);
    if (!show) return null;
    const updated = { ...show, ...data, updatedAt: new Date() };
    inMemoryShows.set(id, updated);
    return updated;
  },

  async findByIdAndDelete(id) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      return await Show.findByIdAndDelete(id);
    }
    const found = inMemoryShows.get(id);
    inMemoryShows.delete(id);
    return found;
  }
};
