const axios = require('axios');
const moment = require('moment');
const { query } = require('../../../includes/db/db.js');
const { buildPagination } = require('../../../helpers/functions/customFunctions.js');

const fetchWeatherForDate = async (date) => {
	try {
		const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
			params: {
				latitude: 51.5074,
				longitude: -0.1278,
				daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
				timezone: 'auto',
				start_date: date,
				end_date: date,
			},
		});
		return response.data;
	} catch (error) {
		console.error('Weather API error:', error.message);
		return null;
	}
};

const autoCompleteExpiredBookings = async () => {
	await query(
		`UPDATE bookings SET status = 'completed', updated_at = NOW()
		WHERE status = 'confirmed' AND check_out_date < CURRENT_DATE`
	);
};

const processGetAllBookings = async ({ page, limit, status } = {}) => {
	await autoCompleteExpiredBookings();

	const conditions = [];
	const values = [];

	if (status !== undefined) {
		values.push(status);
		conditions.push(`b.status = $${values.length}`);
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

	const countResult = await query(
		`SELECT COUNT(*) FROM bookings b ${whereClause}`,
		values
	);
	const totalCount = parseInt(countResult.rows[0].count, 10);

	const { pagination, offset, limit: perPage } = buildPagination(page, limit, totalCount);

	const dataValues = [...values, perPage, offset];
	const dataResult = await query(
		`SELECT b.*,
			g.first_name, g.last_name, g.email,
			r.room_number, r.room_type, r.price_per_night
		FROM bookings b
		JOIN guests g ON b.guest_id = g.id
		JOIN rooms r ON b.room_id = r.id
		${whereClause}
		ORDER BY b.id ASC
		LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
		dataValues
	);

	return { success: true, data: dataResult.rows, pagination };
};

const processCreateBooking = async (guest_id, room_id, check_in_date, check_out_date) => {
	if (check_out_date <= check_in_date) {
		const err = new Error('check_out_date must be after check_in_date');
		err.statusCode = 400;
		throw err;
	}

	const guestResult = await query(
		`SELECT id FROM guests WHERE id = $1 AND is_active = TRUE`,
		[guest_id]
	);
	if (guestResult.rows.length === 0) {
		const err = new Error('Guest not found');
		err.statusCode = 404;
		throw err;
	}

	const roomResult = await query(
		`SELECT id, price_per_night FROM rooms WHERE id = $1 AND is_active = TRUE AND is_available = TRUE`,
		[room_id]
	);
	if (roomResult.rows.length === 0) {
		const err = new Error('Room not found or not available');
		err.statusCode = 404;
		throw err;
	}

	const conflictResult = await query(
		`SELECT id FROM bookings
		WHERE room_id = $1
		AND status NOT IN ('cancelled')
		AND check_in_date < $3
		AND check_out_date > $2`,
		[room_id, check_in_date, check_out_date]
	);
	if (conflictResult.rows.length > 0) {
		const err = new Error('Room is already booked for the selected dates');
		err.statusCode = 409;
		throw err;
	}

	const price_per_night = parseFloat(roomResult.rows[0].price_per_night);
	const nights = moment.utc(check_out_date).diff(moment.utc(check_in_date), 'days');
	const total_price = price_per_night * nights;

	const weather_data = await fetchWeatherForDate(check_in_date);

	const result = await query(
		`INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date, total_price, weather_data)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING *`,
		[guest_id, room_id, check_in_date, check_out_date, total_price, weather_data ?? null]
	);

	return { success: true, data: result.rows[0] };
};

const processGetBookingById = async (id) => {
	await autoCompleteExpiredBookings();

	const result = await query(
		`SELECT b.*,
			g.first_name, g.last_name, g.email,
			r.room_number, r.room_type, r.price_per_night
		FROM bookings b
		JOIN guests g ON b.guest_id = g.id
		JOIN rooms r ON b.room_id = r.id
		WHERE b.id = $1`,
		[id]
	);

	if (result.rows.length === 0) {
		const err = new Error('Booking not found');
		err.statusCode = 404;
		throw err;
	}

	return { success: true, data: result.rows[0] };
};

const processUpdateBooking = async (id, fields) => {
	const setClauses = [];
	const values = [];

	if (fields.status !== undefined) {
		values.push(fields.status);
		setClauses.push(`status = $${values.length}`);
	}

	if (setClauses.length === 0) {
		const err = new Error('No fields provided to update');
		err.statusCode = 400;
		throw err;
	}

	setClauses.push(`updated_at = NOW()`);
	values.push(id);

	const result = await query(
		`UPDATE bookings SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
		values
	);

	if (result.rows.length === 0) {
		const err = new Error('Booking not found');
		err.statusCode = 404;
		throw err;
	}

	return { success: true, data: result.rows[0] };
};

const processCancelBooking = async (id) => {
	const result = await query(
		`UPDATE bookings SET status = 'cancelled', updated_at = NOW()
		WHERE id = $1
		  AND status NOT IN ('cancelled', 'completed')
		  AND check_out_date >= CURRENT_DATE
		RETURNING id`,
		[id]
	);

	if (result.rows.length === 0) {
		const check = await query(
			`SELECT id, status, check_out_date FROM bookings WHERE id = $1`,
			[id]
		);
		if (check.rows.length === 0) {
			const err = new Error('Booking not found');
			err.statusCode = 404;
			throw err;
		}
		const { status, check_out_date } = check.rows[0];
		if (status === 'cancelled') {
			const err = new Error('Booking is already cancelled');
			err.statusCode = 409;
			throw err;
		}
		if (status === 'completed') {
			const err = new Error('Completed bookings cannot be cancelled');
			err.statusCode = 409;
			throw err;
		}
		if (new Date(check_out_date) < new Date(new Date().toISOString().slice(0, 10))) {
			const err = new Error('Past bookings cannot be cancelled');
			err.statusCode = 409;
			throw err;
		}
		const err = new Error('Booking cannot be cancelled');
		err.statusCode = 409;
		throw err;
	}

	return { success: true };
};

const processGetBookingsByGuestId = async (guest_id, { page, limit } = {}) => {
	const guestCheck = await query(
		`SELECT id FROM guests WHERE id = $1 AND is_active = TRUE`,
		[guest_id]
	);
	if (guestCheck.rows.length === 0) {
		const err = new Error('Guest not found');
		err.statusCode = 404;
		throw err;
	}

	const countResult = await query(
		`SELECT COUNT(*) FROM bookings WHERE guest_id = $1`,
		[guest_id]
	);
	const totalCount = parseInt(countResult.rows[0].count, 10);

	const { pagination, offset, limit: perPage } = buildPagination(page, limit, totalCount);

	const result = await query(
		`SELECT b.*,
			g.first_name, g.last_name, g.email,
			r.room_number, r.room_type, r.price_per_night
		FROM bookings b
		JOIN guests g ON b.guest_id = g.id
		JOIN rooms r ON b.room_id = r.id
		WHERE b.guest_id = $1
		ORDER BY b.id ASC
		LIMIT $2 OFFSET $3`,
		[guest_id, perPage, offset]
	);

	return { success: true, data: result.rows, pagination };
};

module.exports = {
	fetchWeatherForDate,
	processGetAllBookings,
	processCreateBooking,
	processGetBookingById,
	processUpdateBooking,
	processCancelBooking,
	processGetBookingsByGuestId,
};
