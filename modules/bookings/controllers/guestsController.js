const { processGetAllGuests, processGetGuestById, processCreateGuest, processUpdateGuest } = require('../functions/guests.js');
const { validateGetAllGuestsRequest, validateGetGuestByIdRequest, validateCreateGuestRequest, validateUpdateGuestRequest } = require('./validations/guestsRequest.js');
const { normalizeOptionalNumber } = require('../../../helpers/functions/customFunctions.js');

const getAllGuests = async (req, res) => {
	try {
		const { page, limit, search } = req.query;
		const form = {
			page: normalizeOptionalNumber(page),
			limit: normalizeOptionalNumber(limit),
			search: search || undefined,
		};

		await validateGetAllGuestsRequest(form);

		const result = await processGetAllGuests(form);
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

const getGuestById = async (req, res) => {
	try {
		const id = Number(req.params.id);

		await validateGetGuestByIdRequest({ id });

		const result = await processGetGuestById(id);
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

const createGuest = async (req, res) => {
	try {
		const { first_name, last_name, email, phone } = req.body;

		await validateCreateGuestRequest({ first_name, last_name, email, phone });

		const result = await processCreateGuest({ first_name, last_name, email, phone });
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

const updateGuest = async (req, res) => {
	try {
		const id = Number(req.params.id);
		const { first_name, last_name, email, phone } = req.body;

		await validateUpdateGuestRequest({ id, first_name, last_name, email, phone });

		const result = await processUpdateGuest(id, { first_name, last_name, email, phone });
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

module.exports = { getAllGuests, getGuestById, createGuest, updateGuest };
