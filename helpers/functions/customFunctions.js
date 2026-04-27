const buildPagination = (page, limit, totalCount) => {
	const parsedPage = parseInt(page, 10);
	const parsedLimit = parseInt(limit, 10);
	const maxLimit = 100;
	const defaultLimit = 50;
	const currentPage = Number.isNaN(parsedPage) ? 1 : parsedPage;

	if (currentPage < 1) {
		throw new Error('Invalid page. page must be greater than or equal to 1.');
	}

	const requestedLimit = Number.isNaN(parsedLimit) ? defaultLimit : parsedLimit;
	if (requestedLimit < 1) {
		throw new Error('Invalid limit. limit must be greater than or equal to 1.');
	}

	const perPage = Math.min(requestedLimit, maxLimit);
	const offset = (currentPage - 1) * perPage;
	const totalPages = Math.ceil(totalCount / perPage);

	return {
		pagination: {
			total: totalCount,
			page: currentPage,
			limit: perPage,
			totalPages,
		},
		offset,
		limit: perPage,
	};
};

const normalizeOptionalNumber = (value) => {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	return Number(value);
};

const normalizeOptionalBoolean = (value) => {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}

	if (value === true || value === 'true') {
		return true;
	}

	if (value === false || value === 'false') {
		return false;
	}

	return undefined;
};

module.exports = { buildPagination, normalizeOptionalNumber, normalizeOptionalBoolean };
