const { app } = require('./appSetup.js');
const { config } = require('./includes/config/mainConfig.js');
const { pool } = require('./includes/db/db.js');
const { autoCompleteExpiredBookings } = require('./modules/bookings/functions/bookings.js');
const moment = require('moment');
const cron = require('node-cron');

const start = async () => {
	await pool.query('SELECT 1');
	console.log(`[${moment.utc().toISOString()}] Database connection verified`);

	app.listen(config.server.port, () => {
		console.log(`[${moment.utc().toISOString()}] Hotel Booking API running on port ${config.server.port}`);
	});

	autoCompleteExpiredBookings();
	cron.schedule('5 0 * * *', () => {
		console.log(`[${moment.utc().toISOString()}] Running daily booking completion check`);
		autoCompleteExpiredBookings();
	});
};

start().catch((err) => {
	console.error(`[${moment.utc().toISOString()}] Startup failed:`, err.message);
	process.exit(1);
});
