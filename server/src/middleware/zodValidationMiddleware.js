import { z } from 'zod';

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issueMessage = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return res.status(400).json({
        error: {
          message: `Request validation failed: ${issueMessage}`,
          code: 400
        }
      });
    }
    next(err);
  }
};

// Zod Validation Schemas
export const schemas = {
  register: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['customer', 'organiser', 'admin']).optional()
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  createVenue: z.object({
    name: z.string().min(1, 'Venue name is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    sections: z
      .array(
        z.object({
          name: z.string().min(1, 'Section name is required'),
          rows: z.number().min(1, 'Rows must be at least 1'),
          seatsPerRow: z.number().min(1, 'Seats per row must be at least 1')
        })
      )
      .min(1, 'At least one section layout is required')
  }),

  createShow: z.object({
    title: z.string().min(1, 'Show title is required'),
    description: z.string().optional(),
    category: z.enum(['movie', 'concert', 'theater', 'standup', 'sports']),
    venueId: z.string().min(1, 'Venue ID is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    bannerUrl: z.string().optional(),
    pricing: z
      .array(
        z.object({
          category: z.string().min(1, 'Category is required'),
          price: z.number().min(1, 'Price must be positive')
        })
      )
      .min(1, 'Pricing is required')
  }),

  holdSeat: z.object({
    ttlSeconds: z.number().optional()
  }).optional(),

  confirmBooking: z.object({
    showId: z.string().min(1, 'Show ID is required'),
    seatIds: z.array(z.string()).optional(),
    seatId: z.string().optional()
  }),

  joinWaitlist: z.object({
    showId: z.string().min(1, 'Show ID is required'),
    category: z.string().min(1, 'Category is required')
  }),

  checkInTicket: z.object({
    bookingRef: z.string().min(1, 'Booking reference is required')
  })
};
