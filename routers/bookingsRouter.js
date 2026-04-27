const express = require('express');
const { router: roomsRouter } = require('../modules/bookings/routers/roomsRouter.js');
const { router: guestsRouter } = require('../modules/bookings/routers/guestsRouter.js');

const router = express.Router();

router.use('/rooms', roomsRouter);
router.use('/guests', guestsRouter);

module.exports = { router };