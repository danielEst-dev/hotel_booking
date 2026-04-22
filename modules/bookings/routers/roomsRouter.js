const express = require('express');
const { getAllRooms, createRoom } = require('../controllers/roomsController.js');

const router = express.Router();

router.get('/', getAllRooms);
router.post('/', createRoom);

module.exports = { router };