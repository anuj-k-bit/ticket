import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, UserRepo } from './src/models/User.js';
import { Venue, VenueRepo } from './src/models/Venue.js';
import { Show, ShowRepo } from './src/models/Show.js';
import { Seat, SeatRepo } from './src/models/Seat.js';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ticket:Chetna%400571@cluster0.i2jnq9v.mongodb.net/ticket_booking?retryWrites=true&w=majority';

async function runDirectCloudSeed() {
  console.log('=== DIRECT CLOUD MONGODB ATLAS SEEDING ===');
  console.log('Connecting to Atlas URI:', MONGO_URI);

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('[MongoDB Atlas] Connected successfully!');

    // Clean existing shows, venues, seats to ensure fresh data
    await Show.deleteMany({});
    await Venue.deleteMany({});
    await Seat.deleteMany({});
    console.log('[MongoDB Atlas] Cleaned old show, venue, and seat documents.');

    // 1. Create Default Users
    const defaultAccounts = [
      { name: 'CinePass Customer', email: 'customer@example.com', password: 'password123', role: 'customer' },
      { name: 'Event Organiser', email: 'organiser@example.com', password: 'password123', role: 'organiser' },
      { name: 'Platform Admin', email: 'admin@example.com', password: 'password123', role: 'admin' }
    ];

    let userMap = {};
    for (const acc of defaultAccounts) {
      let u = await UserRepo.findOne({ email: acc.email }, '+password');
      if (!u) {
        u = await UserRepo.create(acc);
        console.log(`+ Created user: ${acc.email} (${acc.role})`);
      } else {
        u.password = 'password123';
        if (typeof u.save === 'function') await u.save();
        console.log(`~ Updated demo password for: ${acc.email}`);
      }
      userMap[acc.role] = u;
    }

    const adminUser = userMap.admin || userMap.organiser;
    const organiserUser = userMap.organiser || userMap.admin;

    // 2. Create Iconic Venues
    const venueConfigs = [
      {
        name: 'Wankhede Stadium',
        address: 'D Road, Churchgate',
        city: 'Mumbai, Maharashtra',
        sections: [
          { name: 'Sachin Tendulkar Stand (VIP)', rows: 4, seatsPerRow: 12 },
          { name: 'Garware Pavilion (Gold)', rows: 8, seatsPerRow: 16 },
          { name: 'Vijay Merchant Stand (Silver)', rows: 10, seatsPerRow: 20 }
        ]
      },
      {
        name: 'Narendra Modi Stadium',
        address: 'Stadium Road, Motera',
        city: 'Ahmedabad, Gujarat',
        sections: [
          { name: 'Presidential VIP Box', rows: 4, seatsPerRow: 12 },
          { name: 'Platinum Stand', rows: 8, seatsPerRow: 16 },
          { name: 'Gold Stand', rows: 10, seatsPerRow: 20 }
        ]
      }
    ];

    const generateSeatTemplates = (secs) => {
      const templates = [];
      let currentY = 50;
      secs.forEach((sec) => {
        for (let r = 0; r < sec.rows; r++) {
          const rowChar = String.fromCharCode(65 + r);
          for (let n = 1; n <= sec.seatsPerRow; n++) {
            templates.push({
              section: sec.name,
              row: rowChar,
              number: n,
              x: 50 + (n - 1) * 35,
              y: currentY
            });
          }
          currentY += 40;
        }
        currentY += 60;
      });
      return templates;
    };

    let createdVenues = [];
    for (const vc of venueConfigs) {
      const seatMapTemplate = generateSeatTemplates(vc.sections);
      const newVenue = await VenueRepo.create({
        name: vc.name,
        address: vc.address,
        city: vc.city,
        sections: vc.sections,
        seatMapTemplate,
        capacity: seatMapTemplate.length,
        createdBy: adminUser._id
      });
      console.log(`+ Created venue: ${vc.name} with ${seatMapTemplate.length} seat templates`);
      createdVenues.push(newVenue);
    }

    const wankhede = createdVenues[0];
    const motera = createdVenues[1];

    // 3. Create Shows
    const showsToCreate = [
      {
        title: 'A.R. Rahman: Dil Se Live Concert 2026',
        description: 'Experience Oscar-winning composer A.R. Rahman performing live at Wankhede Stadium with a full 50-piece orchestra and guest vocalists.',
        category: 'concert',
        venueId: String(wankhede._id || wankhede.id),
        seatTemplates: wankhede.seatMapTemplate,
        organiserId: String(organiserUser._id || organiserUser.id),
        startTime: new Date(Date.now() + 86400000 * 3),
        endTime: new Date(Date.now() + 86400000 * 3 + 14400000),
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Sachin Tendulkar Stand (VIP)', price: 12500 },
          { category: 'Garware Pavilion (Gold)', price: 6500 },
          { category: 'Vijay Merchant Stand (Silver)', price: 3500 }
        ]
      },
      {
        title: 'IPL 2026 Final: Mumbai Indians vs Chennai Super Kings',
        description: 'The ultimate rivalry in T20 cricket! Catch MI vs CSK battling for the championship trophy under lights at Wankhede Stadium.',
        category: 'sports',
        venueId: String(wankhede._id || wankhede.id),
        seatTemplates: wankhede.seatMapTemplate,
        organiserId: String(organiserUser._id || organiserUser.id),
        startTime: new Date(Date.now() + 86400000 * 7),
        endTime: new Date(Date.now() + 86400000 * 7 + 18000000),
        bannerUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Sachin Tendulkar Stand (VIP)', price: 25000 },
          { category: 'Garware Pavilion (Gold)', price: 12000 },
          { category: 'Vijay Merchant Stand (Silver)', price: 5000 }
        ]
      },
      {
        title: 'World T20 Championship Final 2026',
        description: 'The biggest international cricket showdown live at the world largest stadium in Ahmedabad!',
        category: 'sports',
        venueId: String(motera._id || motera.id),
        seatTemplates: motera.seatMapTemplate,
        organiserId: String(organiserUser._id || organiserUser.id),
        startTime: new Date(Date.now() + 86400000 * 12),
        endTime: new Date(Date.now() + 86400000 * 12 + 18000000),
        bannerUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Presidential VIP Box', price: 35000 },
          { category: 'Platinum Stand', price: 18000 },
          { category: 'Gold Stand', price: 8500 }
        ]
      }
    ];

    for (const s of showsToCreate) {
      const createdShow = await ShowRepo.create({
        title: s.title,
        description: s.description,
        category: s.category,
        venue: s.venueId,
        organiser: s.organiserId,
        startTime: s.startTime,
        endTime: s.endTime,
        bannerUrl: s.bannerUrl,
        pricing: s.pricing,
        status: 'upcoming'
      });

      const pricingMap = {};
      s.pricing.forEach((p) => { pricingMap[p.category] = p.price; });

      const createdSeats = await SeatRepo.createSeatsForShow({
        showId: String(createdShow._id || createdShow.id),
        venueId: s.venueId,
        seatTemplates: s.seatTemplates,
        pricingMap
      });

      console.log(`+ Created show & ${createdSeats.length} stadium seats: ${s.title}`);
    }

    console.log('\n=== CLOUD ATLAS SEEDING COMPLETED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL SEEDING ERROR:', err);
    process.exit(1);
  }
}

runDirectCloudSeed();
