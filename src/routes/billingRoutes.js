const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  billInquiry,
  billPay,
  refundBilling,
  listBilling,
  detailBilling,
  createBilling,
  updateBilling,
  deleteBilling,
  listProducts,
  createProduct
} = require('../controllers/billingController');

router.get('/bill-inquiry/:idbilling', authenticate, billInquiry);
router.post('/bill-pay', authenticate, billPay);
router.post('/refund', authenticate, authorize(['admin']), refundBilling);
router.get('/list-billing', authenticate, listBilling);
router.get('/detail-billing/:idbilling', authenticate, detailBilling);

router.post('/create-billing', authenticate, authorize(['admin']), createBilling);
router.put('/update-billing', authenticate, authorize(['admin']), updateBilling);
router.delete('/delete-billing', authenticate, authorize(['admin']), deleteBilling);

router.get('/products', authenticate, listProducts);
router.post('/products', authenticate, authorize(['admin']), createProduct);

module.exports = router;
