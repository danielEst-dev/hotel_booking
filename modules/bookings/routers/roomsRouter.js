const express = require('express');
const { getAllRooms } = require('../controllers/roomsController.js');

const router = express.Router();

router.get('/', getAllRooms);

module.exports = { router };