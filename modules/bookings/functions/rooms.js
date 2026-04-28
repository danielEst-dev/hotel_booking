const { pool, query } = require('../../../includes/db/db.js');
const { buildPagination } = require('../../../helpers/functions/customFunctions.js');

const processGetAllRooms = async ({ page, limit, room_type, is_available, min_price, max_price } = {}) => {
	const conditions = [];
	const values = [];

	if (room_type !== undefined) {
		values.push(room_type);
		conditions.push(`room_type = $${values.length}`);
	}

	if (is_available !== undefined) {
		values.push(is_available);
		conditions.push(`is_available = $${values.length}`);
	}

	if (min_price !== undefined) {
		values.push(min_price);
		conditions.push(`price_per_night >= $${values.length}`);
	}

	if (max_price !== undefined) {
		values.push(max_price);
		conditions.push(`price_per_night <= $${values.length}`);
	}

	conditions.push(`is_active = TRUE`);

	const whereClause = `WHERE ${conditions.join(' AND ')}`;

	const countResult = await query(
		`SELECT COUNT(*) FROM rooms ${whereClause}`,
		values
	);
	const totalCount = parseInt(countResult.rows[0].count, 10);

	const { pagination, offset, limit: perPage } = buildPagination(page, limit, totalCount);

	const dataValues = [...values, perPage, offset];
	const dataResult = await query(
		`SELECT * FROM rooms ${whereClause} ORDER BY id ASC LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
		dataValues
	);

	return {
		success: true,
		data: dataResult.rows,
		pagination,
	};
};

const processCreateRoom = async ({ room_number, room_type, price_per_night, description }) => {
	try {
		const result = await query(
			`INSERT INTO rooms (room_number, room_type, price_per_night, description)
			VALUES ($1, $2, $3, $4)
			RETURNING *`,
			[room_number, room_type, price_per_night, description ?? null]
		);

		return { success: true, data: result.rows[0] };
	} catch (error) {
		if (error && error.code === '23505') {
			const err = new Error('Room number already exists');
			err.statusCode = 409;
			throw err;
		}

		throw error;
	}
};

const processGetRoomById = async (id) => {
	const result = await query(
		`SELECT * FROM rooms WHERE id = $1 AND is_active = TRUE`,
		[id]
	);

	if (result.rows.length === 0) {
		const err = new Error('Room not found');
		err.statusCode = 404;
		throw err;
	}

	return { success: true, data: result.rows[0] };
};

const processUpdateRoom = async (id, fields) => {
	const setClauses = [];
	const values = [];

	if (fields.room_number !== undefined) {
		values.push(fields.room_number);
		setClauses.push(`room_number = $${values.length}`);
	}

	if (fields.room_type !== undefined) {
		values.push(fields.room_type);
		setClauses.push(`room_type = $${values.length}`);
	}

	if (fields.price_per_night !== undefined) {
		values.push(fields.price_per_night);
		setClauses.push(`price_per_night = $${values.length}`);
	}

	if (fields.description !== undefined) {
		values.push(fields.description);
		setClauses.push(`description = $${values.length}`);
	}

	if (fields.is_available !== undefined) {
		values.push(fields.is_available);
		setClauses.push(`is_available = $${values.length}`);
	}

	values.push(id);

	try {
		const result = await query(
			`UPDATE rooms SET ${setClauses.join(', ')} WHERE id = $${values.length} AND is_active = TRUE RETURNING *`,
			values
		);

		if (result.rows.length === 0) {
			const err = new Error('Room not found');
			err.statusCode = 404;
			throw err;
		}

		return { success: true, data: result.rows[0] };
	} catch (error) {
		if (error && error.code === '23505') {
			const err = new Error('Room number already exists');
			err.statusCode = 409;
			throw err;
		}

		throw error;
	}
};

const processDeleteRoom = async (id) => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		const roomCheck = await client.query(
			`SELECT id FROM rooms WHERE id = $1 AND is_active = TRUE FOR UPDATE`,
			[id]
		);
		if (roomCheck.rows.length === 0) {
			const err = new Error('Room not found');
			err.statusCode = 404;
			throw err;
		}

		const bookingCheck = await client.query(
			`SELECT id FROM bookings WHERE room_id = $1 LIMIT 1`,
			[id]
		);

		let result;
		if (bookingCheck.rows.length > 0) {
			await client.query(`UPDATE rooms SET is_active = FALSE WHERE id = $1`, [id]);
			result = { success: true, deleted: false };
		} else {
			await client.query(`DELETE FROM rooms WHERE id = $1`, [id]);
			result = { success: true, deleted: true };
		}

		await client.query('COMMIT');
		return result;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

module.exports = { processGetAllRooms, processCreateRoom, processGetRoomById, processUpdateRoom, processDeleteRoom };