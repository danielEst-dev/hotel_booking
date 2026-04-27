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
		room_number: yup.string().matches(/^[A-Za-z1-9][A-Za-z0-9\-]*$/, 'Invalid room number').required(),
		room_type: yup.string().required(),
		price_per_night: yup.number().positive().required(),
		description: yup.string().optional(),
	};

	const schema = yup.object().shape(formShape);
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateGetRoomByIdRequest = (form) => {
	const formShape = {
		id: yup.number().integer().min(1).required(),
	};

	const schema = yup.object().shape(formShape);
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateUpdateRoomRequest = (form) => {
	const formShape = {
		id: yup.number().integer().min(1).required(),
		room_number: yup.string().matches(/^[A-Za-z1-9][A-Za-z0-9\-]*$/, 'Invalid room number').optional(),
		room_type: yup.string().optional(),
		price_per_night: yup.number().positive().optional(),
		description: yup.string().optional(),
		is_available: yup.boolean().optional(),
	};

	const schema = yup.object().shape(formShape).test(
		'at-least-one-field',
		'At least one field must be provided to update',
		(value) => {
			const { id, ...fields } = value;
			return Object.values(fields).some((v) => v !== undefined);
		}
	);

	return schema.validate(form, { abortEarly: false, strict: true });
};

module.exports = { validateGetAllRoomsRequest, validateCreateRoomRequest, validateGetRoomByIdRequest, validateUpdateRoomRequest };
