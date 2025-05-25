"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { verifyToken } = require('../middleware/authMiddleware');
const { login, register, logout, getCurrentUser } = require('../controllers/authController');
const router = express_1.default.Router();
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', verifyToken, getCurrentUser);
module.exports = router;
