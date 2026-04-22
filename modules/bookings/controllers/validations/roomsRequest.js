const yup = require('yup');

const validateGetAllRoomsRequest = (form) => {
	const formShape = {
		page: yup.number().integer().min(1).optional(),
		limit: yup.number().integer().min(1).max(100).optional(),
		room_type: yup.string().optional(),
		is_available: yup.boolean().optional(),
		min_price: yup.number().min(0).optional(),
		max_price: yup.number().min(0).optional(),
	};

	const schema = yup.object().shape(formShape).test(
		'price-range',
		'min_price cannot be greater than max_price',
		(value) => value.min_price === undefined || value.max_price === undefined || value.min_price <= value.max_price
	);

	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateCreateRoomRequest = (form) => {
	const formShape = {
		room_number: yup.string().required(),
		room_type: yup.string().required(),
		price_per_night: yup.number().min(0).required(),
		description: yup.string().optional(),
	};

	const schema = yup.object().shape(formShape);
	return schema.validate(form, { abortEarly: false, strict: true });
};

module.exports = { validateGetAllRoomsRequest, validateCreateRoomRequest };
