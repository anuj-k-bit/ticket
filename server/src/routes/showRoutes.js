import express from 'express';
import {
  createShow,
  getShows,
  getOrganiserShows,
  getShowById,
  getShowSeats,
  updateShow,
  deleteShow,
  holdSeatController,
  releaseSeatController
} from '../controllers/showController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { holdLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateBody, schemas } from '../middleware/zodValidationMiddleware.js';

const router = express.Router();

router.get('/', getShows);
router.get('/:id', getShowById);
router.get('/:id/seats', getShowSeats);

// Protected hold and release endpoints
router.post('/:showId/seats/:seatId/hold', protect, holdLimiter, holdSeatController);
router.post('/:showId/seats/:seatId/release', protect, releaseSeatController);

router.get('/organiser/my-shows', protect, authorize('organiser', 'admin'), getOrganiserShows);

router.post(
  '/',
  protect,
  authorize('organiser', 'admin'),
  validateBody(schemas.createShow),
  createShow
);

router.put('/:id', protect, authorize('organiser', 'admin'), updateShow);
router.delete('/:id', protect, authorize('organiser', 'admin'), deleteShow);

export default router;
