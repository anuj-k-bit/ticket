# 🚀 Production Deployment Guide for CinePass Ticket Booking Platform

This guide outlines step-by-step deployment instructions for hosting the **Node.js/Express backend**, **React frontend**, **MongoDB database**, **Redis cache/lock engine**, and **Socket.io WebSocket server**.

---

## 🌟 Recommended Deployment Architecture: Render + MongoDB Atlas

Render is the simplest and most reliable hosting platform for Node.js + Socket.io applications.

```mermaid
graph TD
    Client["Vercel / Render Static Site (React Client)"] -->|HTTPS REST & WebSockets| Backend["Render Web Service (Express API + Socket.io)"]
    Backend -->|MongoDB URI| MongoAtlas[("MongoDB Atlas (Cloud Cluster)")]
    Backend -->|REDIS_URL| UpstashRedis[("Upstash / Render Redis (Distributed Locks)")]
```

---

## Step 1: Set Up MongoDB Atlas (Free Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free **M0 Cluster**.
2. Go to **Network Access** ➔ Add IP Address ➔ `0.0.0.0/0` (Allow access from anywhere).
3. Go to **Database Access** ➔ Create a database user (e.g. `db_user` and password).
4. Click **Connect** ➔ Choose **Drivers (Node.js)** ➔ Copy connection URI:
   ```text
   mongodb+srv://db_user:<password>@cluster0.mongodb.net/ticket_booking?retryWrites=true&w=majority
   ```

---

## Step 2: Set Up Redis (Upstash or Render Redis)

1. Go to [Upstash Redis](https://upstash.com) or Render Redis.
2. Create a Redis database instance.
3. Copy the **Redis Connection URL**:
   ```text
   rediss://default:your_password@your_upstash_endpoint.upstash.io:6379
   ```

---

## Step 3: Deploy Backend Service on Render

1. Sign up at [Render.com](https://render.com) and connect your GitHub repository `anuj-k-bit/ticket`.
2. Click **New +** ➔ Select **Web Service**.
3. Configure the service:
   - **Name**: `cinepass-backend`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Add **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: *(Your MongoDB Atlas connection URI)*
   - `REDIS_URL`: *(Your Upstash / Render Redis URL)*
   - `JWT_SECRET`: *(Your random 64-character secret key)*
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `your_email@gmail.com`
   - `SMTP_PASS`: `your_app_password`
   - `RAZORPAY_KEY_ID`: `rzp_test_R4e941G0XJ5k2E`
   - `RAZORPAY_KEY_SECRET`: `w881VqT01N7PzE6N8K348e02`
   - `CLIENT_URL`: *(Your deployed frontend URL e.g. https://cinepass.onrender.com)*
5. Click **Create Web Service**. Render will build and launch your API on `https://cinepass-backend.onrender.com`.

---

## Step 4: Deploy React Frontend on Vercel or Render Static Site

### Option A: Vercel (Recommended for Frontend)
1. Go to [Vercel.com](https://vercel.com) and import `anuj-k-bit/ticket`.
2. Set **Root Directory**: `client`
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://cinepass-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://cinepass-backend.onrender.com`
6. Click **Deploy**.

---

## Step 5: Post-Deployment Verification

1. Test user sign up / sign in.
2. Test real-time seat map holds and Socket.io broadcasts.
3. Test Razorpay checkout and email ticket delivery with QR code.
