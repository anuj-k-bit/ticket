import express from 'express';
import {
  joinWaitlist,
  getMyWaitlistEntries,
  cancelWaitlistEntry
} from '../controllers/waitlistController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateBody, schemas } from '../middleware/zodValidationMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/join', validateBody(schemas.joinWaitlist), joinWaitlist);
router.get('/my-entries', getMyWaitlistEntries);
router.delete('/:id', cancelWaitlistEntry);

export default router;
