import express from 'express';
import { getOrganiserAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/organiser', protect, authorize('organiser', 'admin'), getOrganiserAnalytics);

export default router;
