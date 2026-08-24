import express from 'express';
import { applyCoupon, createCoupon } from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/apply', protect, applyCoupon);
router.post('/', protect, authorize('admin'), createCoupon);

export default router;
