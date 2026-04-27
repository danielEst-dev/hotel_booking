const express = require('express');
const { getAllGuests, getGuestById, createGuest, updateGuest } = require('../controllers/guestsController.js');

const router = express.Router();

router.get('/', getAllGuests);
router.post('/', createGuest);
router.get('/:id', getGuestById);
router.patch('/:id', updateGuest);

module.exports = { router };
