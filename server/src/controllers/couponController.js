import { CouponRepo } from '../models/Coupon.js';

/**
 * Apply Coupon Code and Calculate Discount
 */
export const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({ message: 'Coupon code and order amount are required' });
    }

    const coupon = await CouponRepo.findOne({ code: String(code).toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or expired promo code' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: 'This promo code has expired' });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount for code ${coupon.code} is ₹${coupon.minOrderAmount?.toLocaleString('en-IN')}`
      });
    }

    let discountINR = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountINR = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountINR > coupon.maxDiscountAmount) {
        discountINR = coupon.maxDiscountAmount;
      }
    } else {
      discountINR = coupon.discountValue;
    }

    if (discountINR > orderAmount) {
      discountINR = orderAmount;
    }

    const finalAmountINR = orderAmount - discountINR;

    res.status(200).json({
      success: true,
      code: coupon.code,
      discountINR,
      finalAmountINR,
      message: `🎉 Applied ${coupon.code}! You saved ₹${discountINR.toLocaleString('en-IN')}`
    });
  } catch (error) {
    console.error('[Apply Coupon Error]:', error);
    res.status(500).json({ message: 'Server error applying coupon', error: error.message });
  }
};

/**
 * Create New Promo Coupon (Admin Only)
 */
export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiresAt } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ message: 'Code and discount value are required' });
    }

    const coupon = await CouponRepo.create({
      code,
      discountType: discountType || 'PERCENTAGE',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 10000,
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating coupon', error: error.message });
  }
};
