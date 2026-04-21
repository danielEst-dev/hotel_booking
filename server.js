const { app } = require('./appSetup.js');
const { config } = require('./includes/config/mainConfig.js');
const { pool } = require('./includes/db/db.js');
const moment = require('moment');

const PORT = config.server.port;

let server;

const start = async () => {
	await pool.query('SELECT 1');
	console.log(`[${moment.utc().toISOString()}] Database connection verified`);

	server = app.listen(PORT, () => {
		console.log(`[${moment.utc().toISOString()}] Hotel Booking API running on port ${PORT} (${config.server.nodeEnv})`);
	});
};

start().catch(err => {
	console.error(`[${moment.utc().toISOString()}] Startup failed:`, err.message);
	process.exit(1);
});

// Graceful shutdown
const shutdown = (signal) => {
	console.log(`\n[${moment.utc().toISOString()}] ${signal} received — shutting down gracefully`);

	const close = async () => {
		await pool.end();
		console.log(`[${moment.utc().toISOString()}] Server closed`);
		process.exit(0);
	};

	if (server) {
		server.close(() => close());
	} else {
		close();
	}

	// Force exit if server hasn't closed within 10 seconds
	setTimeout(() => {
		console.error(`[${moment.utc().toISOString()}] Forcing shutdown`);
		process.exit(1);
	}, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
	console.error(`[${moment.utc().toISOString()}] Unhandled rejection:`, reason);
});

process.on('uncaughtException', (err) => {
	console.error(`[${moment.utc().toISOString()}] Uncaught exception:`, err);
	process.exit(1);
});
