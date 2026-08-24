import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, UserRepo } from './src/models/User.js';
import { Venue, VenueRepo } from './src/models/Venue.js';
import { Show, ShowRepo } from './src/models/Show.js';
import { Seat, SeatRepo } from './src/models/Seat.js';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ticket:Chetna%400571@cluster0.i2jnq9v.mongodb.net/ticket_booking?retryWrites=true&w=majority';

async function runDirectCloudSeed() {
  console.log('=== SEEDING MULTIPLE CATEGORY EVENTS TO CLOUD MONGODB ATLAS ===');
  console.log('Connecting to Atlas URI:', MONGO_URI);

  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('[MongoDB Atlas] Connected successfully!');

    // Clean existing shows, venues, seats to ensure fresh populated data across all categories
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
      },
      {
        name: 'Nita Mukesh Ambani Cultural Centre (NMACC)',
        address: 'Bandra Kurla Complex',
        city: 'Mumbai, Maharashtra',
        sections: [
          { name: 'Grand Diamond Box (VIP)', rows: 4, seatsPerRow: 10 },
          { name: 'Balcony Lounge (Gold)', rows: 6, seatsPerRow: 14 },
          { name: 'Stalls Arena (Silver)', rows: 8, seatsPerRow: 16 }
        ]
      },
      {
        name: 'Kamani Auditorium',
        address: '1 Copernicus Marg, Mandi House',
        city: 'New Delhi, Delhi',
        sections: [
          { name: 'Front VIP Row', rows: 3, seatsPerRow: 10 },
          { name: 'Executive Gallery', rows: 6, seatsPerRow: 14 },
          { name: 'Rear Circle', rows: 8, seatsPerRow: 16 }
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
      console.log(`+ Created venue: ${vc.name} (${seatMapTemplate.length} seats)`);
      createdVenues.push(newVenue);
    }

    const wankhede = createdVenues[0];
    const motera = createdVenues[1];
    const nmacc = createdVenues[2];
    const kamani = createdVenues[3];

    // 3. Seed Shows Across ALL Categories
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
        title: 'Coldplay: Music of the Spheres World Tour',
        description: 'Global pop icons Coldplay bringing their breathtaking laser light stadium spectacle to India!',
        category: 'concert',
        venueId: String(wankhede._id || wankhede.id),
        seatTemplates: wankhede.seatMapTemplate,
        organiserId: String(organiserUser._id || organiserUser.id),
        startTime: new Date(Date.now() + 86400000 * 5),
        endTime: new Date(Date.now() + 86400000 * 5 + 14400000),
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Sachin Tendulkar Stand (VIP)', price: 18500 },
          { category: 'Garware Pavilion (Gold)', price: 9500 },
          { category: 'Vijay Merchant Stand (Silver)', price: 4500 }
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
        title: 'India vs Pakistan World T20 Showdown',
        description: 'The world biggest cricket rivalry live at the 132,000 capacity Narendra Modi Stadium in Ahmedabad!',
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
      },
      {
        title: 'Zakir Khan: Tathastu Live Comedy Special',
        description: 'India beloved Sakht Launda Zakir Khan performing his hit 90-minute standup comedy show live in Mumbai!',
        category: 'standup',
        venueId: String(nmacc._id || nmacc.id),
        seatTemplates: nmacc.seatMapTemplate,
        organiserId: String(organiserUser._id || organiserUser.id),
        startTime: new Date(Date.now() + 86400000 * 4),
        endTime: new Date(Date.now() + 86400000 * 4 + 7200000),
        bannerUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Grand Diamond Box (VIP)', price: 4999 },
          { category: 'Balcony Lounge (Gold)', price: 2999 },
          { category: 'Stalls Arena (Silver)', price: 1499 }
        ]
      },
      {
        title: 'Anubhav Singh Bassi: Bas Kar Bassi Live',
        description: 'Laugh out loud with Bassi relatable storytelling and hilarious anecdotes live at Mandi House, New Delhi.',
        category: 'standup',
        venueId: String(kamani._id || kamani.id),
        seatTemplates: kamani.seatMapTemplate,
        organiserId: String(organiserUser._id || organiserUser.id),
        startTime: new Date(Date.now() + 86400000 * 6),
        endTime: new Date(Date.now() + 86400000 * 6 + 7200000),
        bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Front VIP Row', price: 3999 },
          { category: 'Executive Gallery', price: 2499 },
          { category: 'Rear Circle', price: 1299 }
        ]
      },
      {
        title: 'Jawan 2: IMAX 3D Grand World Premiere',
        description: 'Witness Shah Rukh Khan in high-octane IMAX 3D action at the state-of-the-art NMACC theater auditorium!',
        category: 'movie',
        venueId: String(nmacc._id || nmacc.id),
        seatTemplates: nmacc.seatMapTemplate,
        organiserId: String(organiserUser._id || organiserUser.id),
        startTime: new Date(Date.now() + 86400000 * 2),
        endTime: new Date(Date.now() + 86400000 * 2 + 10800000),
        bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Grand Diamond Box (VIP)', price: 2500 },
          { category: 'Balcony Lounge (Gold)', price: 1500 },
          { category: 'Stalls Arena (Silver)', price: 800 }
        ]
      },
      {
        title: 'Mughal-e-Azam: The Epic Musical Drama',
        description: 'Feroz Abbas Khan grandeur production featuring live classical singing, Kathak dances, and Manish Malhotra costumes.',
        category: 'theater',
        venueId: String(nmacc._id || nmacc.id),
        seatTemplates: nmacc.seatMapTemplate,
        organiserId: String(organiserUser._id || organiserUser.id),
        startTime: new Date(Date.now() + 86400000 * 8),
        endTime: new Date(Date.now() + 86400000 * 8 + 10800000),
        bannerUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Grand Diamond Box (VIP)', price: 7500 },
          { category: 'Balcony Lounge (Gold)', price: 4500 },
          { category: 'Stalls Arena (Silver)', price: 2500 }
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

      console.log(`+ Created ${s.category.toUpperCase()} event & ${createdSeats.length} seats: ${s.title}`);
    }

    console.log('\n=== MULTI-CATEGORY SEEDING COMPLETED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL SEEDING ERROR:', err);
    process.exit(1);
  }
}

runDirectCloudSeed();
