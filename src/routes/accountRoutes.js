const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { checkBalance, transactionHistory } = require('../controllers/accountController');

router.get('/check-balance', authenticate, checkBalance);
router.post('/transaction-history', authenticate, transactionHistory);

module.exports = router;
