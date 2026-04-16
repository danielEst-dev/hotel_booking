# Junior Developer Practical Test: Hotel Booking System

## Overview

You are tasked with building a **Hotel Booking System API** with a minimal front-end. This test evaluates your ability to:

- Design and implement a RESTful API using Node.js/Express
- Design and set up a PostgreSQL database
- Structure code following industry best practices
- Integrate with a third-party API
- Create a functional front-end interface

> 📝 **Note on AI Usage**
> 
> You **are allowed** to use AI assistants (such as ChatGPT, GitHub Copilot, Claude, etc.) to help you complete this project. However, during your presentation, you will be required to **fully understand and explain every aspect of your code**.
> 
> Using AI as a learning tool is acceptable, but simply copying code without understanding it is not. Be prepared to answer detailed questions about your implementation.

---

## Project Requirements

### 1. Project Structure

Your project must follow this folder structure:

```
hotel_booking/
├── server.js                          # Main entry point
├── appSetup.js                        # Express app configuration
├── package.json
├── .env.example                       # Environment variables template (do not include actual secrets)
├── modules/
│   └── bookings/
│       ├── controllers/
│       │   ├── roomsController.js
│       │   ├── guestsController.js
│       │   ├── bookingsController.js
│       │   └── validations/
│       │       └── bookingRequest.js
│       ├── functions/
│       │   ├── rooms.js
│       │   ├── guests.js
│       │   └── bookings.js
│       ├── routers/
│       │   ├── roomsRouter.js
│       │   ├── guestsRouter.js
│       │   └── bookingsRouter.js
│       └── test_cases/
│           └── bookings.test.js
├── helpers/
│   └── functions/
│       └── customFunctions.js
├── includes/
│   ├── config/
│   │   └── mainConfig.js
│   └── db/
│       └── db.js
├── routers/
│   └── bookingsRouter.js              # Top-level router
└── public/
    ├── index.html
    ├── css/
    └── js/
```

---

### 2. Code Conventions

- **Indentation:** Use **tabs** (not spaces), displayed as 2 spaces
- **File Naming:** Use camelCase for file names (e.g., `customFunctions.js`)
- **Folder Naming:** Use lowercase with underscores (e.g., `test_cases`)
- **Local Imports:** Include the file extension (e.g., `require('./helpers/functions/customFunctions.js')`)
- **Date/Time:** Use Moment.js UTC for all date/time operations
- **Environment Variables:** Load all env vars through `mainConfig.js`—no direct `process.env` access in modules
- **Module Exports:** Use object destructuring for multiple exports:

```javascript
module.exports = { func1, func2 }
```

---

### 3. Database Design

Design and create a **PostgreSQL** database named `hotel_booking_db`.

**Requirements:**
- Design your own database schema to support the hotel booking system
- Your schema must support: rooms, guests, and bookings
- Include appropriate relationships between tables
- Include a `database/schema.sql` file with your CREATE TABLE statements

You will be assessed on your ability to design an efficient and normalized database schema.

---

### 4. API Endpoints

Implement the following RESTful endpoints:

#### Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings/rooms` | List all rooms |
| GET | `/bookings/rooms/:id` | Get room by ID |
| POST | `/bookings/rooms` | Create a new room |
| PATCH | `/bookings/rooms/:id` | Update room details |
| DELETE | `/bookings/rooms/:id` | Delete a room |

#### Guests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings/guests` | List all guests |
| GET | `/bookings/guests/:id` | Get guest by ID |
| POST | `/bookings/guests` | Create a new guest |
| PATCH | `/bookings/guests/:id` | Update guest details |

#### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | List all bookings |
| GET | `/bookings/:id` | Get booking by ID |
| POST | `/bookings` | Create a new booking |
| PATCH | `/bookings/:id` | Update booking (status change) |
| DELETE | `/bookings/:id` | Cancel a booking |
| GET | `/bookings/guest/:guest_id` | Get all bookings for a guest |

---

### 5. Request Validation

Use **Yup** for request validation. Create validation schemas in `validations/bookingRequest.js`.

Example validation pattern:

```javascript
const yup = require('yup');

const validateCreateBookingRequest = (form) => {
	const formShape = {
		guest_id: yup.number().required(),
		room_id: yup.number().required(),
		check_in_date: yup.string().required()
			.matches(
				/^\d{4}-\d{2}-\d{2}$/,
				'check_in_date must be in the format YYYY-MM-DD'
			),
		check_out_date: yup.string().required()
			.matches(
				/^\d{4}-\d{2}-\d{2}$/,
				'check_out_date must be in the format YYYY-MM-DD'
			)
	};

	const schema = yup.object().shape(formShape);
	return schema.validate(form, { abortEarly: false, strict: true });
};

module.exports = { validateCreateBookingRequest };
```

---

### 6. Controller Structure

Controllers should handle HTTP request/response and delegate business logic to functions. Follow this pattern:

```javascript
const { processCreateBooking } = require('../functions/bookings.js');
const { validateCreateBookingRequest } = require('./validations/bookingRequest.js');

const createBooking = async (req, res) => {
	try {
		let { guest_id, room_id, check_in_date, check_out_date } = req.body;

		// Convert to appropriate types
		if (guest_id !== undefined) guest_id = Number(guest_id);
		if (room_id !== undefined) room_id = Number(room_id);

		// Validate request
		await validateCreateBookingRequest({ guest_id, room_id, check_in_date, check_out_date });

		const result = await processCreateBooking(guest_id, room_id, check_in_date, check_out_date);
		return res.status(200).send({ ...result });
	} catch (err) {
		// Validation Error
		if (err?.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				error: "validation-error",
				errors: err?.errors || []
			});
		}

		return res.status(400).send({ success: false, error: err.message });
	}
};

module.exports = { createBooking };
```

---

### 7. Third-Party API Integration

Integrate with the **Open-Meteo Weather API** to fetch weather information for the hotel location when creating a booking.

**API Documentation:** https://open-meteo.com/en/docs

**Requirements:**
- When a booking is created, fetch the weather forecast for the check-in date
- Store the weather data in your database (design an appropriate column/structure)
- Handle API failures gracefully (booking should still succeed even if weather API fails)

**Example API Call:**

```
https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=2026-04-20&end_date=2026-04-20
```

**Implementation Example:**

```javascript
const axios = require('axios');

async function fetchWeatherForDate(date) {
	try {
		// Use London coordinates as the hotel location (you can make this configurable)
		const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
			params: {
				latitude: 51.5074,
				longitude: -0.1278,
				daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
				timezone: 'auto',
				start_date: date,
				end_date: date
			}
		});
		return response.data;
	} catch (error) {
		console.error('Weather API error:', error.message);
		return null;
	}
}
```

---

### 8. Testing

Write unit tests using **Jest**. Place tests in `modules/bookings/test_cases/`.

**Required Test Cases:**
1. Test room creation with valid data
2. Test booking creation with valid data
3. Test booking validation rejects invalid dates
4. Test fetching bookings for a specific guest
5. Test weather API integration (mock the API call)

**Example Test Structure:**

```javascript
jest.mock('../../../includes/db/db.js', () => ({
	query: jest.fn()
}));

const db = require('../../../includes/db/db.js');
const { processCreateRoom } = require('../functions/rooms.js');

describe('Room Management', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should create a room successfully', async () => {
		db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

		const result = await processCreateRoom({
			room_number: '101',
			room_type: 'double',
			price_per_night: 150.00
		});

		expect(result.success).toBe(true);
		expect(db.query).toHaveBeenCalled();
	});
});
```

---

### 9. Front-End Requirements

> **Note:** The front-end is for **demonstration purposes only**. It is meant to showcase your API functionality and does not need to be production-ready. Focus on functionality over aesthetics.

Create a minimal front-end using **Bootstrap** (or another CSS framework of your choice) that demonstrates:

1. **Dashboard Page** (`index.html`)
   - Display available rooms
   - Show today's weather (fetched via your API)

2. **Booking Form**
   - Guest information fields
   - Room selection dropdown
   - Date pickers for check-in/check-out
   - Submit button to create booking

3. **Booking List**
   - Display all bookings in a table
   - Show booking status with color coding
   - Option to cancel pending bookings

The front-end can be simple HTML/CSS/JS served statically. No framework required.

---

### 10. Scripts

Include these npm scripts in your `package.json`:

```json
{
  "scripts": {
    "build": "npm install",
    "test": "jest",
    "dev": "nodemon -e js server.js",
    "start": "node server.js"
  }
}
```

---

## Submission Checklist

Before submitting, ensure you have:

- [ ] Included a `.env.example` file (without actual secrets)
- [ ] Included a `database/schema.sql` file with your table designs
- [ ] Written a `README.md` with setup instructions
- [ ] All tests pass when running `npm test`
- [ ] The application runs successfully with `npm run dev`

---

## Bonus Points

- Implement pagination for list endpoints
- Add filtering/search for rooms (by type, price range, availability)
- Add booking date conflict validation
