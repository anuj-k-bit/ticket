import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

const seatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Venue',
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    row: {
      type: String,
      required: true,
      trim: true
    },
    number: {
      type: Number,
      required: true
    },
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'HELD', 'BOOKED'],
      default: 'AVAILABLE',
      index: true
    },
    heldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    holdExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// COMPOUND INDEX for ultra-fast query performance: { show: 1, status: 1 }
seatSchema.index({ show: 1, status: 1 });

export const Seat = mongoose.model('Seat', seatSchema);

// In-memory fallback repository for Seat documents
const inMemorySeats = new Map();

const ensureConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (e) {
      // fallback
    }
  }
};

export const SeatRepo = {
  async createSeatsForShow({ showId, venueId, seatTemplates, pricingMap }) {
    await ensureConnection();
    const seatsToInsert = seatTemplates.map((template) => {
      const categoryName = template.category || template.section || 'Standard';
      return {
        show: showId,
        venue: venueId,
        category: categoryName,
        row: template.row,
        number: template.number,
        x: Number(template.x) || 0,
        y: Number(template.y) || 0,
        price: pricingMap[categoryName] || 0,
        status: 'AVAILABLE',
        heldBy: null,
        holdExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    if (mongoose.connection.readyState === 1) {
      const CHUNK_SIZE = 1000;
      const insertedDocs = [];
      for (let i = 0; i < seatsToInsert.length; i += CHUNK_SIZE) {
        const chunk = seatsToInsert.slice(i, i + CHUNK_SIZE);
        const docs = await Seat.insertMany(chunk, { ordered: false });
        insertedDocs.push(...docs);
      }
      return insertedDocs;
    }

    // In-memory mock store
    seatsToInsert.forEach((s) => inMemorySeats.set(String(s._id || Math.random()), s));
    return seatsToInsert;
  },

  async findByShow(showId) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      return await Seat.find({ show: showId }).sort({ category: 1, row: 1, number: 1 });
    }
    const list = Array.from(inMemorySeats.values());
    return list.filter((s) => String(s.show) === String(showId));
  },

  async countHeldByUser(userId) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      return await Seat.countDocuments({ heldBy: userId, status: 'HELD' });
    }
    const list = Array.from(inMemorySeats.values());
    return list.filter((s) => s.status === 'HELD' && String(s.heldBy) === String(userId)).length;
  },

  async findById(id) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      return await Seat.findById(id);
    }
    return inMemorySeats.get(String(id)) || null;
  },

  async findStaleHolds(now = new Date()) {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      return await Seat.find({ status: 'HELD', holdExpiresAt: { $lte: now } });
    }
    const list = Array.from(inMemorySeats.values());
    return list.filter(
      (s) => s.status === 'HELD' && s.holdExpiresAt && new Date(s.holdExpiresAt) <= now
    );
  }
};
