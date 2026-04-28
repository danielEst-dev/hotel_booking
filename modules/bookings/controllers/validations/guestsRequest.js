const yup = require('yup');

const validateGetAllGuestsRequest = (form) => {
	const formShape = {
		page: yup.number().integer().min(1).optional(),
		limit: yup.number().integer().min(1).max(100).optional(),
		search: yup.string().max(100).optional(),
	};

	const schema = yup.object().shape(formShape);
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateGetGuestByIdRequest = (form) => {
	const formShape = {
		id: yup.number().integer().min(1).required(),
	};

	const schema = yup.object().shape(formShape);
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateCreateGuestRequest = (form) => {
	const formShape = {
		first_name: yup.string().max(100).required(),
		last_name: yup.string().max(100).required(),
		email: yup.string().email().max(254).required(),
		phone: yup.string().max(30).matches(/^\+?[\d\s\-()]+$/, { message: 'Invalid phone number format', excludeEmptyString: true }).optional(),
	};

	const schema = yup.object().shape(formShape);
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateUpdateGuestRequest = (form) => {
	const formShape = {
		id: yup.number().integer().min(1).required(),
		first_name: yup.string().max(100).optional(),
		last_name: yup.string().max(100).optional(),
		email: yup.string().email().max(254).optional(),
		phone: yup.string().max(30).matches(/^\+?[\d\s\-()]+$/, { message: 'Invalid phone number format', excludeEmptyString: true }).optional(),
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

module.exports = { validateGetAllGuestsRequest, validateGetGuestByIdRequest, validateCreateGuestRequest, validateUpdateGuestRequest };