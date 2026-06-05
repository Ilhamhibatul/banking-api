const express = require('express');
const router = express.Router();
const { setor, tarik, transfer, riwayat } = require('../controllers/transaksiController');

router.post('/setor', setor);
router.post('/tarik', tarik);
router.post('/transfer', transfer);
router.get('/riwayat/:nomor', riwayat);

module.exports = router;