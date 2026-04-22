const express = require('express');
const { router: roomsRouter } = require('../modules/bookings/routers/roomsRouter.js');

const router = express.Router();

router.use('/rooms', roomsRouter);

module.exports = { router };