# 🎟️ CinePass - Ticket Booking & High-Concurrency Seating Platform

A production-grade, high-concurrency ticket booking platform built with **Node.js, Express, React, Tailwind CSS, MongoDB, Redis, BullMQ, and Socket.io**.

Engineered for large-scale stadium events (5,000–10,000+ seats), this platform prevents double-booking through distributed Redis locking, enforces atomic database state mutations, manages 10-minute seat holds with BullMQ delayed job expirations, automatically cascades cancelled tickets to waitlisted customers, and pushes real-time WebSocket seat map updates.

---

## 🔑 Demo Login Credentials for Reviewers & Evaluators

You can log in to the live platform using any of the pre-seeded accounts below:

| Role | Email Address | Password | Permitted Actions & Feature Access |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@example.com` | `password123` | Browse Indian events, hold 10-min seats, complete Razorpay checkout, receive QR ticket emails, join waitlists. |
| **Event Organiser** | `organiser@example.com` | `password123` | Schedule shows, configure section pricing, view live revenue & category sales analytics charts. |
| **Platform Admin** | `admin@example.com` | `password123` | Create & edit venue seat templates, platform-wide oversight metrics, verify & check-in QR tickets. |

---

## 🏗️ System Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Frontend Presentation Layer (React + Vite)"]
        UI["React Web Application (Port 5173)"]
        SocketClient["Socket.io Client (Real-Time Seats)"]
        AxiosClient["Axios HTTP Client (REST API)"]
    end

    subgraph API ["Backend API & Service Layer (Express.js - Port 5000)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
        ShowController["Show & Seating Controller"]
        PaymentController["Razorpay & Payment Controller"]
        CouponController["Promo Coupon Engine"]
        AnalyticsController["Organiser Revenue Analytics Controller"]
        SocketServer["Socket.io Server (Room Broadcasting)"]
    end

    subgraph Concurrency ["Distributed Concurrency & Locking Engine"]
        RedisLock["Redis Distributed Lock (SET key token NX EX 600)"]
        LuaRelease["Atomic Lua Lock Release (GET + Compare + DEL)"]
        BullMQWorker["BullMQ Delayed Job Queue (10-Min Hold Expiry & Waitlist Cascades)"]
        CronCleanup["Periodic Stale Hold Cleanup Engine (60s Repeatable Job)"]
    end

    subgraph Storage ["Persistent Database Layer"]
        MongoDB[("MongoDB Database (Atomic updateOne / findOneAndUpdate)")]
        CompoundIndexes[("Compound Index: { show, category, status, joinedAt }")]
    end

    subgraph Services ["External Services & Notification Engine"]
        RazorpayGateway["Razorpay Payment Gateway (HMAC SHA256 Verification)"]
        EmailEngine["Universal Email Service (Nodemailer + Gmail SMTP / Resend)"]
    end

    %% Client Interactions
    UI --> AxiosClient
    UI --> SocketClient

    %% API Requests
    AxiosClient --> AuthMiddleware
    AuthMiddleware --> ShowController
    AuthMiddleware --> PaymentController
    AuthMiddleware --> CouponController
    AuthMiddleware --> AnalyticsController

    %% Concurrency & Locking
    ShowController -->|Acquire Lock with UUID Token| RedisLock
    ShowController -->|Schedule Expiry| BullMQWorker
    PaymentController -->|Atomic Lua Release| LuaRelease
    CronCleanup -->|Clean Expired Holds| MongoDB

    %% Database Operations
    ShowController -->|Atomic Conditional Update| MongoDB
    PaymentController -->|Atomic Booking Mutation| MongoDB
    AnalyticsController -->|Read Sales & Index Scan| CompoundIndexes

    %% Socket Real-Time Updates
    ShowController -->|Broadcast seat_updated| SocketServer
    BullMQWorker -->|Broadcast seat_expired| SocketServer
    SocketServer -->|Push to Clients| SocketClient

    %% External Payments & Emails
    PaymentController -->|Verify HMAC Signature| RazorpayGateway
    PaymentController -->|Dispatch QR Ticket Email| EmailEngine
```

---

## 🏛️ System Component Breakdown

1. **Frontend Presentation Layer (`/client`)**:
   - **React 18 + Vite**: High-performance UI rendering with glassmorphic styling, neon stadium arches, and staggered row seating maps.
   - **Socket.io Client**: Listens to real-time `seat_updated` events to flip seat colors (`AVAILABLE` ➔ `HELD` ➔ `BOOKED`) across all connected browsers without page reloads.
   - **Recharts Analytics**: Interactive bar charts and pie charts rendering live revenue and sales metrics for event organizers.

2. **Backend API & Service Layer (`/server`)**:
   - **Express.js API Router**: Handles authentication, show scheduling, seat holds, payment checkout, promo coupons, and analytics.
   - **Strict Security Enforcement**:
     - **CORS Whitelist Control**: Non-whitelisted origin requests receive `callback(new Error('Not allowed by CORS'))`.
     - **Mandatory `JWT_SECRET` Assertion**: Refuses to start if `JWT_SECRET` is missing (no insecure default secret fallbacks).
     - **Single Confirmation Entry Point**: `/api/payments/verify` requires mandatory `razorpay_signature` HMAC SHA256 signature verification before confirming tickets (un-authenticated `/confirm` route deleted).
   - **Universal Email Engine (`emailService.js`)**: Dispatches dark-mode HTML ticket passes with embedded QR codes via Nodemailer (Gmail SMTP or Resend).

3. **Concurrency & Lock Engine (Redis + BullMQ)**:
   - **Redis Lock Acquisition**: Atomic `SET hold:{showId}:{seatId} lockToken NX EX 600` storing unique `crypto.randomUUID()` tokens.
   - **Safe Atomic Lock Release via Lua Script**: Lock releases use an atomic Lua script (`GET + compare + DEL` via `EVAL`) ensuring processes cannot accidentally delete locks owned by other users.
   - **60-Second Periodic Stale Hold Cleanup**: A 60-second BullMQ repeatable job recovers expired holds in the event of a Redis restart, eliminating orphaned `HELD` seats.

4. **Persistent Database Layer (MongoDB)**:
   - **Atomic Conditional Updates**: `Seat.findOneAndUpdate({ _id: seatId, status: 'HELD', heldBy: userId, holdExpiresAt: { $gt: now } })` preventing document mutation race conditions.
   - **Optimized Compound Indexing**:
     - Uniqueness Index: `{ show: 1, user: 1, category: 1, status: 1 }` (`unique: true`)
     - Claim Priority Lookup Index: `{ show: 1, category: 1, status: 1, joinedAt: 1 }` (enables direct `IXSCAN` index scans for FIFO waitlist matching).

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Socket.io-client, Lucide Icons, Axios
- **Backend**: Node.js, Express.js, Socket.io, JWT Authentication, `bcryptjs`, `helmet`, `express-mongo-sanitize`
- **Database**: MongoDB with Mongoose ODM
- **In-Memory Cache & Distributed Lock**: Redis (`ioredis`, atomic `SET NX EX`, and Lua scripts)
- **Queue & Background Workers**: BullMQ (Seat hold expiry, Waitlist offer cascades, Async Email dispatches)
- **Testing & Quality Assurance**: Jest, Supertest, `mongodb-memory-server`, `ioredis-mock`, `cross-env`

---

## 🚀 Quick Start & Local Setup Instructions

### Prerequisites
- Node.js `v18+` & `npm`
- (Optional) Local MongoDB & Redis daemons running, OR use automatic in-memory fallback mocks included out of the box!

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/anuj-k-bit/ticket.git
cd ticket

# Copy environment template
cp .env.example .env
```

Ensure `JWT_SECRET` is set in your `.env` file before launching:
```env
JWT_SECRET=super_secret_jwt_key_2026
```

### 2. Install Dependencies
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Run Locally in Development Mode
Open two terminal windows:

**Terminal 1 (Backend API & Socket.io Server):**
```bash
cd server
node src/server.js
# Backend runs on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🧪 Running Automated Concurrency Tests

To run the 20-user simultaneous seat lock concurrency test suite:

```bash
cd server
npm test tests/concurrency.test.js
```

**Expected Result**:
- 20 simultaneous POST requests fired at the exact same millisecond.
- Exactly 1 request succeeds (**HTTP 200 OK**).
- Exactly 19 requests are blocked (**HTTP 409 Conflict**).

---

## 🌐 Production Deployment Guide

For full step-by-step instructions on deploying the platform to **Render**, **Vercel**, **MongoDB Atlas**, and **Upstash Redis**, refer to our detailed deployment documentation:

👉 **[Read DEPLOYMENT.md](file:///c:/Users/HP/Desktop/Ticket%20booking/DEPLOYMENT.md)**

---

## 🧠 Core System Workflows Explained in Plain Language

### 1. The Seat-Hold TTL Mechanism (Concurrency Protection)
When a customer clicks an available seat on a show's seating map:
1. **Redis Distributed Lock**: The server attempts an atomic Redis lock: `SET hold:{showId}:{seatId} lockToken NX EX 600`.
   - If another user acquired the lock a millisecond earlier, Redis returns `null`. The server immediately responds with **HTTP 409 Conflict** ("Seat is locked by another user") **without touching MongoDB**.
2. **Atomic Mongo Update**: If the Redis lock succeeds, the server runs an atomic update: `Seat.findOneAndUpdate({ _id: seatId, status: 'AVAILABLE' })` setting status to `'HELD'` owned by the user.
3. **BullMQ Delayed Expiry Job**: A background BullMQ job is scheduled with a **10-minute delay** (`600s`). If the customer does not complete payment before the countdown timer hits `0:00`, BullMQ automatically resets the seat status to `'AVAILABLE'`, deletes the Redis key via Lua script, and notifies all connected viewers via Socket.io.
4. **Real-Time WebSocket Sync**: When any seat changes status (`AVAILABLE` ➔ `HELD` ➔ `BOOKED`), Socket.io broadcasts a `seat_updated` payload to room `show_{showId}`. All connected browsers update their seat grid color instantly without a page refresh!

### 2. Booking Cancellation & Waitlist Auto-Assignment Cascade
When a customer cancels a confirmed ticket:
1. **Cancellation Trigger**: The booking is marked as `'CANCELLED'`, and released seats are flipped to `'AVAILABLE'`.
2. **Atomic Queue Claim**: The server queries the `WaitlistEntry` collection for that show & category using the index `{ show: 1, category: 1, status: 1, joinedAt: 1 }`. The first customer in line is claimed using atomic `findOneAndUpdate` (setting status `'OFFERED'`).
3. **Hold Service Reuse**: The system reuses the exact `holdService.holdSeat` engine to place a **15-minute offer hold** on the seat for the waitlisted customer.
4. **Time-Limited Email Link**: An email is dispatched to the waitlisted customer containing a direct claim link (`http://localhost:5173/shows/{showId}?offerSeatId={seatId}`).
5. **Recursive Expiry Cascade**: If the 15-minute offer TTL expires without a confirmed booking, BullMQ marks the entry `'EXPIRED'`, releases the hold, and **recursively calls `processNextWaitlistOffer`** to pass the ticket to the next person waiting in line!

---

## 🗄️ Database Schema Documentation

### 1. `User` Collection
Stores authenticated user credentials and RBAC roles.
- `_id`: `ObjectId` (Primary Key)
- `name`: `String` (Required)
- `email`: `String` (Required, Unique, Lowercase)
- `password`: `String` (Required, Hashed with bcrypt)
- `role`: `String` (Enum: `'customer'`, `'organiser'`, `'admin'`)

### 2. `Venue` Collection
Template definition for stadium/theater seating layouts.
- `_id`: `ObjectId` (Primary Key)
- `name`: `String` (Required)
- `address`: `String` (Required)
- `city`: `String` (Required)
- `capacity`: `Number` (Pre-calculated total seats)
- `sections`: `Array` of `{ name: String, rows: Number, seatsPerRow: Number }`
- `seatMapTemplate`: `Array` of seat template objects

### 3. `Show` Collection
Scheduled event instances linked to a venue template.
- `_id`: `ObjectId` (Primary Key)
- `title`: `String` (Required)
- `category`: `String` (Enum: `'movie'`, `'concert'`, `'theater'`, `'standup'`, `'sports'`)
- `venue`: `ObjectId` (Ref: `Venue`)
- `organiser`: `ObjectId` (Ref: `User`)
- `startTime`: `Date`
- `endTime`: `Date`
- `pricing`: `Array` of `{ category: String, price: Number }`
- `status`: `String` (Default: `'upcoming'`)

### 4. `Seat` Collection
Individual bookable seat records generated per show (supports 5,000–10,000+ seats).
- `_id`: `ObjectId` (Primary Key)
- `show`: `ObjectId` (Ref: `Show`)
- `venue`: `ObjectId` (Ref: `Venue`)
- `category`: `String` (Section tier: `'VIP'`, `'Gold'`, etc.)
- `row`: `String` (Row identifier e.g., `'A'`, `'B'`)
- `number`: `Number` (Seat number in row)
- `price`: `Number`
- `status`: `String` (Enum: `'AVAILABLE'`, `'HELD'`, `'BOOKED'`)
- `heldBy`: `ObjectId` (Ref: `User`, Nullable)
- `holdExpiresAt`: `Date` (Nullable)

### 5. `Booking` Collection
Confirmed order receipts with digital QR codes.
- `_id`: `ObjectId` (Primary Key)
- `bookingRef`: `String` (Unique Short Ref e.g., `'BK-UJQNDC'`)
- `user`: `ObjectId` (Ref: `User`)
- `show`: `ObjectId` (Ref: `Show`)
- `seats`: `Array` of `ObjectId` (Ref: `Seat`)
- `totalAmount`: `Number`
- `qrCodeDataUrl`: `String` (Base64 PNG Data URL)
- `status`: `String` (Enum: `'CONFIRMED'`, `'CANCELLED'`, `'EXPIRED'`)

### 6. `WaitlistEntry` Collection
Priority queue entries for sold-out section categories.
- `_id`: `ObjectId` (Primary Key)
- `show`: `ObjectId` (Ref: `Show`)
- `user`: `ObjectId` (Ref: `User`)
- `category`: `String` (Section name)
- `status`: `String` (Enum: `'WAITING'`, `'OFFERED'`, `'EXPIRED'`, `'FULFILLED'`, `'CANCELLED'`)
- `joinedAt`: `Date` (Default: `Date.now`)
- `offeredSeat`: `ObjectId` (Ref: `Seat`, Nullable)
- `offerExpiresAt`: `Date` (Nullable)
- **Indexes**:
  - Uniqueness: `{ show: 1, user: 1, category: 1, status: 1 }` (`unique: true`)
  - Claim Priority: `{ show: 1, category: 1, status: 1, joinedAt: 1 }`

---

## 📡 REST API Documentation

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Auth Required | Description | Request Body | Response Shape |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register customer/organiser/admin | `{ name, email, password, role }` | `{ message, token, user }` |
| `POST` | `/login` | Public | Authenticate user & issue JWT | `{ email, password }` | `{ message, token, user }` |
| `GET` | `/me` | Protected | Fetch current user session | None | `{ user }` |

### Venue Management Routes (`/api/venues`)
| Method | Endpoint | Auth Required | Description | Request Body | Response Shape |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | List all created venues | None | `{ venues: [] }` |
| `POST` | `/` | Admin | Create venue with section layout | `{ name, address, city, sections: [] }` | `{ message, venue }` |
| `GET` | `/:id` | Public | Fetch venue details & layout | None | `{ venue }` |
| `PUT` | `/:id` | Admin | Edit venue layout | `{ name, address, sections: [] }` | `{ message, venue }` |
| `DELETE` | `/:id` | Admin | Delete venue | None | `{ message }` |

### Show & Seating Routes (`/api/shows`)
| Method | Endpoint | Auth Required | Description | Request Body | Response Shape |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Browse shows (filter category, date) | None | `{ shows: [] }` |
| `GET` | `/:id` | Public | Show details & venue info | None | `{ show, stats }` |
| `GET` | `/:id/seats` | Public | Fetch generated seat map records | None | `{ total, seats: [] }` |
| `POST` | `/` | Organiser/Admin | Schedule show & bulk generate seats | `{ title, category, venueId, startTime, endTime, pricing: [] }` | `{ message, show, seatCount }` |
| `POST` | `/:showId/seats/:seatId/hold` | Protected | Acquire 10-min Redis seat lock | `{ ttlSeconds? }` | `{ success, seat, holdExpiresAt }` |
| `POST` | `/:showId/seats/:seatId/release` | Protected | Cancel active seat hold | None | `{ success, seat }` |

### Payment & Booking Routes (`/api/payments` & `/api/bookings`)
| Method | Endpoint | Auth Required | Description | Request Body | Response Shape |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/payments/create-order` | Protected | Create Razorpay order for held seat | `{ showId, seatIds: [] }` | `{ orderId, amount, key, currency }` |
| `POST` | `/payments/verify` | Protected | **Single Secure Path**: Verify Razorpay HMAC signature & confirm booking | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, showId, seatIds: [] }` | `{ message, booking }` |
| `POST` | `/bookings/:id/cancel` | Protected | Cancel booking & trigger waitlist cascade | None | `{ message, booking, waitlistResults }` |
| `GET` | `/bookings/my-bookings` | Protected | Customer ticket history | None | `{ bookings: [] }` |
| `GET` | `/bookings/:id` | Protected | Fetch booking details & QR Code | None | `{ booking }` |

### Waitlist Routes (`/api/waitlist`)
| Method | Endpoint | Auth Required | Description | Request Body | Response Shape |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/join` | Protected | Join waitlist queue for category | `{ showId, category }` | `{ message, entry, position }` |
| `GET` | `/my-entries` | Protected | Customer active waitlist queue | None | `{ entries: [] }` |
| `DELETE` | `/:id` | Protected | Leave waitlist queue | None | `{ message, entry }` |

### Analytics & Oversight Routes (`/api`)
| Method | Endpoint | Auth Required | Description | Request Body | Response Shape |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/shows/:id/analytics` | Organiser/Admin | Per-show revenue & category sales | None | `{ show, summary, categories: [] }` |
| `GET` | `/admin/oversight` | Admin | Platform-wide metrics & totals | None | `{ metrics: {} }` |
