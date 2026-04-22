const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const { router: bookingsRouter } = require('./routers/bookingsRouter.js');
app.use('/bookings', bookingsRouter);

// 404 handler
app.use((req, res) => {
	res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ success: false, error: 'Internal server error' });
});

module.exports = { app };
