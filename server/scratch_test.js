import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

console.log('Testing MONGO_URI:', process.env.MONGO_URI);

try {
  const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('SUCCESS! Connected to MongoDB Atlas host:', conn.connection.host);
  process.exit(0);
} catch (e) {
  console.error('FAIL! MongoDB error:', e.message);
  process.exit(1);
}
