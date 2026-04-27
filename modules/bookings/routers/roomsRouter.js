const express = require('express');
const { getAllRooms, createRoom, getRoomById, updateRoom, deleteRoom } = require('../controllers/roomsController.js');

const router = express.Router();

router.get('/', getAllRooms);
router.post('/', createRoom);
router.get('/:id', getRoomById);
router.patch('/:id', updateRoom);
router.delete('/:id', deleteRoom);

module.exports = { router };