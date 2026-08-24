import express from 'express';
import {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue
} from '../controllers/venueController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateBody, schemas } from '../middleware/zodValidationMiddleware.js';

const router = express.Router();

router.get('/', getVenues);
router.get('/:id', getVenueById);

router.post('/', protect, authorize('admin'), validateBody(schemas.createVenue), createVenue);
router.put('/:id', protect, authorize('admin'), validateBody(schemas.createVenue), updateVenue);
router.delete('/:id', protect, authorize('admin'), deleteVenue);

export default router;
