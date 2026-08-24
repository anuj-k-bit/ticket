import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true
    },
    seats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
        required: true
      }
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    qrCodeDataUrl: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'EXPIRED'],
      default: 'CONFIRMED'
    },
    checkInStatus: {
      type: String,
      enum: ['NOT_CHECKED_IN', 'CHECKED_IN'],
      default: 'NOT_CHECKED_IN',
      index: true
    },
    checkedInAt: {
      type: Date,
      default: null
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    paymentDetails: {
      paymentId: { type: String, default: 'PAY-MOCK-SUCCESS' },
      status: { type: String, default: 'COMPLETED' }
    }
  },
  {
    timestamps: true
  }
);

// COMPOUND INDEX for ultra-fast customer ticket queries: { user: 1, createdAt: -1 }
bookingSchema.index({ user: 1, createdAt: -1 });

export const Booking = mongoose.model('Booking', bookingSchema);

// In-memory fallback repository for Booking documents
const inMemoryBookings = new Map();

export const BookingRepo = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const booking = new Booking(data);
      return await booking.save();
    }

    const id = 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const bookingDoc = {
      _id: id,
      bookingRef: data.bookingRef,
      user: data.user,
      show: data.show,
      seats: data.seats,
      totalAmount: data.totalAmount,
      qrCodeDataUrl: data.qrCodeDataUrl,
      status: data.status || 'CONFIRMED',
      checkInStatus: data.checkInStatus || 'NOT_CHECKED_IN',
      checkedInAt: data.checkedInAt || null,
      checkedInBy: data.checkedInBy || null,
      paymentDetails: data.paymentDetails || { paymentId: 'PAY-MOCK-SUCCESS', status: 'COMPLETED' },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryBookings.set(id, bookingDoc);
    return bookingDoc;
  },

  async find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return await Booking.find(filter)
        .populate('show')
        .populate('seats')
        .populate('user', 'name email');
    }
    let list = Array.from(inMemoryBookings.values());
    if (filter.user) {
      list = list.filter((b) => String(b.user._id || b.user) === String(filter.user));
    }
    return list;
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await Booking.findById(id)
        .populate('show')
        .populate('seats')
        .populate('user', 'name email');
    }
    return inMemoryBookings.get(id) || null;
  },

  async findOne(filter) {
    if (mongoose.connection.readyState === 1) {
      return await Booking.findOne(filter)
        .populate('show')
        .populate('seats')
        .populate('user', 'name email');
    }
    const list = Array.from(inMemoryBookings.values());
    if (filter.bookingRef) {
      const found = list.find((b) => b.bookingRef === filter.bookingRef);
      if (!found) return null;
      return found;
    }
    if (filter.user && filter.seats) {
      return (
        list.find((b) => {
          if (String(b.user._id || b.user) !== String(filter.user)) return false;
          const bSeats = (b.seats || []).map((s) => String(s._id || s));
          return filter.seats.some((seatId) => bSeats.includes(String(seatId)));
        }) || null
      );
    }
    return null;
  }
};
