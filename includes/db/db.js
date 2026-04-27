const { Pool, types } = require('pg');

types.setTypeParser(1082, (val) => val);
const moment = require('moment');
const { config } = require('../config/mainConfig.js');

const pool = new Pool({
	host: config.db.host,
	port: config.db.port,
	user: config.db.user,
	password: config.db.password,
	database: config.db.database,
});

pool.on('error', (err) => {
	console.error(`[${moment.utc().toISOString()}] Unexpected DB pool error:`, err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
