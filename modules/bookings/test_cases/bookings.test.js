jest.mock('../../../includes/db/db.js', () => ({
	query: jest.fn()
}));

jest.mock('axios');

const db = require('../../../includes/db/db.js');
const axios = require('axios');
const { processCreateBooking, processGetBookingsByGuestId, fetchWeatherForDate } = require('../functions/bookings.js');
const { validateCreateBookingRequest } = require('../controllers/validations/bookingRequest.js');

describe('Booking Management', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('processCreateBooking', () => {
		it('should create a booking successfully with weather data', async () => {
			const mockGuest = { id: 1 };
			const mockRoom = { id: 2, price_per_night: '100.00' };
			const mockBooking = {
				id: 1,
				guest_id: 1,
				room_id: 2,
				check_in_date: '2026-05-01',
				check_out_date: '2026-05-03',
				total_price: '200.00',
				status: 'pending',
				weather_data: { daily: { temperature_2m_max: [18] } },
			};
			const mockWeather = { daily: { temperature_2m_max: [18], temperature_2m_min: [10], precipitation_sum: [0] } };

			db.query
				.mockResolvedValueOnce({ rows: [mockGuest] })
				.mockResolvedValueOnce({ rows: [mockRoom] })
				.mockResolvedValueOnce({ rows: [] })
				.mockResolvedValueOnce({ rows: [mockBooking] });

			axios.get.mockResolvedValueOnce({ data: mockWeather });

			const result = await processCreateBooking(1, 2, '2026-05-01', '2026-05-03');

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockBooking);
			expect(db.query).toHaveBeenCalledTimes(4);
			expect(db.query).toHaveBeenLastCalledWith(
				expect.stringContaining('INSERT INTO bookings'),
				[1, 2, '2026-05-01', '2026-05-03', 200, mockWeather]
			);
		});

		it('should create a booking successfully even when weather API fails', async () => {
			const mockGuest = { id: 1 };
			const mockRoom = { id: 2, price_per_night: '150.00' };
			const mockBooking = {
				id: 2,
				guest_id: 1,
				room_id: 2,
				check_in_date: '2026-06-10',
				check_out_date: '2026-06-12',
				total_price: '300.00',
				status: 'pending',
				weather_data: null,
			};

			db.query
				.mockResolvedValueOnce({ rows: [mockGuest] })
				.mockResolvedValueOnce({ rows: [mockRoom] })
				.mockResolvedValueOnce({ rows: [] })
				.mockResolvedValueOnce({ rows: [mockBooking] });

			axios.get.mockRejectedValueOnce(new Error('Network error'));

			const result = await processCreateBooking(1, 2, '2026-06-10', '2026-06-12');

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockBooking);
			expect(db.query).toHaveBeenLastCalledWith(
				expect.stringContaining('INSERT INTO bookings'),
				[1, 2, '2026-06-10', '2026-06-12', 300, null]
			);
		});

		it('should throw 400 error when check_out_date is not after check_in_date', async () => {
			await expect(
				processCreateBooking(1, 2, '2026-05-03', '2026-05-01')
			).rejects.toMatchObject({
				message: 'check_out_date must be after check_in_date',
				statusCode: 400,
			});

			expect(db.query).not.toHaveBeenCalled();
		});

		it('should throw 409 error when room has a date conflict', async () => {
			const mockGuest = { id: 1 };
			const mockRoom = { id: 2, price_per_night: '100.00' };

			db.query
				.mockResolvedValueOnce({ rows: [mockGuest] })
				.mockResolvedValueOnce({ rows: [mockRoom] })
				.mockResolvedValueOnce({ rows: [{ id: 99 }] });

			await expect(
				processCreateBooking(1, 2, '2026-05-01', '2026-05-03')
			).rejects.toMatchObject({
				message: 'Room is already booked for the selected dates',
				statusCode: 409,
			});
		});
	});

	describe('validateCreateBookingRequest', () => {
		it('should reject invalid date formats', async () => {
			await expect(
				validateCreateBookingRequest({
					guest_id: 1,
					room_id: 2,
					check_in_date: '01/05/2026',
					check_out_date: '2026-05-03',
				})
			).rejects.toMatchObject({
				name: 'ValidationError',
			});
		});

		it('should reject missing required fields', async () => {
			await expect(
				validateCreateBookingRequest({
					guest_id: 1,
				})
			).rejects.toMatchObject({
				name: 'ValidationError',
			});
		});

		it('should reject a check_in_date in the past', async () => {
			await expect(
				validateCreateBookingRequest({
					guest_id: 1,
					room_id: 2,
					check_in_date: '2020-01-01',
					check_out_date: '2020-01-03',
				})
			).rejects.toMatchObject({
				name: 'ValidationError',
			});
		});

		it('should pass with valid input', async () => {
			await expect(
				validateCreateBookingRequest({
					guest_id: 1,
					room_id: 2,
					check_in_date: '2026-05-01',
					check_out_date: '2026-05-03',
				})
			).resolves.toBeDefined();
		});
	});

	describe('processGetBookingsByGuestId', () => {
		it('should return paginated bookings for a guest', async () => {
			const mockBookings = [
				{
					id: 1,
					guest_id: 5,
					room_id: 3,
					check_in_date: '2026-05-01',
					check_out_date: '2026-05-03',
					status: 'confirmed',
					first_name: 'John',
					last_name: 'Doe',
					email: 'john@example.com',
					room_number: '101',
					room_type: 'double',
					price_per_night: '100.00',
				},
			];

			db.query
				.mockResolvedValueOnce({ rows: [{ id: 5 }] })
				.mockResolvedValueOnce({ rows: [{ count: '1' }] })
				.mockResolvedValueOnce({ rows: mockBookings });

			const result = await processGetBookingsByGuestId(5, {});

			expect(result.success).toBe(true);
			expect(result.data).toEqual(mockBookings);
			expect(result.pagination).toBeDefined();
			expect(result.pagination.total).toBe(1);
			expect(db.query).toHaveBeenCalledTimes(3);
			expect(db.query).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('SELECT COUNT(*)'),
				[5]
			);
		});

		it('should return empty list when guest has no bookings', async () => {
			db.query
				.mockResolvedValueOnce({ rows: [{ id: 99 }] })
				.mockResolvedValueOnce({ rows: [{ count: '0' }] })
				.mockResolvedValueOnce({ rows: [] });

			const result = await processGetBookingsByGuestId(99, {});

			expect(result.success).toBe(true);
			expect(result.data).toEqual([]);
			expect(result.pagination.total).toBe(0);
		});

		it('should throw 404 when guest does not exist', async () => {
			db.query.mockResolvedValueOnce({ rows: [] });

			await expect(
				processGetBookingsByGuestId(9999, {})
			).rejects.toMatchObject({
				message: 'Guest not found',
				statusCode: 404,
			});

			expect(db.query).toHaveBeenCalledTimes(1);
		});
	});

	describe('fetchWeatherForDate', () => {
		it('should return weather data when API call succeeds', async () => {
			const mockWeather = {
				daily: {
					time: ['2026-05-01'],
					temperature_2m_max: [20],
					temperature_2m_min: [12],
					precipitation_sum: [0],
				},
			};

			axios.get.mockResolvedValueOnce({ data: mockWeather });

			const result = await fetchWeatherForDate('2026-05-01');

			expect(result).toEqual(mockWeather);
			expect(axios.get).toHaveBeenCalledWith(
				'https://api.open-meteo.com/v1/forecast',
				expect.objectContaining({
					params: expect.objectContaining({
						start_date: '2026-05-01',
						end_date: '2026-05-01',
					}),
				})
			);
		});

		it('should return null when weather API call fails', async () => {
			axios.get.mockRejectedValueOnce(new Error('API unavailable'));

			const result = await fetchWeatherForDate('2026-05-01');

			expect(result).toBeNull();
		});
	});
});
