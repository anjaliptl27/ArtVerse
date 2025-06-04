import express from 'express';
const{ verifyToken }  = require( '../middleware/authMiddleware');
const{ getCart, addToCart, removeFromCart, clearCart, updateCartItemQuantity} = require('../controllers/cartController');
const { getWishlist, addToWishlist, removeFromWishlist, clearWishlist } = require('../controllers/wishlistController');
//const { createPaymentIntent, handlePaymentSuccess } = require('../controllers/paymentController');

const router = express.Router();

// Cart routes
router.get('/cart', verifyToken, getCart);
router.post('/cart', verifyToken, addToCart);
router.delete('/cart/:cartItemId', verifyToken, removeFromCart);
router.delete('/cart', verifyToken, clearCart);
router.put('/cart/:cartItemId', verifyToken, updateCartItemQuantity);

// Wishlist routes
router.get('/wishlist', verifyToken, getWishlist);
router.post('/wishlist', verifyToken, addToWishlist);
router.delete('/wishlist/:wishlistItemId', verifyToken, removeFromWishlist);
router.delete('/wishlist', verifyToken, clearWishlist);

// Payment routes
//router.post('/create-payment-intent', verifyToken, createPaymentIntent);
//router.post('/webhook', handlePaymentSuccess);

module.exports = router;