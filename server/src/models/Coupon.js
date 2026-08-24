import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT'],
      default: 'PERCENTAGE'
    },
    discountValue: {
      type: Number,
      required: true
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: 10000
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Coupon = mongoose.model('Coupon', couponSchema);

// In-Memory Repository Fallback for environment testing
const memoryCoupons = [
  {
    _id: 'cpn_earlybird20',
    code: 'EARLYBIRD20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 1000,
    maxDiscountAmount: 2000,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true
  },
  {
    _id: 'cpn_ipl500',
    code: 'IPL500',
    discountType: 'FLAT',
    discountValue: 500,
    minOrderAmount: 2000,
    maxDiscountAmount: 500,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true
  }
];

export const CouponRepo = {
  async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      return await Coupon.findOne(query);
    }
    if (query.code) {
      const targetCode = String(query.code).toUpperCase();
      return memoryCoupons.find((c) => c.code === targetCode && c.isActive);
    }
    return null;
  },
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return await Coupon.create(data);
    }
    const newCoupon = {
      _id: `cpn_${Date.now()}`,
      ...data,
      code: String(data.code).toUpperCase(),
      isActive: true
    };
    memoryCoupons.push(newCoupon);
    return newCoupon;
  },
  async listAll() {
    if (mongoose.connection.readyState === 1) {
      return await Coupon.find({});
    }
    return memoryCoupons;
  }
};
