# Project Rules & Guidelines for Ticket Booking Platform

## Tech Stack Overview
- **Backend**: Node.js + Express
- **Frontend**: React + Tailwind CSS
- **Database**: MongoDB with Mongoose
- **In-Memory Cache / Distributed Lock**: Redis (`ioredis`) for seat-hold locking
- **Background Jobs & Queue**: BullMQ (handling seat-hold expiry, email notifications, background tasks)
- **Real-Time Communication**: Socket.io (for live seat map updates & real-time notifications)
- **Authentication & Security**: JWT authentication with `bcrypt` password hashing

---

## Architectural Conventions & Directory Structure
- **Clear Separation of Concerns**:
  - `/server`: All Node.js/Express backend services, database schemas, controllers, queue workers, Socket.io events, and middleware.
  - `/client`: All React components, Tailwind styling, state management, and frontend services.
  - Strict isolation: Do not mix frontend and backend dependencies or code in single files or shared folders.

---

## Concurrency & Data Consistency Guidelines

### 1. Atomic Database Updates
- **Conditional Updates**: Every seat status change in MongoDB **MUST** be performed via an atomic conditional update (`findOneAndUpdate` or `updateOne`) where the filter query includes the expected current status (e.g., `{ _id: seatId, status: 'AVAILABLE' }`).
- **Forbidden**: **NEVER** fetch a document, mutate it in JavaScript, and call `.save()`, as this introduces race conditions during concurrent booking attempts.

### 2. Distributed Redis Locks for Seat Holds
- **Redis Lock Acquisition**: Before writing any hold to the database, a Redis lock **MUST** be acquired using `SET key lock_token NX EX <ttl>` where `lock_token` is a unique value (e.g. `crypto.randomUUID()`).
- **Safe Lock Release via Lua Script**: Lock releases (both explicit user releases and BullMQ expiry jobs) **MUST** only delete the key if the stored value matches the token. This **MUST** be performed atomically using a Lua script (`GET + compare + DEL` via `EVAL`):
  ```lua
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
  ```
- **Lock Failure**: If Redis lock acquisition fails, immediately reject the request (e.g., return HTTP 409 Conflict) without performing database operations.

### 3. Hold Expiry & Job Scheduling
- **BullMQ Delayed Jobs**: Seat hold expiries **MUST** be scheduled using BullMQ delayed jobs at the moment the hold is created.
- **Forbidden**: **NEVER** use `setTimeout`, `setInterval`, or in-memory timers for state expiry or background execution.

---

## Configuration & Environment Variables
- **Environment File (`.env`)**: All database URIs, Redis URLs, secrets (JWT), and credentials (SMTP/mail) must be stored in `.env`.
- **`.env.example` Synchronization**: Whenever a new environment variable is added to `.env`, `.env.example` **MUST** be updated simultaneously with safe placeholder values.

---

## Version Control & Repository Hygiene
- **`.gitignore` Rules**: `.gitignore` must strictly exclude `node_modules`, `.env` files, build output folders (`dist/`, `build/`), and editor configuration folders (`.vscode/`, `.idea/`).
- **Granular Commits**: Write logical, single-purpose commits. Do not combine unrelated features, fixes, or refactors into a single commit.

---

## Routing, Security & Middleware
- **Input Validation**: All API routes **MUST** validate incoming payload parameters (params, query, body) and provide consistent error handling before processing logic. Never trust unvalidated client input.
- **Role-Based Access Control (RBAC)**: Protect restricted endpoints using dedicated middleware enforcing required roles (`customer`, `organiser`, `admin`).
