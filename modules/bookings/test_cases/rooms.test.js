jest.mock('../../../includes/db/db.js', () => ({
	query: jest.fn()
}));

const db = require('../../../includes/db/db.js');
const { processCreateRoom } = require('../functions/rooms.js');

describe('Room Management', () => {
	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should create a room successfully with all fields', async () => {
		const mockRoom = {
			id: 1,
			room_number: '101',
			room_type: 'double',
			price_per_night: '150.00',
			description: 'Sea view room',
			is_available: true,
			is_active: true,
		};

		db.query.mockResolvedValueOnce({ rows: [mockRoom] });

		const result = await processCreateRoom({
			room_number: '101',
			room_type: 'double',
			price_per_night: 150.00,
			description: 'Sea view room',
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockRoom);
		expect(db.query).toHaveBeenCalledTimes(1);
		expect(db.query).toHaveBeenCalledWith(
			expect.stringContaining('INSERT INTO rooms'),
			['101', 'double', 150.00, 'Sea view room']
		);
	});

	it('should create a room successfully without optional description', async () => {
		const mockRoom = {
			id: 2,
			room_number: '102',
			room_type: 'single',
			price_per_night: '80.00',
			description: null,
			is_available: true,
			is_active: true,
		};

		db.query.mockResolvedValueOnce({ rows: [mockRoom] });

		const result = await processCreateRoom({
			room_number: '102',
			room_type: 'single',
			price_per_night: 80.00,
		});

		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockRoom);
		expect(db.query).toHaveBeenCalledWith(
			expect.stringContaining('INSERT INTO rooms'),
			['102', 'single', 80.00, null]
		);
	});

	it('should throw a 409 error when room number already exists', async () => {
		const duplicateError = new Error('duplicate key value violates unique constraint');
		duplicateError.code = '23505';

		db.query.mockRejectedValueOnce(duplicateError);

		await expect(
			processCreateRoom({
				room_number: '101',
				room_type: 'double',
				price_per_night: 150.00,
			})
		).rejects.toMatchObject({
			message: 'Room number already exists',
			statusCode: 409,
		});
	});

	it('should re-throw unexpected database errors', async () => {
		const dbError = new Error('connection timeout');

		db.query.mockRejectedValueOnce(dbError);

		await expect(
			processCreateRoom({
				room_number: '103',
				room_type: 'suite',
				price_per_night: 300.00,
			})
		).rejects.toThrow('connection timeout');
	});
});
