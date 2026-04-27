const express = require('express');
const { getAllBookings, createBooking, getBookingById, updateBooking, cancelBooking, getBookingsByGuestId } = require('../controllers/bookingsController.js');

const router = express.Router();

router.get('/guest/:guest_id', getBookingsByGuestId);
router.get('/', getAllBookings);
router.post('/', createBooking);
router.get('/:id', getBookingById);
router.patch('/:id', updateBooking);
router.delete('/:id', cancelBooking);

module.exports = { router };
