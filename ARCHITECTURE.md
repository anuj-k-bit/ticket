# 🏗️ CinePass: Enterprise High-Concurrency System Design & Architecture

> **CinePass** is an enterprise-grade, high-concurrency ticket booking platform engineered for high-demand events (IPL Finals, Stadium Concerts, and Movie Premieres). It guarantees zero double-bookings using **Distributed Redis Locks**, **Atomic Lua Scripts**, **BullMQ Expiry Queues**, and **Real-Time WebSocket Synchronization**.

---

## 📐 1. System Architecture Overview

The system follows a strict **Decoupled Client-Server Monorepo Architecture** separating high-frequency frontend renders from distributed state lock management.

```mermaid
flowchart TB
    subgraph ClientLayer["🎨 Frontend Client (React + Vite + Tailwind)"]
        UI["Web App (Vercel Host)\nhttps://ticket-ten-olive.vercel.app"]
        State["React Context & State Management"]
        SocketClient["Socket.io Client"]
        UI --> State
        UI --> SocketClient
    end

    subgraph EdgeLayer["🛡️ Edge & Security Layer"]
        CORS["CORS & Preflight Handling"]
        Helmet["Helmet Security Headers"]
        Sanitize["NoSQL Injection Sanitizer"]
        RateLimiter["Express Rate Limiter (IP Window)"]
    end

    subgraph ServerLayer["⚡ Backend Service (Node.js + Express)"]
        Server["Express REST API (Render Host)\nhttps://cinepass-backend-2110.onrender.com"]
        SocketServer["Socket.io Real-Time Event Server"]
        HoldController["Seat Hold Controller"]
        PaymentController["Razorpay Checkout Controller"]
        Server --> SocketServer
        Server --> HoldController
        Server --> PaymentController
    end

    subgraph DataCacheLayer["🔒 Distributed Lock & Persistence Layer"]
        MongoDB[("Database: MongoDB Atlas\n(Venues, Shows, Seats, Bookings)")]
        Redis[("Cache & Distributed Lock: Upstash Redis\n(10-Min Seat Hold Locks via TLS)")]
        BullMQ["Background Queue: BullMQ Workers\n(Seat Expiry & Email Dispatch)"]
    end

    subgraph ExternalServices["🌍 External Services"]
        Razorpay["Razorpay Payment Gateway"]
        SMTP["Gmail Resend SMTP (QR Tickets)"]
    end

    ClientLayer -- "HTTPS / REST API" --> EdgeLayer
    EdgeLayer --> ServerLayer
    HoldController -- "Atomic SET NX EX" --> Redis
    HoldController -- "Atomic Update (status='HELD')" --> MongoDB
    HoldController -- "Schedule Expiry Job" --> BullMQ
    PaymentController -- "HMAC SHA256 Verification" --> Razorpay
    PaymentController -- "Send QR Ticket Pass" --> SMTP
    SocketServer -- "Broadcast 'seat_updated' Event" --> SocketClient
```

---

## ⚡ 2. High-Concurrency Seat Hold & Lock Engine

To eliminate race conditions when thousands of users attempt to select the same seat simultaneously, seat reservation follows a **Two-Tier Distributed Lock Strategy**:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer Browser
    participant Express as Express API Server
    participant Redis as Upstash Redis (TLS)
    participant Mongo as MongoDB Atlas
    participant BullMQ as BullMQ Queue Worker
    participant Socket as Socket.io Cluster

    Customer->>Express: POST /api/shows/:showId/seats/:seatId/hold
    Note over Express,Redis: Step 1: Distributed Lock Acquisition
    Express->>Redis: SET hold:showId:seatId token NX EX 600
    alt Lock Acquisition Failed (Key Exists)
        Redis-->>Express: null (Already Locked)
        Express-->>Customer: 409 Conflict ("Seat is currently locked")
    else Lock Acquired (Success)
        Redis-->>Express: OK
        Note over Express,Mongo: Step 2: Atomic DB Conditional State Mutation
        Express->>Mongo: findOneAndUpdate({ _id: seatId, status: 'AVAILABLE' }, { status: 'HELD', heldBy: userId })
        Mongo-->>Express: Updated Seat Document
        Note over Express,BullMQ: Step 3: Delayed Expiry Job Scheduling
        Express->>BullMQ: seatHoldExpiryQueue.add('expireSeatHold', { seatId }, { delay: 600000 })
        Note over Express,Socket: Step 4: Real-Time Event Broadcast
        Express->>Socket: io.to('show_showId').emit('seat_updated', { seatId, status: 'HELD' })
        Express-->>Customer: 200 OK (🎉 "Seat held for 10 minutes!")
    end
```

---

## 🔒 3. Atomic Lua Script for Safe Lock Release

When a 10-minute hold expires or a user releases a seat, locks must only be deleted if the stored token matches the owner. CinePass uses an **Atomic Lua Script (`GET + compare + DEL`)**:

```lua
-- Atomic Lua Script: Executed via EVAL in ioredis
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
```

### Key Technical Advantages:
- **Zero Race Conditions**: Eliminates scenario where User B acquires an expired lock right before User A's slow process deletes it.
- **Microsecond Latency**: Executed atomically on single-threaded Redis server runtime.

---

## 🗄️ 4. Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ BOOKING : places
    USER ||--o{ SHOW : organises
    VENUE ||--o{ SHOW : hosts
    SHOW ||--o{ SEAT : contains
    SHOW ||--o{ BOOKING : generates
    SEAT }|--o{ BOOKING : included_in

    USER {
        ObjectId _id PK
        string name
        string email
        string password
        string role "customer | organiser | admin"
    }

    VENUE {
        ObjectId _id PK
        string name
        string city
        array sections
        array seatMapTemplate
        number capacity
    }

    SHOW {
        ObjectId _id PK
        string title
        string category "concert | sports | standup | movie | theater"
        ObjectId venue FK
        ObjectId organiser FK
        date startTime
        date endTime
        array pricing
    }

    SEAT {
        string _id PK "seat_showId_category_row_number"
        ObjectId show FK
        ObjectId venue FK
        string category
        string row
        number number
        number price
        string status "AVAILABLE | HELD | BOOKED"
        ObjectId heldBy
        date holdExpiresAt
    }

    BOOKING {
        ObjectId _id PK
        string bookingRef "BK-XXXXXX"
        ObjectId user FK
        ObjectId show FK
        array seats
        number totalAmount
        string qrCodeDataUrl
        string status "CONFIRMED | CANCELLED"
        string checkInStatus "NOT_CHECKED_IN | CHECKED_IN"
    }
```

---

## 🛠️ 5. Tech Stack & Architectural Layering

| Layer | Technologies Used | Core Responsibilities |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive UI, interactive seat grid canvas, live 10-min countdown timer. |
| **Backend API** | Node.js, Express.js | REST APIs, input validation, role middleware, rate limiting. |
| **Real-Time Sockets** | Socket.io | Bi-directional WebSocket rooms (`show_:id`) for live seat color updates. |
| **Distributed Lock** | Upstash Redis (`ioredis` + TLS) | `SET NX EX` distributed locking & atomic Lua script releases. |
| **Background Queues** | BullMQ | Delayed jobs for seat hold expiries (600s) & async email processing. |
| **Primary Database** | MongoDB Atlas (Mongoose ORM) | Document persistence, compound indexing (`{ show: 1, status: 1 }`). |
| **Security & Auth** | JWT, bcrypt, Helmet, Express-Rate-Limit | Token authentication, password hashing, XSS/NoSQL protection. |
| **Payment Gateway** | Razorpay SDK & Webhooks | HMAC SHA256 signature verification for INR transactions. |

---

## 🛡️ 6. Reliability & Fallback Safeguards

1. **Redis Offline Fallback**:
   - If Upstash Redis connection times out (`connectTimeout: 5000`), the platform seamlessly switches to `ioredis-mock` in memory without dropping client requests.
2. **Render Cold-Start Protection**:
   - `server.listen(PORT, '0.0.0.0')` binds immediately upon startup so cloud load balancers never drop connections (`socket hang up`).
3. **Database Preflight Auto-Connection**:
   - Every repository call (`ShowRepo`, `SeatRepo`, `VenueRepo`) enforces `ensureConnection()` before executing queries.
