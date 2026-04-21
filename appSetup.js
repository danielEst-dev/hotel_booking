const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const moment = require('moment');
const { config } = require('./includes/config/mainConfig.js');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
	origin: config.server.allowedOrigins.length ? config.server.allowedOrigins : false,
}));

// Request logging
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
	res.status(200).json({ success: true, status: 'ok', env: config.server.nodeEnv });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
	console.error(`[${moment.utc().toISOString()}] Unhandled error:`, err);
	res.status(500).json({ success: false, error: 'Internal server error' });
});

module.exports = { app };
