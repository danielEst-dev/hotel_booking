# Hotel Booking System

A RESTful API for managing hotel rooms, guests, and bookings, with a minimal front-end dashboard. Built with Node.js, Express, and PostgreSQL.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) v14 or higher

---

## Setup

### 1. Install dependencies

```bash
npm run build
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | — |
| `DB_NAME` | PostgreSQL database name | `hotel_booking_db` |

### 3. Create the database

```sql
CREATE DATABASE hotel_booking_db;
```

### 4. Run the schema

```bash
psql -U postgres -d hotel_booking_db -f database/schema.sql
```

---

## Running the Application

**Development** (auto-restarts on file changes):

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The API will be available at `http://localhost:3000`.  
The front-end dashboard is served at `http://localhost:3000/index.html`.

---

## Running Tests

```bash
npm test
```

---

## API Endpoints

### Rooms

| Method | Endpoint | Description |
|---|---|---|
| GET | `/bookings/rooms` | List all rooms |
| GET | `/bookings/rooms/:id` | Get room by ID |
| POST | `/bookings/rooms` | Create a new room |
| PATCH | `/bookings/rooms/:id` | Update room details |
| DELETE | `/bookings/rooms/:id` | Delete a room |

**Query parameters for `GET /bookings/rooms`:** `page`, `limit`, `room_type`, `is_available`, `min_price`, `max_price`

### Guests

| Method | Endpoint | Description |
|---|---|---|
| GET | `/bookings/guests` | List all guests |
| GET | `/bookings/guests/:id` | Get guest by ID |
| POST | `/bookings/guests` | Create a new guest |
| PATCH | `/bookings/guests/:id` | Update guest details |

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| GET | `/bookings` | List all bookings |
| GET | `/bookings/:id` | Get booking by ID |
| POST | `/bookings` | Create a new booking |
| PATCH | `/bookings/:id` | Update booking status |
| DELETE | `/bookings/:id` | Cancel a booking |
| GET | `/bookings/guest/:guest_id` | Get all bookings for a guest |

**Query parameters for `GET /bookings`:** `page`, `limit`, `status` (`pending`, `confirmed`, `cancelled`, `completed`)

---

## Database Schema

Three tables: `rooms`, `guests`, and `bookings`.

- `rooms` — room number, type, price per night, availability, soft-delete flag
- `guests` — first/last name, email (unique), phone, soft-delete flag
- `bookings` — links guest and room, stores check-in/out dates, status, total price, and weather data (JSONB) fetched from the Open-Meteo API at the time of booking

Foreign keys use `ON DELETE RESTRICT`. A `CHECK` constraint enforces `check_out_date > check_in_date`.

---

## Third-Party API

Weather data is fetched from [Open-Meteo](https://open-meteo.com/) when a booking is created. The forecast for the check-in date is stored in the `weather_data` column. If the API is unavailable the booking is still created successfully — `weather_data` is stored as `null`.

---

## Automated Booking Completion

Confirmed bookings whose checkout date has passed are automatically set to `completed`. This runs once at server startup and then daily at **00:05 UTC** via a scheduled job (`node-cron`).
