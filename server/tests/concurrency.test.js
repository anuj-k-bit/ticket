process.env.JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { ShowRepo } from '../src/models/Show.js';
import { SeatRepo } from '../src/models/Seat.js';
import { UserRepo } from '../src/models/User.js';

describe('High-Concurrency Seat Lock Test', () => {
  let showId;
  let seatId;
  let userTokens = [];

  beforeAll(async () => {
    // 1. Create seed Show & Seat in Repository
    const show = await ShowRepo.create({
      title: 'Concurrency Test Live Event',
      category: 'concert',
      venue: 'venue_concurrency_123',
      organiser: 'organiser_concurrency_123',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      pricing: [{ category: 'VIP', price: 5000 }]
    });
    showId = String(show._id);

    const createdSeats = await SeatRepo.createSeatsForShow({
      showId,
      venueId: 'venue_concurrency_123',
      seatTemplates: [{ category: 'VIP', row: 'A', number: 1 }],
      pricingMap: { VIP: 5000 }
    });

    seatId = String(createdSeats[0]._id);

    // 2. Create 20 Fake Users & Issue JWT Tokens
    const jwtSecret = process.env.JWT_SECRET;
    for (let i = 1; i <= 20; i++) {
      const user = await UserRepo.create({
        name: `Fake User ${i}`,
        email: `fakeuser_${Date.now()}_${i}@example.com`,
        password: 'hashedpassword123',
        role: 'customer'
      });

      const token = jwt.sign({ id: String(user._id || user.id), role: user.role }, jwtSecret, {
        expiresIn: '1h'
      });
      userTokens.push(token);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  test('Fires 20 simultaneous seat hold requests: exactly 1 succeeds (200) and 19 get 409 Conflict', async () => {
    console.log(`\n🚀 Firing 20 simultaneous POST requests for seat ${seatId}...`);

    // Fire 20 simultaneous requests at the exact same instant using Promise.all
    const requests = userTokens.map((token) =>
      request(app)
        .post(`/api/shows/${showId}/seats/${seatId}/hold`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ttlSeconds: 600 })
    );

    const responses = await Promise.all(requests);

    const status200Count = responses.filter((r) => r.status === 200).length;
    const status409Count = responses.filter((r) => r.status === 409).length;

    console.log(`✅ 200 OK Responses (Success): ${status200Count}`);
    console.log(`🛑 409 Conflict Responses (Blocked): ${status409Count}`);

    // Assertions
    expect(status200Count).toBe(1);
    expect(status409Count).toBe(19);

    // Verify Seat status in Database is HELD
    const dbSeat = await SeatRepo.findById(seatId);
    expect(dbSeat.status).toBe('HELD');
    expect(dbSeat.heldBy).not.toBeNull();
  });
});
