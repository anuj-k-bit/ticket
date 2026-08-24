import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { UserRepo } from '../models/User.js';
import { VenueRepo } from '../models/Venue.js';
import { ShowRepo } from '../models/Show.js';
import { SeatRepo } from '../models/Seat.js';

export const seedInitialCloudData = async (force = false) => {
  try {
    await connectDB();

    // 1. Ensure Default Demo Accounts Exist
    const defaultAccounts = [
      { name: 'CinePass Customer', email: 'customer@example.com', password: 'password123', role: 'customer' },
      { name: 'Event Organiser', email: 'organiser@example.com', password: 'password123', role: 'organiser' },
      { name: 'Platform Admin', email: 'admin@example.com', password: 'password123', role: 'admin' }
    ];

    let seededUserMap = {};
    for (const acc of defaultAccounts) {
      try {
        let existing = await UserRepo.findOne({ email: acc.email }, '+password');
        if (!existing) {
          existing = await UserRepo.create(acc);
          console.log(`[Database Seeder] Created default user: ${acc.email}`);
        } else if (typeof existing.comparePassword === 'function') {
          const matches = await existing.comparePassword('password123');
          if (!matches) {
            existing.password = 'password123';
            if (typeof existing.save === 'function') await existing.save();
            console.log(`[Database Seeder] Updated password for demo user: ${acc.email}`);
          }
        }
        seededUserMap[acc.role] = existing;
      } catch (err) {
        console.error(`[Database Seeder User Error] ${acc.email}:`, err.message);
      }
    }

    const adminUser = seededUserMap.admin || seededUserMap.organiser || seededUserMap.customer;
    const adminId = adminUser?._id || adminUser?.id || new mongoose.Types.ObjectId();
    const organiserUser = seededUserMap.organiser || seededUserMap.admin || adminUser;
    const organiserId = organiserUser?._id || organiserUser?.id || adminId;

    // 2. Check if Shows exist, if not seed default Indian venues & shows
    const existingShows = await ShowRepo.find();
    if (!force && existingShows && existingShows.length > 0) {
      console.log(`[Database Seeder] ${existingShows.length} shows already exist in database.`);
      return existingShows;
    }

    console.log('[Database Seeder] Seeding default Indian venues and shows...');

    const sections = [
      { name: 'Sachin Tendulkar Stand (VIP)', rows: 4, seatsPerRow: 12 },
      { name: 'Garware Pavilion (Gold)', rows: 8, seatsPerRow: 16 },
      { name: 'Vijay Merchant Stand (Silver)', rows: 10, seatsPerRow: 20 }
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

    const seatMapTemplate = generateSeatTemplates(sections);
    const capacity = seatMapTemplate.length;

    let venue = await VenueRepo.create({
      name: 'Wankhede Stadium',
      address: 'D Road, Churchgate',
      city: 'Mumbai, Maharashtra',
      sections,
      seatMapTemplate,
      capacity,
      createdBy: adminId
    });

    const venueId = String(venue._id || venue.id || new mongoose.Types.ObjectId());

    const showsToSeed = [
      {
        title: 'A.R. Rahman: Dil Se Live Concert 2026',
        category: 'concert',
        venueId,
        organiserId: String(organiserId),
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
        category: 'concert',
        venueId,
        organiserId: String(organiserId),
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
        category: 'sports',
        venueId,
        organiserId: String(organiserId),
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
        title: 'Zakir Khan: Tathastu Live Comedy Special',
        category: 'standup',
        venueId,
        organiserId: String(organiserId),
        startTime: new Date(Date.now() + 86400000 * 4),
        endTime: new Date(Date.now() + 86400000 * 4 + 7200000),
        bannerUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Sachin Tendulkar Stand (VIP)', price: 4999 },
          { category: 'Garware Pavilion (Gold)', price: 2999 },
          { category: 'Vijay Merchant Stand (Silver)', price: 1499 }
        ]
      },
      {
        title: 'Jawan 2: IMAX 3D Grand World Premiere',
        category: 'movie',
        venueId,
        organiserId: String(organiserId),
        startTime: new Date(Date.now() + 86400000 * 2),
        endTime: new Date(Date.now() + 86400000 * 2 + 10800000),
        bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Sachin Tendulkar Stand (VIP)', price: 2500 },
          { category: 'Garware Pavilion (Gold)', price: 1500 },
          { category: 'Vijay Merchant Stand (Silver)', price: 800 }
        ]
      },
      {
        title: 'Mughal-e-Azam: The Epic Musical Drama',
        category: 'theater',
        venueId,
        organiserId: String(organiserId),
        startTime: new Date(Date.now() + 86400000 * 8),
        endTime: new Date(Date.now() + 86400000 * 8 + 10800000),
        bannerUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
        pricing: [
          { category: 'Sachin Tendulkar Stand (VIP)', price: 7500 },
          { category: 'Garware Pavilion (Gold)', price: 4500 },
          { category: 'Vijay Merchant Stand (Silver)', price: 2500 }
        ]
      }
    ];

    const createdShowsList = [];

    for (const s of showsToSeed) {
      const createdShow = await ShowRepo.create({
        title: s.title,
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
      s.pricing.forEach((p) => {
        pricingMap[p.category] = p.price;
      });

      await SeatRepo.createSeatsForShow({
        showId: String(createdShow._id || createdShow.id),
        venueId: s.venueId,
        seatTemplates: seatMapTemplate,
        pricingMap
      });

      createdShowsList.push(createdShow);
      console.log(`[Database Seeder] Created show & seats: ${s.title}`);
    }

    console.log('[Database Seeder] Initial database seeding completed successfully!');
    return createdShowsList;
  } catch (err) {
    console.error('[Database Seeder Error]:', err);
    return [];
  }
};
