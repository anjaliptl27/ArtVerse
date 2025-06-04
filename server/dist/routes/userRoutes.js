"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { verifyToken } = require('../middleware/authMiddleware');
const { getUserProfile, updateUserProfile, deleteUserProfile, getPublicProfile, updateProfilePicture, getAllArtists, getArtistById } = require('../controllers/userController');
const router = express_1.default.Router();
// Authenticated routes
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.delete('/profile', verifyToken, deleteUserProfile);
router.put('/profile/picture', verifyToken, updateProfilePicture);
//artist routes
router.get('/artists', getAllArtists);
router.get('/artists/:id', getArtistById);
// Public route
router.get('/:userId', getPublicProfile);
module.exports = router;
