import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const inMemoryUsers = new Map();

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['customer', 'organiser', 'admin'],
      default: 'customer'
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);

export const UserRepo = {
  async findOne(filter, selectFields) {
    if (mongoose.connection.readyState === 1) {
      const query = User.findOne(filter);
      if (selectFields) query.select(selectFields);
      return await query;
    }
    if (filter.email) {
      const found = Array.from(inMemoryUsers.values()).find(
        (u) => u.email.toLowerCase() === filter.email.toLowerCase()
      );
      if (!found) return null;
      return {
        ...found,
        comparePassword: async (pwd) => await bcrypt.compare(pwd, found.password),
        select: function () { return this; }
      };
    }
    return null;
  },

  async create({ name, email, password, role }) {
    if (mongoose.connection.readyState === 1) {
      return await User.create({ name, email, password, role });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const userDoc = {
      _id: id,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'customer',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryUsers.set(id, userDoc);
    return userDoc;
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return await User.findById(id);
    }
    const found = inMemoryUsers.get(id);
    if (!found) return null;
    return {
      _id: found._id,
      name: found.name,
      email: found.email,
      role: found.role
    };
  },

  async find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return await User.find(filter);
    }
    let list = Array.from(inMemoryUsers.values());
    if (filter.role) {
      list = list.filter((u) => u.role === filter.role);
    }
    return list;
  }
};
