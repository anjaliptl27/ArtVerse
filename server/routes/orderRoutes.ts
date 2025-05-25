import express from 'express';
const { verifyToken, authorizeRoles } = require ('../middleware/authMiddleware');
const {createOrder, getOrderHistory, getAllOrders, updateOrderStatus} = require('../controllers/orderController');

const router = express.Router();

// Buyer routes
router.post('/', verifyToken, createOrder);
router.get('/history', verifyToken, getOrderHistory);

// Admin routes
router.get('/', verifyToken, authorizeRoles('artist','admin'),getAllOrders);
router.patch('/:id/status', verifyToken, authorizeRoles('artist','admin'), updateOrderStatus);

module.exports = router;