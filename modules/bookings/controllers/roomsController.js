const { processGetAllRooms } = require('../functions/rooms.js');
const { validateGetAllRoomsRequest } = require('./validations/roomsRequest.js');
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

		return res.status(400).send({ success: false, error: err.message });
	}
};

module.exports = { getAllRooms };