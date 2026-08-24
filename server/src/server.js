import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';
import { seedInitialCloudData } from './utils/seedData.js';

dotenv.config({ path: '../.env' });

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io attached to HTTP Server
initSocket(server, process.env.CLIENT_URL);

// Connect DB, Seed Demo Accounts, and Start Server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialCloudData();
    server.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`[Server] Startup Failure: ${error.message}`);
    process.exit(1);
  }
};

startServer();
