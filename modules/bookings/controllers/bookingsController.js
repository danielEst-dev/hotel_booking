const {
	processGetAllBookings,
	processCreateBooking,
	processGetBookingById,
	processUpdateBooking,
	processCancelBooking,
	processGetBookingsByGuestId,
} = require('../functions/bookings.js');
const {
	validateGetAllBookingsRequest,
	validateCreateBookingRequest,
	validateGetBookingByIdRequest,
	validateUpdateBookingRequest,
	validateGetBookingsByGuestIdRequest,
} = require('./validations/bookingRequest.js');
const { normalizeOptionalNumber } = require('../../../helpers/functions/customFunctions.js');

const getAllBookings = async (req, res) => {
	try {
		const { page, limit, status } = req.query;
		const form = {
			page: normalizeOptionalNumber(page),
			limit: normalizeOptionalNumber(limit),
			status,
		};

		await validateGetAllBookingsRequest(form);

		const result = await processGetAllBookings(form);
		return res.status(200).send({ ...result });
	} catch (err) {
		if (err?.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				error: 'validation-error',
				errors: err?.errors || [],
			});
		}

		return res.status(err.statusCode || 500).send({ success: false, error: err.message });
	}
};

const createBooking = async (req, res) => {
	try {
		let { guest_id, room_id, check_in_date, check_out_date } = req.body;

		if (guest_id !== undefined) guest_id = Number(guest_id);
		if (room_id !== undefined) room_id = Number(room_id);

		await validateCreateBookingRequest({ guest_id, room_id, check_in_date, check_out_date });

		const result = await processCreateBooking(guest_id, room_id, check_in_date, check_out_date);
		return res.status(201).send({ ...result });
	} catch (err) {
		if (err?.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				error: 'validation-error',
				errors: err?.errors || [],
			});
		}

		return res.status(err.statusCode || 500).send({ success: false, error: err.message });
	}
};

const getBookingById = async (req, res) => {
	try {
		const id = Number(req.params.id);

		await validateGetBookingByIdRequest({ id });

		const result = await processGetBookingById(id);
		return res.status(200).send({ ...result });
	} catch (err) {
		if (err?.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				error: 'validation-error',
				errors: err?.errors || [],
			});
		}

		return res.status(err.statusCode || 500).send({ success: false, error: err.message });
	}
};

const updateBooking = async (req, res) => {
	try {
		const id = Number(req.params.id);
		const { status } = req.body;

		await validateUpdateBookingRequest({ id, status });

		const result = await processUpdateBooking(id, { status });
		return res.status(200).send({ ...result });
	} catch (err) {
		if (err?.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				error: 'validation-error',
				errors: err?.errors || [],
			});
		}

		return res.status(err.statusCode || 500).send({ success: false, error: err.message });
	}
};

const cancelBooking = async (req, res) => {
	try {
		const id = Number(req.params.id);

		await validateGetBookingByIdRequest({ id });

		const result = await processCancelBooking(id);
		return res.status(200).send({ ...result });
	} catch (err) {
		if (err?.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				error: 'validation-error',
				errors: err?.errors || [],
			});
		}

		return res.status(err.statusCode || 500).send({ success: false, error: err.message });
	}
};

const getBookingsByGuestId = async (req, res) => {
	try {
		const guest_id = Number(req.params.guest_id);
		const { page, limit } = req.query;
		const form = {
			guest_id,
			page: normalizeOptionalNumber(page),
			limit: normalizeOptionalNumber(limit),
		};

		await validateGetBookingsByGuestIdRequest(form);

		const result = await processGetBookingsByGuestId(guest_id, { page: form.page, limit: form.limit });
		return res.status(200).send({ ...result });
	} catch (err) {
		if (err?.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				error: 'validation-error',
				errors: err?.errors || [],
			});
		}

		return res.status(err.statusCode || 500).send({ success: false, error: err.message });
	}
};

module.exports = { getAllBookings, createBooking, getBookingById, updateBooking, cancelBooking, getBookingsByGuestId };
