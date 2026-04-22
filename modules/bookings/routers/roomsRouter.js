const express = require('express');
const { getAllRooms, createRoom, getRoomById } = require('../controllers/roomsController.js');

const router = express.Router();

router.get('/', getAllRooms);
router.post('/', createRoom);
router.get('/:id', getRoomById);

module.exports = { router };