require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = REQUIRED.filter(key => !process.env[key]);
if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);

const config = Object.freeze({
	server: {
		port: process.env.PORT || 3000,
		nodeEnv: process.env.NODE_ENV || 'development',
		allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [],
	},
	db: {
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT) || 5432,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
	},
});

module.exports = { config };
