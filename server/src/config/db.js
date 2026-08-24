import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ticket_booking';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection Warning: ${error.message}`);
    console.log('[MongoDB] Ensure MongoDB daemon is running locally or MONGO_URI in .env is configured.');
    // Do not crash process, allow server to run for route testing
  }
};
