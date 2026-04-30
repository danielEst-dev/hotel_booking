const { processGetAllRooms, processCreateRoom, processGetRoomById, processUpdateRoom, processDeleteRoom } = require('../functions/rooms.js');
const { validateGetAllRoomsRequest, validateCreateRoomRequest, validateGetRoomByIdRequest, validateUpdateRoomRequest } = require('./validations/roomsRequest.js');
const { normalizeOptionalNumber, normalizeOptionalBoolean } = require('../../../helpers/functions/customFunctions.js');

const getAllRooms = async (req, res) => {
	try {
		const { page, limit, room_type, is_available, min_price, max_price } = req.query;
		const form = {
			page: normalizeOptionalNumber(page),
			limit: normalizeOptionalNumber(limit),
			room_type,
			is_available: normalizeOptionalBoolean(is_available),
			min_price: normalizeOptionalNumber(min_price),
			max_price: normalizeOptionalNumber(max_price),
		};

		await validateGetAllRoomsRequest(form);

		const result = await processGetAllRooms(form);
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

const createRoom = async (req, res) => {
	try {
		let { room_number, room_type, price_per_night, description } = req.body;

		if (price_per_night !== undefined) price_per_night = Number(price_per_night);

		await validateCreateRoomRequest({ room_number, room_type, price_per_night, description });

		const result = await processCreateRoom({ room_number, room_type, price_per_night, description });
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

const getRoomById = async (req, res) => {
	try {
		const id = Number(req.params.id);

		await validateGetRoomByIdRequest({ id });

		const result = await processGetRoomById(id);
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

const updateRoom = async (req, res) => {
	try {
		const id = Number(req.params.id);
		let { room_number, room_type, price_per_night, description, is_available } = req.body;

		if (price_per_night !== undefined) price_per_night = Number(price_per_night);

		await validateUpdateRoomRequest({ id, room_number, room_type, price_per_night, description, is_available });

		const result = await processUpdateRoom(id, { room_number, room_type, price_per_night, description, is_available });
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

const deleteRoom = async (req, res) => {
	try {
		const id = Number(req.params.id);

		await validateGetRoomByIdRequest({ id });

		const result = await processDeleteRoom(id);
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

module.exports = { getAllRooms, createRoom, getRoomById, updateRoom, deleteRoom };