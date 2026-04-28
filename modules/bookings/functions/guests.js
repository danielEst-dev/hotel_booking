const { query } = require('../../../includes/db/db.js');
const { buildPagination } = require('../../../helpers/functions/customFunctions.js');

const processGetAllGuests = async ({ page, limit, search } = {}) => {
	const conditions = ['is_active = TRUE'];
	const values = [];

	if (search) {
		values.push(`%${search}%`);
		conditions.push(`(first_name ILIKE $${values.length} OR last_name ILIKE $${values.length} OR email ILIKE $${values.length})`);
	}

	const whereClause = `WHERE ${conditions.join(' AND ')}`;

	const countResult = await query(
		`SELECT COUNT(*) FROM guests ${whereClause}`,
		values
	);
	const totalCount = parseInt(countResult.rows[0].count, 10);

	const { pagination, offset, limit: perPage } = buildPagination(page, limit, totalCount);

	const dataValues = [...values, perPage, offset];
	const dataResult = await query(
		`SELECT * FROM guests ${whereClause} ORDER BY id ASC LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
		dataValues
	);

	return {
		success: true,
		data: dataResult.rows,
		pagination,
	};
};

const processGetGuestById = async (id) => {
	const result = await query(
		`SELECT * FROM guests WHERE id = $1 AND is_active = TRUE`,
		[id]
	);

	if (result.rows.length === 0) {
		const err = new Error('Guest not found');
		err.statusCode = 404;
		throw err;
	}

	return { success: true, data: result.rows[0] };
};

const processCreateGuest = async ({ first_name, last_name, email, phone }) => {
	try {
		const result = await query(
			`INSERT INTO guests (first_name, last_name, email, phone)
			VALUES ($1, $2, $3, $4)
			RETURNING *`,
			[first_name, last_name, email, phone ?? null]
		);

		return { success: true, data: result.rows[0] };
	} catch (error) {
		if (error && error.code === '23505') {
			const err = new Error('Email already exists');
			err.statusCode = 409;
			throw err;
		}

		throw error;
	}
};

const processUpdateGuest = async (id, fields) => {
	const setClauses = [];
	const values = [];

	if (fields.first_name !== undefined) {
		values.push(fields.first_name);
		setClauses.push(`first_name = $${values.length}`);
	}

	if (fields.last_name !== undefined) {
		values.push(fields.last_name);
		setClauses.push(`last_name = $${values.length}`);
	}

	if (fields.email !== undefined) {
		values.push(fields.email);
		setClauses.push(`email = $${values.length}`);
	}

	if (fields.phone !== undefined) {
		values.push(fields.phone);
		setClauses.push(`phone = $${values.length}`);
	}

	values.push(id);

	try {
		const result = await query(
			`UPDATE guests SET ${setClauses.join(', ')} WHERE id = $${values.length} AND is_active = TRUE RETURNING *`,
			values
		);

		if (result.rows.length === 0) {
			const err = new Error('Guest not found');
			err.statusCode = 404;
			throw err;
		}

		return { success: true, data: result.rows[0] };
	} catch (error) {
		if (error && error.code === '23505') {
			const err = new Error('Email already exists');
			err.statusCode = 409;
			throw err;
		}

		throw error;
	}
};

module.exports = { processGetAllGuests, processGetGuestById, processCreateGuest, processUpdateGuest };