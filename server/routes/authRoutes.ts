import express from 'express';
const {verifyToken} = require ('../middleware/authMiddleware');
const { login, register, logout, getCurrentUser } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', verifyToken, getCurrentUser);

module.exports=router;