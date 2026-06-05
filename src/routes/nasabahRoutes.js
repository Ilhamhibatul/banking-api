const express = require('express');
const router = express.Router();
const { daftarNasabah, getNasabah } = require('../controllers/nasabahController');

router.post('/', daftarNasabah);
router.get('/:id', getNasabah);

module.exports = router;