# 🚀 Production Deployment Guide for CinePass Ticket Booking Platform

This guide outlines step-by-step deployment instructions for hosting the **Node.js/Express persistent backend**, **React SPA frontend**, **MongoDB Atlas database**, **Upstash Redis lock engine**, and **Socket.io WebSocket server**.

---

## 🌟 Architecture Overview

```mermaid
graph TD
    Client["Vercel SPA (client/vercel.json) OR Render Static Site"] -->|HTTPS REST & WebSockets| Backend["Render Web Service (render.yaml Node.js API + Socket.io)"]
    Backend -->|MONGO_URI| MongoAtlas[("MongoDB Atlas Cloud Database")]
    Backend -->|REDIS_URL| UpstashRedis[("Upstash Redis (Distributed Locks & Queues)")]
```

---

## 📄 Infrastructure-as-Code Configuration Files

The repository includes pre-configured deployment blueprints:

1. **`render.yaml`** (Repo Root): Automatically provisions the persistent **Render Web Service** for `server/` and **Render Static Site** for `client/`.
2. **`client/vercel.json`** (Client Root): Pre-configured SPA rewrite rules for deploying `client/` to **Vercel** with clean client-side routing (`index.html` fallback).

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free **M0 Cluster**.
2. Go to **Network Access** ➔ Add IP Address ➔ `0.0.0.0/0` (Allow access from anywhere).
3. Go to **Database Access** ➔ Create a database user (e.g. `db_user` and password).
4. Click **Connect** ➔ Choose **Drivers (Node.js)** ➔ Copy connection URI:
   ```text
   mongodb+srv://db_user:<password>@cluster0.mongodb.net/ticket_booking?retryWrites=true&w=majority
   ```

---

## Step 2: Set Up Redis (Upstash Redis)

1. Go to [Upstash Redis](https://upstash.com) and create a Redis database.
2. Copy the **TLS Redis Connection URL**:
   ```text
   rediss://default:your_password@your_upstash_endpoint.upstash.io:6379
   ```

---

## Step 3: Deploy Backend Service on Render (`render.yaml` Blueprint)

1. Sign up at [Render.com](https://render.com) and connect your GitHub repository `anuj-k-bit/ticket`.
2. Click **New +** ➔ Select **Blueprint**.
3. Render will detect `render.yaml` and provision:
   - **Service**: `cinepass-backend` (Node.js Web Service)
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Enter Environment Variable secrets when prompted:
   - `MONGO_URI`: *(Your MongoDB Atlas connection URI)*
   - `REDIS_URL`: *(Your Upstash Redis connection URI)*
   - `JWT_SECRET`: *(Your random 64-character secret key)*
   - `CLIENT_URL`: *(Your deployed frontend URL e.g. https://cinepass.vercel.app)*
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `your_email@gmail.com`
   - `SMTP_PASS`: `your_app_password`
   - `RAZORPAY_KEY_ID`: `your_razorpay_key_id_placeholder`
   - `RAZORPAY_KEY_SECRET`: `your_razorpay_key_secret_placeholder`

---

## Step 4: Deploy React Frontend on Vercel (`client/vercel.json`)

### Vercel Deployment (Recommended for SPA Frontend)
1. Go to [Vercel.com](https://vercel.com) and import `anuj-k-bit/ticket`.
2. Set **Root Directory**: `client`
3. Vercel automatically detects `client/vercel.json` for SPA rewrites.
4. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://cinepass-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://cinepass-backend.onrender.com`
5. Click **Deploy**.

---

## Step 5: Post-Deployment Verification & Reviewer Credentials

### Pre-Seeded Demo Login Credentials for Evaluators:

| Role | Email Address | Password | Permitted Actions |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `password123` | Browse Indian events, hold 10-min seats, complete Razorpay checkout, receive QR ticket emails. |
| **Event Organiser** | `organiser@example.com` | `password123` | Schedule shows, configure section pricing, view live revenue analytics charts. |
| **Platform Admin** | `admin@example.com` | `password123` | Create venue templates, view oversight metrics, verify & check-in QR tickets. |

1. Test user sign up / sign in.
2. Test real-time seat map holds and Socket.io broadcasts.
3. Test Razorpay checkout and email ticket delivery with QR code.
