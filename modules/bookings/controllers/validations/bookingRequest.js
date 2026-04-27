const yup = require('yup');
const moment = require('moment');

const validateGetAllBookingsRequest = (form) => {
	const schema = yup.object().shape({
		page: yup.number().integer().min(1).optional(),
		limit: yup.number().integer().min(1).max(100).optional(),
		status: yup.string().oneOf(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
	});
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateCreateBookingRequest = (form) => {
	const schema = yup.object().shape({
		guest_id: yup.number().integer().min(1).required(),
		room_id: yup.number().integer().min(1).required(),
		check_in_date: yup.string().required()
			.matches(/^\d{4}-\d{2}-\d{2}$/, 'check_in_date must be in the format YYYY-MM-DD')
			.test('not-in-past', 'check_in_date cannot be in the past', (value) => {
				if (!value) return true;
				return moment.utc(value).isSameOrAfter(moment.utc().startOf('day'));
			}),
		check_out_date: yup.string().required().matches(
			/^\d{4}-\d{2}-\d{2}$/,
			'check_out_date must be in the format YYYY-MM-DD'
		),
	});
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateGetBookingByIdRequest = (form) => {
	const schema = yup.object().shape({
		id: yup.number().integer().min(1).required(),
	});
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateUpdateBookingRequest = (form) => {
	const schema = yup.object().shape({
		id: yup.number().integer().min(1).required(),
		status: yup.string().oneOf(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
	}).test('at-least-one-field', 'At least one field besides id must be provided', (value) => {
		const { id, ...rest } = value;
		return Object.values(rest).some((v) => v !== undefined);
	});
	return schema.validate(form, { abortEarly: false, strict: true });
};

const validateGetBookingsByGuestIdRequest = (form) => {
	const schema = yup.object().shape({
		guest_id: yup.number().integer().min(1).required(),
		page: yup.number().integer().min(1).optional(),
		limit: yup.number().integer().min(1).max(100).optional(),
	});
	return schema.validate(form, { abortEarly: false, strict: true });
};

module.exports = {
	validateGetAllBookingsRequest,
	validateCreateBookingRequest,
	validateGetBookingByIdRequest,
	validateUpdateBookingRequest,
	validateGetBookingsByGuestIdRequest,
};
