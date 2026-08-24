import express from 'express';
import { createRazorpayOrder, verifyPaymentSignature } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPaymentSignature);

export default router;
