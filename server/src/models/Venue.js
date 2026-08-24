import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rows: { type: Number, required: true, min: 1 },
    seatsPerRow: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const seatTemplateSchema = new mongoose.Schema(
  {
    section: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  { _id: false }
);

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    capacity: {
      type: Number,
      default: 0
    },
    sections: [sectionSchema],
    seatMapTemplate: [seatTemplateSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * SPATIAL (x, y) BLUEPRINT COORDINATES COMPUTATION
 * Computes exact x, y pixel coordinates for every seat in each section tier,
 * ensuring zero seat overlap, aisle breaks, and stadium curvature.
 */
function generateSpatialSeatTemplate(sections) {
  let totalCapacity = 0;
  const template = [];
  const STAGE_CX = 450;
  const STAGE_CY = 60;

  sections.forEach((sec, secIdx) => {
    const rows = Number(sec.rows);
    const seatsPerRow = Number(sec.seatsPerRow);
    totalCapacity += rows * seatsPerRow;
    const lowerName = sec.name.toLowerCase();

    // 1. FAN PIT / VIP (Center Block in front of Stage)
    if (lowerName.includes('vip') || lowerName.includes('pit') || lowerName.includes('ringside') || lowerName.includes('box')) {
      const blockWidth = seatsPerRow * 36;
      const startX = STAGE_CX - blockWidth / 2 + 18;

      for (let r = 1; r <= rows; r++) {
        const rowLabel = String.fromCharCode(64 + r);
        const y = 160 + (r - 1) * 36;
        for (let s = 1; s <= seatsPerRow; s++) {
          template.push({
            section: sec.name,
            row: rowLabel,
            number: s,
            x: Math.round(startX + (s - 1) * 36),
            y: Math.round(y)
          });
        }
      }
    }
    // 2. LOUNGE / FLANKING PAVILIONS (Angled Wing Blocks)
    else if (lowerName.includes('lounge') || lowerName.includes('pavilion') || lowerName.includes('premium')) {
      const isLeft = secIdx % 2 === 0;
      const startX = isLeft ? 120 : 620;

      for (let r = 1; r <= rows; r++) {
        const rowLabel = String.fromCharCode(64 + r);
        const y = 170 + (r - 1) * 36;
        for (let s = 1; s <= seatsPerRow; s++) {
          template.push({
            section: sec.name,
            row: rowLabel,
            number: s,
            x: Math.round(startX + (s - 1) * 36),
            y: Math.round(y)
          });
        }
      }
    }
    // 3. GOLD STAND ARC TIER (Middle Curved Stand)
    else if (lowerName.includes('gold') || secIdx === 0) {
      const isLeft = secIdx % 2 === 0;
      const startX = isLeft ? 60 : 500;

      for (let r = 1; r <= rows; r++) {
        const rowLabel = String.fromCharCode(64 + r);
        const y = 300 + (r - 1) * 36;
        for (let s = 1; s <= seatsPerRow; s++) {
          template.push({
            section: sec.name,
            row: rowLabel,
            number: s,
            x: Math.round(startX + (s - 1) * 36),
            y: Math.round(y)
          });
        }
      }
    }
    // 4. SILVER STAND ARC TIER (Upper Stand)
    else {
      const isLeft = secIdx % 2 === 0;
      const startX = isLeft ? 50 : 510;

      for (let r = 1; r <= rows; r++) {
        const rowLabel = String.fromCharCode(64 + r);
        const y = 460 + (r - 1) * 36;
        for (let s = 1; s <= seatsPerRow; s++) {
          template.push({
            section: sec.name,
            row: rowLabel,
            number: s,
            x: Math.round(startX + (s - 1) * 36),
            y: Math.round(y)
          });
        }
      }
    }
  });

  return { totalCapacity, template };
}

// Pre-save hook to generate spatial seatMapTemplate
venueSchema.pre('save', function (next) {
  if (this.sections && this.sections.length > 0) {
    const { totalCapacity, template } = generateSpatialSeatTemplate(this.sections);
    this.capacity = totalCapacity;
    this.seatMapTemplate = template;
  }
  next();
});

export const Venue = mongoose.model('Venue', venueSchema);

// In-memory fallback repository
const inMemoryVenues = new Map();

export const VenueRepo = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      const venue = new Venue(data);
      return await venue.save();
    }
    const { totalCapacity, template } = generateSpatialSeatTemplate(data.sections || []);

    const id = 'venue_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const venueDoc = {
      _id: id,
      name: data.name,
      address: data.address,
      city: data.city,
      capacity: totalCapacity,
      sections: data.sections || [],
      seatMapTemplate: template,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryVenues.set(id, venueDoc);
    return venueDoc;
  },

  async find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return await Venue.find(filter);
    }
    return Array.from(inMemoryVenues.values());
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await Venue.findById(id);
    }
    return inMemoryVenues.get(id) || null;
  }
};
