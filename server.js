const { app } = require('./appSetup.js');
const { config } = require('./includes/config/mainConfig.js');
const { pool } = require('./includes/db/db.js');
const moment = require('moment');

const start = async () => {
	await pool.query('SELECT 1');
	console.log(`[${moment.utc().toISOString()}] Database connection verified`);

	app.listen(config.server.port, () => {
		console.log(`[${moment.utc().toISOString()}] Hotel Booking API running on port ${config.server.port}`);
	});
};

start().catch((err) => {
	console.error(`[${moment.utc().toISOString()}] Startup failed:`, err.message);
	process.exit(1);
});
