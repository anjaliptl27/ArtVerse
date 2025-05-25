"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { createOrder, getOrderHistory, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const router = express_1.default.Router();
// Buyer routes
router.post('/', verifyToken, createOrder);
router.get('/history', verifyToken, getOrderHistory);
// Admin routes
router.get('/', verifyToken, authorizeRoles('artist', 'admin'), getAllOrders);
router.patch('/:id/status', verifyToken, authorizeRoles('artist', 'admin'), updateOrderStatus);
module.exports = router;
