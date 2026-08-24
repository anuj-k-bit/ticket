import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';
import { seedInitialCloudData } from './utils/seedData.js';

// Import workers to initialize BullMQ background jobs
import './workers/holdWorker.js';
import './workers/emailWorker.js';
import './workers/waitlistWorker.js';

dotenv.config({ path: '../.env' });

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io attached to HTTP Server
initSocket(server, process.env.CLIENT_URL);

// Start HTTP Server immediately so cloud proxies (Render/Vercel) bind $PORT instantly
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
  try {
    await connectDB();
    await seedInitialCloudData();
  } catch (error) {
    console.error(`[Server] Non-fatal DB/Seeder initialization warning: ${error.message}`);
  }
});
